# Monmon

Learning materials for a Grade 6 student (Class 6.3).

## Dashboard

[`index.html`](index.html) is the home page, in Arabic: what he has to do (homework not yet due, grouped by due date, with ticks), his upcoming tests with what to study (and a link to the study page when there is one), links to the practice pages, and every earlier week's homework and tests.

The homework and tests come from the school's public EduPage list for class 6.3 (`https://aisedusa.edupage.org/exam/`), which needs no login. Grades, attendance and messages need a login and are not included.

- `tools/edupage_sync.py` re-reads that list and rewrites the data block in `index.html` (standard library only; `--dry-run` prints the items without changing anything). The block keeps two times: `synced`, when the list last changed, and `checked`, when it was last read (stamped at least once a day). If the list hasn't been read for two days, the dashboard shows a warning at the top.
- `.github/workflows/edupage-sync.yml` runs it every hour from 05:41 to 23:41 Jeddah time and commits only when something changed, plus one "EduPage checked: no changes" commit a day. GitHub often starts scheduled runs late or skips some, so the hourly schedule keeps the site close to EduPage. If the school's server can't be reached, the run tries again next hour and only fails (with GitHub's failure email) once the list hasn't been read for 24 hours. The workflow can also be started by hand from the Actions tab ("Sync EduPage", then "Run workflow").
- The site is published with GitHub Pages at <https://abdulsejini.github.io/Monmon/>, built from the root of the main branch (`.nojekyll` serves the files as they are). Any commit to the main branch, including the sync's, goes live within a couple of minutes.
- Every page, the dashboard included, has the same dark strip at the top (`assets/site-nav.js`): the home page, this week's plan, the IXL plan and the list of study pages. It stays on screen while the page scrolls, with the page's own bar just under it, so there is always a way back; on phones it uses short labels. Pages that scroll to an element themselves read its height from `--site-nav-h`. On pages that don't load the Arabic font (Tajawal) for their own text, the strip loads it.
- Under the greeting, «المطلوب اليوم» says what to do now: tests on the next school day and graded projects one by one, homework that has been set grouped by due date (the next two dates), the nearest test with a countdown, and a link to tonight's jobs on the week's plan. A test on the day itself counts until 15:00 Jeddah time.
- Under it, «إنجازاتي» shows his level, today's goal, the streak of study days and the latest stickers, with a link to the album (see [Rewards](#rewards-points-stickers-and-celebrations)).
- The study pages are grouped: "start here" (this week's plan, next week's once it is ready, the IXL plan and the practice sheet), then math, science, English and ICT, then older weekly plans. The IXL plan (below) adds one homework item a week from the week's first day, with how many of its skills are done; the plan page ticks the item when every skill of that week is done. Teacher assignments found on IXL can be added to `EXTRA` with a direct link to the skill.
- Notes on what to study or bring, items from the Weekly Study Plan or the class's EduPage messages that the public list doesn't have (`EXTRA`), due dates that the list leaves out but the Weekly Study Plan or Weekly Events give (`DUE_FIX`, for example the Be Well presentation on 1 Nov, which EduPage dates without a deadline), school calendar dates (`SCHOOL_DATES`) and class notices (`NOTICES`) are kept by hand near the top of the script in `index.html`. Nothing personal (messages to or about the student, reports, behaviour notes) goes on this public site.

## Weekly plans

| Week | Page | What's inside |
| --- | --- | --- |
| Week 8 (18–22 Oct 2026), Class 6.3 | [`weekly/week-08/index.html`](weekly/week-08/index.html) | The school's Weekly Study Plan as one page: tests (Qur'an periodic test, Arabic dictation), a homework checklist grouped by due date, the day-by-day timetable, a suggested evening plan with "tonight's jobs" picked from today's date (Jeddah time), a friendly-letter planner, and links to this week's practice pages. Prints as a one-week sheet. |
| Week 9 (25–29 Oct 2026), Class 6.3 | [`weekly/week-09/index.html`](weekly/week-09/index.html) | The same layout for Week 9: Sunday 25/10 shown as the long weekend, tests (ICT practical quiz, Qur'an recitation check), eight homework items with a pronoun helper for the writing task and an exponent reminder, a note that the Science IXL link opens the plant cell skill while the task names the animal cell one, the Mon–Thu timetable, the evening plan (with the ICT quiz practice spread over the four evenings before it), and links to the practice pages: Future Lab for the ICT quiz, the coordinate plane, Power Lab, Signal Lab and the Cell Lab. Prints as a one-week sheet. |
| Week 10 (1–5 Nov 2026), Class 6.3 | [`weekly/week-10/index.html`](weekly/week-10/index.html) | The same layout for Week 10, with the weekend before it: the Be Well presentation on Sunday (15 marks, with a 3-minute planner), the Qur'an recitation and memorisation checks, nine homework items with reminders for GCF and LCM, plant and animal cells, subject and object pronouns, the order of operations and the friendly letter, a note that the pages given for Math HW 10.2 belong to other lessons, the Sun–Thu timetable with Wednesday's trip (periods 3–7), an evening plan from "before Sunday" to Thursday, and after the week a list of what is still open. A link to one item (`#hw-bewell`, `#hw-eng102`, …) opens its reminder; the dashboard uses these links. The math periods and homework link to Factor Lab. Ticks show up without reloading when another device changes them. |

## IXL practice plan

| Plan | Page | What's inside |
| --- | --- | --- |
| His IXL personal study plans for the NWEA MAP Growth tests in math, reading, language and science (239 skills, 236 different; 16 weeks from 1 Nov 2026 to 20 Feb 2027) | [`ixl/index.html`](ixl/index.html) | One plan for the four subjects, in the order of his IXL study file (fractions and stories first, then informational texts, vocabulary and writing, then grammar and physical science, then the rest of the expressions with punctuation and spelling), about 14 skills a week and 40–45 minutes a day. A getting-started week (28–31 Oct) has the teacher's Understanding cells skill and the first exponent skills, like the class. The page shows this week day by day (3 skills Sunday to Wednesday, teacher work and Trouble Spots on Thursday, rest on Friday, 2–3 skills and the practice sheet on Saturday), left-over skills first, each skill's target (80; 90 for reading and fractions; 100 for teacher assignments and the two tense skills B54 and 42P), the stop rule (3 wrong in a row or 25 minutes), the four phases with milestones, all weeks with ticks, and 26 optional bonus skills (geometry, data, Earth and space, life science). The skills come from IXL's public grade-6 plans for those tests at his levels; no scores are on the page. Ticks are kept in `monmon-ixl-plan-v1`; the first visit copies ticks from the earlier math and reading plans, whose old addresses (`ixl/map-math/`, `ixl/map-reading/`) now redirect here. |
| Practice sheet | [`ixl/practice/index.html`](ixl/practice/index.html) | The questions from his study file's practice sheet as an interactive drill: verb tenses, character traits and feelings, the coordinate plane, fractions and balancing equations, exponents and the order of operations, prefixes, suffixes and roots, and body tissues and states of matter, with checking, a rule for each mistake, word lists with Arabic and an irregular-past quiz. Each section's best score is kept on the device, in `monmon-ixl-practice-v1`. |

## Math

| Lessons | Page | What's inside |
| --- | --- | --- |
| enVision Mathematics Grade 6, Lessons 2-4 and 2-5 (coordinate plane) | [`math/coordinate-plane/index.html`](math/coordinate-plane/index.html) | Five zones (axes and quadrants, fractions and decimals, reflections, distance with absolute value, map problems), each with lesson cards and a 6-question practice; a tap-to-plot grid that works on iPad; typed answers that accept fractions, mixed numbers and decimals; explanations for every answer with tips for common slips; a 20-question Final Challenge with a skill report and study plan; and a homework check for H.W. 8.1 (IXL) and 8.2 (book pp. 102–103). |
| enVision Mathematics Grade 6, Lessons 3-2 and 3-3 (GCF and LCM, pp. 129–136; numerical expressions, pp. 137–142) | [`math/factors-expressions/index.html`](math/factors-expressions/index.html) | Factor Lab, built on Power Lab's engine: five zones (factors, primes and the GCF; multiples, the LCM and prime factorization; GCF or LCM word problems and the Distributive Property; the order of operations with exponents and brackets; writing expressions, placing parentheses and spotting mistakes), each with four lesson cards with pictures (factor pairs, common factors, a factor tree, multiples meeting at the LCM, an area model, the order of operations) and a 6-question practice from random generators. A small expression engine follows the order of operations step by step for the explanations and recognises the usual slips (working left to right, ignoring parentheses, × before ÷, reading an exponent as a factor) to give a targeted tip. A 20-question Final Challenge with a ten-skill report, and a homework check for H.W. 10.1 (IXL) and H.W. 10.2 (notebook) that ticks the dashboard too. Progress is kept in `factorlab-envision-3-2-3-3-v1`. |
| enVision Mathematics Grade 6, Lesson 3-1 (exponents, pp. 123–128) | [`math/exponents/index.html`](math/exponents/index.html) | Power Lab: five zones (repeated multiplication and powers, evaluating whole-number powers, fractions and decimals, powers of 10 and expanded form with 10⁰, comparing powers and word problems with error analysis), each with four lesson cards with pictures and a 6-question practice from random generators; a two-box base/exponent input and typed answers that accept fractions, decimals and thousands separators; a targeted tip for each common slip (base × exponent, squaring only the numerator, a misplaced decimal point, miscounted zeros); a 20-question Final Challenge with a nine-skill report and study plan; and a homework check for H.W. 9.2 (book pp. 127–128). |

## Science

| Lesson | Page | What's inside |
| --- | --- | --- |
| Module 2: Body Systems, L4 Moving Material | [`science/moving-material/index.html`](science/moving-material/index.html) | Eight parts following the week's lesson questions (the phenomenon, transport in plants, the human circulatory system, the lungs and gas exchange, the heart's two loops, how other animals breathe, open and closed circulatory systems, the cardiovascular technologist and blood cells), each with an animated diagram and a quick check; a Cell Lab for the IXL animal-cell labeling homework; a 20-question Lesson Review with a weak-spot report; and a 37-word word bank. |
| Module 2: Body Systems, L5 Control and Information Processing | [`science/control-information/index.html`](science/control-information/index.html) | Signal Lab: eight parts following the week's lesson questions (the surfer phenomenon and "when do we use our brains?", the nervous system and the brain, neurons, synapses and reflexes, taste, smell, touch, hearing and balance, sight), each with an animated diagram and a quick check; a reaction-time test and a blind-spot test; a Label Lab for the eye, ear, brain and neuron; a 20-question Lesson Review drawn from 53 with a weak-spot report; a 38-word word bank; and the week's science homework (Worksheet 6, and the IXL cell skill with its link mismatch). |

## ICT

| Book | Page | What's inside |
| --- | --- | --- |
| TechnoFuture (TechnoKids), Sessions 1–3, pp. 1–8, 11–22 and 25–30, for ICT practical Quiz 1 (MS PowerPoint, Thursday 29 Oct 2026) | [`ict/technofuture/index.html`](ict/technofuture/index.html) | Future Lab: seven parts following the book's assignments (what a futurist is, the Imagine Tomorrow story and emerging technologies, the story organizer, the PowerPoint 2013 window and ribbon, the Home of the Future slide, the START action button, and the slide master with Home and Return buttons), with 47 lesson cards, drawn PowerPoint screens, try-it widgets and a 6-question quick check per part; a Ribbon Lab with three games (name the 9 window parts, a Ribbon Hunt of 43 "where would you click?" tasks on a drawn ribbon with the Picture Tools and Drawing Tools tabs, and a Link Lab in the Action Settings box); six step-by-step missions to do in PowerPoint on a computer, ending with a timed Speed Run; a 30-question Final Test drawn from 85, weighted to the practical parts, with a weak-spot report; tonight's job from a four-evening plan; a table of names that differ in newer PowerPoint; and a 50-word word bank with Arabic. |

## Vocabulary

| Unit | Page | What's inside |
| --- | --- | --- |
| Sadlier Vocabulary Workshop, Unit 2 | [`vocabulary/unit-02/index.html`](vocabulary/unit-02/index.html) | 20 words in 5 themed "lands", an animated scene and memory trick for each word, quick checks, a land challenge per land, a 30-question Final Challenge built from the book's exercises, and a weak-spot report with a study plan. |
| Sadlier Vocabulary Workshop Level A (Enriched Edition), Review Units 1–3 (pp. 42–49) | [`vocabulary/review-units-1-3/index.html`](vocabulary/review-units-1-3/index.html) | All 60 words with meaning, pronunciation, memory trick, synonyms, antonyms and word family; flashcards and a 13-question warm-up per unit; a randomized 40-question Final Review in the style of the book's review pages (stories, two-word completions, right meaning, synonyms, antonyms, using the word, shades of meaning, word families and spelling); a report by unit and skill with a spelling watch list and study plan. Unit 1's list is from the school's Week 3 test sheet. |

Each page is a single self-contained HTML file: open it in a browser, no build step or server needed.

Every study page also loads `assets/site-nav.js`, which puts the same navigation strip at the top: the dashboard (لوحتي), this week's plan, the IXL plan and the list of all pages. It picks this week's plan from the date, so when a new weekly plan is added, add it to `WEEK_PAGES` there as well as in `index.html`. Right after it comes `assets/rewards.js` (below), so a new page should load all three: `sync.js`, `site-nav.js` and `rewards.js`.

## Rewards (points, stickers and celebrations)

`assets/rewards.js` makes studying on the site feel rewarding for an 11-year-old, without changing the pages themselves:

- **Points** come from the progress the pages already save and sync, so every device shows the same total: 50 for each tick on the dashboard and the week plans, 30 for each IXL skill that reached its target, 10 for each question in the practice sheet's best scores, and each XP point in the interactive lessons (a right answer is 10). Points, levels and stickers follow the highest total so far, so they never go down: unticking and ticking again doesn't count twice, and clearing the ticks takes nothing away.
- **Levels:** level *n* starts at 50·*n*·(*n*−1) points, so each takes 100 more than the one before. The titles praise effort, from مبتدئ to أسطورة.
- **Daily goal and streak:** the goal is 100 points a day, and 30 points make a day of the streak. Friday and Saturday never break the streak. Every 7 days in a row earn a shield (2 at most) that saves the streak on one missed school day.
- **Sticker album,** [`rewards/index.html`](rewards/index.html): four series of ten (space, desert and sea, sports, science and technology), each with common, rare and legendary stickers. The first three are a gift. After that a sticker opens every 200–380 points earned since the album started, and the order isn't shown, so the next one is a surprise. Once the album is full, every 500 points add a gold star. The page also shows the level, today's goal, the streak and the last two weeks' points, and tapping a sticker shows it again.
- **Celebrations** only happen for progress saved on this device within seconds of a tap. Pages also save as they open, and another device's progress only updates the numbers. A celebration can be:
  - a short toast with the points and a line that praises the work, never his cleverness, sometimes with a fun fact;
  - a sound from a tiny synth, with a few versions of each sound. It can be switched off on the card or the album, and stays silent when a lesson's own sound is off;
  - confetti, except with reduced motion;
  - a card for the daily goal, a new level, a new sticker, a finished series or a gold star.

  Right answers in the lessons get no toast of their own, because the lessons already celebrate them, but they count towards the goal.
- **Where it shows:** the dashboard's «إنجازاتي» card, and a chip at the end of the strip (from 700 px wide) that opens the album. The first visit to the dashboard on each device explains the system once.
- **Storage:**
  - `monmon-activity-v1` (synced) keeps each day's points per device in `days[date][device]`, so two devices never overwrite each other. It also keeps the highest total (`peak`) and the total when the album started (`start`). The start is only set once a page has the family's progress, so a device that is behind doesn't move it.
  - `monmon-fx-v1` (this device only) keeps the sound setting, the device's id and what this device already celebrated.
  - `assets/sync.js` sends a `monmon-saved` event for each save made on this device. `MonmonSync.peek()` reads a value without counting as the page's own read.
- **Why it works this way:**
  - Unexpected rewards and praise that tells the child something about the work keep or raise interest, while rewards promised in advance for doing a task can lower it (Deci, Koestner and Ryan, 1999). So the sticker order is a surprise, and nothing is promised for a particular task.
  - Praising effort rather than intelligence helps children keep going after mistakes (Mueller and Dweck, 1998).
  - Points, badges and levels have a moderate positive effect on learning (Sailer and Homner, 2020).

## Progress sync between devices

Progress is saved in each browser's localStorage. Every page (the dashboard included) also loads `assets/sync.js` before its own script, which keeps that progress in step across the family's devices through a Firebase Realtime Database. Every device that opens the site syncs, with no link or sign-in: the family chose that over opening a link on each device, so the progress is open to anyone who opens the site. The page [`sync/index.html`](sync/index.html) shows whether this device syncs and when it last did, and can switch sync off (or back on) on this device. An older family link (`sync/#code=…`) still works and just switches sync on.

- **What syncs:** the keys in `KEYS` in `assets/sync.js`. These are the homework ticks (`monmon-done-v1`), the IXL plan ticks, the practice sheet's best scores, the saved progress of each study page, and the rewards' log of points (`monmon-activity-v1`). When a new page saves progress, add its key there. Its `xp` then counts towards the rewards too.
- **Sending:** ticks and best scores are sent within seconds. Quiz progress is sent a minute after the last answer, and at most 5 minutes after the first. Anything left is sent when the page is hidden or closed.
- **Receiving:**
  - While a page is in front, the database streams the time of each change to it.
  - Pages that are not open fetch the changes when they open or come back to the front.
  - The dashboard, the IXL plan and the practice sheet redraw in place. Other pages reload if nobody has touched them yet, and otherwise show a banner.
- **No undoing other devices' changes:** each save is turned into just the changes the page made since it last read the value. So a page still showing older progress never undoes another device's change. A device that already has progress when it first syncs adds what only it has; where both have a value, the family's wins.
- **Storage:** the family's node is `/f/<CODE>`, with `CODE` from `assets/sync.js`. Inside it:
  - `d` holds one entry per value, keyed by its path, for example `monmon-done-v1|done|<item id>`. Each segment is %-escaped for Firebase, and each value is stored as JSON text, so arrays and empty objects come back exactly as saved.
  - `t` is the server time of the last change.
- **Database rules:** they deny everything except reading and writing `f/<CODE>`:

  ```json
  {"rules": {".read": false, ".write": false, "f": {"<CODE>": {".read": true, ".write": true}}}}
  ```

  `CODE` is in `assets/sync.js`, a public file, so it is not a secret: anyone who opens the site can read and change the progress. To make it private again, change the path in the rules and in `CODE`, stop syncing automatically, and give each device a link with the new code instead.

Every page has its own A4 print layout. The screen view is hidden and a paper version is printed instead:

| Page | Prints as |
| --- | --- |
| Dashboard | Usually 1–2 pages, longer when two weeks' homework overlap: homework still due, with boxes to tick by hand, and the coming tests with what to study |
| Week 8 plan | 2 pages: tests, homework and evening plan; then the Sun–Thu timetable as a grid |
| Week 9 plan | 2 pages: tests, homework and evening plan; then the Mon–Thu timetable as a grid |
| Week 10 plan | 2 pages: tests and homework; then the Sun–Thu timetable as a grid (shorter topics on paper) and the evening plan |
| IXL MAP Plan | 3 pages: the 16 weeks and the bonus skills as a checklist, with codes and targets |
| Practice sheet | 3 pages: sections A–C, then D–G with blank lines, then the answer key with the rules and word lists |
| Math | 2 pages: study sheet, then 10 practice questions with an answer key |
| Math, exponents | 2 pages: study sheet, then 10 practice questions with an answer key |
| Math, GCF, LCM and expressions | 2 pages: study sheet with a factor tree, rules and one example per zone, then 10 practice questions with an answer key |
| Science | 3 pages: key ideas and word bank, then a label-the-cell sheet with an answer key |
| Science, control and information | 3 pages: homework and key ideas, the rest of the key ideas and the word bank, then a label-the-eye-and-ear sheet with an answer key |
| ICT, TechnoFuture | 2 pages: the PowerPoint window with its 9 parts labelled and a "How do I…?" table; then the three big procedures (link an action button, a picture on every slide, stop click-to-advance with Home and Return), futurist facts and a 10-question self-test with an answer key |
| Vocabulary Unit 2 | 2 pages: word list, then "Test yourself" with an answer key |
| Vocabulary Review Units 1–3 | 3 pages: one per unit, with a word table and a short test |
| Sticker album | No paper version: the screen as it is, about 3 pages, without the strip and the sound button |

Progress is saved in the browser of the device being used (`localStorage`). Homework ticks are shared between the dashboard and the weekly plans, keyed by EduPage item id.
