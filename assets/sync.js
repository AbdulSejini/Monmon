/* Progress sync between the family's devices, through the family's Firebase Realtime Database.
   Include right after <body>, before the page's own script:  <script src="../../assets/sync.js"></script>
   Every device that opens the site syncs: the family chose that over opening a link on each device, so the progress is
   open to anyone who opens the site. A device can switch it off on sync/index.html. On a syncing device:
   - the page's saves are sent: ticks and best scores within seconds, quiz progress a minute after the last answer
     (at most 5 minutes after the first), and anything left when the page is hidden or closed;
   - other devices' changes arrive while a page is open (the database tells it), and when a page opens or comes back;
     a page that shows them updates itself, reloads, or offers to reload if someone is using it;
   - each save is turned into the changes the page made since it last read the value, so a page still showing older
     progress never undoes what another device saved.
   In the database the family's progress is /f/<code>/d: one entry per value, keyed by its path ("key|field|..."),
   holding the value as JSON text, so arrays and empty objects come back exactly as saved. /f/<code>/t is the time of
   the last change. The database rules only allow reads and writes under /f/<CODE>. */
(function () {
  "use strict";
  var DB = "https://monmon-sync-default-rtdb.europe-west1.firebasedatabase.app";
  var CODE = "cqjxbK0AU2tgeGGZjafIJ7LQDFx9DbjL";   /* the family's path in the database (not a secret: it is in this public file) */
  var OFF = "monmon-sync-off";   /* "1" on a device where sync was switched off on sync/index.html */
  var META = "monmon-sync-v1";   /* {code, rev, flat, base, ready, last, err}: flat and base are the progress as the database last sent it */
  var KEYS = ["monmon-done-v1", "monmon-ixl-plan-v1", "monmon-ixl-practice-v1",
    "futurelab-g6-ict-q1-v1", "gridquest-envision-2-4-2-5-v1", "powerlab-envision-3-1-v1", "factorlab-envision-3-2-3-3-v1",
    "signallab-g6-m2-l5-v1", "flowlab-g6-m2-l4-v1", "reviewquest-sadlier-a-units1-3-v1", "wordquest-sadlier-unit2-v1",
    "monmon-activity-v1"];
  var KEYSET = {};
  KEYS.forEach(function (k) { KEYSET[k] = 1; });
  var QUICK = {"monmon-done-v1": 1, "monmon-ixl-plan-v1": 1, "monmon-ixl-practice-v1": 1};   /* ticks and best scores */
  var BANNED = {"__proto__": 1, "constructor": 1, "prototype": 1};

  var store;
  try { store = window.localStorage; store.getItem(META); } catch (e) { return; }
  var proto = window.Storage.prototype, rawGet = proto.getItem, rawSet = proto.setItem, rawRemove = proto.removeItem;
  function get(k) { try { return rawGet.call(store, k); } catch (e) { return null; } }
  function put(k, v) { try { rawSet.call(store, k, v); } catch (e) {} }
  function drop(k) { try { rawRemove.call(store, k); } catch (e) {} }

  /* ---------- values and changes ---------- */
  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function isObj(x) { return x !== null && typeof x === "object" && !Array.isArray(x); }
  function size(o) { return Object.keys(o).length; }
  function parse(raw) { if (raw === null || raw === undefined) return undefined; try { return JSON.parse(raw); } catch (e) { return undefined; } }
  function clone(x) { return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); }
  function eq(a, b) {
    if (a === b) return true;
    if (!a || !b || typeof a !== "object" || typeof b !== "object" || Array.isArray(a) !== Array.isArray(b)) return false;
    var ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (var i = 0; i < ka.length; i++) if (!own(b, ka[i]) || !eq(a[ka[i]], b[ka[i]])) return false;
    return true;
  }
  /* The changes from a to b: {p: path, v: value}, {p: path, d: 1} (delete) or {p: path, v: {}, e: 1} (an object
     emptied). A new object is split into its values, so it adds to what another device saved there instead of
     replacing it; setting a new empty object keeps whatever is already there. Arrays count as one value. */
  function diff(a, b, path, ops) {
    if (isObj(a) && isObj(b)) {
      if (!size(b) && size(a)) { ops.push({p: path, v: {}, e: 1}); return ops; }
      Object.keys(a).forEach(function (k) { if (!own(b, k)) ops.push({p: path.concat(k), d: 1}); });
      Object.keys(b).forEach(function (k) { if (own(a, k)) diff(a[k], b[k], path.concat(k), ops); else split(b[k], path.concat(k), ops); });
    } else if (b === undefined) { if (a !== undefined) ops.push({p: path, d: 1}); }
    else if (a === undefined) split(b, path, ops);
    else if (!eq(a, b)) ops.push({p: path, v: b});
    return ops;
  }
  function split(v, path, ops) {
    if (isObj(v) && size(v)) Object.keys(v).forEach(function (k) { split(v[k], path.concat(k), ops); });
    else ops.push({p: path, v: v});
  }
  function applyOp(root, op) {
    var o = root, p = op.p;
    for (var i = 0; i < p.length - 1; i++) {
      if (BANNED[p[i]]) return;
      if (!isObj(o[p[i]])) { if (op.d) return; o[p[i]] = {}; }
      o = o[p[i]];
    }
    var k = p[p.length - 1];
    if (BANNED[k]) return;
    if (op.d) delete o[k];
    else if (isObj(op.v) && !size(op.v) && !op.e && isObj(o[k])) return;
    else o[k] = clone(op.v);
  }
  function hasPath(o, p) {
    for (var i = 0; i < p.length; i++) { if (!isObj(o)) return true; if (!own(o, p[i])) return false; o = o[p[i]]; }
    return true;
  }

  /* ---------- the database's flat form ---------- */
  /* a path segment as a database key: no . $ # [ ] / | or control characters, and never empty */
  function enc(s) { return s === "" ? "%" : String(s).replace(/[%.$#\[\]\/|\x00-\x1f\x7f]/g, function (c) { return "%" + ("0" + c.charCodeAt(0).toString(16).toUpperCase()).slice(-2); }); }
  function dec(s) { return s === "%" ? "" : s.replace(/%([0-9A-F]{2})/g, function (m, h) { return String.fromCharCode(parseInt(h, 16)); }); }
  function fkey(p) { return p.map(enc).join("|"); }
  function fromFlat(flat) {
    var data = {};
    Object.keys(flat).sort().forEach(function (fk) {   /* a path comes before the values under it */
      var v, p = fk.split("|").map(dec);
      try { v = JSON.parse(flat[fk]); } catch (e) { return; }
      if (own(KEYSET, p[0])) applyOp(data, {p: p, v: v});
    });
    return data;
  }
  /* the database update for some changes; flat is what the database holds, to find the values under a path */
  function toUpdate(ops, flat) {
    var up = {}, keys = Object.keys(flat);
    function clear(fk) { up["d/" + fk] = null; keys.forEach(function (k) { if (k.indexOf(fk + "|") === 0) up["d/" + k] = null; }); }
    ops.forEach(function (op) {
      var fk = fkey(op.p);
      if (op.d) { clear(fk); return; }
      if (isObj(op.v) && size(op.v)) {   /* an object where a value was: its values replace it */
        clear(fk);
        var leaves = [];
        split(op.v, op.p, leaves);
        leaves.forEach(function (l) { up["d/" + fkey(l.p)] = JSON.stringify(l.v); });
        return;
      }
      if (!isObj(op.v) || op.e) clear(fk);   /* a value, or an emptied object, replaces what was under it */
      up["d/" + fk] = JSON.stringify(op.v);
    });
    up.t = {".sv": "timestamp"};
    return up;
  }

  function meta() { var m = parse(get(META)); return isObj(m) && typeof m.code === "string" ? m : null; }
  function saveMeta(m) { put(META, JSON.stringify(m)); }
  function readLocal() { var o = {}; KEYS.forEach(function (k) { var v = parse(get(k)); if (v !== undefined) o[k] = v; }); return o; }

  /* ---------- the page's reads and saves ---------- */
  var code = "", seen = {};   /* seen: what this page last read or saved, per key */
  function mine(st, k) { return code !== "" && st === store && own(KEYSET, k); }
  proto.getItem = function (k) {
    var r = rawGet.apply(this, arguments);
    if (mine(this, k)) seen[k] = parse(r);
    return r;
  };
  proto.setItem = function (k, v) {
    var before = this === store && own(KEYSET, k) ? parse(rawGet.call(this, k)) : undefined;
    if (!mine(this, k)) { rawSet.apply(this, arguments); saved(this, k, before); return; }
    var next = parse(String(v));
    if (next === undefined) return rawSet.apply(this, arguments);
    var cur = parse(rawGet.call(this, k)), box = {v: clone(cur)};
    diff(own(seen, k) ? seen[k] : cur, next, [], []).forEach(function (op) { applyOp(box, {p: ["v"].concat(op.p), v: op.v, d: op.d, e: op.e}); });
    seen[k] = next;
    rawSet.call(this, k, JSON.stringify(box.v === undefined ? next : box.v));
    changed(k);
    saved(this, k, before);
  };
  /* tell the page about progress saved on this device (assets/rewards.js celebrates it); another device's
     progress is written with rawSet and never comes through here */
  function saved(st, k, before) {
    if (st !== store || !own(KEYSET, k)) return;
    try { window.dispatchEvent(new CustomEvent("monmon-saved", {detail: {key: k, before: before, after: parse(rawGet.call(store, k))}})); } catch (e) {}
  }
  proto.removeItem = function (k) {
    var r = rawRemove.apply(this, arguments);
    if (mine(this, k)) { seen[k] = undefined; changed(k); }
    return r;
  };

  /* ---------- talking to the database ---------- */
  var busy = false, inflight = null, timer = 0, firstAt = 0, quickAt = 0, dirty = false, lastSend = 0, lastPull = 0, retry = 0;
  var started = Date.now(), touched = false, lastTouch = Date.now(), stream = null;

  function url(path, q) { return DB + "/f/" + code + path + ".json" + (q ? "?" + q : ""); }
  function ask(u, opts) {
    return fetch(u, opts || {cache: "no-store", credentials: "omit"}).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (j) {
        if (!r.ok) { var e = new Error((j && j.error) || "http " + r.status); e.status = r.status; throw e; }
        return j;
      });
    });
  }
  /* the family's node: {d: {flat key: JSON}, t: time of the last change} */
  function fetchAll() {
    return ask(url("")).then(function (j) {
      var flat = j && isObj(j.d) ? j.d : {};
      return {rev: j && typeof j.t === "number" ? j.t : 0, flat: flat, data: fromFlat(flat)};
    });
  }
  function plan(at) {
    clearTimeout(timer);
    timer = setTimeout(function () { timer = 0; sync(); }, Math.max(0, at - Date.now()));
  }
  function changed(k) {
    var now = Date.now(), at;
    dirty = true;
    if (!firstAt) firstAt = now;
    if (QUICK[k] && !quickAt) quickAt = now + 4000;
    at = Math.min(now + 60000, firstAt + 300000, quickAt || Infinity);
    plan(Math.max(at, lastSend + 5000));
    tell();
  }
  function pending() { var m = meta(); return !!(m && m.ready) && diff(m.base || {}, readLocal(), [], []).length > 0; }
  function sync() { return pending() ? push(false) : pull(); }

  /* one request at a time; an answer only counts for the code it was asked with */
  function pull() {
    if (!code) return Promise.resolve();
    if (busy) return inflight || Promise.resolve();
    var c = code;
    busy = true; lastPull = Date.now();
    inflight = fetchAll()
      .then(function (res) { retry = 0; if (c === code) receive(res, null); }, function (e) { if (c === code) failed(e); })
      .then(function () { busy = false; inflight = null; });
    return inflight;
  }
  function push(keep) {
    var m = meta();
    if (!code || !m) return Promise.resolve();
    if (!m.ready) return pull();   /* the first pull merges this device's progress with the family's */
    if (busy) { if (!keep) plan(Date.now() + 3000); return Promise.resolve(); }
    var local = readLocal(), ops = diff(m.base || {}, local, [], []);
    firstAt = 0; quickAt = 0; dirty = false;
    if (!ops.length) { tell(); return Promise.resolve(); }
    var body = JSON.stringify(toUpdate(ops, m.flat || {})), c = code;
    busy = true; lastSend = Date.now(); lastPull = Date.now();
    /* POST with x-http-method-override and a text body is a simple request, so there is no preflight */
    inflight = ask(url("", "x-http-method-override=PATCH"), {method: "POST", body: body, headers: {"Content-Type": "text/plain;charset=UTF-8"},
        keepalive: !!keep && body.length < 60000, cache: "no-store", credentials: "omit"})
      .then(function () { return keep ? null : fetchAll(); })
      .then(function (res) { retry = 0; if (res && c === code) receive(res, local); }, function (e) { if (c === code) { dirty = true; failed(e); } })
      .then(function () { busy = false; inflight = null; });
    return inflight;
  }
  /* res is the family's progress; this device's changes not in it yet are kept on top and sent next */
  function receive(res, sent) {
    var m = meta();
    if (!m || m.code !== code || !res || typeof res.rev !== "number") return;
    if (m.ready && res.rev < (m.rev || 0)) return;   /* older than what this device already has */
    var local = readLocal(), data = res.data, keys = [], ops;
    if (m.ready) ops = diff(sent || m.base || {}, local, [], []);
    else ops = diff({}, local, [], []).filter(function (op) { return !hasPath(data, op.p); });   /* first time: add what only this device has */
    var next = clone(data);
    ops.forEach(function (op) { applyOp(next, op); });
    KEYS.forEach(function (k) {
      if (eq(next[k], local[k])) return;
      keys.push(k);
      if (next[k] === undefined) drop(k); else put(k, JSON.stringify(next[k]));
    });
    m.rev = res.rev; m.flat = res.flat; m.base = data; m.ready = true; m.last = Date.now(); m.err = "";
    saveMeta(m);
    /* send them soon, like a tick: a later save on this page mustn't push that back by a minute */
    if (ops.length) { dirty = true; quickAt = Math.max(Date.now() + 500, lastSend + 5000); plan(quickAt); }
    tell();
    if (keys.length) landed(keys);
  }
  function failed(e) {
    var m = meta();
    if (!m) return;
    if (e && (e.status === 401 || e.status === 403)) { m.err = "code"; saveMeta(m); stop(); tell(); return; }
    m.err = "net";
    saveMeta(m);
    retry = Math.min(Math.max(retry * 2, 15000), 600000);
    plan(Date.now() + retry);
    tell();
  }
  function stop() { code = ""; clearTimeout(timer); timer = 0; dirty = false; listen(false); }
  function tell() { try { window.dispatchEvent(new CustomEvent("monmon-sync-status")); } catch (e) {} }

  /* while a page is in front, the database tells it when the family's progress changes (only the time is sent) */
  function listen(on) {
    if (stream) { stream.close(); stream = null; }
    if (!on || !code || !window.EventSource) return;
    try { stream = new EventSource(url("/t")); } catch (e) { stream = null; return; }
    stream.addEventListener("put", function (ev) {
      var j = parse(ev.data), m = meta();
      if (j && typeof j.data === "number" && m && m.ready && j.data > (m.rev || 0)) setTimeout(sync, 300);
    });
    stream.addEventListener("cancel", function () { listen(false); });
  }

  /* ---------- new progress from another device ---------- */
  function landed(keys) {
    var used = keys.filter(function (k) { return own(seen, k); });
    if (!used.length) return;   /* this page doesn't show them */
    var ev = null;
    try { ev = new CustomEvent("monmon-sync", {detail: {keys: used}, cancelable: true}); } catch (e) {}
    if (ev && !window.dispatchEvent(ev)) return;   /* the page showed them itself */
    var last = 0;
    try { last = +sessionStorage.getItem("monmon-sync-reload") || 0; } catch (e) {}
    if (!touched && Date.now() - started < 8000 && Date.now() - last > 30000) {
      try { sessionStorage.setItem("monmon-sync-reload", String(Date.now())); } catch (e) {}
      location.reload();
      return;
    }
    banner();
  }
  function banner() {
    if (document.getElementById("syncBanner")) return;
    var css = document.createElement("style");
    css.textContent = '.sync-banner{position:fixed;z-index:60;inset-inline:12px;bottom:12px;max-width:520px;margin-inline:auto;display:flex;align-items:center;gap:10px;' +
      'padding:10px 12px;background:#14163A;color:#fff;border-radius:12px;box-shadow:0 6px 20px rgba(0,0,0,.25);font:700 15px/1.4 "Tajawal","Segoe UI",system-ui,sans-serif;direction:rtl}' +
      '.sync-banner span{flex:1}.sync-banner button{font:inherit;min-height:40px;padding:6px 14px;border:0;border-radius:10px;background:#FFD23F;color:#14163A;cursor:pointer}' +
      '@media print{.sync-banner{display:none!important}}';
    document.head.appendChild(css);
    var b = document.createElement("div");
    b.id = "syncBanner"; b.className = "sync-banner"; b.setAttribute("role", "status"); b.lang = "ar";
    b.innerHTML = '<span>وصل تقدّم جديد من جهاز ثاني.</span><button type="button">حدّث الصفحة</button>';
    b.querySelector("button").addEventListener("click", function () { location.reload(); });
    document.body.appendChild(b);
  }

  /* ---------- when to sync ---------- */
  ["pointerdown", "keydown", "touchstart"].forEach(function (t) {
    window.addEventListener(t, function () { touched = true; lastTouch = Date.now(); }, {capture: true, passive: true});
  });
  document.addEventListener("visibilitychange", function () {
    if (!code) return;
    if (document.visibilityState === "hidden") { listen(false); if (dirty) push(true); }
    else { listen(true); if (Date.now() - lastPull > 20000) sync(); }
  });
  window.addEventListener("pagehide", function () { if (code && dirty) push(true); });
  window.addEventListener("online", function () { if (code) sync(); });
  /* if the database can't tell this page about changes, look every 2 minutes while it is in use */
  setInterval(function () {
    if (code && document.visibilityState === "visible" && (!stream || stream.readyState !== 1) &&
        Date.now() - lastTouch < 600000 && Date.now() - lastPull > 110000) sync();
  }, 30000);

  window.MonmonSync = {
    keys: KEYS.slice(),
    /* a saved value, read without counting as the page's own read (the page's reads protect its next save) */
    peek: function (k) { return get(k); },
    status: function () {
      var m = meta();
      return {linked: !!m, off: get(OFF) === "1", code: m ? m.code : "", ready: !!(m && m.ready), last: (m && m.last) || 0, err: (m && m.err) || "", waiting: dirty};
    },
    link: function (c) {
      if (!/^[A-Za-z0-9_-]{16,128}$/.test(c || "")) return Promise.reject(new Error("code"));
      var m = meta();
      drop(OFF);
      if (!m || m.code !== c) saveMeta({code: c, rev: 0, flat: {}, base: {}, ready: false, last: 0, err: ""});
      else if (m.err === "code") { m.err = ""; saveMeta(m); }
      code = c;
      listen(document.visibilityState !== "hidden");
      /* after any request already on its way; a device that already has progress sends it straight away,
         so closing this page doesn't hold it back */
      return (inflight || Promise.resolve()).then(pull).then(function () { return pending() ? push(false) : null; })
        .then(function () { return window.MonmonSync.status(); });
    },
    start: function () { return window.MonmonSync.link(CODE); },
    unlink: function () { drop(META); put(OFF, "1"); stop(); tell(); },
    sync: function () { return sync(); }
  };

  /* every device syncs unless sync was switched off on it */
  var m0 = meta();
  if (!m0 && get(OFF) !== "1") { m0 = {code: CODE, rev: 0, flat: {}, base: {}, ready: false, last: 0, err: ""}; saveMeta(m0); }
  if (m0 && m0.err !== "code") { code = m0.code; listen(document.visibilityState !== "hidden"); sync(); }
})();
