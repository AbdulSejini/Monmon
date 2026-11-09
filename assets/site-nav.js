/* Site navigation strip for every page. It stays at the top while the page scrolls, so there is always a way
   back home or to the other plans; a page's own sticky .topbar sits just under it.
   Include right after <body>:  <script src="../../assets/site-nav.js" data-root="../../"></script>
   data-root is the path from the page back to the site root. Keep WEEK_PAGES and TERM_START in step with index.html.
   The strip's height is kept in the CSS variable --site-nav-h for pages that scroll to an element themselves. */
(function () {
  "use strict";
  var me = document.currentScript || document.querySelector('script[src*="site-nav.js"]');
  var root = (me && me.getAttribute("data-root")) || "";
  var TZ = "Asia/Riyadh", TERM_START = "2026-08-30";
  /* whole school weeks off (their Sundays): the school does not count them, as BREAK_WEEKS in index.html */
  var BREAK_WEEKS = ["2026-11-22", "2027-01-10", "2027-02-28", "2027-03-07", "2027-05-02", "2027-05-09", "2027-05-16"];
  var WEEK_PAGES = {8: "weekly/week-08/index.html", 9: "weekly/week-09/index.html", 10: "weekly/week-10/index.html", 11: "weekly/week-11/index.html"};

  function today() {
    try { return new Intl.DateTimeFormat("en-CA", {timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit"}).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  function utc(iso) { var p = iso.split("-").map(Number); return Date.UTC(p[0], p[1] - 1, p[2]); }
  /* the school week of today; on Friday and Saturday, the coming week; in a week off, the week after it */
  function schoolWeek() {
    var t = today(), wd = new Date(utc(t)).getUTCDay(), k = Math.floor((utc(t) - utc(TERM_START)) / 864e5 / 7) + (wd === 5 || wd === 6 ? 1 : 0);
    var sun = new Date(utc(TERM_START) + k * 7 * 864e5).toISOString().slice(0, 10);
    return k + 1 - BREAK_WEEKS.filter(function (d) { return d < sun; }).length;
  }
  var weeks = Object.keys(WEEK_PAGES).map(Number).sort(function (a, b) { return a - b; });
  var wk = schoolWeek(), weekHref = WEEK_PAGES[wk] || WEEK_PAGES[weeks.filter(function (n) { return n <= wk; }).pop() || weeks[weeks.length - 1]];

  var ICON = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    week: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    ixl: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    coach: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7"/>',
    all: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    games: '<path d="M6.5 9h11a4 4 0 0 1 3.9 4.9l-.9 3.6a2.2 2.2 0 0 1-3.8.9L14.6 16H9.4l-2.1 2.4a2.2 2.2 0 0 1-3.8-.9l-.9-3.6A4 4 0 0 1 6.5 9z"/><path d="M8 11.5v3M6.5 13h3"/><circle cx="15.5" cy="12.3" r=".6"/><circle cx="17.3" cy="14" r=".6"/>'
  };
  /* icon, address, label, shorter label for phones */
  var LINKS = [
    ["home", "index.html", "الرئيسية", "الرئيسية"],
    ["week", weekHref, "خطة الأسبوع", "الأسبوع"],
    ["ixl", "ixl/index.html", "خطة IXL", "IXL"],
    ["coach", "ixl/coach/index.html", "عيادة IXL", "العيادة"],
    ["all", "index.html#practice", "كل الصفحات", "الصفحات"],
    ["games", "arcade/index.html", "صالة الألعاب", "ألعاب"]
  ];
  var path = location.pathname.replace(/\/index\.html$/, "/");
  function isCurrent(href) {
    if (href.indexOf("#") >= 0) return false;
    var a = document.createElement("a"); a.href = root + href;
    return a.pathname.replace(/\/index\.html$/, "/") === path;
  }

  var css = '.site-nav{position:sticky;top:env(safe-area-inset-top,0px);z-index:40;background:#14163A;color:#fff;font-family:"Tajawal","Segoe UI",system-ui,sans-serif;direction:rtl}' +
    /* with viewport-fit=cover, iPad and iPhone Safari run the page under the clock and the folded address bar,
       and the strip stops below them (the top safe-area inset). Paint that part of the screen in the strip's
       colour, so the page does not show through above the strip. Off screen when there is no inset. */
    '.site-nav::before{content:"";position:absolute;left:0;right:0;bottom:100%;height:100vh;background:#14163A}' +
    '.site-nav ul{max-width:960px;margin:0 auto;padding:6px 10px;display:flex;gap:6px;list-style:none;overflow-x:auto;scrollbar-width:none}' +
    '.site-nav ul::-webkit-scrollbar{display:none}' +
    '.site-nav a{display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:999px;color:#fff;text-decoration:none;font-size:14px;font-weight:700;line-height:1.2;white-space:nowrap;border:2px solid transparent}' +
    '.site-nav a:hover{background:rgba(255,255,255,.12)}' +
    '.site-nav a[aria-current="page"]{background:#FFD23F;color:#14163A;border-color:#FFD23F}' +
    '.site-nav a:focus-visible{outline:3px solid #FFD23F;outline-offset:2px}' +
    '.site-nav svg{width:17px;height:17px;flex:none;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}' +
    '.site-nav .s{display:none}' +
    '@media (max-width:919px){.site-nav .f{display:none}.site-nav .s{display:inline}.site-nav a{padding:5px 8px;gap:5px}.site-nav ul{gap:2px;padding-inline:6px;justify-content:space-between}}' +
    '@media (max-width:440px){.site-nav li + li svg{display:none}.site-nav a{padding:5px 6px}.site-nav ul{gap:1px;padding-inline:4px}}' +
    '@media (max-width:370px){.site-nav svg{display:none}.site-nav a{font-size:13px;padding:5px 5px}}' +
    '@media (max-width:340px){.site-nav a{font-size:12px;padding:5px 3px}.site-nav ul{padding-inline:2px}}' +
    /* the page's own bar and in-page links land under the strip */
    '.topbar{top:calc(env(safe-area-inset-top,0px) + var(--site-nav-h,0px))!important}' +
    'html{scroll-padding-top:var(--site-nav-h,0px)}' +
    '@media print{.site-nav{display:none!important}}' +
    /* long pages: a round button back to the top, bottom left, above the iPhone's home bar */
    '.site-top{position:fixed;z-index:50;left:max(14px,env(safe-area-inset-left,0px));bottom:calc(14px + env(safe-area-inset-bottom,0px));width:48px;height:48px;padding:0;border-radius:50%;border:3px solid #FFD23F;background:#14163A;color:#FFD23F;display:grid;place-items:center;box-shadow:0 4px 12px rgba(20,22,58,.35);cursor:pointer}' +
    '.site-top[hidden]{display:none}' +
    '.site-top svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}' +
    '.site-top:focus-visible{outline:3px solid #FFD23F;outline-offset:3px}' +
    '@media print{.site-top{display:none!important}}';
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
  /* the strip (and assets/rewards.js) are in Arabic: the lessons don't load Tajawal for their own text */
  if (!document.querySelector('link[href*="family=Tajawal"]')) {
    var font = document.createElement("link");
    font.rel = "stylesheet";
    font.href = "https://fonts.googleapis.com/css2?family=Tajawal:wght@500;700;800&display=swap";
    document.head.appendChild(font);
  }

  var nav = document.createElement("nav");
  nav.className = "site-nav";
  nav.setAttribute("aria-label", "تنقّل الموقع");
  nav.setAttribute("lang", "ar");
  nav.innerHTML = "<ul>" + LINKS.map(function (l) {
    return '<li><a href="' + root + l[1] + '"' + (isCurrent(l[1]) ? ' aria-current="page"' : "") + '><svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[l[0]] + "</svg>" + (l[2] === l[3] ? l[2] : '<span class="f">' + l[2] + '</span><span class="s">' + l[3] + "</span>") + "</a></li>";
  }).join("") + "</ul>";
  document.body.insertBefore(nav, document.body.firstChild);
  /* on a narrow screen the strip scrolls sideways: keep this page's link in view */
  var cur = nav.querySelector('a[aria-current="page"]'), list = nav.querySelector("ul");
  function keep() { if (cur && list && list.scrollWidth > list.clientWidth + 1) { try { cur.scrollIntoView({block: "nearest", inline: "nearest"}); } catch (e) {} } }
  keep();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(keep);
  window.addEventListener("load", keep);

  /* the height changes when the web font arrives or the window is resized */
  function setHeight() { document.documentElement.style.setProperty("--site-nav-h", nav.offsetHeight + "px"); }
  setHeight();
  if (window.ResizeObserver) new ResizeObserver(setHeight).observe(nav);
  else window.addEventListener("resize", setHeight);

  /* on a long page (over three screens), once you are a screen and a half down, a button takes you back to the top.
     A page that has its own controls at the bottom (the arcade) opts out with data-top="0". */
  if (!(me && me.getAttribute("data-top") === "0")) {
    var up = document.createElement("button");
    up.type = "button"; up.className = "site-top"; up.hidden = true;
    up.setAttribute("lang", "ar"); up.setAttribute("aria-label", "إلى أعلى الصفحة"); up.title = "إلى أعلى الصفحة";
    up.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    document.body.appendChild(up);
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var showUp = function () { var h = window.innerHeight || 600; up.hidden = !(document.documentElement.scrollHeight > h * 3 && (window.scrollY || window.pageYOffset) > h * 1.5); };
    window.addEventListener("scroll", showUp, {passive: true});
    window.addEventListener("resize", showUp);
    showUp();
    up.addEventListener("click", function () {
      try { window.scrollTo({top: 0, behavior: reduce ? "auto" : "smooth"}); } catch (e) { window.scrollTo(0, 0); }
      /* keyboard users land on the strip, not on a button that just disappeared */
      var first = nav.querySelector('a[aria-current="page"]') || nav.querySelector("a");
      if (first) try { first.focus({preventScroll: true}); } catch (e) {}
    });
  }
})();
