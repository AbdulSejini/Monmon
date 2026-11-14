/* The facts for the parent's report after each study session (asked for on 14/11).
   The pages send every answer to the family's database (assets/answers.js, under /f/<code>/a, keyed by time-sorted ids).
   This script reads them and prints one JSON report of the study sessions that ended since the last report, plus the
   last 30 days per topic, so the weak points that keep coming back show. A scheduled task runs it every hour in the
   afternoon and evening, writes the email from it, sends it, then marks the sessions as reported:
     node answers-report.mjs                print the report, or {"status":"nothing"} when no session has ended
     node answers-report.mjs --mark <id>    remember that everything up to that answer id was reported (/f/<code>/ar),
                                            and remove answers older than 60 days
   Options: --idle <minutes> (a session has ended after this long without an answer, 20), --now <ms>, --db <url>,
   --code <code>. Node 18 or newer; no packages. It only reads, except --mark. */
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf("--" + name); return i >= 0 && i + 1 < args.length ? args[i + 1] : def; };
const DB = opt("db", "https://monmon-sync-default-rtdb.europe-west1.firebasedatabase.app");
const CODE = opt("code", "cqjxbK0AU2tgeGGZjafIJ7LQDFx9DbjL");
const SITE = "https://abdulsejini.github.io/Monmon/";
const NOW = +opt("now", Date.now());
const IDLE = +opt("idle", 20) * 60000;
const TZ = "Asia/Riyadh";
const DAY = 86400000;

const idAt = t => { let s = Math.max(0, Math.floor(t)).toString(36); while (s.length < 9) s = "0" + s; return s; };
const q = s => encodeURIComponent(JSON.stringify(s));
async function get(path, query) {
  const r = await fetch(DB + "/f/" + CODE + path + ".json" + (query ? "?" + query : ""), {headers: {accept: "application/json"}});
  if (!r.ok) throw new Error("read " + path + ": http " + r.status);
  return r.json();
}
async function patch(body) {
  const r = await fetch(DB + "/f/" + CODE + ".json", {method: "PATCH", body: JSON.stringify(body), headers: {"content-type": "application/json"}});
  if (!r.ok) throw new Error("write: http " + r.status);
}
const when = t => new Intl.DateTimeFormat("en-GB", {timeZone: TZ, weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false}).format(new Date(t));
const day = t => new Intl.DateTimeFormat("en-CA", {timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit"}).format(new Date(t));
const pct = (a, b) => b ? Math.round(100 * a / b) : null;
const median = xs => { if (!xs.length) return null; const s = xs.slice().sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); };
const sec = ms => Math.round((ms || 0) / 100) / 10;
const link = e => SITE + e.pg + "/index.html" + (e.pg.endsWith("quiz-2") && e.tp && /^[a-z0-9-]+$/.test(e.tp) ? "#" + e.tp : "");

function topics(list) {
  const m = new Map();
  for (const e of list) {
    const k = e.s + "|" + (e.tp || e.tn || e.pg);
    const t = m.get(k) || {s: e.s, tp: e.tp || "", tn: e.tn || e.tp || e.pg, pg: e.pg, n: 0, right: 0, wrongs: 0, fastWrong: 0};
    t.n++; if (e.ok) t.right++; else { t.wrongs++; if (e.ms < 5000) t.fastWrong++; }
    m.set(k, t);
  }
  return [...m.values()].map(t => Object.assign(t, {pct: pct(t.right, t.n), link: SITE + t.pg + "/index.html"}));
}
function session(list) {
  const first = list[0], last = list[list.length - 1], right = list.filter(e => e.ok).length;
  const pages = new Map();
  for (const e of list) { const p = pages.get(e.pg) || {pg: e.pg, s: e.s, n: 0, right: 0, link: SITE + e.pg + "/index.html"}; p.n++; if (e.ok) p.right++; pages.set(e.pg, p); }
  /* the same question answered wrong more than once in the session */
  const seen = new Map();
  for (const e of list) if (!e.ok) seen.set(e.q, (seen.get(e.q) || 0) + 1);
  /* right after wrong: he got it the second time */
  const fixed = [];
  const byQ = new Map();
  for (const e of list) { const h = byQ.get(e.q) || []; h.push(e.ok); byQ.set(e.q, h); }
  for (const [qq, h] of byQ) if (h.includes(0) && h[h.length - 1] === 1) fixed.push(qq.slice(0, 140));
  let run = 0, bestRun = 0; for (const e of list) { run = e.ok ? run + 1 : 0; bestRun = Math.max(bestRun, run); }
  const half = Math.floor(list.length / 2);
  const firstHalf = list.slice(0, half), secondHalf = list.slice(half);
  return {
    start: when(first.at), end: when(last.at), minutes: Math.max(1, Math.round((last.at - first.at) / 60000)), firstId: first.id, lastId: last.id,
    n: list.length, right, wrong: list.length - right, pct: pct(right, list.length),
    secondsPerAnswer: {median: sec(median(list.map(e => e.ms))), right: sec(median(list.filter(e => e.ok).map(e => e.ms))), wrong: sec(median(list.filter(e => !e.ok).map(e => e.ms)))},
    pages: [...pages.values()].map(p => Object.assign(p, {pct: pct(p.right, p.n)})),
    topics: topics(list).sort((a, b) => a.pct - b.pct || b.n - a.n),
    signals: {
      fastWrong: list.filter(e => !e.ok && e.ms < 5000).length,           /* answered wrong in under 5 seconds: guessing or rushing */
      slowRight: list.filter(e => e.ok && e.ms > 60000).length,           /* right, but after more than a minute */
      withHint: list.filter(e => /hint/i.test(e.w || "")).length,
      repeatedWrong: [...seen].filter(([, n]) => n > 1).map(([qq, n]) => ({q: qq.slice(0, 160), times: n})),
      fixedAfterWrong: fixed.slice(0, 10),
      bestRunInARow: bestRun,
      firstHalfPct: pct(firstHalf.filter(e => e.ok).length, firstHalf.length), secondHalfPct: pct(secondHalf.filter(e => e.ok).length, secondHalf.length)
    },
    wrongAnswers: list.filter(e => !e.ok).slice(0, 40).map(e => ({time: when(e.at), s: e.s, topic: e.tn || e.tp || "", kind: e.k || "", question: e.q, his: e.a, right: e.r, why: e.w || "", seconds: sec(e.ms), mode: e.m || "", link: link(e)})),
    rightAnswersOnWeakTopics: list.filter(e => e.ok && topics(list).some(t => t.tp === e.tp && t.wrongs)).slice(0, 12).map(e => ({topic: e.tn || e.tp, question: e.q.slice(0, 140), his: e.a, seconds: sec(e.ms)}))
  };
}

async function report() {
  const mark = await get("/ar").catch(() => null);
  const from = Math.min(NOW - 30 * DAY, mark && mark.at ? mark.at : NOW);
  const raw = (await get("/a", "orderBy=" + q("$key") + "&startAt=" + q(idAt(from)))) || {};
  const all = Object.entries(raw).map(([id, e]) => Object.assign({id}, e)).filter(e => e && typeof e.at === "number" && typeof e.q === "string")
    .sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : 1));
  /* new since the last report; on the first run, the last 24 hours */
  const fresh = all.filter(e => mark && mark.last ? e.id > mark.last : e.at > NOW - DAY);
  const sessions = [];
  let cur = [];
  for (const e of fresh) { if (cur.length && e.at - cur[cur.length - 1].at > IDLE) { sessions.push(cur); cur = []; } cur.push(e); }
  if (cur.length) sessions.push(cur);
  const ended = sessions.filter(s => NOW - s[s.length - 1].at >= IDLE);
  const going = sessions.length > ended.length ? sessions[sessions.length - 1] : null;
  if (!ended.length) return {status: "nothing", newAnswers: fresh.length, sessionGoingOn: !!going, lastReported: mark || null};
  const month = all.filter(e => e.at > NOW - 30 * DAY), week = all.filter(e => e.at > NOW - 7 * DAY);
  const hist = topics(month).map(t => {
    const w = topics(week.filter(e => e.s === t.s && (e.tp || e.tn || e.pg) === (t.tp || t.tn || t.pg)))[0];
    return Object.assign(t, {last7: w ? {n: w.n, pct: w.pct} : null});
  }).filter(t => t.n >= 3).sort((a, b) => a.pct - b.pct || b.n - a.n);
  const days = [...new Set(month.map(e => day(e.at)))];
  return {
    status: "report", now: when(NOW), timeZone: TZ, site: SITE,
    sessions: ended.map(session),
    sessionGoingOn: !!going,
    markId: ended[ended.length - 1][ended[ended.length - 1].length - 1].id,
    last30days: {answers: month.length, right: month.filter(e => e.ok).length, pct: pct(month.filter(e => e.ok).length, month.length), studyDays: days.length,
      bySubject: Object.values(month.reduce((m, e) => { const x = m[e.s] || (m[e.s] = {s: e.s, n: 0, right: 0}); x.n++; if (e.ok) x.right++; return m; }, {})).map(x => Object.assign(x, {pct: pct(x.right, x.n)})),
      weakestTopics: hist.filter(t => t.pct < 80).slice(0, 10), strongestTopics: hist.filter(t => t.pct >= 85).sort((a, b) => b.n - a.n).slice(0, 8)}
  };
}

async function markDone(id) {
  if (!/^[0-9a-z]{9}-[0-9a-z]+$/.test(id || "")) throw new Error("bad id");
  await patch({ar: {last: id, at: NOW}});
  /* keep two months of answers */
  const old = (await get("/a", "orderBy=" + q("$key") + "&endAt=" + q(idAt(NOW - 60 * DAY)) + "&limitToFirst=300")) || {};
  const body = {}; for (const k of Object.keys(old)) body["a/" + k] = null;
  if (Object.keys(body).length) await patch(body);
  return {status: "marked", last: id, removedOld: Object.keys(body).length};
}

const m = args.indexOf("--mark");
(m >= 0 ? markDone(args[m + 1]) : report())
  .then(r => { process.stdout.write(JSON.stringify(r, null, 1) + "\n"); })
  .catch(e => { process.stderr.write(String(e && e.message || e) + "\n"); process.exit(1); });
