/* Game feel for the study pages: what happens on screen when an answer is checked.
   - right: the answer pops (squash and stretch) with a burst of sparks, and the points fly to the page's ⭐ chip
   - wrong: the answer shakes and the screen flashes red
   - right answers in a row: a tilted "combo" banner at 3, 5, 8, 12 and 20, in rarity colours
   It watches for the feedback box every page already shows (.fb.ok / .fb.no) and for the page's .xp chip going
   up, so no page has to call it. Nothing moves with "reduce motion" on.
   Include after rewards.js:  <script src="../../assets/fx.js"></script>
   data-sound="1"      also play short sounds (for pages without their own; the labs have theirs)
   data-enter=".run"   slide in these panels when they appear (the labs animate their own screens) */
(function () {
  "use strict";
  var me = document.currentScript || document.querySelector('script[src*="fx.js"]');
  var SOUND = !!(me && me.getAttribute("data-sound") === "1"), ENTER = (me && me.getAttribute("data-enter")) || "";
  var EN = (document.documentElement.lang || "").slice(0, 2) === "en";
  var still = function () { return !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); };
  var COLORS = ["#FFD23F", "#7CF0FF", "#FF6FB5", "#7DF59C", "#B15CFF", "#FFFFFF"];
  var TIERS = [[20, "#FF6FB5", "#7CF0FF", 4], [12, "#FFD15A", "#D9770F", 4], [8, "#C77DFF", "#6A21B8", 3], [5, "#4FA7FF", "#1B4FC2", 2], [3, "#4BE26A", "#14883A", 1]];

  /* ---------- sound (only with data-sound) ---------- */
  var ac = null;
  function soundOn() { return SOUND && !(window.MonmonRewards && MonmonRewards.sound && !MonmonRewards.sound()); }
  function tone(f, dur, type, vol, to, at) {
    if (!soundOn()) return;
    try {
      if (!ac) { var A = window.AudioContext || window.webkitAudioContext; if (!A) return; ac = new A(); }
      if (ac.state === "suspended") ac.resume();
      var t = ac.currentTime + (at || 0), o = ac.createOscillator(), g = ac.createGain();
      o.type = type || "square"; o.frequency.value = f; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.05, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch (e) {}
  }
  var SFX = {
    right: function () { tone(784, 0.09, "square", 0.045); tone(1175, 0.16, "square", 0.045, 0, 0.07); },
    wrong: function () { tone(220, 0.22, "triangle", 0.07, 140); },
    combo: function (n) { var b = 523 * Math.pow(1.06, Math.min(n, 14)); [0, 4, 7, 12].forEach(function (s, i) { tone(b * Math.pow(2, s / 12), 0.12, "square", 0.04, 0, i * 0.055); }); },
    swish: function () { tone(1400, 0.12, "sine", 0.02, 500); }
  };

  /* ---------- the layer: sparks on a canvas, everything else as elements ---------- */
  var cv = null, g2 = null, sparks = [], raf = 0;
  function layer() {
    if (cv || !document.body) return;
    var css = document.createElement("style");
    css.textContent = '.fx-cv{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:64}' +
      '.fx-fly{position:fixed;z-index:65;pointer-events:none;font:900 22px/1 "Lilita One","Tajawal","Segoe UI",system-ui,sans-serif;color:#FFD23F;-webkit-text-stroke:1.5px #14163A;text-shadow:2px 2px 0 #14163A;white-space:nowrap;direction:ltr}' +
      '.fx-flash{position:fixed;inset:0;z-index:63;pointer-events:none;box-shadow:inset 0 0 0 0 rgba(226,61,69,0);border-radius:0}' +
      '.fx-banner{position:fixed;z-index:66;left:50%;top:calc(var(--site-nav-h,0px) + 70px);pointer-events:none;padding:8px 22px 6px;border:3px solid #14163A;border-radius:12px;box-shadow:5px 5px 0 #14163A;' +
      'font:400 30px/1.2 "Lalezar","Lilita One","Tajawal",sans-serif;color:#fff;-webkit-text-stroke:1px #14163A;text-shadow:2px 2px 0 #14163A;white-space:nowrap;transform:translateX(-50%) skewX(-10deg) rotate(-3deg)}' +
      '.fx-banner small{display:block;font:800 13px/1.2 "Tajawal","Segoe UI",sans-serif;-webkit-text-stroke:0;text-shadow:none;letter-spacing:.04em;text-align:center}' +
      '@media print{.fx-cv,.fx-fly,.fx-flash,.fx-banner{display:none!important}}';
    document.head.appendChild(css);
    cv = document.createElement("canvas"); cv.className = "fx-cv"; cv.setAttribute("aria-hidden", "true");
    document.body.appendChild(cv); g2 = cv.getContext("2d");
  }
  function fit() { var d = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(innerWidth * d); cv.height = Math.round(innerHeight * d); g2.setTransform(d, 0, 0, d, 0, 0); }
  function burst(x, y, n, big) {
    if (still()) return;
    layer(); if (!cv) return;
    if (!raf) fit();
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, s = (big ? 260 : 180) * (0.35 + Math.random() * 0.65);
      sparks.push({x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 90, life: 0.5 + Math.random() * 0.45, c: COLORS[i % COLORS.length], r: 2.5 + Math.random() * 3.5, star: i % 4 === 0});
    }
    if (!raf) { var last = performance.now(); raf = requestAnimationFrame(function step(t) {
      var dt = Math.min(0.05, (t - last) / 1000); last = t;
      g2.clearRect(0, 0, innerWidth, innerHeight);
      sparks.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 520 * dt; p.life -= dt; });
      sparks = sparks.filter(function (p) { return p.life > 0; });
      sparks.forEach(function (p) {
        g2.globalAlpha = Math.min(1, p.life * 2); g2.fillStyle = p.c;
        if (p.star) { g2.save(); g2.translate(p.x, p.y); g2.rotate(p.life * 8); g2.fillRect(-p.r, -1, p.r * 2, 2); g2.fillRect(-1, -p.r, 2, p.r * 2); g2.restore(); }
        else { g2.beginPath(); g2.arc(p.x, p.y, p.r, 0, Math.PI * 2); g2.fill(); }
      });
      g2.globalAlpha = 1;
      if (sparks.length) raf = requestAnimationFrame(step); else { raf = 0; g2.clearRect(0, 0, innerWidth, innerHeight); }
    }); }
  }
  function centre(el) { var r = el.getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + r.height / 2, ok: r.width > 0 && r.bottom > 0 && r.top < innerHeight}; }
  function pop(el) {
    if (still() || !el || !el.animate) return;
    el.animate([{transform: "scale(1)"}, {transform: "scale(1.05, .9)", offset: .25}, {transform: "scale(.96, 1.08)", offset: .55}, {transform: "scale(1.01, .98)", offset: .8}, {transform: "scale(1)"}],
      {duration: 480, easing: "cubic-bezier(.3,1.4,.5,1)"});
  }
  function shake(el) {
    if (still() || !el || !el.animate) return;
    el.animate([{transform: "translateX(0)"}, {transform: "translateX(-7px) rotate(-.6deg)"}, {transform: "translateX(6px) rotate(.6deg)"}, {transform: "translateX(-4px)"}, {transform: "translateX(3px)"}, {transform: "translateX(0)"}],
      {duration: 420, easing: "ease-out"});
  }
  function flash() {
    if (still() || !document.body) return;
    layer();
    var f = document.createElement("div"); f.className = "fx-flash"; f.setAttribute("aria-hidden", "true"); document.body.appendChild(f);
    var a = f.animate([{boxShadow: "inset 0 0 0 0 rgba(226,61,69,0)"}, {boxShadow: "inset 0 0 80px 18px rgba(226,61,69,.55)"}, {boxShadow: "inset 0 0 0 0 rgba(226,61,69,0)"}], {duration: 520, easing: "ease-out"});
    a.onfinish = function () { f.remove(); };
  }
  function fly(text, from) {
    var chip = document.querySelector(".xp");
    if (still() || !chip || !document.body || !from) { if (chip && chip.animate && !still()) chip.animate([{transform: "scale(1)"}, {transform: "scale(1.2)"}, {transform: "scale(1)"}], {duration: 380}); return; }
    layer();
    var to = centre(chip), el = document.createElement("div");
    el.className = "fx-fly"; el.textContent = text; el.setAttribute("aria-hidden", "true");
    el.style.left = from.x + "px"; el.style.top = from.y + "px";
    document.body.appendChild(el);
    var dx = to.x - from.x, dy = to.y - from.y;
    var a = el.animate([
      {transform: "translate(-50%,-50%) scale(.4)", opacity: 0},
      {transform: "translate(-50%,-90%) scale(1.25)", opacity: 1, offset: .2},
      {transform: "translate(calc(-50% + " + dx * .5 + "px), calc(-50% + " + (dy * .5 - 60) + "px)) scale(1)", opacity: 1, offset: .6},
      {transform: "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px)) scale(.5)", opacity: .2}
    ], {duration: 900, easing: "cubic-bezier(.4,0,.6,1)"});
    a.onfinish = function () {
      el.remove();
      if (chip.animate) chip.animate([{transform: "scale(1)"}, {transform: "scale(1.25) rotate(-4deg)"}, {transform: "scale(1)"}], {duration: 360, easing: "cubic-bezier(.3,1.6,.5,1)"});
      burst(to.x, to.y, 8, false);
    };
  }
  function banner(n) {
    var tier = null;
    TIERS.forEach(function (t) { if (!tier && n === t[0]) tier = t; });
    if (!tier || !document.body) return;
    SFX.combo(n);
    if (still()) return;
    layer();
    var old = document.querySelector(".fx-banner"); if (old) old.remove();
    var b = document.createElement("div");
    b.className = "fx-banner"; b.setAttribute("role", "status");
    b.style.background = "linear-gradient(135deg," + tier[1] + "," + tier[2] + ")";
    b.innerHTML = (EN ? "COMBO ×" + n + "!" : "كومبو ×" + n + "!") + "<small>" + (EN ? n + " right in a row 🔥" : n + " صح ورا بعض 🔥") + "</small>";
    document.body.appendChild(b);
    var a = b.animate([
      {transform: "translateX(-50%) translateX(-120vw) skewX(-10deg) rotate(-3deg)"},
      {transform: "translateX(-50%) translateX(12px) skewX(-10deg) rotate(-3deg) scale(1.08)", offset: .18},
      {transform: "translateX(-50%) skewX(-10deg) rotate(-3deg) scale(1)", offset: .26},
      {transform: "translateX(-50%) skewX(-10deg) rotate(-3deg) scale(1)", offset: .82},
      {transform: "translateX(-50%) translateX(120vw) skewX(-10deg) rotate(-3deg)"}
    ], {duration: 1700, easing: "ease-in-out"});
    a.onfinish = function () { b.remove(); };
    var c = centre(b); burst(c.x, c.y, 18 + tier[3] * 6, true);
  }

  /* ---------- watching the page ---------- */
  var streak = 0, origin = null, lastFb = null;
  function onFeedback(fb) {
    if (fb === lastFb) return; lastFb = fb;
    var ok = fb.classList.contains("ok"), no = fb.classList.contains("no");
    if (!ok && !no) return;
    var scope = fb.closest("section, .screen, .panel, main") || document;
    if (ok) {
      var el = scope.querySelector(".opt.right, .mrow.right, .choice.right") || scope.querySelector("input, textarea, .type-in") || fb;
      var c = centre(el); if (!c.ok) c = centre(fb);
      origin = c;
      pop(el); pop(fb.querySelector(".burst") || fb);
      burst(c.x, c.y, 22, false);
      SFX.right();
      streak++;
      banner(streak);
    } else {
      var w = scope.querySelector(".opt.wrong, .mrow.wrong, .choice.wrong") || fb;
      shake(w); flash(); SFX.wrong();
      streak = 0;
    }
  }
  function onAdded(n) {
    if (n.nodeType !== 1) return;
    if (n.matches && n.matches(".fb")) onFeedback(n);
    else if (n.querySelectorAll) { var f = n.querySelectorAll(".fb.ok, .fb.no"); if (f.length) onFeedback(f[f.length - 1]); }
    if (n.matches && (n.matches(".result, .result-stars") || (n.querySelector && n.querySelector(".result, .result-stars")))) streak = 0;
    if (ENTER && !still() && n.animate && n.matches && n.matches(ENTER)) {
      /* up and in, never wider than the panel, so a phone never scrolls sideways */
      n.animate([{transform: "translateY(22px) scale(.95) rotate(-1deg)", opacity: 0}, {transform: "translateY(-4px) scale(1) rotate(.3deg)", opacity: 1, offset: .7}, {transform: "none", opacity: 1}], {duration: 320, easing: "cubic-bezier(.2,.9,.3,1.2)"});
      SFX.swish();
    }
  }
  function watch() {
    new MutationObserver(function (list) {
      list.forEach(function (m) {
        if (m.type === "childList") m.addedNodes.forEach(onAdded);
        else if (m.type === "attributes" && m.target.matches && m.target.matches(".fb.ok, .fb.no")) onFeedback(m.target);
      });
    }).observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ["class"]});
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watchChip); else watchChip();
  }
  /* the points flying to the ⭐ chip, by how much it went up (the chip is in the page's own bar, after this script) */
  function watchChip() {
    var chip = document.querySelector(".xp"), num = function () { var m = chip && chip.textContent.replace(/[^\d]/g, ""); return m ? +m : NaN; }, was = num();
    if (chip) new MutationObserver(function () {
      var now = num();
      if (isFinite(now) && isFinite(was) && now > was) { fly("+" + (now - was), origin); origin = null; }
      was = now;
    }).observe(chip, {childList: true, subtree: true, characterData: true});
  }
  window.addEventListener("resize", function () { if (cv && raf) fit(); });
  if (document.body) watch(); else document.addEventListener("DOMContentLoaded", watch);
  window.MonmonFx = {burst: burst, banner: banner, streak: function () { return streak; }};
})();
