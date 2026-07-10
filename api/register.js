'use strict';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(res, statusCode, payload){
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function normalizeString(value){
  return typeof value === 'string' ? value.trim() : '';
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
    page_url: normalizeString(body.page_url),
    submitted_at: normalizeString(body.submitted_at) || new Date().toISOString(),
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

    return json(res, 200, {ok: true});
  } catch (error){
    return json(res, 502, {ok: false, error: 'Unable to forward registration right now.'});
  }
};
