'use strict';

const crypto = require('crypto');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_WHOP_ACCOUNT_ID = 'biz_KTsDYurBxmAMfN';
const DEFAULT_WHOP_EVENT_NAME = 'schedule';
const WHOP_EVENTS_URL = 'https://api.whop.com/api/v1/events';

function json(res, statusCode, payload){
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function normalizeString(value){
  return typeof value === 'string' ? value.trim() : '';
}

function queryParamFromUrl(url, name){
  try {
    return new URL(url).searchParams.get(name) || '';
  } catch (error){
    return '';
  }
}

function trackingField(body, pageUrl, name){
  return normalizeString(body[name]) || normalizeString(queryParamFromUrl(pageUrl, name));
}

function firstHeaderValue(value){
  if (Array.isArray(value)) return normalizeString(value[0]);
  return normalizeString(value);
}

function clientIp(req){
  return firstHeaderValue(req.headers['x-forwarded-for']).split(',')[0].trim()
    || firstHeaderValue(req.headers['x-real-ip']);
}

function compactObject(value){
  return Object.fromEntries(
    Object.entries(value).filter(function(entry){
      return entry[1] !== '';
    })
  );
}

function whopEventId(payload){
  const source = [
    payload.email,
    payload.submitted_at,
    payload.page_url,
    payload.event_datetime_et
  ].join('|');
  return 'evnt_' + crypto.createHash('sha256').update(source).digest('hex').slice(0, 24);
}

async function sendWhopEvent(payload, req){
  if (!process.env.WHOP_API_KEY) return;

  const accountId = normalizeString(process.env.WHOP_ACCOUNT_ID) || DEFAULT_WHOP_ACCOUNT_ID;
  const eventName = normalizeString(process.env.WHOP_EVENT_NAME) || DEFAULT_WHOP_EVENT_NAME;
  const eventPayload = {
    account_id: accountId,
    event_name: eventName,
    action_source: 'website',
    event_id: whopEventId(payload),
    event_time: payload.submitted_at,
    referrer_url: normalizeString(payload.referrer_url),
    source: 'form',
    title: payload.event_name,
    url: payload.page_url,
    context: compactObject({
      fbc: payload.fbc,
      fbclid: payload.fbclid,
      fbp: payload.fbp,
      gbraid: payload.gbraid,
      gclid: payload.gclid,
      ip_address: clientIp(req),
      user_agent: payload.user_agent,
      utm_campaign: payload.utm_campaign,
      utm_content: payload.utm_content,
      utm_id: payload.utm_id,
      utm_medium: payload.utm_medium,
      utm_source: payload.utm_source,
      utm_term: payload.utm_term,
      wbraid: payload.wbraid
    }),
    user: compactObject({
      email: payload.email,
      first_name: payload.first_name,
      name: payload.first_name,
      phone: payload.phone
    })
  };

  const whopResponse = await fetch(WHOP_EVENTS_URL, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.WHOP_API_KEY,
      'Content-Type': 'application/json',
      'Idempotency-Key': eventPayload.event_id
    },
    body: JSON.stringify(eventPayload)
  });

  if (!whopResponse.ok){
    throw new Error('Whop event request failed with status ' + whopResponse.status);
  }
}

async function readJsonBody(req){
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.trim()){
    return JSON.parse(req.body);
  }

  let raw = '';
  for await (const chunk of req){
    raw += chunk;
  }

  if (!raw.trim()){
    return {};
  }

  return JSON.parse(raw);
}

module.exports = async function handler(req, res){
  if (req.method !== 'POST'){
    res.setHeader('Allow', 'POST');
    return json(res, 405, {ok: false, error: 'Method not allowed.'});
  }

  if (!process.env.ZAPIER_WEBHOOK_URL){
    return json(res, 500, {ok: false, error: 'Server is not configured for registrations yet.'});
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (error){
    return json(res, 400, {ok: false, error: 'Invalid JSON payload.'});
  }

  const firstName = normalizeString(body.first_name);
  const email = normalizeString(body.email);
  const phone = normalizeString(body.phone);
  const website = normalizeString(body.website);
  const pageUrl = normalizeString(body.page_url);

  if (website){
    return json(res, 400, {ok: false, error: 'Spam check failed.'});
  }
  if (!firstName){
    return json(res, 400, {ok: false, error: 'First name is required.'});
  }
  if (!EMAIL_RE.test(email)){
    return json(res, 400, {ok: false, error: 'A valid email is required.'});
  }
  if (!phone){
    return json(res, 400, {ok: false, error: 'Phone is required.'});
  }

  const payload = {
    first_name: firstName,
    email,
    phone,
    sms_consent: Boolean(body.sms_consent),
    event_name: normalizeString(body.event_name) || 'Legacy Investing Show Tax Strategy Workshop',
    event_datetime_et: normalizeString(body.event_datetime_et),
    page_url: pageUrl,
    referrer_url: normalizeString(body.referrer_url),
    submitted_at: normalizeString(body.submitted_at) || new Date().toISOString(),
    utm_source: trackingField(body, pageUrl, 'utm_source'),
    utm_medium: trackingField(body, pageUrl, 'utm_medium'),
    utm_campaign: trackingField(body, pageUrl, 'utm_campaign'),
    utm_term: trackingField(body, pageUrl, 'utm_term'),
    utm_content: trackingField(body, pageUrl, 'utm_content'),
    utm_id: trackingField(body, pageUrl, 'utm_id'),
    fbclid: trackingField(body, pageUrl, 'fbclid'),
    gclid: trackingField(body, pageUrl, 'gclid'),
    gbraid: trackingField(body, pageUrl, 'gbraid'),
    wbraid: trackingField(body, pageUrl, 'wbraid'),
    fbp: normalizeString(body.fbp),
    fbc: normalizeString(body.fbc),
    website: '',
    source: 'lwb-tax-masterclass',
    user_agent: normalizeString(req.headers['user-agent'])
  };

  try {
    const zapierResponse = await fetch(process.env.ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });

    if (!zapierResponse.ok){
      return json(res, 502, {ok: false, error: 'Unable to forward registration right now.'});
    }

    try {
      await sendWhopEvent(payload, req);
    } catch (error){
      console.error('Unable to send Whop event.');
    }

    return json(res, 200, {ok: true});
  } catch (error){
    return json(res, 502, {ok: false, error: 'Unable to forward registration right now.'});
  }
};
