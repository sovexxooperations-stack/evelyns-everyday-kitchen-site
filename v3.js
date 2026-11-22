(function () {
  'use strict';
  var cfg = {};
  try { cfg = JSON.parse(document.getElementById('offer-config').textContent); } catch (e) {}
  var money = function (n) { return '$' + n.toFixed(2); };
  var params = new URLSearchParams(location.search);

  /* ---------- Black Friday: real dates only (preview with ?preview=bf) ---------- */
  var bf = cfg.blackfriday, now = Date.now(), bfActive = false;
  if (bf && bf.start && bf.end) {
    bfActive = (now >= Date.parse(bf.start) && now <= Date.parse(bf.end)) || params.get('preview') === 'bf';
  }
  var completePrice = cfg.complete ? cfg.complete.price : 0;
  if (bfActive) {
    completePrice = bf.price;
    document.querySelectorAll('[data-price="complete"]').forEach(function (el) { el.textContent = money(bf.price); });
    document.querySelectorAll('[data-buy="complete"]').forEach(function (a) { a.href = bf.checkout; });
    var anchor = cfg.complete.anchor, save = anchor - bf.price;
    document.querySelectorAll('[data-save-pct]').forEach(function (el) { el.textContent = 'Save ' + Math.round(save / anchor * 100) + '%'; });
    document.querySelectorAll('[data-save-amount]').forEach(function (el) { el.textContent = 'You save ' + money(save); });
    document.querySelectorAll('[data-per-recipe]').forEach(function (el) {
      var c = Math.round(bf.price / cfg.recipes.total * 100);
      el.textContent = (el.textContent.charAt(0) === 'A' ? 'About ' : 'about ') + c + '¢ a recipe';
    });
    var tb = document.getElementById('topbar');
    if (tb) { tb.classList.add('is-bf'); tb.querySelector('.tb-default').hidden = true; tb.querySelector('.tb-bf').hidden = false; }
    document.querySelectorAll('.bf-note').forEach(function (el) { el.hidden = false; });
  }

  /* ---------- Measurement: loads only after the visitor accepts cookies ---------- */
  var CONSENT_KEY = 'ek_consent_v1';
  var measuring = false;
  function getConsent() { try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; } }
  function setConsent(v) { try { localStorage.setItem(CONSENT_KEY, v); } catch (e) {} }
  function startMeasurement() {
    if (measuring) return; measuring = true;
    if (cfg.clarity_id) {
      (function (c, l, a, r, i, t, y) {
        c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
        t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
        y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
      })(window, document, 'clarity', 'script', cfg.clarity_id);
      window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
    }
    if (cfg.meta_pixel_id) {
      !function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
        t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', cfg.meta_pixel_id);
      window.fbq('track', 'PageView');
      window.fbq('track', 'ViewContent', { content_name: 'Everyday Kitchen landing', value: completePrice, currency: 'USD' });
    }
  }
  var banner = document.getElementById('cookie');
  function showBanner(show) {
    if (!banner) return;
    banner.hidden = !show;
    document.body.classList.toggle('cookie-open', show);
  }
  if (cfg.clarity_id || cfg.meta_pixel_id) {
    var choice = getConsent();
    if (choice === 'granted') startMeasurement();
    else if (choice !== 'denied') showBanner(true);
  }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-consent]');
    if (b) {
      var v = b.getAttribute('data-consent');
      setConsent(v); showBanner(false);
      if (v === 'granted') startMeasurement();
      else if (measuring) location.reload(); /* withdrawing consent: stop scripts already running */
      return;
    }
    if (ev.target.closest('[data-cookie-settings]')) showBanner(true);
  });
  function track(name, data) {
    try { if (window.clarity) window.clarity('event', name); } catch (e) {}
    try { if (window.fbq && data) window.fbq('track', 'InitiateCheckout', data); } catch (e) {}
  }

  document.addEventListener('click', function (ev) {
    var a = ev.target.closest('a[data-buy], a[data-track]');
    if (!a) return;
    var buy = a.getAttribute('data-buy');
    if (buy && /^PENDING/.test(a.getAttribute('href'))) {
      ev.preventDefault();
      console.warn('Checkout link not configured yet for', buy);
      return;
    }
    var value = buy === 'complete' ? completePrice : buy === 'starter' ? cfg.starter.price : null;
    track(a.getAttribute('data-track') || 'click', buy ? { content_name: buy, value: value, currency: 'USD' } : null);
  });

  /* ---------- Sticky buy bar: after the hero, hidden while the offer is on screen ---------- */
  var sticky = document.getElementById('sticky');
  var hero = document.querySelector('.hero-buy');
  var offer = document.getElementById('offer');
  if (sticky && hero && offer && 'IntersectionObserver' in window) {
    var pastHero = false, offerVisible = false;
    var update = function () {
      var show = pastHero && !offerVisible;
      sticky.classList.toggle('show', show);
      sticky.setAttribute('aria-hidden', show ? 'false' : 'true');
      sticky.querySelector('a').tabIndex = show ? 0 : -1;
    };
    new IntersectionObserver(function (e) {
      pastHero = !e[0].isIntersecting && e[0].boundingClientRect.top < 0; update();
    }).observe(hero);
    new IntersectionObserver(function (e) {
      offerVisible = e[0].isIntersecting; update();
    }, { threshold: 0.15 }).observe(offer);
  }
})();

/* Entrada suave das secções (sem efeito para quem pede menos movimento) */
(function () {
  var els = document.querySelectorAll('.reveal');
  if (!els.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('motion');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  els.forEach(function (el) { io.observe(el); });
})();
