# Monmon

Learning materials for a Grade 6 student (Class 6.3).

## Dashboard

[`index.html`](index.html) is the home page, in Arabic: what he has to do (homework not yet due, grouped by due date, with ticks), his upcoming tests with what to study (and a link to the study page when there is one), links to the practice pages, and every earlier week's homework and tests.

The homework and tests come from the school's public EduPage list for class 6.3 (`https://aisedusa.edupage.org/exam/`), which needs no login. Grades, attendance and messages need a login and are not included.

- `tools/edupage_sync.py` re-reads that list and rewrites the data block in `index.html` (standard library only; `--dry-run` prints the items without changing anything). The block keeps two times: `synced`, when the list last changed, and `checked`, when it was last read (stamped at least once a day). If the list hasn't been read for two days, the dashboard shows a warning at the top.
- `.github/workflows/edupage-sync.yml` runs it every hour from 05:41 to 23:41 Jeddah time and commits only when something changed, plus one "EduPage checked: no changes" commit a day. GitHub often starts scheduled runs late or skips some, so the hourly schedule keeps the site close to EduPage. If the school's server can't be reached, the run tries again next hour and only fails (with GitHub's failure email) once the list hasn't been read for 24 hours. The workflow can also be started by hand from the Actions tab ("Sync EduPage", then "Run workflow").
- The site is published with GitHub Pages at <https://abdulsejini.github.io/Monmon/>, built from the root of the main branch (`.nojekyll` serves the files as they are). Any commit to the main branch, including the sync's, goes live within a couple of minutes.
- A green "دخول IXL" button at the top opens IXL's sign-in page. The two IXL plans (below) each add one homework item a week to the dashboard, from the week's first day, with how many of its skills are closed; the plan page ticks the item when every skill of that week is closed.
- Notes on what to study or bring, items from the Weekly Study Plan or the class's EduPage messages that the public list doesn't have (`EXTRA`), school calendar dates (`SCHOOL_DATES`) and class notices (`NOTICES`) are kept by hand near the top of the script in `index.html`. Nothing personal (messages to or about the student, reports, behaviour notes) goes on this public site.

## Weekly plans

| Week | Page | What's inside |
| --- | --- | --- |
| Week 8 (18–22 Oct 2026), Class 6.3 | [`weekly/week-08/index.html`](weekly/week-08/index.html) | The school's Weekly Study Plan as one page: tests (Qur'an periodic test, Arabic dictation), a homework checklist grouped by due date, the day-by-day timetable, a suggested evening plan with "tonight's jobs" picked from today's date (Jeddah time), a friendly-letter planner, and links to this week's practice pages. Prints as a one-week sheet. |
| Week 9 (25–29 Oct 2026), Class 6.3 | [`weekly/week-09/index.html`](weekly/week-09/index.html) | The same layout for Week 9: Sunday 25/10 shown as the long weekend, tests (ICT practical quiz, Qur'an recitation check), eight homework items with a pronoun helper for the writing task and an exponent reminder, a note that the Science IXL link opens the plant cell skill while the task names the animal cell one, the Mon–Thu timetable, the evening plan (with the ICT quiz practice spread over the four evenings before it), and links to the practice pages: Future Lab for the ICT quiz, the coordinate plane, Power Lab, Signal Lab and the Cell Lab. Prints as a one-week sheet. |

## IXL practice plan

| Plan | Page | What's inside |
| --- | --- | --- |
| IXL personal study plan for the NWEA MAP Growth Math test (66 skills, from 28 Oct 2026 to 7 Jan 2027) | [`ixl/map-math/index.html`](ixl/map-math/index.html) | The 66 skills in his IXL study plan, each with a direct link, its IXL code, its area and a rough time. They are spread over nine weeks of about 8 skills each, with the expression skills in the same order as the class's Topic 3 and quick number-sense review in between, then two weeks to catch up. The page shows this week's skills (with any left from earlier weeks first), how to close a skill (SmartScore 100), progress by area, and the whole plan with ticks. It also lists the next level after the 66: 101 skills one step up in IXL's grade-6 plan for that test. Ticks are kept on the device, in `monmon-ixl-v1`. No test scores are on the page. |
| IXL's grade-6 plan for the NWEA MAP Growth Reading test, at his level (62 skills, from 1 Nov 2026 to 28 Jan 2027) | [`ixl/map-reading/index.html`](ixl/map-reading/index.html) | The same layout for reading: 62 skills in stories and poems (14), informational texts (20) and vocabulary (28), about 5 a week next to the math plan and a few more in the two breaks, ending 23 Jan, then catch-up days to 28 Jan. Each week mixes a story skill, an informational-text skill and word skills, with a reminder to read a book for 20 minutes a day. It also lists the next level: 81 grade-4 skills. Ticks are kept in `monmon-ixl-read-v1`. |

## Math

| Lessons | Page | What's inside |
| --- | --- | --- |
| enVision Mathematics Grade 6, Lessons 2-4 and 2-5 (coordinate plane) | [`math/coordinate-plane/index.html`](math/coordinate-plane/index.html) | Five zones (axes and quadrants, fractions and decimals, reflections, distance with absolute value, map problems), each with lesson cards and a 6-question practice; a tap-to-plot grid that works on iPad; typed answers that accept fractions, mixed numbers and decimals; explanations for every answer with tips for common slips; a 20-question Final Challenge with a skill report and study plan; and a homework check for H.W. 8.1 (IXL) and 8.2 (book pp. 102–103). |
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

Every page has its own A4 print layout. The screen view is hidden and a paper version is printed instead:

| Page | Prints as |
| --- | --- |
| Dashboard | 1 page: homework still due, with boxes to tick by hand, and the coming tests with what to study |
| Week 8 plan | 2 pages: tests, homework and evening plan; then the Sun–Thu timetable as a grid |
| Week 9 plan | 2 pages: tests, homework and evening plan; then the Mon–Thu timetable as a grid |
| IXL Math Plan | 1 page: the 66 skills week by week, with codes and tick boxes |
| IXL Reading Plan | 1 page: the 62 skills week by week, with codes and tick boxes |
| Math | 2 pages: study sheet, then 10 practice questions with an answer key |
| Math, exponents | 2 pages: study sheet, then 10 practice questions with an answer key |
| Science | 3 pages: key ideas and word bank, then a label-the-cell sheet with an answer key |
| Science, control and information | 3 pages: homework and key ideas, the rest of the key ideas and the word bank, then a label-the-eye-and-ear sheet with an answer key |
| ICT, TechnoFuture | 2 pages: the PowerPoint window with its 9 parts labelled and a "How do I…?" table; then the three big procedures (link an action button, a picture on every slide, stop click-to-advance with Home and Return), futurist facts and a 10-question self-test with an answer key |
| Vocabulary Unit 2 | 2 pages: word list, then "Test yourself" with an answer key |
| Vocabulary Review Units 1–3 | 3 pages: one per unit, with a word table and a short test |

Progress is saved in the browser of the device being used (`localStorage`). Homework ticks are shared between the dashboard and the weekly plans, keyed by EduPage item id.
