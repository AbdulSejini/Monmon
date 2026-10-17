# Monmon

Learning materials for Mohammed.

## Dashboard

[`index.html`](index.html) is the home page, in Arabic: what Mohammed has to do (homework not yet due, grouped by due date, with ticks), his upcoming tests with what to study, links to the practice pages, and every earlier week's homework and tests.

The homework and tests come from the school's public EduPage list for class 6.3 (`https://aisedusa.edupage.org/exam/`), which needs no login. Grades, attendance and messages need a login and are not included.

- `tools/edupage_sync.py` re-reads that list and rewrites the data block in `index.html` (standard library only; `--dry-run` prints the items without changing anything).
- `.github/workflows/edupage-sync.yml` runs it at 06:23 and 16:23 Jeddah time and commits only when something changed. It can also be started by hand from the Actions tab ("Sync EduPage", then "Run workflow"). Scheduled runs start once this is on the default branch.
- Notes on what to study for a test, and anything the Weekly Study Plan has that EduPage doesn't, are kept by hand in `NOTES` and `EXTRA` near the top of the script in `index.html`.

## Weekly plans

| Week | Page | What's inside |
| --- | --- | --- |
| Week 8 (18–22 Oct 2026), Class 6.3 | [`weekly/week-08/index.html`](weekly/week-08/index.html) | The school's Weekly Study Plan as one page: tests (Qur'an periodic test, Arabic dictation), a homework checklist grouped by due date, the day-by-day timetable, a suggested evening plan with "tonight's jobs" picked from today's date (Jeddah time), a friendly-letter planner, and links to this week's practice pages. Prints as a one-week sheet. |

## Vocabulary

| Unit | Page | What's inside |
| --- | --- | --- |
| Sadlier Vocabulary Workshop, Unit 2 | [`vocabulary/unit-02/index.html`](vocabulary/unit-02/index.html) | 20 words in 5 themed "lands", an animated scene and memory trick for each word, quick checks, a land challenge per land, a 30-question Final Challenge built from the book's exercises, and a weak-spot report with a study plan. |

Each page is a single self-contained HTML file: open it in a browser, no build step or server needed.
Progress is saved in the browser of the device being used (`localStorage`). Homework ticks are shared between the dashboard and the weekly plans, keyed by EduPage item id.
