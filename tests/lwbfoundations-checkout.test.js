'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'assets/js/lwbfoundations-checkout.js'), 'utf8');

function storage(values = {}) {
  return {
    getItem: key => values[key] || null,
    setItem: (key, value) => { values[key] = value; }
  };
}

function setup(options = {}) {
  const elements = {};
  const events = [];
  const listeners = {};
  let checkoutOptions;
  let elementOptions;
  let mounted;
  let reloaded = false;
  function element(id) {
    if (!elements[id]) elements[id] = {
      hidden: false,
      textContent: '',
      attributes: id === 'checkout' ? { 'data-checkout-plan-id': 'plan_ThiSPZvUsDffb' } : {},
      getAttribute(name) { return this.attributes[name] || null; },
      setAttribute(name, value) { this.attributes[name] = value; },
      addEventListener(type, callback) { this[type] = callback; }
    };
    return elements[id];
  }
  element('checkout-error').hidden = true;
  const url = new URL(options.url || 'https://join.managemoney101.com/lwbfoundations');
  const window = {
    location: { href: url.href, search: url.search, reload() { reloaded = true; } },
    localStorage: options.localStorage || storage(),
    sessionStorage: options.sessionStorage || storage(),
    addEventListener(type, callback) { listeners[type] = callback; },
    __lwbWebinarAnalytics: { enabled: options.analyticsReady !== false },
    posthog: { capture: (name, properties) => events.push({ name, properties }) }
  };
  if (!options.missingSdk) window.WhopElements = () => ({ checkout: {
    create(value) {
      checkoutOptions = value;
      if (options.throwOnCreate) throw new Error('Initialization failed');
      return { create(type, props) {
        assert.equal(type, 'checkout');
        elementOptions = props;
        return { mount(target) { mounted = target; } };
      } };
    }
  } });
  vm.runInNewContext(code, {
    window, document: { getElementById: element, cookie: options.cookie || '' }, URL, URLSearchParams
  });
  return {
    window, elements, events, listeners,
    checkoutOptions, elementOptions, mounted,
    get reloaded() { return reloaded; }
  };
}

test('mounts full checkout for the unchanged plan without client-side pricing', () => {
  const state = setup();
  assert.equal(state.checkoutOptions.plan, 'plan_ThiSPZvUsDffb');
  assert.equal(state.mounted, '#checkout-element');
  assert.equal(state.checkoutOptions.amount, undefined);
  assert.equal(state.checkoutOptions.appearance.theme.appearance, 'light');
  assert.equal(state.checkoutOptions.appearance.classes['whop-CheckoutPayButton'].backgroundColor, '#1e5b43');
});

test('passes supported attribution and allowlisted metadata without copying arbitrary query fields', () => {
  const state = setup({
    url: 'https://join.managemoney101.com/lwbfoundations?utm_source=whop&utm_id=123&fbclid=newclick&a=partner&email=private@example.com',
    localStorage: storage({
      lwb_webinar_attribution_v1: JSON.stringify({ last: { utm_source: 'old', utm_campaign: 'webinar', utm_medium: 'paid' } }),
      lwb_tracking_ids: JSON.stringify({ gclid: 'storedgoogle', fbclid: 'oldclick' })
    }),
    cookie: '_fbp=browser123; _fbc=fb.1.123.click'
  });
  const options = state.checkoutOptions;
  assert.equal(options.attribution.utmSource, 'whop');
  assert.equal(options.attribution.utmCampaign, 'webinar');
  assert.equal(options.attribution.utmMedium, 'paid');
  assert.equal(options.metadata.utm_id, '123');
  assert.equal(options.metadata.fbclid, 'newclick');
  assert.equal(options.metadata.gclid, 'storedgoogle');
  assert.equal(options.metadata.fbp, 'browser123');
  assert.equal(options.metadata.fbc, 'fb.1.123.click');
  assert.equal(options.metadata.email, undefined);
  assert.equal(options.affiliateCode, 'partner');
});

test('readiness clears loading and waits for analytics initialization', () => {
  const state = setup({ analyticsReady: false });
  state.elementOptions.onReady();
  assert.equal(state.elements.checkout.attributes['aria-busy'], 'false');
  assert.equal(state.elements['checkout-status'].hidden, true);
  assert.equal(state.events.length, 0);
  state.window.__lwbWebinarAnalytics.enabled = true;
  state.listeners['lwb-webinar-analytics-ready']();
  assert.equal(state.events[0].name, 'checkout_elements_ready');
});

test('records payment completion once, including after a page reload', () => {
  const sharedStorage = storage();
  const state = setup({ sessionStorage: sharedStorage });
  const result = { result: 'payment', paymentId: 'pay_test123', sessionId: 'chs_test123' };
  state.checkoutOptions.onComplete(null);
  state.checkoutOptions.onComplete({ result: 'waitlist_entry', entryId: 'ent_test' });
  state.checkoutOptions.onComplete({ result: 'setup', setupIntentId: 'sint_test' });
  state.checkoutOptions.onComplete(result);
  state.checkoutOptions.onComplete(result);
  assert.equal(state.events.length, 1);
  assert.equal(state.events[0].name, 'checkout_payment_completed');
  assert.equal(state.events[0].properties.payment_id, 'pay_test123');
  const restored = setup({ sessionStorage: sharedStorage });
  restored.checkoutOptions.onComplete(result);
  assert.equal(restored.events.length, 0);
});

test('successful return does not mint another checkout or fire purchase tracking', () => {
  const state = setup({ url: 'https://join.managemoney101.com/lwbfoundations?payment=pay_test123&status=succeeded' });
  assert.equal(state.checkoutOptions, undefined);
  assert.equal(state.elements.checkout.hidden, true);
  assert.match(state.elements['checkout-status'].textContent, /Check your email/);
  assert.equal(state.events.length, 0);
});

for (const status of ['failed', 'canceled']) test(`${status} return allows retry and does not report a sale`, () => {
  const state = setup({ url: `https://join.managemoney101.com/lwbfoundations?payment=pay_test123&status=${status}&utm_campaign=kept` });
  assert.equal(state.mounted, '#checkout-element');
  const returnUrl = new URL(state.checkoutOptions.returnUrl);
  assert.equal(returnUrl.searchParams.get('payment'), null);
  assert.equal(returnUrl.searchParams.get('status'), null);
  assert.equal(returnUrl.searchParams.get('utm_campaign'), 'kept');
  assert.equal(returnUrl.hash, '#checkout');
  state.elementOptions.onReady();
  assert.match(state.elements['checkout-status'].textContent, /try again below/);
  assert(!state.events.some(event => event.name === 'checkout_payment_completed'));
});

test('missing SDK, initialization failure and element errors show a usable retry', () => {
  for (const options of [{ missingSdk: true }, { throwOnCreate: true }, {}]) {
    const state = setup(options);
    if (state.elementOptions) state.elementOptions.onError();
    assert.equal(state.elements['checkout-error'].hidden, false);
    assert.equal(state.elements.checkout.attributes['aria-busy'], 'false');
    state.elements['checkout-retry'].click();
    assert.equal(state.reloaded, true);
  }
});

test('blocked browser storage and malformed attribution do not prevent checkout', () => {
  const blocked = { getItem() { throw new Error('Blocked'); }, setItem() { throw new Error('Blocked'); } };
  const state = setup({ localStorage: blocked, sessionStorage: blocked, cookie: '_fbp=%broken' });
  assert.equal(state.mounted, '#checkout-element');
  const result = { result: 'payment', paymentId: 'pay_test123', sessionId: 'chs_test123' };
  state.checkoutOptions.onComplete(result);
  state.checkoutOptions.onComplete(result);
  assert.equal(state.events.length, 1);
  assert.equal(setup({ localStorage: storage({ lwb_webinar_attribution_v1: '{invalid' }) }).mounted, '#checkout-element');
});

test('only Foundations loads the new integration and the legacy loader is removed', () => {
  const html = fs.readFileSync(path.join(root, 'lwbfoundations.html'), 'utf8');
  assert(!html.includes('js.whop.com/static/checkout/loader.js'));
  assert(html.includes('https://cdn.whop.com/elements/amber/elements.js'));
  assert(html.includes('/assets/js/lwbfoundations-checkout.js'));
  assert(html.includes('href="#checkout"'));
  assert.match(html, /#checkout\s*\{[^}]*background:\s*#fff/);
  for (const file of fs.readdirSync(root).filter(file => file.endsWith('.html') && file !== 'lwbfoundations.html')) {
    assert(!fs.readFileSync(path.join(root, file), 'utf8').includes('/assets/js/lwbfoundations-checkout.js'), file);
  }
});
