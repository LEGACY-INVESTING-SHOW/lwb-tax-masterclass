/* Legacy Wealth Blueprint Webinar analytics in the shared LIS PostHog project. */
(function () {
  'use strict';

  var ANALYTICS_VERSION = '2026-09-16.3';
  var POSTHOG_TOKEN = 'phc_rQffz3NncDqfmLpKUcrDvThjyT3brt4QRSxcPUT2pFsw';
  var POSTHOG_PROXY = '/lwb-events';
  var PRODUCTION_HOST = 'join.managemoney101.com';
  var FUNNEL = 'legacy_wealth_blueprint_webinar';
  var ATTRIBUTION_KEY = 'lwb_webinar_attribution_v1';
  var ATTRIBUTION_SESSION_KEY = 'lwb_webinar_attribution_session';
  var TEST_SESSION_KEY = 'lwb_webinar_analytics_test';

  if (window.__lwbWebinarAnalytics || window.posthog || !/^https?:$/.test(location.protocol)) return;

  var servedPath = (location.pathname.replace(/\/+$/, '') || '/').toLowerCase();
  var routes = {
    '/': { canonical: '/taxseasonisnow', step: 'registration_landing', page: 'webinar_registration', variant: 'tax_season' },
    '/index': { canonical: '/taxseasonisnow', step: 'registration_landing', page: 'webinar_registration', variant: 'tax_season' },
    '/index.html': { canonical: '/taxseasonisnow', step: 'registration_landing', page: 'webinar_registration', variant: 'tax_season' },
    '/taxseasonisnow': { canonical: '/taxseasonisnow', step: 'registration_landing', page: 'webinar_registration', variant: 'tax_season' },
    '/future': { canonical: '/future', step: 'registration_landing', page: 'webinar_registration', variant: 'family_wealth_future' },
    '/future.html': { canonical: '/future', step: 'registration_landing', page: 'webinar_registration', variant: 'family_wealth_future' },
    '/tax-strategies': { canonical: '/tax-strategies', step: 'registration_landing', page: 'webinar_registration', variant: 'tax_strategies' },
    '/tax-strategies.html': { canonical: '/tax-strategies', step: 'registration_landing', page: 'webinar_registration', variant: 'tax_strategies' },
    '/tax-strategies-v2': { canonical: '/tax-strategies-v2', step: 'registration_landing', page: 'webinar_registration', variant: 'tax_strategies_v2' },
    '/tax-strategies-v2.html': { canonical: '/tax-strategies-v2', step: 'registration_landing', page: 'webinar_registration', variant: 'tax_strategies_v2' },
    '/tax-strategies-yt': { canonical: '/tax-strategies-yt', step: 'registration_landing', page: 'webinar_registration', variant: 'tax_strategies_youtube' },
    '/taxstrategiesyt': { canonical: '/tax-strategies-yt', step: 'registration_landing', page: 'webinar_registration', variant: 'tax_strategies_youtube' },
    '/taxstrategiesyt.html': { canonical: '/tax-strategies-yt', step: 'registration_landing', page: 'webinar_registration', variant: 'tax_strategies_youtube' },
    '/taxseasonconfirmation': { canonical: '/taxseasonconfirmation', step: 'registration_confirmation', page: 'webinar_confirmation', variant: 'tax_season' },
    '/confirmation': { canonical: '/taxseasonconfirmation', step: 'registration_confirmation', page: 'webinar_confirmation', variant: 'tax_season' },
    '/confirmation.html': { canonical: '/taxseasonconfirmation', step: 'registration_confirmation', page: 'webinar_confirmation', variant: 'tax_season' },
    '/taxstrategiesconfirmationyt': { canonical: '/taxstrategiesconfirmationyt', step: 'registration_confirmation', page: 'webinar_confirmation', variant: 'tax_strategies_youtube' },
    '/taxstrategiesconfirmationyt.html': { canonical: '/taxstrategiesconfirmationyt', step: 'registration_confirmation', page: 'webinar_confirmation', variant: 'tax_strategies_youtube' },
    '/lwbfoundations': { canonical: '/lwbfoundations', step: 'foundations_sales', page: 'foundations_sales_page', variant: 'course_and_ai' },
    '/lwbfoundations.html': { canonical: '/lwbfoundations', step: 'foundations_sales', page: 'foundations_sales_page', variant: 'course_and_ai' }
  };
  var routeInfo = routes[servedPath];
  if (!routeInfo) return;

  var testMode = false;
  try {
    if (new URLSearchParams(location.search).get('analytics_test') === '1') {
      sessionStorage.setItem(TEST_SESSION_KEY, '1');
    }
    testMode = sessionStorage.getItem(TEST_SESSION_KEY) === '1';
  } catch (_) {
    testMode = /(?:^|[?&])analytics_test=1(?:&|$)/.test(location.search);
  }

  window.__lwbWebinarAnalytics = {
    version: ANALYTICS_VERSION,
    loaded: false,
    enabled: false,
    route: servedPath,
    canonicalPath: routeInfo.canonical,
    step: routeInfo.step,
    variant: routeInfo.variant,
    isTest: testMode
  };

  var isProductionHost = location.hostname === PRODUCTION_HOST;
  var isLocalTest = !isProductionHost && window.__LWB_ANALYTICS_TEST__ === true;
  var hostAllowed = isProductionHost || isLocalTest;
  if (isLocalTest && typeof window.__LWB_POSTHOG_TOKEN__ === 'string') {
    POSTHOG_TOKEN = window.__LWB_POSTHOG_TOKEN__;
  }
  if (!hostAllowed) {
    window.__lwbWebinarAnalytics.disabledReason = 'non_production_host';
    return;
  }
  if (!POSTHOG_TOKEN || POSTHOG_TOKEN === 'PROJECT_TOKEN_PENDING') {
    window.__lwbWebinarAnalytics.disabledReason = 'project_token_pending';
    return;
  }

  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split('.');2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement('script')).type='text/javascript',p.crossOrigin='anonymous',p.async=!0,p.src=s.api_host.replace('.i.posthog.com','-assets.i.posthog.com')+'/static/array.js',(r=t.getElementsByTagName('script')[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a='posthog',u.people=u.people||[],o='init capture register register_once unregister identify reset get_distinct_id get_session_id set_config startSessionRecording stopSessionRecording opt_in_capturing opt_out_capturing has_opted_out_capturing'.split(' '),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  function redactString(value) {
    return String(value)
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
      .replace(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/g, '[redacted-phone]')
      .replace(/\b(?:\d[ -]*?){13,19}\b/g, '[redacted-number]');
  }

  function cleanUrl(value) {
    if (typeof value !== 'string') return value;
    return value.replace(/https?:\/\/[^\s"'<>]+/gi, function (match) {
      try {
        var url = new URL(match);
        Array.from(url.searchParams.keys()).forEach(function (key) {
          if (!/^utm_(source|medium|campaign|content|term|id)$/i.test(key) && key !== 'analytics_test') {
            url.searchParams.delete(key);
          }
        });
        url.hash = '';
        return url.href.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]');
      } catch (_) {
        return match.split('?')[0].split('#')[0];
      }
    });
  }

  function sensitiveKey(key) {
    return /(^|_)(email|phone|phone_number|first_name|last_name|full_name|contact_name|address|password|passcode|card|authorization|cookie|fbclid|gclid|gbraid|wbraid|fbc|fbp)(_|$)/i.test(key || '');
  }

  function sanitize(value, key, depth) {
    if (depth > 10 || sensitiveKey(key)) return undefined;
    if (typeof value === 'string') {
      var stringValue = cleanUrl(value);
      if (/(message|exception|error|element_text|title|referrer|text)/i.test(key || '')) {
        stringValue = redactString(stringValue);
      }
      return stringValue.slice(0, 2000);
    }
    if (!value || typeof value !== 'object') return value;
    if (Array.isArray(value)) {
      return value.map(function (item) { return sanitize(item, '', depth + 1); });
    }
    var output = {};
    Object.keys(value).forEach(function (childKey) {
      var child = sanitize(value[childKey], childKey, depth + 1);
      if (typeof child !== 'undefined') output[childKey] = child;
    });
    return output;
  }

  function safeTag(value) {
    return redactString(value || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, 240);
  }

  function safeReferrer(value) {
    if (!value) return '';
    try {
      var url = new URL(value);
      return url.origin + url.pathname;
    } catch (_) {
      return '';
    }
  }

  function readJson(storage, key) {
    if (!storage) return null;
    try { return JSON.parse(storage.getItem(key) || 'null'); } catch (_) { return null; }
  }

  function writeJson(storage, key, value) {
    if (!storage) return;
    try { storage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  function currentTouch() {
    var params = new URLSearchParams(location.search);
    var touch = {
      landing_path: routeInfo.canonical,
      referrer: safeReferrer(document.referrer)
    };
    ['source', 'medium', 'campaign', 'content', 'term', 'id'].forEach(function (name) {
      var value = params.get('utm_' + name);
      // Advertising platforms use long numeric IDs in UTM parameters.
      // Keep those IDs intact; free-text labels still receive PII redaction.
      if (value) touch['utm_' + name] = /^\d+$/.test(value) ? value.slice(0, 240) : safeTag(value);
    });
    return touch;
  }

  function attributionProperties() {
    var storage = null;
    try { storage = window.localStorage; } catch (_) {}
    var stored = readJson(storage, ATTRIBUTION_KEY) || {};
    var touch = currentTouch();
    // Repair an earlier redacted ID only when the current campaign proves its value.
    ['first', 'last'].forEach(function (position) {
      Object.keys(touch).forEach(function (key) {
        if (/^utm_/.test(key) && /^\d+$/.test(touch[key]) && stored[position] &&
            stored[position][key] === safeTag(touch[key])) {
          stored[position][key] = touch[key];
        }
      });
    });
    var hasUtm = Object.keys(touch).some(function (key) { return /^utm_/.test(key); });
    var externalReferrer = false;
    var sessionEntry = false;
    try {
      if (!window.sessionStorage.getItem(ATTRIBUTION_SESSION_KEY)) {
        window.sessionStorage.setItem(ATTRIBUTION_SESSION_KEY, '1');
        sessionEntry = true;
      }
    } catch (_) {}
    if (touch.referrer) {
      try { externalReferrer = new URL(touch.referrer).hostname !== location.hostname; } catch (_) {}
    }
    var newCampaign = hasUtm && ['source', 'medium', 'campaign', 'content', 'term', 'id'].some(function (name) {
      return (touch['utm_' + name] || '') !== ((stored.last || {})['utm_' + name] || '');
    });
    if (!stored.first) stored.first = touch;
    if (!stored.last || sessionEntry || externalReferrer || newCampaign) stored.last = touch;
    writeJson(storage, ATTRIBUTION_KEY, stored);

    var properties = {};
    ['first', 'last'].forEach(function (position) {
      Object.keys(stored[position] || {}).forEach(function (key) {
        properties[position + '_' + key] = stored[position][key];
      });
    });
    return properties;
  }

  var attribution = attributionProperties();

  function pageProperties(extra) {
    var properties = {
      funnel: FUNNEL,
      funnel_step: routeInfo.step,
      page_name: routeInfo.page,
      page_variant: routeInfo.variant,
      canonical_path: routeInfo.canonical,
      served_path: servedPath,
      analytics_version: ANALYTICS_VERSION,
      is_test: testMode
    };
    Object.keys(attribution).forEach(function (key) { properties[key] = attribution[key]; });
    Object.keys(extra || {}).forEach(function (key) { properties[key] = extra[key]; });
    return properties;
  }

  function stampEventProperties(properties) {
    properties.funnel = FUNNEL;
    properties.funnel_step = routeInfo.step;
    properties.page_name = routeInfo.page;
    properties.page_variant = routeInfo.variant;
    properties.canonical_path = routeInfo.canonical;
    properties.served_path = servedPath;
    properties.analytics_version = ANALYTICS_VERSION;
    properties.is_test = testMode;
    Object.keys(attribution).forEach(function (key) { properties[key] = attribution[key]; });
    return properties;
  }

  function capture(ph, eventName, properties) {
    try { ph.capture(eventName, pageProperties(properties)); } catch (_) {}
  }

  function elementText(element) {
    return safeTag(element.getAttribute('aria-label') || element.getAttribute('title') || element.textContent || '').slice(0, 120);
  }

  function slug(value) {
    return safeTag(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80);
  }

  function sectionName(element) {
    var section = element.closest('section, header, footer, [data-analytics-location], [data-page-element="SectionContainer/V1"]');
    if (!section) return 'unknown';
    if (section.getAttribute('data-analytics-location')) return slug(section.getAttribute('data-analytics-location'));
    if (section.id) return slug(section.id);
    var heading = section.querySelector('h1, h2, h3');
    return heading ? slug(heading.textContent) : 'section_' + (Array.prototype.indexOf.call(section.parentNode.children, section) + 1);
  }

  function destination(href) {
    try {
      var url = new URL(href, location.href);
      return { host: url.hostname, path: url.pathname };
    } catch (_) {
      return { host: '', path: '' };
    }
  }

  function trackClicks(ph) {
    document.addEventListener('click', function (event) {
      var element = event.target.closest && event.target.closest('a, button, summary');
      if (!element) return;
      var href = element.getAttribute('href') || '';
      var target = destination(href);
      var properties = {
        element_text: elementText(element),
        element_type: element.tagName.toLowerCase(),
        element_id: element.id || null,
        section: sectionName(element),
        destination_host: target.host || null,
        destination_path: target.path || null
      };

      if (element.matches('.addeventatc, [data-calendar], [id^="calendar-"]') || /calendar|addevent/i.test(href + ' ' + element.className)) {
        capture(ph, 'calendar_link_clicked', properties);
      }
      if (href && !/^(#|javascript:|mailto:|tel:)/i.test(href) && target.host && target.host !== location.hostname) {
        capture(ph, 'outbound_link_clicked', properties);
      }
      if (element.matches('button, .btn, .button, [class*="Button"], [class*="button"]') || href === '#register' || href === '#checkout') {
        properties.cta_action = href === '#register' ? 'open_registration' : (href === '#checkout' ? 'view_checkout' : 'click');
        capture(ph, 'cta_clicked', properties);
      }
    }, true);
  }

  function trackScroll(ph) {
    var milestones = [25, 50, 75, 90, 100];
    var seen = {};
    var ticking = false;
    function measure() {
      ticking = false;
      var documentHeight = Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0);
      var available = Math.max(1, documentHeight - window.innerHeight);
      var percent = Math.min(100, Math.round((window.scrollY / available) * 100));
      milestones.forEach(function (milestone) {
        if (percent >= milestone && !seen[milestone]) {
          seen[milestone] = true;
          capture(ph, 'scroll_milestone_reached', { percent: milestone });
        }
      });
    }
    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(measure);
      }
    }, { passive: true });
    measure();
  }

  function trackSections(ph) {
    if (!('IntersectionObserver' in window)) return;
    var seen = {};
    var selectors = 'section, main > header, [data-page-element="SectionContainer/V1"]';
    var sections = Array.prototype.slice.call(document.querySelectorAll(selectors));
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var name = sectionName(entry.target);
        if (seen[name]) return;
        seen[name] = true;
        capture(ph, 'section_viewed', { section: name, section_index: sections.indexOf(entry.target) + 1 });
        observer.unobserve(entry.target);
      });
    }, { threshold: 0 });
    sections.forEach(function (section) { observer.observe(section); });
  }

  function trackRegistrationForm(ph) {
    var form = document.getElementById('register-form');
    if (!form) return;

    window.addEventListener('lwb:registration', function (event) {
      var detail = event && event.detail ? event.detail : {};
      var eventMap = {
        opened: 'registration_form_opened',
        started: 'registration_form_started',
        validation_failed: 'registration_form_validation_failed',
        submitted: 'registration_form_submitted',
        succeeded: 'registration_succeeded',
        failed: 'registration_failed'
      };
      var eventName = eventMap[detail.stage];
      if (!eventName) return;
      capture(ph, eventName, {
        form_id: 'register-form',
        invalid_fields: Array.isArray(detail.invalid_fields) ? detail.invalid_fields.slice(0, 10) : undefined,
        failure_type: detail.failure_type ? safeTag(detail.failure_type) : undefined
      });
    });
  }

  function trackCheckout(ph) {
    var checkout = document.getElementById('checkout');
    if (!checkout) return;
    var viewed = false;
    var mounted = false;
    var loaded = false;
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        if (viewed || !entries[0].isIntersecting) return;
        viewed = true;
        capture(ph, 'checkout_viewed', { checkout_provider: 'whop', offer: 'course_and_ai' });
        observer.disconnect();
      }, { threshold: 0.25 });
      observer.observe(checkout);
    }

    var attempts = 0;
    var timer = setInterval(function () {
      attempts += 1;
      var root = checkout.shadowRoot || checkout;
      var frame = root.querySelector && root.querySelector('iframe');
      if (!mounted && frame) {
        mounted = true;
        capture(ph, 'checkout_embed_mounted', { checkout_provider: 'whop', offer: 'course_and_ai' });
      }
      if (frame && !frame.__lwbAnalyticsTracked) {
        frame.__lwbAnalyticsTracked = true;
        frame.addEventListener('load', function () {
          if (loaded) return;
          loaded = true;
          capture(ph, 'checkout_embed_loaded', { checkout_provider: 'whop', offer: 'course_and_ai' });
        });
      }
      if (attempts >= 80 || loaded) clearInterval(timer);
    }, 250);
  }

  function videoId(frame) {
    var match = (frame.getAttribute('src') || '').match(/vimeo\.com\/video\/(\d+)/i);
    return match ? match[1] : 'unknown';
  }

  function trackVimeo(ph) {
    if (routeInfo.step !== 'registration_confirmation') return;
    var frames = Array.prototype.slice.call(document.querySelectorAll('iframe[src*="player.vimeo.com/video/"]'));
    if (!frames.length) return;
    if (!(window.Vimeo && window.Vimeo.Player) && !document.querySelector('script[src="https://player.vimeo.com/api/player.js"]')) {
      var sdk = document.createElement('script');
      sdk.src = 'https://player.vimeo.com/api/player.js';
      sdk.async = true;
      document.head.appendChild(sdk);
    }
    var attempts = 0;
    var timer = setInterval(function () {
      attempts += 1;
      if (!(window.Vimeo && window.Vimeo.Player)) {
        if (attempts >= 80) clearInterval(timer);
        return;
      }
      clearInterval(timer);
      frames.forEach(function (frame, index) {
        try {
          var player = new window.Vimeo.Player(frame);
          var id = videoId(frame);
          var started = false;
          var milestones = {};
          player.on('play', function () {
            if (started) return;
            started = true;
            capture(ph, 'video_started', { video_provider: 'vimeo', video_id: id, video_instance: index + 1 });
          });
          player.on('timeupdate', function (data) {
            var percent = Math.round((data.percent || 0) * 100);
            [25, 50, 75, 90].forEach(function (milestone) {
              if (percent >= milestone && !milestones[milestone]) {
                milestones[milestone] = true;
                capture(ph, 'video_progress', { video_provider: 'vimeo', video_id: id, video_instance: index + 1, percent: milestone });
              }
            });
          });
          player.on('ended', function () {
            capture(ph, 'video_completed', { video_provider: 'vimeo', video_id: id, video_instance: index + 1, percent: 100 });
          });
          player.on('error', function (error) {
            capture(ph, 'video_error', { video_provider: 'vimeo', video_id: id, video_instance: index + 1, error_type: safeTag(error && error.name || 'player_error') });
          });
        } catch (_) {}
      });
    }, 250);
  }

  window.posthog.init(POSTHOG_TOKEN, {
    api_host: POSTHOG_PROXY,
    ui_host: 'https://us.posthog.com',
    defaults: '2026-08-30',
    persistence: 'localStorage',
    persistence_name: 'lwb_webinar_analytics',
    cross_subdomain_cookie: false,
    person_profiles: 'identified_only',
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
    capture_dead_clicks: true,
    capture_exceptions: true,
    capture_heatmaps: true,
    capture_performance: {
      web_vitals_allowed_metrics: ['LCP', 'CLS', 'FCP', 'INP']
    },
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: 'form',
      blockSelector: 'iframe, #checkout, [data-whop-checkout-plan-id], [data-ph-no-capture]',
      maskCapturedNetworkRequestFn: function (request) {
        request.name = cleanUrl(request.name);
        if (request.requestHeaders) request.requestHeaders = {};
        if (request.responseHeaders) request.responseHeaders = {};
        if ('requestBody' in request) request.requestBody = undefined;
        if ('responseBody' in request) request.responseBody = undefined;
        if ('body' in request) request.body = undefined;
        return request;
      }
    },
    before_send: function (event) {
      if (!event) return event;
      var properties = event.properties || {};
      if (event.event !== '$snapshot') {
        properties = sanitize(properties, '', 0) || {};
      }
      event.properties = stampEventProperties(properties);
      return event;
    },
    loaded: function (ph) {
      ph.register(pageProperties());
      capture(ph, '$pageview', { title: document.title });
      trackClicks(ph);
      trackScroll(ph);
      trackSections(ph);
      trackRegistrationForm(ph);
      trackCheckout(ph);
      trackVimeo(ph);
      if (routeInfo.step === 'registration_confirmation') {
        capture(ph, 'registration_confirmation_viewed', {});
      }
      window.__lwbWebinarAnalytics.loaded = true;
      window.__lwbWebinarAnalytics.enabled = true;
      window.dispatchEvent(new CustomEvent('lwb-webinar-analytics-ready'));
    }
  });
}());
