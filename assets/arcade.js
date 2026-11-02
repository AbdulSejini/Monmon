/* The arcade's ledger (arcade/index.html): games are a reward for mastering parts of the study pages.
   - Each part mastered gives 5 minutes of play, once. The first game is open from the start with 5 minutes,
     and each part mastered opens the next game.
   - Play time is a balance spent second by second while a game runs (arcade/index.html calls spend()), so going
     back, reloading, a second window or a changed clock never brings it back. At most 20 minutes a day.
   - A part counts when a page saves it as newly mastered on this device (the monmon-saved event of assets/sync.js:
     before → after). What was mastered before the arcade existed, or is mastered again, gives nothing, and each
     part id is earned once in all.
   Saved in monmon-arcade-v1 (synced): {earned: {part: {t, n}}, used: {day: {device: ms}}, best: {game: score}}.
   Each device adds only its own play time, so devices never undo each other's.
   Include after rewards.js on the pages with parts:  <script src="../../assets/arcade.js" data-root="../../"></script> */
(function () {
  "use strict";
  var KEY = "monmon-arcade-v1", TZ = "Asia/Riyadh", PER_PART = 5, DAILY = 20, GIFT = 5, MIN = 60000;
  var me = document.currentScript || document.querySelector('script[src*="arcade.js"]');
  var root = (me && me.getAttribute("data-root")) || "";
  var store;
  try { store = window.localStorage; store.getItem(KEY); } catch (e) { return; }

  /* ---------- the games, in the order they open ---------- */
  var GAMES = [
    {id: "drop", name: "هبوط المظلة", en: "Sky Drop", rarity: 1},
    {id: "stack", name: "برج البناء", en: "Build Rush", rarity: 2},
    {id: "storm", name: "هروب العاصفة", en: "Storm Run", rarity: 3},
    {id: "target", name: "صيد الأهداف", en: "Target Rush", rarity: 4}
  ];

  /* ---------- where the parts come from: a saved key, and the parts its value has mastered ---------- */
  function keys(o) { return o && typeof o === "object" ? Object.keys(o).filter(function (k) { return o[k]; }) : []; }
  function lab(pre, title, zones) {
    return function (v) {
      var out = [];
      Object.keys(zones).forEach(function (z) { var Z = v && v.zones && v.zones[z]; if (Z && Z.stars >= 3) out.push([pre + "-" + z, title + ": " + zones[z]]); });
      if (v && Array.isArray(v.attempts) && v.attempts.some(function (a) { return a && a.kind === "final" && a.pct >= 80; })) out.push([pre + "-final", title + ": التحدي النهائي"]);
      return out;
    };
  }
  var ISL = {mc: "اختيار من متعدد", tf: "صح أو خطأ", match: "صِل", fill: "أكمل", mock: "الاختبار التجريبي"};
  var ENG = {read: "Reading", idea: "Main idea", vocab: "Vocabulary", gram: "Grammar", write: "Letter", test: "Practice test"};
  var AR = {a1: "همزتا الوصل والقطع", a2: "الهمزة المتوسطة", a3: "الهمزة المتطرفة", a4: "كان وأخواتها", dict: "قطعة الإملاء", mock: "الاختبار التجريبي"};
  var SCI = {l2: "Structure and Support", l3: "Energy and Waste", l4: "Moving Materials", l5: "Control and Information", test: "Practice test"};
  var SOURCES = [
    {key: "islamic-g6-quiz2-v1", page: "islamic/quiz-2/index.html", title: "الإسلامية: الاختبار القصير 2", rule: "80% أو أكثر في جولة كاملة، أو 12 من 15 في الاختبار التجريبي",
     all: Object.keys(ISL).map(function (m) { return ["isl-" + m, "الإسلامية: " + ISL[m]]; }),
     parts: function (v) { return keys(v && v.mastered).filter(function (m) { return ISL[m]; }).map(function (m) { return ["isl-" + m, "الإسلامية: " + ISL[m]]; }); }},
    {key: "english-g6-quiz2-v1", page: "english/quiz-2/index.html", title: "الإنجليزي: الاختبار القصير 2", rule: "80% أو أكثر في جولة كاملة، أو 24 من 30 في الاختبار التجريبي",
     all: Object.keys(ENG).map(function (m) { return ["eng-" + m, "الإنجليزي: " + ENG[m]]; }),
     parts: function (v) { return keys(v && v.mastered).filter(function (m) { return ENG[m]; }).map(function (m) { return ["eng-" + m, "الإنجليزي: " + ENG[m]]; }); }},
    {key: "arabic-g6-quiz2-v1", page: "arabic/quiz-2/index.html", title: "لغتي: الاختبار القصير 2", rule: "80% أو أكثر في جولة كاملة، أو 16 من 20 في الاختبار التجريبي، أو قطعة الإملاء بلا خطأ",
     all: Object.keys(AR).map(function (m) { return ["ar-" + m, "لغتي: " + AR[m]]; }),
     parts: function (v) { return keys(v && v.mastered).filter(function (m) { return AR[m]; }).map(function (m) { return ["ar-" + m, "لغتي: " + AR[m]]; }); }},
    {key: "science-g6-quiz2-v1", page: "science/quiz-2/index.html", title: "العلوم: الاختبار القصير 2", rule: "80% أو أكثر في جولة كاملة، أو 24 من 30 في الاختبار التجريبي",
     all: Object.keys(SCI).map(function (m) { return ["sci-" + m, "العلوم: " + SCI[m]]; }),
     parts: function (v) { return keys(v && v.mastered).filter(function (m) { return SCI[m]; }).map(function (m) { return ["sci-" + m, "العلوم: " + SCI[m]]; }); }},
    {key: "numberline-envision-2-1-2-3-v1", page: "math/integers-rational/index.html", title: "رياضيات: الأعداد الصحيحة", rule: "3 نجوم في المنطقة، أو 80% في التحدي النهائي",
     zones: {z1: "Integer Island", z2: "Rational Road", z3: "Absolute Value Bridge"}, pre: "nll"},
    {key: "factorlab-envision-3-2-3-3-v1", page: "math/factors-expressions/index.html", title: "رياضيات: العوامل والمضاعفات", rule: "3 نجوم في المنطقة، أو 80% في التحدي النهائي",
     zones: {z1: "Factor Finder", z2: "Multiple Mountain", z3: "Party Planner", z4: "Order Station", z5: "Expression Builder"}, pre: "fl"},
    {key: "powerlab-envision-3-1-v1", page: "math/exponents/index.html", title: "رياضيات: الأسس", rule: "3 نجوم في المنطقة، أو 80% في التحدي النهائي",
     zones: {z1: "Factor Factory", z2: "Power Plant", z3: "Fraction Falls", z4: "Ten Tower", z5: "Puzzle Peak"}, pre: "pl"},
    {key: "gridquest-envision-2-4-2-5-v1", page: "math/coordinate-plane/index.html", title: "رياضيات: المستوى الإحداثي", rule: "3 نجوم في المنطقة، أو 80% في التحدي النهائي",
     zones: {z1: "Grid City", z2: "Fraction Forest", z3: "Mirror Lake", z4: "Distance Dunes", z5: "Town Map"}, pre: "gq"},
    {key: "monmon-ixl-coach-v1", page: "ixl/coach/index.html", title: "عيادة IXL", rule: "تنجح في اختبار الجاهزية",
     all: ["b54", "42p", "cqj", "pqq", "pf8"].map(function (s) { return ["coach-" + s, "عيادة IXL: " + s.toUpperCase()]; }),
     parts: function (v) { return keys(v && v.passed).map(function (s) { return ["coach-" + s, "عيادة IXL: " + s.toUpperCase()]; }); }}
  ];
  SOURCES.forEach(function (s) {
    if (!s.zones) return;
    s.parts = lab(s.pre, s.title, s.zones);
    s.all = Object.keys(s.zones).map(function (z) { return [s.pre + "-" + z, s.title + ": " + s.zones[z]]; }).concat([[s.pre + "-final", s.title + ": التحدي النهائي"]]);
  });
  var BY_KEY = {};
  SOURCES.forEach(function (s) { BY_KEY[s.key] = s; });

  /* ---------- the ledger ---------- */
  function isObj(v) { return v !== null && typeof v === "object" && !Array.isArray(v); }
  function num(v) { return typeof v === "number" && isFinite(v) && v > 0 ? v : 0; }
  function read() {
    var v = null;
    try { v = JSON.parse(store.getItem(KEY) || "null"); } catch (e) {}
    if (!isObj(v)) v = {};
    if (!isObj(v.earned)) v.earned = {};
    if (!isObj(v.used)) v.used = {};
    if (!isObj(v.best)) v.best = {};
    return v;
  }
  function write(v) { try { store.setItem(KEY, JSON.stringify(v)); } catch (e) {} }
  function day() {
    try { return new Intl.DateTimeFormat("en-CA", {timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit"}).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  var DEV = (function () {
    try {
      var f = JSON.parse(store.getItem("monmon-fx-v1") || "null");
      if (f && typeof f.dev === "string" && /^[a-z0-9]{6,12}$/.test(f.dev)) return f.dev;
      var d = store.getItem("monmon-arcade-dev");
      if (!d || !/^[a-z0-9]{6,12}$/.test(d)) { d = ("a" + Math.random().toString(36).slice(2) + "00000").slice(0, 9); store.setItem("monmon-arcade-dev", d); }
      return d;
    } catch (e) { return "anon00"; }
  })();
  function totals(L) {
    L = L || read();
    var parts = Object.keys(L.earned).length, bank = (GIFT + PER_PART * parts) * MIN, usedAll = 0, usedToday = 0, today = day();
    Object.keys(L.used).forEach(function (d) {
      var m = L.used[d];
      if (!isObj(m)) return;
      Object.keys(m).forEach(function (k) { var v = num(m[k]); usedAll += v; if (d === today) usedToday += v; });
    });
    var left = Math.max(0, bank - usedAll), todayLeft = Math.max(0, DAILY * MIN - usedToday);
    return {parts: parts, bank: bank, usedAll: usedAll, usedToday: usedToday, left: left, todayLeft: todayLeft,
      can: Math.min(left, todayLeft), open: Math.min(GAMES.length, 1 + parts), next: parts + 1 < GAMES.length ? GAMES[parts + 1] : null};
  }
  /* spend play time; returns what is left to play */
  function spend(ms) {
    ms = num(ms);
    var L = read(), d = day();
    if (ms) {
      if (!isObj(L.used[d])) L.used[d] = {};
      L.used[d][DEV] = num(L.used[d][DEV]) + Math.round(ms);
      write(L);
    }
    return totals(L).can;
  }
  function best(game, score) {
    var L = read();
    if (typeof score === "number" && isFinite(score) && score > num(L.best[game])) { L.best[game] = Math.round(score); write(L); }
    return num(L.best[game]);
  }
  /* what is mastered right now, from the saved progress, and whether it gave time */
  function catalog() {
    var L = read();
    return SOURCES.map(function (s) {
      var v = null;
      try { v = JSON.parse(store.getItem(s.key) || "null"); } catch (e) {}
      var done = {};
      s.parts(v).forEach(function (p) { done[p[0]] = 1; });
      return {key: s.key, page: s.page, title: s.title, rule: s.rule, parts: s.all.map(function (p) {
        return {id: p[0], name: p[1], earned: L.earned[p[0]] ? L.earned[p[0]].t : 0, mastered: !!done[p[0]]};
      })};
    });
  }

  /* ---------- a part newly mastered on this device ---------- */
  function earn(list) {
    var L = read(), before = totals(L).open, added = [];
    list.forEach(function (p) { if (!L.earned[p[0]]) { L.earned[p[0]] = {t: Date.now(), n: p[1]}; added.push(p); } });
    if (!added.length) return [];
    write(L);
    var t = totals(L);
    toast(added, t, t.open > before ? GAMES[t.open - 1] : null);
    try { window.dispatchEvent(new CustomEvent("monmon-arcade", {detail: {added: added, totals: t}})); } catch (e) {}
    return added;
  }
  window.addEventListener("monmon-saved", function (e) {
    var d = e.detail || {}, s = BY_KEY[d.key];
    if (!s) return;
    var had = {};
    s.parts(d.before).forEach(function (p) { had[p[0]] = 1; });
    var fresh = s.parts(d.after).filter(function (p) { return !had[p[0]]; });
    if (fresh.length) earn(fresh);
  });

  /* ---------- the note that time was earned ---------- */
  var styled = false;
  function sound() {
    try {
      if (window.MonmonRewards && MonmonRewards.sound && !MonmonRewards.sound()) return;
      var A = window.AudioContext || window.webkitAudioContext; if (!A) return;
      var ac = sound.ac || (sound.ac = new A()), t = ac.currentTime;
      [523, 659, 784, 1047].forEach(function (f, i) {
        var o = ac.createOscillator(), g = ac.createGain();
        o.type = "square"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t + i * 0.07); g.gain.exponentialRampToValueAtTime(0.06, t + i * 0.07 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.07 + 0.18);
        o.connect(g); g.connect(ac.destination); o.start(t + i * 0.07); o.stop(t + i * 0.07 + 0.2);
      });
    } catch (e) {}
  }
  function toast(added, t, opened) {
    if (!document.body) return;
    if (!styled) {
      styled = true;
      var css = document.createElement("style");
      css.textContent = '.ar-toast{position:fixed;z-index:67;inset-inline:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));max-width:480px;margin-inline:auto;display:grid;gap:4px;padding:12px 14px;' +
        'background:linear-gradient(135deg,#2A1B6E,#5B2BB5);color:#fff;border:3px solid #14163A;border-radius:14px;box-shadow:4px 4px 0 #14163A;font:700 15px/1.45 "Tajawal","Segoe UI",system-ui,sans-serif;direction:rtl;' +
        'transform:translateY(140%) skewY(-2deg);transition:transform .45s cubic-bezier(.3,1.6,.5,1)}' +
        '.ar-toast.in{transform:none}.ar-toast b{font-size:18px;color:#FFD23F}.ar-toast a{color:#7CF0FF;font-weight:800}' +
        '.ar-toast button{position:absolute;inset-inline-end:8px;top:6px;border:0;background:none;color:#fff;font-size:20px;cursor:pointer;line-height:1}' +
        '@media (prefers-reduced-motion:reduce){.ar-toast{transition:none}}@media print{.ar-toast{display:none!important}}';
      document.head.appendChild(css);
    }
    var old = document.querySelector(".ar-toast"); if (old) old.remove();
    var el = document.createElement("div");
    el.className = "ar-toast"; el.setAttribute("role", "status"); el.lang = "ar";
    var mins = Math.floor(t.can / MIN);
    el.innerHTML = '<button type="button" aria-label="إغلاق">×</button><b>🎮 +' + (PER_PART * added.length) + ' دقائق لعب</b>' +
      '<span>أتقنت ' + added.map(function (p) { return "«" + p[1] + "»"; }).join(" و") + '.' + (opened ? ' وانفتحت لعبة جديدة: <b>' + opened.name + '</b>!' : "") + '</span>' +
      '<span>رصيدك الآن ' + Math.floor(t.left / MIN) + ' دقيقة' + (t.todayLeft < t.left ? ' (المسموح اليوم ' + mins + ')' : "") + '. <a href="' + root + 'arcade/index.html">افتح صالة الألعاب ←</a></span>';
    document.body.appendChild(el);
    el.querySelector("button").addEventListener("click", function () { el.remove(); });
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add("in"); }); });
    sound();
    setTimeout(function () { if (el.isConnected) { el.classList.remove("in"); setTimeout(function () { el.remove(); }, 600); } }, 9000);
  }

  window.MonmonArcade = {
    key: KEY, games: GAMES, perPart: PER_PART, daily: DAILY, gift: GIFT, device: DEV,
    totals: function () { return totals(); }, spend: spend, best: best, catalog: catalog, day: day,
    sources: SOURCES.map(function (s) { return s.key; })
  };
})();
