/* Saves device details on the visit, through Umami's own identify call (session data). */
(function () {
  function collect() {
    var n = navigator;
    var s = window.screen || {};
    var d = {};
    function put(key, value) {
      if (value === undefined || value === null || value === "") return;
      d[key] = typeof value === "string" ? value.slice(0, 500) : value;
    }
    try { put("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone); } catch {}
    put("languages", (n.languages || []).join(","));
    put("userAgent", n.userAgent);
    put("platform", n.platform);
    put("cpuCores", n.hardwareConcurrency);
    put("ramGb", n.deviceMemory);
    put("touchPoints", n.maxTouchPoints);
    put("pixelRatio", window.devicePixelRatio);
    put("viewport", window.innerWidth + "x" + window.innerHeight);
    put("screenAvailable", s.availWidth + "x" + s.availHeight);
    put("colorDepth", s.colorDepth);
    try { put("darkMode", window.matchMedia("(prefers-color-scheme: dark)").matches ? "yes" : "no"); } catch {}
    var c = n.connection;
    if (c) {
      put("networkType", c.effectiveType);
      put("networkDownlinkMbps", c.downlink);
      put("networkRttMs", c.rtt);
      put("dataSaver", c.saveData ? "yes" : "no");
    }
    try {
      var gl = document.createElement("canvas").getContext("webgl");
      var info = gl && gl.getExtension("WEBGL_debug_renderer_info");
      if (info) {
        put("gpu", gl.getParameter(info.UNMASKED_RENDERER_WEBGL));
        put("gpuVendor", gl.getParameter(info.UNMASKED_VENDOR_WEBGL));
      }
    } catch {}
    var u = n.userAgentData;
    if (!u || !u.getHighEntropyValues) return Promise.resolve(d);
    return u
      .getHighEntropyValues(["model", "platformVersion", "fullVersionList", "architecture", "bitness"])
      .then(function (h) {
        put("deviceModel", h.model);
        put("osName", h.platform);
        put("osVersion", h.platformVersion);
        put("cpuArchitecture", [h.architecture, h.bitness].filter(Boolean).join(" "));
        var list = h.fullVersionList || [];
        var real = list.filter(function (b) { return !/not.?a.?brand|chromium/i.test(b.brand); })[0] || list[0];
        if (real) put("browserVersion", real.brand + " " + real.version);
        return d;
      })
      .catch(function () { return d; });
  }

  var tries = 0;
  (function wait() {
    if (window.umami && typeof window.umami.identify === "function") {
      collect().then(function (d) { window.umami.identify(d); });
    } else if (++tries < 60) {
      setTimeout(wait, 250);
    }
  })();
})();
