(function() {
  var TRACKING_KEYS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    'utm_id', 'src', 'sck', 'fbclid', 'gclid', 'ttclid'
  ];

  function getParamsFromUrl() {
    var params = {};
    try {
      var search = window.location.search;
      if (!search) return params;
      var q = new URLSearchParams(search);
      TRACKING_KEYS.forEach(function(k) {
        var val = q.get(k);
        if (val) params[k] = val;
      });
      q.forEach(function(val, key) {
        if (key.indexOf('utm_') === 0 && !params[key]) {
          params[key] = val;
        }
      });
    } catch(e) {}
    return params;
  }

  function saveParams(params) {
    if (!params || Object.keys(params).length === 0) return;
    try {
      var stored = getStoredParams();
      var merged = Object.assign({}, stored, params);
      localStorage.setItem('takealot_utm_params', JSON.stringify(merged));
      sessionStorage.setItem('takealot_utm_params', JSON.stringify(merged));
      Object.keys(merged).forEach(function(k) {
        localStorage.setItem(k, merged[k]);
      });
    } catch(e) {}
  }

  function getStoredParams() {
    try {
      var s = sessionStorage.getItem('takealot_utm_params') || localStorage.getItem('takealot_utm_params');
      if (s) return JSON.parse(s);
    } catch(e) {}
    var fallback = {};
    TRACKING_KEYS.forEach(function(k) {
      try {
        var v = localStorage.getItem(k);
        if (v) fallback[k] = v;
      } catch(e) {}
    });
    return fallback;
  }

  var currentUrlParams = getParamsFromUrl();
  if (Object.keys(currentUrlParams).length > 0) {
    saveParams(currentUrlParams);
  }

  window.getPreservedUtms = function() {
    return Object.assign({}, getStoredParams(), getParamsFromUrl());
  };

  window.getPreservedUtmQuery = function(includeLeadingAmp) {
    var utms = window.getPreservedUtms();
    var parts = [];
    Object.keys(utms).forEach(function(k) {
      parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(utms[k]));
    });
    if (parts.length === 0) return '';
    var str = parts.join('&');
    return includeLeadingAmp !== false ? ('&' + str) : str;
  };

  window.appendUtms = function(url) {
    if (!url || typeof url !== 'string') return url;
    if (url.indexOf('javascript:') === 0 || url.indexOf('#') === 0 || url.indexOf('mailto:') === 0 || url.indexOf('tel:') === 0) {
      return url;
    }
    var utms = window.getPreservedUtms();
    if (Object.keys(utms).length === 0) return url;

    try {
      var hasProtocol = url.indexOf('http://') === 0 || url.indexOf('https://') === 0;
      var base = hasProtocol ? url : 'http://local.fake/' + url.replace(/^\//, '');
      var parsed = new URL(base);

      Object.keys(utms).forEach(function(k) {
        if (!parsed.searchParams.has(k)) {
          parsed.searchParams.set(k, utms[k]);
        }
      });

      if (hasProtocol) {
        return parsed.toString();
      } else {
        var cleanPath = parsed.pathname.replace(/^\/local\.fake\/?/, '').replace(/^\//, '');
        var prefix = (url.indexOf('/') === 0) ? '/' : '';
        return prefix + cleanPath + parsed.search + parsed.hash;
      }
    } catch(e) {
      var sep = url.indexOf('?') === -1 ? '?' : '&';
      var q = window.getPreservedUtmQuery(false);
      return q ? (url + sep + q) : url;
    }
  };

  function decorateLinks() {
    try {
      var links = document.querySelectorAll('a[href]');
      for (var i = 0; i < links.length; i++) {
        var a = links[i];
        var href = a.getAttribute('href');
        if (href && (href.indexOf('.html') !== -1 || href === '/' || href.indexOf('?') !== -1)) {
          if (href.indexOf('http') === -1 || href.indexOf(window.location.host) !== -1) {
            a.setAttribute('href', window.appendUtms(href));
          }
        }
      }
    } catch(e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', decorateLinks);
  } else {
    decorateLinks();
  }
  if (window.MutationObserver) {
    document.addEventListener('DOMContentLoaded', function() {
      new MutationObserver(decorateLinks).observe(document.body, { childList: true, subtree: true });
    });
  }
})();
