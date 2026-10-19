/* Whop Elements checkout, used only by the Foundations sales page. */
(function () {
  'use strict';

  var root = document.getElementById('checkout');
  if (!root || !root.getAttribute('data-checkout-plan-id')) return;

  var status = document.getElementById('checkout-status');
  var error = document.getElementById('checkout-error');
  var retry = document.getElementById('checkout-retry');
  var params = new URLSearchParams(window.location.search);
  var pendingEvents = [];
  var recordedPayments = {};
  var returnNotice = '';

  retry.addEventListener('click', function () { window.location.reload(); });

  function setStatus(message) {
    status.textContent = message;
    status.hidden = !message;
  }

  function flushEvents() {
    if (!window.__lwbWebinarAnalytics || !window.__lwbWebinarAnalytics.enabled || !window.posthog) return;
    while (pendingEvents.length) {
      var event = pendingEvents[0];
      try {
        window.posthog.capture(event.name, event.properties);
        pendingEvents.shift();
      } catch (_) { return; }
    }
  }

  function capture(name, properties) {
    pendingEvents.push({ name: name, properties: Object.assign({
      checkout_provider: 'whop', checkout_integration: 'elements', offer: 'course_and_ai'
    }, properties || {}) });
    flushEvents();
  }

  window.addEventListener('lwb-webinar-analytics-ready', flushEvents);

  function showError() {
    root.setAttribute('aria-busy', 'false');
    setStatus('');
    error.hidden = false;
  }

  function storedJson(key) {
    try { return JSON.parse(window.localStorage.getItem(key) || '{}') || {}; }
    catch (_) { return {}; }
  }

  function stringValue(value) {
    return typeof value === 'string' ? value.trim().slice(0, 1000) : '';
  }

  function cookieValue(name) {
    var prefix = name + '=';
    var cookie = document.cookie.split(';').map(function (part) { return part.trim(); }).find(function (part) {
      return part.indexOf(prefix) === 0;
    });
    if (!cookie) return '';
    try { return decodeURIComponent(cookie.slice(prefix.length)); } catch (_) { return ''; }
  }

  var attribution = { source: 'lwbfoundations' };
  var storedTouch = storedJson('lwb_webinar_attribution_v1').last || {};
  var storedClicks = storedJson('lwb_tracking_ids');
  var metadata = { source_page: 'lwbfoundations' };
  var utmFields = { utm_source: 'utmSource', utm_medium: 'utmMedium', utm_campaign: 'utmCampaign', utm_term: 'utmTerm', utm_content: 'utmContent' };
  Object.keys(utmFields).forEach(function (key) {
    var value = stringValue(params.get(key)) || stringValue(storedTouch[key]);
    if (value) attribution[utmFields[key]] = value;
  });
  ['utm_id', 'fbclid', 'gclid', 'gbraid', 'wbraid'].forEach(function (key) {
    var value = stringValue(params.get(key)) || stringValue(storedClicks[key]) || stringValue(storedTouch[key]);
    if (value) metadata[key] = value;
  });
  ['fbp', 'fbc'].forEach(function (key) {
    var value = stringValue(cookieValue('_' + key));
    if (value) metadata[key] = value;
  });

  // A return query is UI context, never proof of payment or a fulfillment trigger.
  var returnedPayment = params.get('payment') || '';
  if (/^pay_[A-Za-z0-9]+$/.test(returnedPayment)) {
    if (params.get('status') === 'succeeded') {
      root.hidden = true;
      root.setAttribute('aria-busy', 'false');
      setStatus('Check your email for your payment confirmation and access details. If no confirmation arrives, contact Whop support before trying again.');
      return;
    }
    if (params.get('status') === 'failed') returnNotice = 'Your payment was not completed. Please try again below.';
    if (params.get('status') === 'canceled') returnNotice = 'Payment was canceled. You have not completed this checkout. You can try again below.';
  }

  function paymentAlreadyRecorded(paymentId) {
    if (recordedPayments[paymentId]) return true;
    recordedPayments[paymentId] = true;
    try {
      var key = 'lwb_foundations_payment_' + paymentId;
      if (window.sessionStorage.getItem(key)) return true;
      window.sessionStorage.setItem(key, '1');
    } catch (_) {}
    return false;
  }

  try {
    if (typeof window.WhopElements !== 'function') throw new Error('Elements SDK unavailable');

    var returnUrl = new URL(window.location.href);
    ['payment', 'status', 'setup', 'setup_intent_id'].forEach(function (key) { returnUrl.searchParams.delete(key); });
    returnUrl.hash = 'checkout';

    var checkout = window.WhopElements().checkout.create({
      plan: root.getAttribute('data-checkout-plan-id'),
      returnUrl: returnUrl.href,
      attribution: attribution,
      metadata: metadata,
      affiliateCode: stringValue(params.get('a')) || undefined,
      appearance: {
        theme: { appearance: 'light', accentColor: 'blue', grayColor: 'slate' },
        classes: { 'whop-CheckoutPayButton': { backgroundColor: '#3358d4' } }
      },
      onComplete: function (result) {
        if (!result || result.result !== 'payment' || !/^pay_[A-Za-z0-9]+$/.test(result.paymentId || '')) return;
        if (paymentAlreadyRecorded(result.paymentId)) return;
        // Browser analytics only; Whop's payment webhooks still deliver access.
        capture('checkout_payment_completed', { payment_id: result.paymentId, checkout_session_id: result.sessionId });
      }
    });

    checkout.create('checkout', {
      onReady: function () {
        root.setAttribute('aria-busy', 'false');
        error.hidden = true;
        setStatus(returnNotice);
        capture('checkout_elements_ready');
      },
      onError: function () {
        showError();
        capture('checkout_elements_error');
      }
    }).mount('#checkout-element');
  } catch (_) {
    showError();
    capture('checkout_elements_error');
  }
}());
