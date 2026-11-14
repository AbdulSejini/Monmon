/* Every answer, for the parent's report after each study session (asked for on 14/11): the page, the subject, the
   topic, the question, the answer given, the right answer, right or wrong, the seconds taken and the page's explanation.
   Include right after sync.js:  <script src="../../assets/answers.js"></script>
   - Each answer goes at once to the family's database, under /f/<code>/a, keyed by a time-sorted id. It is apart from the
     progress (/f/<code>/d): sync.js reads only d and t, so pages never download the answers.
   - A device where sync is switched off (sync/index.html) sends nothing. Answers that cannot be sent (offline) wait in
     this device's storage (monmon-answers-q, at most 300) and go with the next answer, when the page comes back, or
     when the device is online again.
   - Nothing personal is sent: no name, only the page's own question and answers.
   Pages call MonmonAnswers.ask() when a question is shown (for the time taken) and MonmonAnswers.log({...}) when it is
   answered: {s: subject, tp: topic id, tn: topic name, k: kind of question, q: question, a: answer given, r: right
   answer, ok: true/false, w: explanation, m: mode (practice, test, mission…)}. Only q, a, r and ok are needed. */
(function () {
  "use strict";
  var DB = "https://monmon-sync-default-rtdb.europe-west1.firebasedatabase.app";
  var QKEY = "monmon-answers-q", MAX_Q = 300;
  var store; try { store = window.localStorage; } catch (e) { store = null; }
  var page = location.pathname.replace(/\/index\.html$/, "/").replace(/\/+$/, "").split("/").slice(-2).join("/");
  var SUBJ = {science: "science", social: "social", arabic: "arabic", english: "english", islamic: "islamic", math: "math", ict: "ict", vocabulary: "english", ixl: "math", review: "review"};
  var asked = 0, lastAt = performance.now(), seq = 0, sending = false;

  function status() { try { return window.MonmonSync ? MonmonSync.status() : null; } catch (e) { return null; } }
  function cut(x, n) {
    var s = String(x === undefined || x === null ? "" : x).replace(/<(br|\/p|\/li|\/div|\/h\d)\b[^>]*>/gi, " ").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  }
  function readQ() { try { var q = JSON.parse(store.getItem(QKEY) || "{}"); return q && typeof q === "object" && !Array.isArray(q) ? q : {}; } catch (e) { return {}; } }
  function writeQ(q) {
    try {
      var ids = Object.keys(q).sort();
      if (ids.length > MAX_Q) ids.slice(0, ids.length - MAX_Q).forEach(function (k) { delete q[k]; });
      if (Object.keys(q).length) store.setItem(QKEY, JSON.stringify(q)); else store.removeItem(QKEY);
    } catch (e) {}
  }
  /* ids sort by time: 9 base-36 digits of the time, then a short random part */
  function newId(t) { var s = t.toString(36); while (s.length < 9) s = "0" + s; return s + "-" + (++seq).toString(36) + Math.random().toString(36).slice(2, 6); }

  function send() {
    var st = status();
    if (sending || !store || !st || st.off || !st.code || !window.fetch) return;
    var q = readQ(), ids = Object.keys(q).sort();
    if (!ids.length) return;
    var body = {};
    ids.slice(0, 60).forEach(function (k) { body["a/" + k] = q[k]; });
    sending = true;
    fetch(DB + "/f/" + st.code + ".json?x-http-method-override=PATCH", {method: "POST", body: JSON.stringify(body), headers: {"Content-Type": "text/plain;charset=UTF-8"}, credentials: "omit", keepalive: true})
      .then(function (r) {
        sending = false;
        if (!r.ok) return;
        var left = readQ();
        Object.keys(body).forEach(function (k) { delete left[k.slice(2)]; });
        writeQ(left);
        if (Object.keys(left).length) setTimeout(send, 400);
      }, function () { sending = false; });
  }

  window.MonmonAnswers = {
    page: page,
    /* a question is on the screen: the time taken counts from now */
    ask: function () { asked = performance.now(); },
    log: function (o) {
      if (!o || !store) return null;
      var st = status();
      if (!st || st.off) return null;
      var now = performance.now(), from = asked || lastAt, ms = Math.round(Math.min(Math.max(now - from, 0), 15 * 60000));
      asked = 0; lastAt = now;
      var t = Date.now(), id = newId(t);
      var e = {at: t, pg: page, s: o.s || SUBJ[page.split("/")[0]] || "other", ok: o.ok ? 1 : 0, ms: ms,
        q: cut(o.q, 300), a: cut(o.a, 160), r: cut(o.r, 160)};
      if (o.tp) e.tp = cut(o.tp, 40);
      if (o.tn) e.tn = cut(o.tn, 90);
      if (o.k) e.k = cut(o.k, 20);
      if (o.w) e.w = cut(o.w, 300);
      if (o.m) e.m = cut(o.m, 30);
      var q = readQ(); q[id] = e; writeQ(q);
      send();
      return id;
    },
    pending: function () { return Object.keys(readQ()).length; },
    flush: send
  };
  window.addEventListener("online", send);
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") send(); });
  setTimeout(send, 3000);
})();
