/* Bloom tracking snippet — small, no deps, sends pageviews and SPA route changes */
(function () {
  var script = document.currentScript || document.querySelector('script[data-site]');
  if (!script) return;
  var siteId = script.getAttribute('data-site');
  var endpoint = script.getAttribute('data-endpoint') || (script.src ? script.src.replace(/\/track\.js$/, '/api/track') : '/api/track');
  if (!siteId) return;

  // Session ID: short-lived (30 min) random id stored in sessionStorage
  function getSession() {
    try {
      var key = 'bloom_track_session';
      var raw = sessionStorage.getItem(key);
      var now = Date.now();
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed.exp > now) {
          parsed.exp = now + 30 * 60 * 1000;
          sessionStorage.setItem(key, JSON.stringify(parsed));
          return parsed.id;
        }
      }
      var id = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
      sessionStorage.setItem(key, JSON.stringify({ id: id, exp: now + 30 * 60 * 1000 }));
      return id;
    } catch (e) {
      return null;
    }
  }

  function send(eventType, path) {
    try {
      var body = JSON.stringify({
        siteId: siteId,
        eventType: eventType,
        path: path || (location.pathname + location.search),
        referrer: document.referrer || null,
        sessionId: getSession(),
      });
      // Prefer sendBeacon for unload reliability, fallback to fetch
      if (navigator.sendBeacon) {
        var blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon(endpoint, blob);
      } else {
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body,
          keepalive: true,
        }).catch(function () {});
      }
    } catch (e) {}
  }

  // Initial pageview
  send('pageview');

  // Track SPA navigation (history.pushState/replaceState)
  var lastPath = location.pathname + location.search;
  function checkPath() {
    var current = location.pathname + location.search;
    if (current !== lastPath) {
      lastPath = current;
      send('pageview', current);
    }
  }
  var origPush = history.pushState;
  var origReplace = history.replaceState;
  history.pushState = function () {
    origPush.apply(this, arguments);
    setTimeout(checkPath, 0);
  };
  history.replaceState = function () {
    origReplace.apply(this, arguments);
    setTimeout(checkPath, 0);
  };
  window.addEventListener('popstate', checkPath);

  // Expose tiny API for custom events: bloom('event_name', { props })
  window.bloom = function (eventName) {
    if (!eventName) return;
    send(String(eventName));
  };
})();
