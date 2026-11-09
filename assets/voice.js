/* Reading voice for the whole site (English words and sentences, Arabic dictation).
   - Picks the clearest voice the device has: downloaded Premium/Enhanced voices on iPad, iPhone and Mac,
     Natural voices in Edge, Google voices in Chrome; never the novelty voices (Bad News, Bubbles, Grandpa…).
   - Remembers the voice and speed chosen in the voice panel, per language, on this device.
   - Reads long text sentence by sentence: it sounds more natural, and Chrome stops one long utterance
     after about 15 seconds.
   - Dictation reads like a teacher: the whole sentence, then each short phrase twice with time to write,
     then the whole sentence again.
   Include before the page's own script:  <script src="../../assets/voice.js"></script>
   Any element with data-voice-panel="en" or "ar" opens the voice panel. */
(function () {
  "use strict";
  var synth = window.speechSynthesis;
  var can = !!(synth && window.SpeechSynthesisUtterance);
  var KEY = "monmon-voice-v1";
  var NOVELTY = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Deranged|Good News|Hysterical|Jester|Organ|Pipe Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Fred|Junior|Ralph|Kathy|Princess|Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley)\b/i;
  var BASE = {en: 0.9, ar: 0.85};
  var SPEEDS = [["slow", 0.8, "أبطأ"], ["normal", 1, "عادي"], ["fast", 1.15, "أسرع"]];
  var NAMES = {en: "الإنجليزي", ar: "العربي"};
  var SAMPLE = {en: "Hello! This is how I will read your words and sentences.", ar: "مَرْحَبًا! هكذا سأقرأُ لكَ الجُمَلَ في التدريب."};

  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { return {}; } }
  function save(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {} }
  var prefs = load();

  /* ---------- the voices this device has, best first ---------- */
  var cache = [];
  function all() {
    if (!can) return [];
    try { var v = synth.getVoices() || []; if (v.length) cache = v; } catch (e) {}
    return cache;
  }
  function langOf(v) { return String(v.lang || "").replace("_", "-").toLowerCase(); }
  function quality(v) {
    var n = v.name || "";
    if (/premium|natural|neural/i.test(n)) return 3;
    if (/enhanced|google|siri/i.test(n)) return 2;
    return 1;
  }
  function score(v, lang) {
    var n = v.name || "", L = langOf(v);
    if (L.indexOf(lang) !== 0 || NOVELTY.test(n)) return -1;
    var s = quality(v) * 30;
    if (/online/i.test(n)) s += 3;
    if (lang === "en") s += L === "en-us" ? 12 : L === "en-gb" ? 9 : L === "en-au" || L === "en-ca" ? 5 : 0;
    if (lang === "ar") s += L === "ar-sa" ? 12 : /^ar-(001|ae|kw|qa|bh|om|jo)$/.test(L) ? 8 : 4;
    /* clear, well-known voices first among equals */
    if (/\b(Ava|Zoe|Samantha|Allison|Evan|Nathan|Aria|Jenny|Guy|Hamed|Zariyah|Majed|Maged|Laila|Tarik)\b/i.test(n)) s += 4;
    if (/^Microsoft (David|Zira|Mark|Naayf|Hoda)\b/i.test(n) && !/online|natural/i.test(n)) s -= 4;
    if (v.default) s += 1;
    return s;
  }
  function list(lang) {
    return all().map(function (v) { return {v: v, s: score(v, lang)}; }).filter(function (x) { return x.s >= 0; })
      .sort(function (a, b) { return b.s - a.s || String(a.v.name).localeCompare(String(b.v.name)); }).map(function (x) { return x.v; });
  }
  function id(v) { return v ? (v.voiceURI || v.name) : ""; }
  function pick(lang) {
    var vs = list(lang), want = (prefs[lang] || {}).voice;
    if (want) for (var i = 0; i < vs.length; i++) if (id(vs[i]) === want) return vs[i];
    return vs[0] || null;
  }
  function speed(lang) {
    var k = (prefs[lang] || {}).speed || "normal";
    for (var i = 0; i < SPEEDS.length; i++) if (SPEEDS[i][0] === k) return SPEEDS[i][1];
    return 1;
  }

  /* ---------- speaking ---------- */
  var token = 0, origCancel = can ? synth.cancel.bind(synth) : function () {};
  /* the pages also call speechSynthesis.cancel() when they change screen: stop the queue too */
  if (can) try { synth.cancel = function () { token++; return origCancel(); }; } catch (e) {}
  function stop() { token++; try { origCancel(); } catch (e) {} }

  function sentences(text) {
    var t = String(text || "").replace(/\s+/g, " ").trim();
    if (!t) return [];
    var parts = t.match(/[^.!?؟…]+[.!?؟…]*["'”»)]*\s*/g) || [t], out = [];
    parts.forEach(function (p) {
      p = p.trim(); if (!p) return;
      /* a very long sentence is split at its commas */
      if (p.length > 160) cut(p, /([,،;؛])\s+/g).forEach(function (q) { if (q.trim()) out.push(q.trim()); });
      else out.push(p);
    });
    /* keep a tiny piece ("Yes.") with the next one */
    for (var i = out.length - 2; i >= 0; i--) if (out[i].length < 8) { out[i] = out[i] + " " + out[i + 1]; out.splice(i + 1, 1); }
    return out;
  }
  /* split after the punctuation the pattern captures (no lookbehind: older iPads lack it) */
  function cut(s, re) { return s.replace(re, "$1\u0000").split("\u0000"); }
  /* dictation phrases: split at commas and full stops, then into two to four words, as a teacher dictates.
     A phrase does not end on a small joining word (في، من، عن…) and the last one is never a single word. */
  var GLUE = /^(في|من|عن|على|إلى|الى|و|ثم|أو|أن|إن|لا|ما|مع|بين|الذي|التي|a|an|the|of|to|in|on|at|for|and|or|but|with)$/i;
  function bare(w) { return w.replace(/[\u064B-\u0652\u0670.,،؛;:!?؟"'«»()]/g, ""); }
  function phrases(text) {
    var out = [];
    cut(String(text || ""), /([,،.؛;!?؟])\s+/g).forEach(function (part) {
      var w = part.trim().split(/\s+/).filter(Boolean);
      if (!w.length) return;
      if (w.length <= 4) { out.push(w.join(" ")); return; }
      var size = Math.ceil(w.length / Math.ceil(w.length / 3)), chunks = [], cur = [];
      w.forEach(function (x) { cur.push(x); if (cur.length >= size) { chunks.push(cur); cur = []; } });
      if (cur.length) chunks.push(cur);
      var glue = function () {
        for (var i = 0; i < chunks.length - 1; i++)
          while (chunks[i].length > 1 && GLUE.test(bare(chunks[i][chunks[i].length - 1]))) chunks[i + 1].unshift(chunks[i].pop());
      };
      glue();
      var k = chunks.length - 1;
      if (k > 0 && chunks[k].length === 1) {
        if (chunks[k - 1].length <= 3) chunks[k - 1] = chunks[k - 1].concat(chunks.pop());
        else { chunks[k].unshift(chunks[k - 1].pop()); glue(); }
      }
      chunks.forEach(function (c) { out.push(c.join(" ")); });
    });
    return out;
  }

  /* run a list of steps: {text, rate, after} speaks, {wait} pauses */
  function run(steps, lang, done) {
    if (!can) return false;
    var busy = false;
    try { busy = synth.speaking || synth.pending; } catch (e) {}
    stop();
    var my = token, i = 0, v = pick(lang), mult = speed(lang);
    function next() {
      if (my !== token) return;
      if (i >= steps.length) { if (done) try { done(); } catch (e) {} return; }
      var s = steps[i++];
      if (s.wait) { setTimeout(next, s.wait); return; }
      var u;
      try { u = new SpeechSynthesisUtterance(s.text); } catch (e) { return; }
      if (v) { try { u.voice = v; } catch (e) {} u.lang = v.lang; } else u.lang = lang === "ar" ? "ar-SA" : "en-US";
      u.rate = Math.max(0.5, Math.min(1.4, (s.rate || BASE[lang] || 0.9) * mult));
      var fired = false;
      var fin = function () { if (fired) return; fired = true; if (my === token) setTimeout(next, s.after || 120); };
      u.onend = fin; u.onerror = fin;
      /* Safari now and then never says it has finished: move on after a generous time */
      setTimeout(fin, 2500 + s.text.length * 140 / u.rate);
      try { synth.speak(u); } catch (e) { fin(); }
    }
    /* right after cancel(), Safari can drop the next utterance: wait a moment, but only when something was playing,
       so the first tap still speaks inside the tap itself (iPad needs that) */
    if (busy) setTimeout(next, 80); else next();
    return true;
  }

  function speak(text, opt) {
    opt = opt || {};
    var lang = opt.lang === "ar" ? "ar" : "en";
    var steps = sentences(text).map(function (p) { return {text: p, rate: opt.rate, after: opt.gap || 150}; });
    return steps.length ? run(steps, lang, opt.onend) : false;
  }
  function dictate(text, opt) {
    opt = opt || {};
    var lang = opt.lang === "en" ? "en" : "ar", slow = (opt.rate || BASE[lang]) * 0.9;
    var steps = [{text: String(text).trim(), rate: slow, after: 1200}];
    phrases(text).forEach(function (p) {
      var words = p.split(/\s+/).length;
      steps.push({text: p, rate: slow * 0.95, after: 900}, {text: p, rate: slow * 0.95, after: 1400 + words * 900});
    });
    steps.push({text: String(text).trim(), rate: slow, after: 0});
    return run(steps, lang, opt.onend);
  }
  function has(lang) { return !!pick(lang === "ar" ? "ar" : "en"); }

  /* ---------- the voice panel ---------- */
  var listeners = [];
  function onvoices(fn) { listeners.push(fn); }
  if (can) {
    var changed = function () { all(); listeners.forEach(function (fn) { try { fn(); } catch (e) {} }); if (panel && !panel.hidden) fill(); };
    try { synth.addEventListener("voiceschanged", changed); } catch (e) { try { synth.onvoiceschanged = changed; } catch (e2) {} }
    all();
  }
  var ua = navigator.userAgent || "";
  var apple = /iPad|iPhone|iPod|Macintosh/.test(ua), android = /Android/.test(ua), windows = /Windows/.test(ua), edge = /Edg\//.test(ua);
  function hint(lang, vs) {
    var langName = lang === "ar" ? "العربية" : "English";
    if (!can) return "متصفحك ما يدعم القراءة الصوتية.";
    if (!vs.length) return "جهازك ما فيه صوت " + (lang === "ar" ? "عربي" : "إنجليزي") + " للقراءة. " + howTo(langName);
    if (quality(vs[0]) >= 2) return "";
    return "تبي صوت أوضح؟ " + howTo(langName);
  }
  function howTo(langName) {
    if (apple) return "نزّل صوتًا أوضح من: الإعدادات ← تسهيلات الاستخدام ← المحتوى المنطوق ← الأصوات ← " + langName + "، واختر صوتًا مكتوب جنبه Premium أو Enhanced (أو «محسّن»)، ثم ارجع لهذه الصفحة واختره من القائمة.";
    if (windows && !edge) return "على الكمبيوتر، افتح الموقع في متصفح Edge: فيه أصوات Natural أوضح بكثير.";
    if (android) return "من إعدادات الجهاز: تحويل النص إلى كلام (Text-to-speech)، اختر محرك Google ونزّل اللغة " + langName + ".";
    return "أصوات القراءة تجي من نظام الجهاز، وتقدر تنزّل صوتًا أوضح من إعدادات النظام.";
  }
  var panel = null, panelLang = "en", opener = null;
  var CSS = ".mv-back{position:fixed;inset:0;z-index:1000;background:rgba(20,22,58,.55);display:grid;place-items:center;padding:16px}" +
    ".mv-back[hidden]{display:none}" +
    ".mv-card{width:min(440px,100%);max-height:calc(100vh - 32px);overflow:auto;background:#fff;color:#14163A;border:3px solid #14163A;border-radius:14px;box-shadow:4px 4px 0 #14163A;padding:16px 16px 14px;font-family:\"Tajawal\",\"Segoe UI\",system-ui,sans-serif;direction:rtl;text-align:right}" +
    ".mv-card h2{margin:0 0 4px;font-size:21px;font-weight:800}" +
    ".mv-card p{margin:0 0 10px;font-size:15px;line-height:1.6}" +
    ".mv-card label{display:block;font-size:15px;font-weight:800;margin:10px 0 6px}" +
    ".mv-card select{width:100%;min-height:46px;font:inherit;font-size:16px;padding:6px 10px;border:2px solid #14163A;border-radius:10px;background:#fff;color:#14163A}" +
    ".mv-speeds{display:flex;gap:8px}" +
    ".mv-speeds button,.mv-row button{flex:1;min-height:46px;font:inherit;font-size:16px;font-weight:800;border:2px solid #14163A;border-radius:10px;background:#fff;color:#14163A;cursor:pointer}" +
    ".mv-speeds button[aria-pressed=true]{background:#FFD23F}" +
    ".mv-row{display:flex;gap:8px;margin-top:14px}" +
    ".mv-row .mv-go{background:#14163A;color:#fff}" +
    ".mv-hint{background:#FFF4CC;border:2px dashed #14163A;border-radius:10px;padding:8px 10px;font-size:14px!important}" +
    ".mv-card button:focus-visible,.mv-card select:focus-visible{outline:3px solid #2F6FEB;outline-offset:2px}";
  function build() {
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    panel = document.createElement("div");
    panel.className = "mv-back"; panel.hidden = true;
    panel.innerHTML = '<div class="mv-card" role="dialog" aria-modal="true" aria-labelledby="mvTitle" lang="ar">' +
      '<h2 id="mvTitle">صوت القراءة</h2><p id="mvNote"></p>' +
      '<label for="mvVoice">الصوت</label><select id="mvVoice"></select>' +
      '<label id="mvSpeedLab">السرعة</label><div class="mv-speeds" role="group" aria-labelledby="mvSpeedLab">' +
      SPEEDS.map(function (s) { return '<button type="button" data-mv-speed="' + s[0] + '" aria-pressed="false">' + s[2] + '</button>'; }).join("") + '</div>' +
      '<p class="mv-hint" id="mvHint" hidden></p>' +
      '<div class="mv-row"><button type="button" class="mv-go" data-mv="test">🔊 جرّب الصوت</button><button type="button" data-mv="close">تم</button></div></div>';
    document.body.appendChild(panel);
    panel.addEventListener("click", function (e) {
      if (e.target === panel) return close();
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.mv === "close") close();
      else if (b.dataset.mv === "test") speak(SAMPLE[panelLang], {lang: panelLang});
      else if (b.dataset.mvSpeed) { set(panelLang, "speed", b.dataset.mvSpeed); fill(); speak(SAMPLE[panelLang], {lang: panelLang}); }
    });
    panel.querySelector("#mvVoice").addEventListener("change", function (e) { set(panelLang, "voice", e.target.value); speak(SAMPLE[panelLang], {lang: panelLang}); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && panel && !panel.hidden) close(); });
  }
  function set(lang, k, v) { prefs = load(); prefs[lang] = prefs[lang] || {}; prefs[lang][k] = v; save(prefs); }
  function label(v) {
    var q = quality(v), tag = q >= 3 ? " · الأوضح" : q === 2 ? " · واضح" : "";
    return v.name.replace(/\s*-\s*(English|Arabic).*$/i, "") + " (" + v.lang + ")" + tag;
  }
  function fill() {
    var vs = list(panelLang), cur = pick(panelLang), sel = panel.querySelector("#mvVoice");
    panel.querySelector("#mvNote").textContent = "لقراءة " + NAMES[panelLang] + " في هذا الجهاز. يُحفظ اختيارك هنا.";
    sel.innerHTML = vs.length ? vs.map(function (v) { return '<option value="' + esc(id(v)) + '"' + (v === cur ? " selected" : "") + ">" + esc(label(v)) + "</option>"; }).join("")
      : '<option value="">ما فيه صوت لهذه اللغة</option>';
    sel.disabled = !vs.length;
    var sp = (prefs[panelLang] || {}).speed || "normal";
    [].forEach.call(panel.querySelectorAll("[data-mv-speed]"), function (b) { b.setAttribute("aria-pressed", String(b.dataset.mvSpeed === sp)); });
    var h = hint(panelLang, vs), hb = panel.querySelector("#mvHint");
    hb.textContent = h; hb.hidden = !h;
    panel.querySelector('[data-mv="test"]').disabled = !vs.length;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); }
  function open(lang, from) {
    if (!panel) build();
    panelLang = lang === "ar" ? "ar" : "en"; opener = from || document.activeElement;
    all(); fill(); panel.hidden = false;
    var sel = panel.querySelector("#mvVoice"); try { (sel.disabled ? panel.querySelector('[data-mv="close"]') : sel).focus(); } catch (e) {}
  }
  function close() {
    if (!panel) return;
    panel.hidden = true;
    if (opener && opener.focus) try { opener.focus(); } catch (e) {}
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-voice-panel]");
    if (b) { e.preventDefault(); open(b.getAttribute("data-voice-panel"), b); }
  });

  window.MonmonVoice = {can: can, speak: speak, dictate: dictate, stop: stop, has: has, pick: pick, list: list, onvoices: onvoices, open: open, close: close,
    sentences: sentences, phrases: phrases};
})();
