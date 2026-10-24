'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const main = read('confirmation.html');
const youtube = read('taxstrategiesconfirmationyt.html');
const whop = read('tax-strategies-confirmation-whop.html');
const scripts = html => [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
const normalize = value => JSON.parse(JSON.stringify(value));

for (const [name, html] of [['YouTube', youtube], ['Whop', whop]]) {
  test(`${name} matches the main confirmation layout, proof sections, and styles`, () => {
    assert.equal(html.match(/<main>[\s\S]*?<\/main>/i)[0], main.match(/<main>[\s\S]*?<\/main>/i)[0]);
    assert.equal(html.match(/<style\b[^>]*>[\s\S]*?<\/style>/i)[0], main.match(/<style\b[^>]*>[\s\S]*?<\/style>/i)[0]);
    const proof = [...html.matchAll(/<img[^>]+src="(\/assets\/images\/proof\/[^" ]+)"[^>]*>/g)];
    assert.equal(proof.length, 13);
    for (const image of proof) {
      assert(fs.existsSync(path.join(root, image[1].slice(1))), image[1]);
      assert(image[0].includes('loading="lazy"'));
      assert(image[0].includes('alt="'));
    }
  });

  test(`${name} retains the current date, calendar, videos, and shared analytics`, () => {
    const date = main.match(/datetime="([^"]+)"/)[1];
    const calendar = main.match(/data-id="([^"]+)"/)[1];
    assert(html.includes('datetime="' + date + '"'));
    assert(html.includes("new Date('" + date + "')"));
    assert.deepEqual([...html.matchAll(/data-id="([^"]+)"/g)].map(m => m[1]), [calendar, calendar]);
    for (const id of ['1234669128', '1234669127']) assert(html.includes('player.vimeo.com/video/' + id));
    assert.equal(scripts(html).filter(m => m[1].includes('/assets/js/webinar-analytics.js')).length, 1);
    assert.equal(scripts(html).filter(m => m[1].includes('https://cdn.addevent.com/')).length, 1);
    assert.equal(scripts(html).filter(m => m[2].includes('clarity.ms/tag/')).length, 1);
    assert.equal(scripts(html).filter(m => m[1].includes('tag.pixel.spendback.ai')).length, 1);
    assert.equal(scripts(html).filter(m => m[2].includes('t.managemoney101.com/v1/lst/universal-script')).length, 1);
  });
}

function browserContext(session = {}) {
  const inserted = [];
  const context = {
    document: {
      createElement: () => ({}),
      getElementsByTagName: () => [{ parentNode: { insertBefore: element => inserted.push(element) } }]
    },
    sessionStorage: {
      getItem: key => session[key] || null,
      removeItem: key => { delete session[key]; }
    }
  };
  context.window = context;
  return { context, inserted };
}

test('YouTube preserves its own GTM container and Meta PageView and Lead events', () => {
  const state = browserContext();
  const gtm = scripts(youtube).find(m => m[2].includes('GTM-KQ4R2LKP'));
  const meta = scripts(youtube).find(m => m[2].includes('fbq("init"'));
  assert(gtm && meta);
  vm.runInNewContext(gtm[2], state.context);
  assert.equal(state.context.dataLayer[0].event, 'gtm.js');
  assert.equal(state.inserted[0].src, 'https://tracking.managemoney101.com/gtm.js?id=GTM-KQ4R2LKP');
  vm.runInNewContext(meta[2], state.context);
  assert.deepEqual(normalize(state.context.fbq.queue).map(args => Object.values(args)), [
    ['init', '489941607383296'], ['track', 'PageView'], ['track', 'Lead']
  ]);
  assert(youtube.includes('https://www.facebook.com/tr?id=489941607383296&ev=PageView&noscript=1'));
  assert(!youtube.includes('t.whop.tw'));
});

test('Whop preserves its business scope and consumes a lead only once', () => {
  const lead = { event_id: 'lead_test', email: 'test@example.com', first_name: 'Test', phone: '+15555550123' };
  const session = { whop_lead: JSON.stringify(lead) };
  const state = browserContext(session);
  const pixel = scripts(whop).find(m => m[2].includes('whop.setScope('));
  const handoff = scripts(whop).find(m => m[2].includes("sessionStorage.getItem('whop_lead')"));
  vm.runInNewContext(pixel[2], state.context);
  vm.runInNewContext(handoff[2], state.context);
  vm.runInNewContext(handoff[2], state.context);
  assert.equal(state.inserted[0].src, 'https://t.whop.tw/s.js');
  assert.deepEqual(normalize(state.context.whop.s), ['biz_KTsDYurBxmAMfN']);
  assert.equal(state.context.whop.q.filter(event => event[1] === 'page').length, 1);
  const events = state.context.whop.q.filter(event => event[1] === 'lead');
  assert.equal(events.length, 1);
  assert.deepEqual(normalize(events[0][2]), lead);
  assert.equal(session.whop_lead, undefined);
  assert(!/fbevents\.js|fbq\(|GTM-KQ4R2LKP/.test(whop));
});

test('Whop does not send a lead on a direct confirmation visit', () => {
  const state = browserContext();
  for (const script of scripts(whop).filter(m => m[2].includes('whop.setScope(') || m[2].includes("sessionStorage.getItem('whop_lead')"))) {
    vm.runInNewContext(script[2], state.context);
  }
  assert.equal(state.context.whop.q.filter(event => event[1] === 'lead').length, 0);
});

test('registration destinations remain separated by advertising channel', () => {
  for (const file of ['index.html', 'future.html', 'tax-strategies.html']) {
    assert(read(file).includes("window.location.href = '/taxseasonconfirmation' + window.location.search;"));
  }
  assert(read('taxstrategiesyt.html').includes("window.location.href = '/taxstrategiesconfirmationyt' + window.location.search;"));
  assert(read('tax-strategies-whop.html').includes("window.location.href = '/taxseasonconfirmation-whop' + window.location.search;"));
});
