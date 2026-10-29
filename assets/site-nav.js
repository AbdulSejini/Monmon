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
  var WEEK_PAGES = {8: "weekly/week-08/index.html", 9: "weekly/week-09/index.html", 10: "weekly/week-10/index.html"};

  function today() {
    try { return new Intl.DateTimeFormat("en-CA", {timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit"}).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  function utc(iso) { var p = iso.split("-").map(Number); return Date.UTC(p[0], p[1] - 1, p[2]); }
  /* the school week of today; on Friday and Saturday, the coming week */
  function schoolWeek() {
    var t = today(), n = Math.floor((utc(t) - utc(TERM_START)) / 864e5 / 7) + 1, wd = new Date(utc(t)).getUTCDay();
    return wd === 5 || wd === 6 ? n + 1 : n;
  }
  var weeks = Object.keys(WEEK_PAGES).map(Number).sort(function (a, b) { return a - b; });
  var wk = schoolWeek(), weekHref = WEEK_PAGES[wk] || WEEK_PAGES[weeks.filter(function (n) { return n <= wk; }).pop() || weeks[weeks.length - 1]];

  var ICON = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    week: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    ixl: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    coach: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7"/>',
    all: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>'
  };
  /* icon, address, label, shorter label for phones */
  var LINKS = [
    ["home", "index.html", "الرئيسية", "الرئيسية"],
    ["week", weekHref, "خطة الأسبوع", "الأسبوع"],
    ["ixl", "ixl/index.html", "خطة IXL", "IXL"],
    ["coach", "ixl/coach/index.html", "عيادة IXL", "العيادة"],
    ["all", "index.html#practice", "كل الصفحات", "الصفحات"]
  ];
  var path = location.pathname.replace(/\/index\.html$/, "/");
  function isCurrent(href) {
    if (href.indexOf("#") >= 0) return false;
    var a = document.createElement("a"); a.href = root + href;
    return a.pathname.replace(/\/index\.html$/, "/") === path;
  }

  var css = '.site-nav{position:sticky;top:env(safe-area-inset-top,0px);z-index:40;background:#14163A;color:#fff;font-family:"Tajawal","Segoe UI",system-ui,sans-serif;direction:rtl}' +
    '.site-nav ul{max-width:960px;margin:0 auto;padding:6px 10px;display:flex;gap:6px;list-style:none;overflow-x:auto;scrollbar-width:none}' +
    '.site-nav ul::-webkit-scrollbar{display:none}' +
    '.site-nav a{display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:999px;color:#fff;text-decoration:none;font-size:14px;font-weight:700;line-height:1.2;white-space:nowrap;border:2px solid transparent}' +
    '.site-nav a:hover{background:rgba(255,255,255,.12)}' +
    '.site-nav a[aria-current="page"]{background:#FFD23F;color:#14163A;border-color:#FFD23F}' +
    '.site-nav a:focus-visible{outline:3px solid #FFD23F;outline-offset:2px}' +
    '.site-nav svg{width:17px;height:17px;flex:none;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}' +
    '.site-nav .s{display:none}' +
    '@media (max-width:640px){.site-nav .f{display:none}.site-nav .s{display:inline}.site-nav a{padding:5px 8px;gap:5px}.site-nav ul{gap:2px;padding-inline:6px;justify-content:space-between}}' +
    '@media (max-width:440px){.site-nav li + li svg{display:none}}' +
    '@media (max-width:370px){.site-nav svg{display:none}.site-nav a{font-size:13px;padding:5px 6px}}' +
    /* the page's own bar and in-page links land under the strip */
    '.topbar{top:calc(env(safe-area-inset-top,0px) + var(--site-nav-h,0px))!important}' +
    'html{scroll-padding-top:var(--site-nav-h,0px)}' +
    '@media print{.site-nav{display:none!important}}';
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

  /* the height changes when the web font arrives or the window is resized */
  function setHeight() { document.documentElement.style.setProperty("--site-nav-h", nav.offsetHeight + "px"); }
  setHeight();
  if (window.ResizeObserver) new ResizeObserver(setHeight).observe(nav);
  else window.addEventListener("resize", setHeight);
})();
