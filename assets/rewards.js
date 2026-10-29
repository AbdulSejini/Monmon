/* Rewards for studying, on every page: points, levels, a daily goal, a streak of study days and a sticker album, with
   short celebrations (sounds, confetti and words that praise the effort, never "you're clever") when progress is saved.
   Include right after site-nav.js:  <script src="../../assets/rewards.js" data-root="../../"></script>
   data-root is the path from the page back to the site root (the album is rewards/index.html).
   - Points come from the progress the pages already save and sync, so every device shows the same: 50 for each tick on
     the dashboard and the week plans, 30 for each IXL skill that reached its target, 10 for each question in the IXL
     practice sheet's best scores, 40 for each IXL Coach ready check passed, and the XP of the interactive lessons (10 for
     each right answer).
   - Points, levels and stickers never go down: they follow the highest total so far, so unticking and ticking again
     doesn't count twice, and clearing the ticks doesn't take anything away.
   - monmon-activity-v1 (synced) holds each day's points from each device (for the daily goal and the streak), the
     highest total, and the total when the album started: the stickers come from the points earned after that.
   - monmon-fx-v1 (this device only) holds the sound setting and what this device already celebrated.
   Celebrations need progress saved on this device within seconds of a tap or a key press: pages also save as they
   open, and another device's progress only updates the numbers.
   The dashboard's card goes in [data-rewards-card]; rewards/index.html reads window.MonmonRewards. */
(function () {
  "use strict";
  var Sync = window.MonmonSync;
  if (!Sync || !Sync.peek) return;   /* needs assets/sync.js, and storage that works */
  var me = document.currentScript || document.querySelector('script[src*="rewards.js"]');
  var root = (me && me.getAttribute("data-root")) || "";
  var ALBUM = root + "rewards/index.html";
  var onAlbum = /\/rewards\/(index\.html)?$/.test(location.pathname);
  var TZ = "Asia/Riyadh", T0 = Date.now();
  var DONE = "monmon-done-v1", PLAN = "monmon-ixl-plan-v1", PRAC = "monmon-ixl-practice-v1", COACH = "monmon-ixl-coach-v1", ACT = "monmon-activity-v1", FXK = "monmon-fx-v1";
  var GOAL = 100, STREAK_MIN = 30, GOLD = 500;

  /* ---------- points, from the saved progress ---------- */
  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function isObj(x) { return x !== null && typeof x === "object" && !Array.isArray(x); }
  function num(x, max) { return typeof x === "number" && isFinite(x) && x > 0 ? Math.min(Math.floor(x), max || 1e9) : 0; }
  function read(k) { try { return JSON.parse(Sync.peek(k)); } catch (e) { return undefined; } }
  function ticks(o) { var n = 0; if (isObj(o)) for (var k in o) if (own(o, k) && o[k]) n++; return n; }
  function worth(k, v) {
    if (!isObj(v) || k === ACT) return 0;
    if (k === DONE) return ticks(v.done) * 50;
    if (k === PLAN) return ticks(v.done) * 30;
    if (k === PRAC) { var s = 0; if (isObj(v.best)) for (var id in v.best) if (own(v.best, id)) s += num(v.best[id], 1000); return s * 10; }
    if (k === COACH) return ticks(v.passed) * 40;   /* each IXL Coach ready check passed */
    return num(v.xp, 1e6);   /* the interactive lessons */
  }
  function total() { var t = 0; Sync.keys.forEach(function (k) { t += worth(k, read(k)); }); return t; }

  /* ---------- levels: level n starts at 50·n·(n−1) points, so each level takes 100 more than the one before ---------- */
  var TITLES = ["مبتدئ", "مستكشف", "متدرّب", "مثابر", "مجتهد", "بطل صاعد", "محترف", "خبير", "قائد", "بطل المذاكرة",
    "فارس المعرفة", "نجم لامع", "صقر الإنجاز", "أسطورة", "أسطورة ذهبية"];
  function levelOf(p) { var n = 1; while (n < 999 && p >= 50 * n * (n + 1)) n++; return n; }
  function levelAt(n) { return 50 * n * (n - 1); }
  function titleOf(n) { return TITLES[Math.min(n, TITLES.length) - 1]; }

  /* ---------- the album: four series of ten, opened one series at a time in a fixed shuffled order ----------
     [emoji, name, rarity: 0 common, 1 rare, 2 legendary]; order is the order the slots open in. */
  var SERIES = [
    {name: "الفضاء", color: "#2F7DE1", order: [0, 3, 1, 6, 4, 2, 7, 5, 9, 8], items: [["🚀", "صاروخ"], ["🌙", "هلال"], ["☀️", "الشمس"], ["🌍", "الأرض"],
      ["☄️", "مذنّب"], ["🔭", "تلسكوب"], ["🛰️", "قمر صناعي", 1], ["🪐", "زحل", 1], ["🌌", "المجرّة", 1], ["👨‍🚀", "رائد فضاء", 2]]},
    {name: "الصحراء والبحر", color: "#F39200", order: [1, 4, 0, 7, 3, 5, 8, 2, 6, 9], items: [["🌴", "نخلة"], ["🐪", "جمل"], ["🦎", "ضب"],
      ["🐢", "سلحفاة بحرية"], ["🐠", "سمكة المرجان"], ["🦂", "عقرب"], ["🐬", "دلفين", 1], ["🐎", "حصان عربي", 1], ["🦈", "قرش", 1], ["🦅", "صقر", 2]]},
    {name: "الرياضة", color: "#12A15E", order: [0, 2, 6, 4, 1, 3, 9, 5, 8, 7], items: [["⚽", "كرة القدم"], ["🏀", "كرة السلة"], ["🏓", "تنس الطاولة"],
      ["🚴", "دراجة"], ["🏊", "سباحة"], ["🏐", "كرة الطائرة"], ["♟️", "شطرنج", 1], ["🥋", "كاراتيه", 1], ["🥇", "ميدالية ذهبية", 1], ["🏆", "الكأس", 2]]},
    {name: "العلوم والتقنية", color: "#9A4FE0", order: [2, 0, 7, 3, 5, 1, 6, 4, 9, 8], items: [["💡", "فكرة"], ["🔬", "مجهر"], ["🧪", "تجربة"],
      ["🧲", "مغناطيس"], ["🔋", "بطارية"], ["🌋", "بركان"], ["🧬", "الحمض النووي", 1], ["💻", "حاسوب", 1], ["🧠", "دماغ", 1], ["🤖", "روبوت", 2]]}
  ];
  var RARITY = ["عادي", "نادر", "أسطوري"];
  var STICKERS = [];   /* in the order they open */
  SERIES.forEach(function (s, si) {
    s.order.forEach(function (slot) { var it = s.items[slot]; STICKERS.push({n: STICKERS.length, series: si, slot: slot, emoji: it[0], name: it[1], rarity: it[2] || 0}); });
  });
  var N = STICKERS.length;
  /* the first three are a gift; then one every 200 to 380 points, so the next one is never quite where you expect it */
  var TH = (function () { var out = [], t = 0; for (var k = 0; k < N; k++) { if (k >= 3) t += 200 + ((k * 37 + 11) % 7) * 30; out.push(t); } return out; })();
  function stickersAt(e) { var c = 0; while (c < N && TH[c] <= e) c++; return c; }
  function goldAt(e) { return e >= TH[N - 1] ? Math.floor((e - TH[N - 1]) / GOLD) : 0; }   /* after the album: a gold star every 500 */

  /* ---------- days ---------- */
  var ISO = /^\d{4}-\d{2}-\d{2}$/;
  function today() {
    var d = "";
    try { d = new Intl.DateTimeFormat("en-CA", {timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit"}).format(new Date()); } catch (e) {}
    return ISO.test(d) ? d : new Date(Date.now() + 3 * 36e5).toISOString().slice(0, 10);
  }
  function utc(d) { var p = d.split("-").map(Number); return Date.UTC(p[0], p[1] - 1, p[2]); }
  function shift(d, n) { return new Date(utc(d) + n * 864e5).toISOString().slice(0, 10); }
  function weekday(d) { return new Date(utc(d)).getUTCDay(); }

  /* ---------- the activity log (synced) and this device's settings ---------- */
  function act() { var a = read(ACT); a = isObj(a) ? a : {}; if (!isObj(a.days)) a.days = {}; return a; }
  function writeAct(a) {
    var o = {};
    for (var k in a) if (own(a, k) && !(k === "days" && !Object.keys(a.days).length)) o[k] = a[k];
    try { localStorage.setItem(ACT, JSON.stringify(o)); } catch (e) {}
  }
  function dayPoints(a, d) { var o = a.days[d], s = 0; if (isObj(o)) for (var k in o) if (own(o, k)) s += num(o[k], 1e6); return s; }
  function fx() { var v = null; try { v = JSON.parse(localStorage.getItem(FXK) || "null"); } catch (e) {} return isObj(v) ? v : {}; }
  function setFx(v) { try { localStorage.setItem(FXK, JSON.stringify(v)); } catch (e) {} }
  /* each device adds to its own entry for the day, so two devices never overwrite each other's points */
  var dev = (function () {
    var f = fx();
    if (typeof f.dev !== "string" || !/^[a-z0-9]{6,12}$/.test(f.dev)) { f.dev = ("d" + Math.random().toString(36).slice(2) + "00000").slice(0, 9); setFx(f); }
    return f.dev;
  })();
  /* the start and the highest total wait for this page to have the family's progress (or for sync to be off),
     so a device that is behind doesn't start the album from a smaller total. Only the device that earned the
     points raises the highest total (owe): the others would only write the same number again. */
  var owe = false;
  function fresh() { var s = Sync.status(); return !s.linked || s.off || s.err === "code" || (s.ready && s.last >= T0); }
  function settle(a, tot) {
    if (!fresh()) return false;
    var w = false;
    if (!isObj(a.start) || typeof a.start.pts !== "number") { a.start = {pts: tot, day: today()}; owe = true; w = true; }
    if (owe && tot > num(a.peak)) { a.peak = tot; w = true; }
    owe = false;
    return w;
  }
  /* a day counts in the streak with 30 points; Friday and Saturday never break it, and today only ends at midnight.
     Every 7 days in a row earn a shield (2 at most) that saves the streak on a missed school day. */
  function streakOf(a, t) {
    var first = Object.keys(a.days).filter(function (d) { return ISO.test(d) && d <= t; }).sort()[0];
    var n = 0, shields = 0, saved = "", lim = shift(t, -400);
    if (!first) return {n: 0, shields: 0, saved: ""};
    for (var d = first < lim ? lim : first; d <= t; d = shift(d, 1)) {
      if (dayPoints(a, d) >= STREAK_MIN) { n++; if (n % 7 === 0 && shields < 2) shields++; }
      else if (d !== t && weekday(d) !== 5 && weekday(d) !== 6) { if (n && shields) { shields--; saved = d; } else n = 0; }
    }
    return {n: n, shields: shields, saved: saved};
  }
  function compute(a, tot) {
    var f = fx(), t = today(), pts = Math.max(num(a.peak), tot), started = isObj(a.start) && typeof a.start.pts === "number";
    var earned = started ? Math.max(0, pts - num(a.start.pts)) : 0, c = stickersAt(earned), lv = levelOf(pts), st = streakOf(a, t), days = [];
    var from = c >= N ? TH[N - 1] + goldAt(earned) * GOLD : c ? TH[c - 1] : 0, to = c >= N ? from + GOLD : TH[c];
    for (var i = 13; i >= 0; i--) { var d = shift(t, -i); days.push({day: d, points: dayPoints(a, d)}); }
    return {points: pts, level: lv, title: titleOf(lv), nextTitle: titleOf(lv + 1), levelFrom: levelAt(lv), levelTo: levelAt(lv + 1),
      date: t, today: dayPoints(a, t), goal: GOAL, streak: st.n, shields: st.shields, saved: st.saved, streakMin: STREAK_MIN,
      started: started, earned: earned, count: c, of: N, gold: goldAt(earned), next: {from: from, to: to, need: Math.max(0, to - earned), gold: c >= N},
      unseen: Math.max(0, c - Math.min(num(f.seen), c)), sound: f.sound !== false, days: days};
  }

  /* ---------- words ---------- */
  var SAY = {
    done: ["أحسنت! واجب خلص ✅", "شغل مرتّب، كمّل كذا 💪", "واحد أقل من القائمة 😎", "تعبك ما راح على الفاضي 🌟", "ركّزت وخلّصت، برافو 👏",
      "خطوة خطوة توصل 👣", "كفو، خلّصته 🔥", "هذا الاجتهاد اللي يفرق 🙌", "إنجاز جديد ينضاف لك 🏅", "كل واجب تخلّصه يقرّبك لهدفك 🎯"],
    ixl: ["مهارة IXL وصلت هدفها 🧠", "تدرّبت لين وصلت، أحسنت 📈", "مهارة ورا مهارة، ماشي صح 🚀", "صبرك على التمرين جاب نتيجة 💪", "كفو، مهارة جديدة في جيبك 🎒"],
    ixlweek: ["كمّلت مهارات الأسبوع كلها في IXL 🏆", "أسبوع IXL خلص كامل، كفو 🏆", "كل مهارات الأسبوع وصلت هدفها 🏆"],
    coach: ["جاهز! ارجع لـ IXL وطبّق 🎯", "اختبار الجاهزية خلص، كفو 🏅", "عشرة صح ورا بعض، IXL ينتظرك 💪"],
    best: ["رقم قياسي جديد لك! 📈", "تفوّقت على نفسك 🏅", "أحسن من المرة اللي فاتت، كمّل 🔥", "التمرين يفرق، وهذا الدليل 👀"],
    streak: ["كمّل السلسلة 💪", "لا توقف الحين!", "السلسلة تكبر معك 🌱", "الاستمرار سر الإنجاز ⭐"],
    fact: ["الأخطبوط عنده 3 قلوب.", "ضوء الشمس يوصل للأرض في حوالي 8 دقائق.", "قلبك ينبض حوالي 100 ألف مرة في اليوم.",
      "صقر الشاهين أسرع حيوان: ينقضّ بسرعة أكثر من 300 كم في الساعة.", "زحل أخف من الماء: لو فيه حوض ماء كبير كفاية، كان طفا فيه.",
      "في جسم الإنسان البالغ 206 عظمة.", "الدلفين ينام بنص دماغه، والنص الثاني صاحي.", "كلمة «algorithm» جاية من اسم العالم المسلم الخوارزمي.",
      "كلمة «algebra» جاية من «الجبر» في كتاب الخوارزمي.", "الحوت الأزرق أكبر حيوان عاش على الأرض.",
      "العسل ما يخرب: لقوا عسل عمره آلاف السنين وما زال صالح للأكل.", "القمر يبعد عن الأرض حوالي 384 ألف كيلومتر.",
      "البحر الأحمر من أدفى وأملح بحار العالم.", "النملة تقدر تشيل أكثر من 10 أضعاف وزنها.", "الجمل العطشان يقدر يشرب حوالي 100 لتر ماء في دقائق.",
      "الفهد أسرع حيوان على اليابسة: يوصل لحوالي 110 كم في الساعة.", "جبل إيفرست أعلى جبل على الأرض: حوالي 8849 متر.",
      "الضوء يقطع حوالي 300 ألف كيلومتر في الثانية الوحدة.", "بصمة إصبعك ما تتكرر عند أي إنسان ثاني."]
  };
  var recent = {};
  function say(kind) {   /* a random line, not one of the last few */
    var list = SAY[kind], last = recent[kind] || (recent[kind] = []);
    var opts = list.filter(function (x) { return last.indexOf(x) < 0; });
    var x = opts[Math.floor(Math.random() * opts.length)];
    last.push(x); if (last.length > Math.min(5, list.length - 1)) last.shift();
    return x;
  }
  function any(list) { return list[Math.floor(Math.random() * list.length)]; }
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  function daysAr(n) { return n === 1 ? "يوم واحد" : n === 2 ? "يومين" : n <= 10 ? n + " أيام" : n + " يوم"; }
  function stickersAr(n) { return n === 1 ? "ملصق واحد" : n === 2 ? "ملصقين" : n <= 10 ? n + " ملصقات" : n + " ملصق"; }

  /* ---------- sound: a tiny synth, no files ---------- */
  var ac = null;
  function soundOn() { return fx().sound !== false; }
  function audio() {
    if (!soundOn() || (!ac && !lastTap)) return null;   /* browsers only allow sound after a tap */
    try {
      if (!ac) { var A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ac = new A(); }
      if (ac.state === "suspended") ac.resume();
    } catch (e) { return null; }
    return ac;
  }
  function tone(f, at, dur, type, vol) {
    try {
      var o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + at;
      o.type = type || "triangle"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.09, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + 0.05);
    } catch (e) {}
  }
  /* [frequency, start, length, wave, volume]; a few versions of each, so the same moment doesn't always sound the same */
  var TUNES = {
    tick: [[[784, 0, .12], [1047, .09, .22]], [[659, 0, .1], [880, .07, .1], [1319, .14, .24]],
      [[1047, 0, .08], [1319, .06, .08], [1568, .12, .22]], [[587, 0, .1], [784, .08, .1], [988, .16, .1], [1175, .24, .26]]],
    streak: [[[392, 0, .16, "sine", .1], [523, .12, .16, "sine", .1], [784, .24, .36, "sine", .1], [1568, .36, .18, "sine", .04]],
      [[440, 0, .14, "sine", .1], [659, .12, .14, "sine", .1], [880, .24, .36, "sine", .1], [1760, .36, .18, "sine", .04]]],
    goal: [[[392, 0, .12], [523, .14, .62], [659, .14, .62, "sine", .06], [784, .14, .62, "sine", .05]],
      [[523, 0, .1], [659, .1, .1], [784, .2, .1], [1047, .3, .55], [1319, .3, .55, "sine", .05]],
      [[784, 0, .1], [784, .12, .1], [1047, .26, .6], [1319, .26, .6, "sine", .05], [1568, .26, .6, "sine", .04]]],
    level: [[[523, 0, .09], [587, .07, .09], [659, .14, .09], [784, .21, .09], [880, .28, .09], [1047, .35, .6], [1319, .35, .6, "sine", .05], [1568, .35, .6, "sine", .05]],
      [[392, 0, .09], [523, .08, .09], [659, .16, .09], [784, .24, .09], [1047, .32, .09], [1319, .4, .6], [1568, .4, .6, "sine", .05]]],
    sticker0: [[[1568, 0, .1, "sine"], [2093, .07, .1, "sine"], [2637, .14, .22, "sine"]], [[1319, 0, .1, "sine"], [1760, .07, .1, "sine"], [2637, .14, .22, "sine"]]],
    sticker1: [[[1047, 0, .1], [1319, .08, .1], [1568, .16, .1], [2093, .24, .3, "sine"], [2637, .32, .34, "sine", .06]]],
    sticker2: [[[523, 0, .14], [659, .14, .14], [784, .28, .14], [1047, .42, .55], [1568, .56, .12, "sine", .05], [2093, .64, .12, "sine", .05], [2637, .72, .34, "sine", .05]]],
    welcome: [[[523, 0, .16, "sine"], [659, .13, .16, "sine"], [784, .26, .34, "sine"]]]
  };
  function play(name) {
    if (!audio()) return;
    var tune = any(TUNES[name] || TUNES.tick), k = name === "tick" ? any([1, 1.122, 1.26, .891]) : 1;
    tune.forEach(function (n) { tone(n[0] * k, n[1], n[2], n[3], n[4]); });
  }

  /* ---------- confetti ---------- */
  var cv = null, ctx = null, parts = [], raf = 0;
  var COLS = ["#FFD23F", "#2F7DE1", "#F39200", "#9A4FE0", "#12A15E", "#E23F66"];
  function reduced() { try { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) { return false; } }
  function canvas() {
    if (ctx) return true;
    try { cv = document.createElement("canvas"); ctx = cv.getContext("2d"); } catch (e) { ctx = null; }
    if (!ctx) return false;
    cv.className = "rw-cv"; cv.setAttribute("aria-hidden", "true");
    document.body.appendChild(cv); fit(); window.addEventListener("resize", fit);
    return true;
  }
  function fit() { var d = window.devicePixelRatio || 1; cv.width = Math.round(innerWidth * d); cv.height = Math.round(innerHeight * d); }
  function add(x, y, n, o) {
    for (var i = 0; i < n; i++) {
      var ang = o.ang !== undefined ? o.ang + (Math.random() - .5) * o.spread : Math.random() * Math.PI * 2, v = (o.v || 6) * (.5 + Math.random() * .7);
      parts.push({x: x, y: y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - (o.up === undefined ? 3 : o.up), r: 5 + Math.random() * 6, rot: Math.random() * 6,
        vr: (Math.random() - .5) * .4, c: COLS[(i + Math.floor(Math.random() * 6)) % 6], life: 0, max: (o.life || 70) + Math.random() * 40,
        shape: o.emoji ? 3 : Math.floor(Math.random() * 3), ch: o.emoji || "", g: o.g === undefined ? .22 : o.g});
    }
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function star(r) { ctx.beginPath(); for (var i = 0; i < 10; i++) { var a = i * Math.PI / 5 - Math.PI / 2, q = i % 2 ? r * .45 : r; ctx.lineTo(Math.cos(a) * q, Math.sin(a) * q); } ctx.closePath(); ctx.fill(); }
  function frame() {
    var d = window.devicePixelRatio || 1;
    ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(function (p) { return p.life < p.max && p.y < innerHeight + 40; });
    parts.forEach(function (p) {
      p.life++; p.vy += p.g; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, 1.6 - 1.6 * p.life / p.max)); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      if (p.shape === 3) { ctx.font = Math.round(p.r * 3.4) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(p.ch, 0, 0); }
      else { ctx.fillStyle = p.c; if (p.shape === 0) ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); else if (p.shape === 1) { ctx.beginPath(); ctx.arc(0, 0, p.r / 2.6, 0, 6.283); ctx.fill(); } else star(p.r * .6); }
      ctx.restore();
    });
    raf = parts.length ? requestAnimationFrame(frame) : 0;
    if (!raf) ctx.clearRect(0, 0, innerWidth, innerHeight);
  }
  function later(ms, fn) { setTimeout(fn, ms); }
  function confetti(kind, el, emoji) {
    if (!kind || reduced() || !canvas()) return;
    var r = el ? el.getBoundingClientRect() : null, x = r ? r.left + r.width / 2 : innerWidth / 2, y = r ? r.top + r.height / 2 : innerHeight / 3, i;
    if (kind === "mini") add(x, y, 16, {v: 5, life: 40});
    else if (kind === "pop") add(x, y, 40, {v: 8});
    else if (kind === "party") for (i = 0; i < 5; i++) later(i * 160, function () { add(innerWidth * (.15 + Math.random() * .7), innerHeight * (.2 + Math.random() * .3), 36, {v: 8}); });
    else if (kind === "fountain") {
      var v = Math.sqrt(2 * .22 * innerHeight * .85);   /* high enough to reach most of the screen */
      for (i = 0; i < 6; i++) later(i * 120, function () { add(innerWidth * (.2 + .6 * Math.random()), innerHeight + 10, 24, {ang: -Math.PI / 2, spread: .6, v: v, up: 0, life: 100}); });
    } else if (kind === "rain") {
      add(x, y, 30, {v: 8});
      for (i = 0; i < 24; i++) later(i * 70, function () { add(Math.random() * innerWidth, -20, 1, {ang: Math.PI / 2, spread: .3, v: 2, up: 0, g: .1, life: 170, emoji: emoji || "⭐"}); });
    }
  }

  /* ---------- toasts and celebration cards (at the top, under the site strip) ---------- */
  var layer = null, live = null, bigQ = [], bigEl = null, bigWait = 0, bigClose = null;
  var TONES = ["#FFF3C4", "#DCF7E9", "#DCEBFF", "#FFDDE6", "#EEE0FF"];
  var ICON_X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  function speak(text) { if (!live) return; live.textContent = ""; setTimeout(function () { live.textContent = text; }, 50); }
  function toast(html, text, ms) {
    if (!layer) return null;
    var el = document.createElement("div"), old = layer.querySelectorAll(".rw-toast"), timer = 0;
    if (old.length >= 2) old[0].parentNode.removeChild(old[0]);
    el.className = "rw-toast"; el.style.setProperty("--rw-bg", any(TONES)); el.innerHTML = html;
    layer.insertBefore(el, bigEl);
    speak(text);
    function hide() { clearTimeout(timer); if (!el.parentNode) return; el.classList.add("rw-out"); setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 280); }
    timer = setTimeout(hide, ms);
    el.rwHide = hide;
    el.addEventListener("click", hide);
    el.addEventListener("pointerenter", function () { clearTimeout(timer); });
    el.addEventListener("pointerleave", function () { clearTimeout(timer); timer = setTimeout(hide, 1800); });
    return el;
  }
  function big(c, delay) {
    bigQ.push(c);
    if (!bigEl && !bigWait) bigWait = setTimeout(showBig, delay || 0);
  }
  function showBig() {
    bigWait = 0;
    var c = bigQ.shift();
    if (!c || !layer) return;
    var el = document.createElement("div"), timer = 0, gone = false;
    /* the card takes over from the toasts, so a phone's screen isn't covered */
    Array.prototype.forEach.call(layer.querySelectorAll(".rw-toast"), function (t) { if (t.rwHide) t.rwHide(); });
    el.className = "rw-big rw-t-" + c.type + (c.rarity ? " rw-r" + c.rarity : "");
    el.innerHTML = '<button class="rw-x" type="button" aria-label="إغلاق">' + ICON_X + '</button><div class="rw-pop" aria-hidden="true">' + c.icon + '</div>'
      + '<p class="rw-kick">' + c.kick + '</p><h2>' + c.title + '</h2>' + (c.text ? '<p class="rw-txt">' + c.text + '</p>' : "")
      + (c.link ? '<a class="rw-go" href="' + ALBUM + '">' + c.link + '</a>' : "");
    layer.appendChild(el); bigEl = el;
    speak(c.kick + " " + c.title + (c.text ? ". " + c.text : ""));
    if (!c.quiet) play(c.sound);
    confetti(c.fx, el.querySelector(".rw-pop"), c.emoji);
    function close() {
      if (gone) return;
      gone = true; clearTimeout(timer); el.classList.add("rw-out");
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
        if (bigEl === el) { bigEl = null; bigClose = null; }
        if (bigQ.length && !bigWait) bigWait = setTimeout(showBig, 250);
      }, 280);
    }
    function arm(ms) { clearTimeout(timer); timer = setTimeout(close, ms); }
    bigClose = close;
    arm(c.ms || 5500);
    el.querySelector(".rw-x").addEventListener("click", close);
    el.addEventListener("pointerenter", function () { clearTimeout(timer); });
    el.addEventListener("pointerleave", function () { arm(2500); });
    el.addEventListener("focusin", function () { clearTimeout(timer); });
    el.addEventListener("focusout", function () { arm(2500); });
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && bigClose) bigClose(); });

  function goalCard(pts, n) {
    return {type: "goal", icon: "🎯", kick: any(["كفو 👏", "برافو 👏", "رهيب 🔥", "يا سلام ✨"]), title: "حققت هدف اليوم",
      text: any(["جمعت " + fmt(pts) + " نقطة اليوم. كل نقطة بعدها تقرّبك من الملصق الجاي.", "ذاكرت وأنجزت، والباقي زيادة خير.",
        n >= 2 ? "يومك محسوب في سلسلتك: " + daysAr(n) + " ورا بعض 🔥" : "يومك محسوب في سلسلتك 🔥"]),
      sound: "goal", fx: any(["party", "fountain"]), ms: 5500};
  }
  function levelCard(n) {
    return {type: "level", icon: '<span class="rw-lvb">' + n + '</span>', kick: "مستوى جديد ⬆️", title: "المستوى " + n + ": " + titleOf(n),
      text: any(["وصلت له بتعبك ومذاكرتك.", "كل نقطة فيه جبتها بنفسك.", "المستوى الجاي يبي " + fmt(levelAt(n + 1) - levelAt(n)) + " نقطة، وتقدر عليها 💪"]),
      sound: "level", fx: "fountain", ms: 5500};
  }
  function stickerCard(i, isNew) {
    var s = STICKERS[i], ser = SERIES[s.series];
    return {type: "sticker", rarity: s.rarity, icon: s.emoji, kick: isNew ? ["ملصق جديد ✨", "ملصق نادر جديد 💜", "ملصق أسطوري جديد 🌟"][s.rarity] : "ملصق " + RARITY[s.rarity],
      title: s.name, text: isNew ? "سلسلة " + ser.name + ": " + (i % 10 + 1) + " من 10" : "من سلسلة " + ser.name, link: isNew && !onAlbum ? "افتح الألبوم" : "",
      sound: "sticker" + s.rarity, fx: ["pop", "party", "rain"][s.rarity], emoji: s.emoji, ms: 6000};
  }
  function seriesCard(si) {
    var nx = SERIES[si + 1];
    return {type: "series", icon: "🏆", kick: "كمّلت السلسلة", title: "سلسلة " + SERIES[si].name + " كاملة",
      text: nx ? "عشرة من عشرة. السلسلة الجاية: " + nx.name + "." : "كمّلت الألبوم كله 🎉 ومن الحين كل " + GOLD + " نقطة تجيب لك نجمة ذهبية ⭐",
      link: onAlbum ? "" : "افتح الألبوم", sound: "level", fx: "party", ms: 6000};
  }
  function goldCard(g) {
    return {type: "gold", icon: "⭐", kick: "نجمة ذهبية جديدة", title: "النجمة رقم " + g, text: "الألبوم مكتمل، وأنت مكمّل.", sound: "sticker2", fx: "rain", emoji: "⭐", ms: 5000};
  }
  function welcomeCard(s) {
    return {type: "welcome", icon: "🎉", kick: "جديد في لوحتي", title: "نقاط وملصقات للمذاكرة",
      text: "كل واجب تعلّم عليه، وكل مهارة في IXL، وكل تمرين في صفحات المذاكرة يجيب لك نقاط. بدأت بالمستوى " + s.level + " (" + s.title + ") من تعبك اللي فات، "
        + (s.count === 3 ? "و3 ملصقات هدية تنتظرك في الألبوم." : "وعندك " + stickersAr(s.count) + " في الألبوم."),
      link: "افتح ألبومي", sound: "welcome", fx: "party", ms: 12000};
  }

  /* ---------- progress saved on this device ---------- */
  var queue = [], flushTimer = 0, lastTap = 0;
  ["pointerdown", "keydown", "touchstart"].forEach(function (t) {
    window.addEventListener(t, function () { lastTap = Date.now(); }, {capture: true, passive: true});
  });
  window.addEventListener("monmon-saved", function (e) {
    var d = e.detail || {}, k = d.key;
    if (!k || k === ACT) return;
    var gain = worth(k, d.after) - worth(k, d.before);
    if (!gain) return;
    if (Date.now() - lastTap > 10000) { if (gain > 0) owe = true; soon(); return; }   /* saved as the page opened: not new progress */
    var quiet = isObj(d.after) && d.after.sound === false;   /* a lesson whose own sound is switched off */
    queue.push({key: k, gain: gain, quiet: quiet});
    if (gain > 0 && !quiet) audio();   /* still inside the tap, so the browser lets the page play sound */
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, 60);
  });
  window.addEventListener("pagehide", function () { if (flushTimer) { clearTimeout(flushTimer); flush(); } });
  var KIND = {}; KIND[DONE] = "done"; KIND[PLAN] = "ixl"; KIND[PRAC] = "best"; KIND[COACH] = "coach";
  function flush() {
    flushTimer = 0;
    var items = queue.splice(0, queue.length), gain = 0, shown = 0, kinds = {}, quiet = false;
    items.forEach(function (q) {
      gain += q.gain; quiet = quiet || q.quiet;
      var kd = KIND[q.key];
      if (kd && q.gain > 0) { shown += q.gain; kinds[kd] = 1; }
    });
    /* the IXL plan ticks the week on the dashboard when its last skill is done */
    var kind = kinds.coach ? "coach" : kinds.ixl ? (kinds.done ? "ixlweek" : "ixl") : kinds.done ? "done" : "best";
    var a = act(), t = today(), tot = total(), f = fx(), peak = num(a.peak);
    var ptsB = Math.max(peak, tot - gain), ptsA = Math.max(peak, tot), dayB = dayPoints(a, t), stB = streakOf(a, t);
    var mine = isObj(a.days[t]) ? a.days[t] : (a.days[t] = {});
    mine[dev] = Math.max(0, (typeof mine[dev] === "number" && isFinite(mine[dev]) ? mine[dev] : 0) + gain);
    var lim = shift(t, -400);
    Object.keys(a.days).forEach(function (d) { if (!ISO.test(d) || d < lim) delete a.days[d]; });
    if (gain > 0) owe = true;
    settle(a, tot);
    writeAct(a);
    var dayA = dayPoints(a, t), stA = streakOf(a, t), started = isObj(a.start) && typeof a.start.pts === "number", base = started ? num(a.start.pts) : 0;
    var eB = started ? Math.max(0, ptsB - base) : 0, eA = started ? Math.max(0, ptsA - base) : 0, cB = stickersAt(eB), cA = stickersAt(eA);
    if (!own(f, "level")) { f.level = levelOf(ptsB); f.stick = cB; f.gold = goldAt(eB); }
    var cards = [];
    if (dayB < GOAL && dayA >= GOAL && f.goalDay !== t) { f.goalDay = t; cards.push(goalCard(dayA, stA.n)); }
    var lB = levelOf(ptsB), lA = levelOf(ptsA);
    if (lA > lB && lA > num(f.level)) { f.level = lA; cards.push(levelCard(lA)); }
    for (var i = cB; i < cA; i++) {
      if (i + 1 <= num(f.stick)) continue;
      cards.push(stickerCard(i, true));
      if (i % 10 === 9) cards.push(seriesCard(STICKERS[i].series));
    }
    f.stick = Math.max(num(f.stick), cA);
    var gB = goldAt(eB), gA = goldAt(eA);
    if (gA > gB && gA > num(f.gold)) { f.gold = gA; cards.push(goldCard(gA)); }
    /* first the points, then the streak, then the cards one at a time; a fun fact only when no card is coming */
    var wait = 0, el;
    if (shown > 0) {
      var msg = say(kind), fact = !cards.length && Math.random() < .25 ? say("fact") : "";
      el = toast('<span class="rw-pts">+' + shown + '</span><span class="rw-msg">' + msg + (fact ? '<span class="rw-fact">💡 تعرف؟ ' + fact + '</span>' : "") + '</span>',
        "+" + shown + " نقطة. " + msg + (fact ? " تعرف؟ " + fact : ""), fact ? 7000 : 2800);
      if (!quiet) play("tick");
      if (Math.random() < .35) confetti("mini", el);
      wait = 700;
    }
    if (dayB < STREAK_MIN && dayA >= STREAK_MIN && f.streakDay !== t) {
      var n = stA.n, shield = stA.shields > stB.shields;
      f.streakDay = t;
      later(wait, function () {
        toast('<span class="rw-pts">🔥 ' + n + '</span><span class="rw-msg">' + (n <= 1 ? "بدأت سلسلة أيام جديدة! ذاكر بكرة بعد وتكبر 🌱" : daysAr(n) + " ورا بعض! " + say("streak"))
          + (shield ? '<span class="rw-fact">🛡️ كسبت درع: إذا غبت يوم دراسة، يحمي سلسلتك.</span>' : "") + '</span>',
          "سلسلة " + daysAr(n) + (shield ? ". كسبت درع يحمي السلسلة." : ""), shield ? 6000 : 3200);
        if (!quiet) play("streak");
      });
      wait += shield ? 3000 : 1800;
    }
    setFx(f);
    cards.forEach(function (c) { c.quiet = quiet; big(c, wait + 300); });
    refresh();
  }

  /* ---------- the site strip's chip and the dashboard's card ---------- */
  var ICON_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="#FFD23F" stroke="#14163A" stroke-width="2" stroke-linejoin="round"/><path d="M16 9q2 3 0 6M18.5 6.5q4 5.5 0 11" fill="none" stroke="#14163A" stroke-width="2" stroke-linecap="round"/></svg>';
  var ICON_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="#fff" stroke="#14163A" stroke-width="2" stroke-linejoin="round"/><path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="#14163A" stroke-width="2" stroke-linecap="round"/></svg>';
  function paintChip(s) {
    var ul = document.querySelector(".site-nav ul");
    if (!ul) return;
    var li = ul.querySelector(".rw-li");
    if (!li) { li = document.createElement("li"); li.className = "rw-li"; ul.appendChild(li); }
    var goal = s.today >= s.goal ? "✓" : s.today + "/" + s.goal;
    var html = '<a class="rw-chip" href="' + ALBUM + '"' + (onAlbum ? ' aria-current="page"' : "") + ' aria-label="إنجازاتي: المستوى ' + s.level
      + '، هدف اليوم ' + (s.today >= s.goal ? "تحقق" : s.today + " من " + s.goal) + '، سلسلة ' + s.streak + (s.unseen ? "، ملصقات جديدة" : "") + '">'
      + '<span aria-hidden="true">⭐ ' + s.level + '</span><span aria-hidden="true">🎯 ' + goal + '</span><span aria-hidden="true">🔥 ' + s.streak + '</span>'
      + (s.unseen ? '<i class="rw-dot" aria-hidden="true"></i>' : "") + "</a>";
    if (li.rwHtml !== html) { li.rwHtml = html; li.innerHTML = html; }
  }
  function ring(g, done) {
    var C = 2 * Math.PI * 25;
    return '<svg class="rw-ring" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="25" fill="#fff" stroke="#14163A" stroke-width="2"/>'
      + (g > 0 ? '<circle cx="32" cy="32" r="25" fill="none" stroke="' + (done ? "#12A15E" : "#F39200") + '" stroke-width="8" stroke-linecap="round" stroke-dasharray="'
        + (C * g).toFixed(1) + " " + C.toFixed(1) + '" transform="rotate(-90 32 32)"/>' : "")
      + (done ? '<path d="M22 33l7 7 13-15" fill="none" stroke="#12A15E" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'
        : '<text x="32" y="39" text-anchor="middle" font-size="19">🎯</text>') + "</svg>";
  }
  function cardHTML(s) {
    var span = s.levelTo - s.levelFrom, pct = Math.max(0, Math.min(100, Math.round((s.points - s.levelFrom) / span * 100)));
    var done = s.today >= s.goal, last = STICKERS.slice(Math.max(0, s.count - 5), s.count).reverse();
    var sp = Math.round((s.earned - s.next.from) / Math.max(1, s.next.to - s.next.from) * 100);
    return '<div class="rw-head"><h2 id="rwTitle">إنجازاتي</h2><button class="rw-snd" type="button" aria-pressed="' + s.sound + '" aria-label="صوت الاحتفالات">'
      + (s.sound ? ICON_ON : ICON_OFF) + "</button></div>"
      + '<div class="rw-grid">'
      + '<div class="rw-box rw-lv"><div class="rw-badge" aria-hidden="true">' + s.level + '</div><div class="rw-lvt"><b>المستوى ' + s.level + " · " + s.title + "</b>"
      + '<div class="rw-bar" role="img" aria-label="' + pct + '٪ من المستوى ' + s.level + '"><i style="width:' + pct + '%"></i></div>'
      + "<small>" + fmt(s.points) + " نقطة · باقي " + fmt(s.levelTo - s.points) + " للمستوى " + (s.level + 1) + "</small></div></div>"
      + '<div class="rw-box rw-goal' + (done ? " ok" : "") + '">' + ring(Math.min(1, s.today / s.goal), done)
      + "<b>" + (done ? fmt(s.today) : s.today + "/" + s.goal) + "</b><span>" + (done ? "هدف اليوم تحقق" : "هدف اليوم") + "</span></div>"
      + '<div class="rw-box rw-fire"><b><span aria-hidden="true">🔥</span> ' + s.streak + "</b><span>سلسلة الأيام</span><small>"
      + (s.today >= s.streakMin ? "اليوم محسوب ✓" : "باقي " + (s.streakMin - s.today) + " نقطة لليوم") + (s.shields ? " · 🛡️ " + s.shields : "") + "</small></div>"
      + "</div>"
      + '<div class="rw-foot"><div class="rw-last" aria-label="آخر ملصقاتك">' + last.map(function (x) { return '<span title="' + x.name + '">' + x.emoji + "</span>"; }).join("") + "</div>"
      + '<div class="rw-next"><p>' + (s.next.gold ? "النجمة الذهبية الجاية" : "الملصق الجاي") + " بعد <b>" + fmt(s.next.need) + "</b> نقطة</p>"
      + '<div class="rw-bar sm" role="img" aria-label="' + sp + '٪"><i style="width:' + sp + '%"></i></div></div>'
      + '<a class="rw-album" href="' + ALBUM + '">ألبومي <span class="rw-cnt">' + s.count + "/" + s.of + "</span>" + (s.unseen ? '<span class="rw-new">' + s.unseen + " جديد</span>" : "") + "</a></div>";
  }
  function paintCards(s) {
    var els = document.querySelectorAll("[data-rewards-card]");
    for (var i = 0; i < els.length; i++) {
      var el = els[i], html = cardHTML(s);
      if (el.rwHtml === html) continue;
      var refocus = document.activeElement && el.contains(document.activeElement) && document.activeElement.classList.contains("rw-snd");
      el.rwHtml = html; el.innerHTML = html; el.hidden = false;
      var b = el.querySelector(".rw-snd");
      b.addEventListener("click", function () { api.sound(!soundOn()); });
      if (refocus) b.focus();
    }
  }

  var refreshTimer = 0;
  function soon() { if (!refreshTimer) refreshTimer = setTimeout(refresh, 80); }
  function refresh() {
    clearTimeout(refreshTimer); refreshTimer = 0;
    var a = act(), tot = total();
    if (settle(a, tot)) writeAct(a);
    var s = compute(a, tot), f = fx();
    if (!own(f, "level")) { f.level = s.level; f.stick = s.count; f.gold = s.gold; setFx(f); }
    paintChip(s);
    paintCards(s);
    if (!f.welcomed && s.started && layer && document.querySelector("[data-rewards-card]")) { f.welcomed = 1; setFx(f); big(welcomeCard(s), 1200); }
    try { window.dispatchEvent(new CustomEvent("monmon-rewards", {detail: s})); } catch (e) {}
    return s;
  }
  /* new progress from another device, or this page saved something, or the date changed while it was hidden */
  window.addEventListener("monmon-sync-status", soon);
  window.addEventListener("monmon-sync", function (e) {
    var keys = (e.detail && e.detail.keys) || [];
    soon();
    if (keys.length && keys.every(function (k) { return k === ACT; })) e.preventDefault();   /* only the rewards show it */
  });
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") soon(); });

  var api = window.MonmonRewards = {
    album: ALBUM, goal: GOAL, streakMin: STREAK_MIN, goldEvery: GOLD, rarity: RARITY.slice(),
    stickers: STICKERS, series: SERIES.map(function (s) { return {name: s.name, color: s.color, items: s.items.length}; }),
    state: function () { return compute(act(), total()); },
    /* get or set this device's sound; switching it on plays a sound, so you hear it works */
    sound: function (on) {
      if (on === undefined) return soundOn();
      var f = fx(); f.sound = !!on; setFx(f);
      if (on) play("tick");
      soon();
      return !!on;
    },
    /* the album was opened: the stickers it shows aren't new any more */
    seen: function () { var s = api.state(), f = fx(); if (num(f.seen) !== s.count) { f.seen = s.count; setFx(f); soon(); } },
    /* show an opened sticker big, with its sound */
    show: function (i) {
      if (!(i >= 0 && i < api.state().count) || !layer) return;
      audio();
      bigQ = [stickerCard(i, false)];
      if (bigClose) bigClose(); else if (!bigWait) showBig();
    }
  };

  var CSS = '.rw-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}' +
    '.rw-layer{position:fixed;z-index:66;top:calc(env(safe-area-inset-top,0px) + var(--site-nav-h,0px) + 10px);left:10px;right:10px;display:grid;justify-items:center;gap:8px;pointer-events:none;' +
      'font-family:"Tajawal","Segoe UI","Geeza Pro",Tahoma,sans-serif;color:#14163A;direction:rtl;text-align:start}' +
    '.rw-toast{pointer-events:auto;cursor:pointer;max-width:min(460px,100%);display:flex;align-items:flex-start;gap:10px;padding:9px 14px;background:var(--rw-bg,#FFF3C4);border:3px solid #14163A;' +
      'border-radius:14px;box-shadow:3px 3px 0 #14163A;font-size:16px;font-weight:700;line-height:1.45;animation:rw-in .35s cubic-bezier(.3,1.4,.5,1) both}' +
    '.rw-pts{flex:none;background:#14163A;color:#FFD23F;border-radius:999px;padding:1px 10px;font-weight:800;white-space:nowrap;direction:ltr;unicode-bidi:isolate}' +
    '.rw-msg{min-width:0}' +
    '.rw-fact{display:block;margin-top:5px;padding-top:5px;border-top:2px dashed rgba(20,22,58,.3);font-size:14px;font-weight:500}' +
    '.rw-big{pointer-events:auto;position:relative;width:min(380px,100%);display:grid;justify-items:center;gap:6px;padding:16px 18px 18px;background:#fff;border:3px solid #14163A;' +
      'border-radius:18px;box-shadow:5px 5px 0 #14163A;text-align:center;animation:rw-in .45s cubic-bezier(.3,1.5,.5,1) both}' +
    '.rw-big h2{margin:0;font-size:24px;font-weight:800;line-height:1.3}' +
    /* the pages' own heading font and letter spacing would break the Arabic letters apart */
    '.rw-layer h2,.rw-card h2{font-family:"Tajawal","Segoe UI","Geeza Pro",Tahoma,sans-serif;letter-spacing:0;text-transform:none;text-shadow:none}' +
    '.rw-big p{margin:0}' +
    '.rw-kick{font-size:14px;font-weight:800;padding:2px 12px;border-radius:999px;background:#14163A;color:#FFD23F}' +
    '.rw-txt{font-size:15px;font-weight:500;line-height:1.55;color:#4A4D78}' +
    '.rw-pop{font-size:62px;line-height:1.15;animation:rw-pop .7s cubic-bezier(.3,1.7,.5,1) both}' +
    '.rw-lvb{display:inline-grid;place-items:center;width:84px;height:84px;border-radius:50%;background:#FFD23F;border:4px solid #14163A;box-shadow:3px 3px 0 #14163A;font-size:38px;font-weight:800;color:#14163A}' +
    '.rw-x{position:absolute;top:8px;inset-inline-end:8px;width:36px;height:36px;display:grid;place-items:center;padding:0;border:2px solid #14163A;border-radius:10px;background:#fff;cursor:pointer}' +
    '.rw-x svg{width:18px;height:18px;fill:none;stroke:#14163A;stroke-width:3;stroke-linecap:round}' +
    '.rw-x:focus-visible,.rw-go:focus-visible,.rw-snd:focus-visible,.rw-album:focus-visible{outline:3px solid #2F7DE1;outline-offset:3px}' +
    '.rw-go{margin-top:4px;display:inline-flex;align-items:center;min-height:44px;padding:6px 18px;border:3px solid #14163A;border-radius:12px;background:#FFD23F;color:#14163A;' +
      'font-weight:800;text-decoration:none;box-shadow:3px 3px 0 #14163A}' +
    '.rw-t-goal{background:linear-gradient(#DCF7E9,#fff 60%)}.rw-t-level,.rw-t-series{background:linear-gradient(#FFF3C4,#fff 60%)}.rw-t-welcome{background:linear-gradient(#DCEBFF,#fff 60%)}' +
    '.rw-big.rw-r1{background:linear-gradient(#EEE0FF,#fff 60%)}.rw-big.rw-r2{background:linear-gradient(#FFE8A3,#fff 65%)}' +
    '.rw-r1 .rw-pop{filter:drop-shadow(0 0 8px rgba(154,79,224,.75))}' +
    '.rw-r2 .rw-pop{animation:rw-pop .7s cubic-bezier(.3,1.7,.5,1) both,rw-glow 1.3s ease-in-out .7s infinite alternate}' +
    '.rw-out{animation:rw-out .28s ease-in both!important}' +
    '@keyframes rw-in{from{opacity:0;transform:translateY(-14px) scale(.92)}to{opacity:1;transform:none}}' +
    '@keyframes rw-out{to{opacity:0;transform:translateY(-10px) scale(.96)}}' +
    '@keyframes rw-pop{0%{transform:scale(.2) rotate(-25deg)}100%{transform:none}}' +
    '@keyframes rw-glow{from{filter:drop-shadow(0 0 3px rgba(243,146,0,.5))}to{filter:drop-shadow(0 0 16px rgba(255,190,0,1))}}' +
    '.rw-cv{position:fixed;inset:0;width:100%;height:100%;z-index:65;pointer-events:none}' +
    '.rw-li{margin-inline-start:auto}' +
    '.site-nav a.rw-chip{gap:9px;background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.28);font-variant-numeric:tabular-nums;position:relative}' +
    '.site-nav a.rw-chip[aria-current="page"]{background:#FFD23F;color:#14163A;border-color:#FFD23F}' +
    '.rw-dot{position:absolute;top:-3px;inset-inline-end:-3px;width:11px;height:11px;border-radius:50%;background:#E23F66;border:2px solid #14163A}' +
    '@media (max-width:819px){.rw-li{display:none}}' +   /* under that the strip's five links need the room */
    /* the dashboard's card */
    '.rw-card{margin-top:20px;padding:14px 16px 16px;display:grid;gap:12px;background:#fff;border:3px solid #14163A;border-radius:14px;box-shadow:4px 4px 0 #14163A;color:#14163A}' +
    '.rw-card p{margin:0}' +
    '.rw-head{display:flex;align-items:center;gap:10px}' +
    '.rw-head h2{flex:1;margin:0;font-size:26px;font-weight:800;line-height:1.25}' +
    '.rw-snd{flex:none;width:44px;height:44px;display:grid;place-items:center;padding:0;border:2px solid #14163A;border-radius:10px;background:#FFF3C4;box-shadow:2px 2px 0 #14163A;cursor:pointer}' +
    '.rw-snd[aria-pressed="false"]{background:#fff}' +
    '.rw-snd svg{width:26px;height:26px}' +
    '.rw-grid{display:grid;grid-template-columns:1.6fr 1fr 1fr;gap:10px}' +
    '.rw-box{min-width:0;border:2px solid #14163A;border-radius:10px;background:#E4F2FF;padding:10px 8px;display:grid;gap:3px;justify-items:center;align-content:center;text-align:center}' +
    '.rw-box b{font-size:22px;font-weight:800;line-height:1.2;font-variant-numeric:tabular-nums}' +
    '.rw-box span,.rw-box small{font-size:13px;font-weight:700;color:#4A4D78;line-height:1.35}' +
    '.rw-lv{grid-template-columns:auto 1fr;justify-items:stretch;align-items:center;text-align:start;gap:12px;background:#FFF3C4;padding-inline:12px}' +
    '.rw-badge{width:60px;height:60px;border-radius:50%;display:grid;place-items:center;background:#FFD23F;border:3px solid #14163A;box-shadow:2px 2px 0 #14163A;font-size:26px;font-weight:800}' +
    '.rw-lvt{display:grid;gap:6px;min-width:0}' +
    '.rw-lvt b{font-size:18px}' +
    '.rw-bar{height:12px;border:2px solid #14163A;border-radius:999px;background:#fff;overflow:hidden}' +
    '.rw-bar i{display:block;height:100%;background:#12A15E;border-radius:999px}' +
    '.rw-bar.sm{height:10px}.rw-bar.sm i{background:#9A4FE0}' +
    '.rw-ring{width:56px;height:56px}' +
    '.rw-goal.ok{background:#DCF7E9}' +
    '.rw-fire b{font-size:24px}' +
    '.rw-foot{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px}' +
    '.rw-last{display:flex;gap:5px}' +
    '.rw-last span{width:40px;height:40px;display:grid;place-items:center;border:2px solid #14163A;border-radius:10px;background:#fff;font-size:24px;line-height:1}' +
    '.rw-next{flex:1;min-width:160px;display:grid;gap:4px}' +
    '.rw-next p{font-size:14px;font-weight:700;color:#4A4D78}' +
    '.rw-album{display:inline-flex;align-items:center;gap:8px;min-height:46px;padding:6px 16px;border:3px solid #14163A;border-radius:12px;background:#FFD23F;color:#14163A;' +
      'font-weight:800;text-decoration:none;box-shadow:3px 3px 0 #14163A;white-space:nowrap}' +
    '.rw-album:active{transform:translate(3px,3px);box-shadow:none}' +
    '.rw-cnt{font-size:14px;font-variant-numeric:tabular-nums}' +
    '.rw-new{font-size:12px;font-weight:800;color:#fff;background:#E23F66;border-radius:999px;padding:0 8px}' +
    '@media (max-width:560px){.rw-grid{grid-template-columns:1fr 1fr}.rw-lv{grid-column:1/-1}.rw-last span{width:36px;height:36px;font-size:21px}}' +
    '@media (prefers-reduced-motion:reduce){.rw-toast,.rw-big,.rw-pop,.rw-r2 .rw-pop,.rw-out{animation:none!important}}' +
    '@media print{.rw-layer,.rw-cv,.rw-li,[data-rewards-card]{display:none!important}}';

  function boot() {
    var st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);
    layer = document.createElement("div");
    layer.className = "rw-layer"; layer.lang = "ar"; layer.dir = "rtl";
    live = document.createElement("div");
    live.className = "rw-sr"; live.lang = "ar"; live.setAttribute("role", "status"); live.setAttribute("aria-live", "polite");
    document.body.appendChild(layer);
    document.body.appendChild(live);
    refresh();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
