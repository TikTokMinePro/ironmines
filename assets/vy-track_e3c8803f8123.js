(function () {
  'use strict';

  var body = document.body;
  if (!body) return;

  var pageId = body.getAttribute('data-vy-page-id') || '';
  if (!pageId || !/^[0-9a-f-]{36}$/i.test(pageId)) return;

  var slug = body.getAttribute('data-vy-page-slug') || '';
  var endpoint = body.getAttribute('data-vy-track-endpoint') || '/public/api/track.php';

  function post(payload) {
    try {
      var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, blob);
        return;
      }
    } catch (e) {}
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: 'same-origin',
    }).catch(function () {});
  }

  var sidKey = 'vyral_sid';
  var sid = '';
  try {
    sid = window.localStorage.getItem(sidKey) || '';
    if (!sid || sid.length < 16) {
      sid = '';
      var a = new Uint8Array(16);
      if (window.crypto && crypto.getRandomValues) {
        crypto.getRandomValues(a);
      } else {
        for (var i = 0; i < 16; i++) a[i] = (Math.random() * 256) | 0;
      }
      sid = Array.from(a, function (b) {
        return ('0' + b.toString(16)).slice(-2);
      }).join('');
      window.localStorage.setItem(sidKey, sid);
    }
  } catch (e) {
    sid = 'anon-' + String(Date.now());
  }

  post({
    action: 'view',
    page_id: pageId,
    session_id: sid,
    user_agent: navigator.userAgent || '',
  });

  function planFromEl(el) {
    if (!el) return null;
    var p = el.getAttribute('data-plan') || el.getAttribute('data-d13-checkout');
    if (p === 'annual' || p === 'anual') return 'anual';
    if (p === 'monthly' || p === 'mensal') return 'mensal';
    var card = el.closest('[data-d13-card]');
    if (card) {
      var c = card.getAttribute('data-d13-card');
      if (c === 'annual') return 'anual';
      if (c === 'monthly') return 'mensal';
    }
    return null;
  }

  document.addEventListener(
    'click',
    function (ev) {
      var el = ev.target && ev.target.closest ? ev.target.closest('a.btn-cta, button.btn-cta, .btn-cta a') : null;
      if (!el) return;
      var plan = planFromEl(el);
      post({
        action: 'event',
        page_id: pageId,
        type: 'click_cta',
        metadata: {
          type: plan || 'unknown',
          page: slug,
        },
      });
    },
    true
  );

  window.addEventListener('load', function () {
    var nav = performance.getEntriesByType('navigation')[0];
    if (!nav || nav.entryType !== 'navigation') return;
    var ttfb = Math.max(0, Math.round(nav.responseStart));
    var load = Math.max(0, Math.round(nav.loadEventEnd));
    var dom = Math.max(0, Math.round(nav.domContentLoadedEventEnd));
    post({
      action: 'performance',
      page_id: pageId,
      ttfb_ms: ttfb,
      load_time_ms: load,
      dom_ready_ms: dom,
    });
  });
})();
