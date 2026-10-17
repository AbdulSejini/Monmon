#!/usr/bin/env python3
"""Refresh the homework dashboard (index.html) from EduPage.

Reads the school's public "Exams / Homeworks" list for class 6.3
(https://aisedusa.edupage.org/exam/), one school week per request, and writes
the homework and tests into index.html between the EDUPAGE-DATA markers, so the
page stays a single self-contained file. No login is used and nothing personal
(grades, attendance, messages) is read: only what the school publishes for the
whole class.

    python3 tools/edupage_sync.py             # update index.html
    python3 tools/edupage_sync.py --dry-run   # print the items, change nothing

Standard library only. Exits non-zero, without touching index.html, if any
week cannot be fetched or does not look like the class 6.3 list.
"""
import argparse
import datetime as dt
import html
import json
import re
import sys
import time
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo

SCHOOL = "https://aisedusa.edupage.org"
CLASS_ID = "-177"  # value of "6.3" in the class filter of /exam/
CLASS_NAME = "6.3"
TERM_START = dt.date(2026, 8, 30)  # Sunday of school week 1, 2026/2027
WEEKS_AHEAD = 8  # tests are sometimes posted weeks in advance
TZ = ZoneInfo("Asia/Riyadh")
PAGE = Path(__file__).resolve().parent.parent / "index.html"
BEGIN = "<!-- EDUPAGE-DATA:BEGIN -->"
END = "<!-- EDUPAGE-DATA:END -->"
USER_AGENT = "monmon-dashboard/1.0 (+https://github.com/AbdulSejini/Monmon)"

TEST_TYPES = {"Small exam", "Big exam", "Oral exam", "Unit Test (W2)", "Test",
              "Performance testing", "Test - online viewing", "Test - only for printing"}
AR_MONTHS = {"يناير": 1, "فبراير": 2, "مارس": 3, "أبريل": 4, "ابريل": 4, "مايو": 5,
             "يونيو": 6, "يوليو": 7, "أغسطس": 8, "اغسطس": 8, "سبتمبر": 9,
             "أكتوبر": 10, "اكتوبر": 10, "نوفمبر": 11, "ديسمبر": 12}
DECORATION = re.compile("[​﻿⌛⏳\U0001F3AF\U0001F4DA]")


def fetch_week(sunday, attempts=3):
    url = (f"{SCHOOL}/exam/?wid=exam_ExamList_1&classid={CLASS_ID}"
           f"&date={sunday.isoformat()}&type=")
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(1, attempts + 1):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                page = resp.read().decode("utf-8", "replace")
            break
        except OSError as err:  # URLError, timeouts and dropped connections
            if attempt == attempts:
                raise
            # the school's server occasionally drops a connection; wait and retry
            print(f"{url}: {err}; retrying", file=sys.stderr)
            time.sleep(10 * attempt)
    if 'id="exam_ExamList_1"' not in page or f'value="{CLASS_ID}" selected' not in page:
        raise RuntimeError(f"{url} did not return the class {CLASS_NAME} list (login page?)")
    return page


def clean(fragment):
    text = re.sub(r"<br\s*/?>", "\n", fragment, flags=re.I)
    text = html.unescape(re.sub(r"<[^>]+>", "", text)).replace("\xa0", " ")
    text = DECORATION.sub(" ", text)
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.split("\n")]
    return "\n".join(line for line in lines if line)


def parse_week(page):
    start = page.find('id="exam_ExamList_1"')
    body = page[start:page.find("</ul>", start)]
    items = []
    for block in re.split(r'(?=<li class="skgd skgdli-exam_ListItem_)', body):
        m = re.search(r'data-listItemId="(\d{4}-\d{2}-\d{2})-([^"]+)"', block)
        if not m or m.group(2) == "empty":
            continue
        fields = {}
        for f in re.finditer(r'data-sgid="exam_(DFText_\d+)-[0-9a-f]+"[^>]*>(.*?)</(?:span|div)>', block, flags=re.S):
            fields.setdefault(f.group(1), clean(f.group(2)))
        items.append({
            "id": f"{m.group(1)}-{m.group(2)}",
            "date": m.group(1),
            "type": fields.get("DFText_4", ""),
            "subject": fields.get("DFText_5", ""),
            "text": fields.get("DFText_6", ""),
        })
    return items


def find_due(text, assigned):
    """Due date written in the item, or None. Accepts 24/10/2026, 24 /10 / 26,
    and Arabic "24 من أكتوبر"; a date before the item or more than three weeks
    after it is treated as a typo (e.g. a wrong year) and retried with the
    item's year."""
    found = []
    for d, m, y in re.findall(r"(\d{1,2})\s*/\s*(\d{1,2})\s*/\s*(\d{2,4})", text):
        year = int(y) + 2000 if len(y) == 2 else int(y)
        found.append((int(d), int(m), year))
    for d, month in re.findall(r"(\d{1,2})\s*من\s*(" + "|".join(AR_MONTHS) + ")", text):
        found.append((int(d), AR_MONTHS[month], assigned.year))
    for d, m, y in found:
        for year in (y, assigned.year, assigned.year + 1):
            try:
                due = dt.date(year, m, d)
            except ValueError:
                continue
            if assigned <= due <= assigned + dt.timedelta(days=21):
                return due
    return None


def normalise(raw):
    assigned = dt.date.fromisoformat(raw["date"])
    item = dict(raw)
    if raw["type"] in TEST_TYPES:
        item["kind"] = "test"
        item["due"] = raw["date"]
    else:
        item["kind"] = "hw" if raw["type"].lower() == "homework" else "other"
        due = find_due(raw["text"], assigned)
        # the school's default deadline is the Saturday after the school week
        item["dueGuessed"] = due is None
        item["due"] = (due or assigned + dt.timedelta(days=(5 - assigned.weekday()) % 7)).isoformat()
    return item


def collect():
    today = dt.datetime.now(TZ).date()
    last = today + dt.timedelta(weeks=WEEKS_AHEAD)
    items, sunday = {}, TERM_START
    while sunday <= last:
        for raw in parse_week(fetch_week(sunday)):
            items[raw["id"]] = normalise(raw)
        sunday += dt.timedelta(weeks=1)
        time.sleep(0.4)
    return sorted(items.values(), key=lambda x: (x["date"], x["subject"], x["id"]))


def render(items, synced):
    data = {"source": f"{SCHOOL}/exam/", "class": CLASS_NAME, "synced": synced, "items": items}
    payload = json.dumps(data, ensure_ascii=False, indent=1).replace("</", "<\\/")
    return f'{BEGIN}\n<script id="edupage-data" type="application/json">\n{payload}\n</script>\n{END}'


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--dry-run", action="store_true", help="print the items and leave index.html alone")
    args = ap.parse_args()

    items = collect()
    if args.dry_run:
        for it in items:
            print(it["date"], it["kind"], it["subject"], "due", it["due"], "|", it["text"][:90].replace("\n", " "))
        print(len(items), "items")
        return 0

    page = PAGE.read_text(encoding="utf-8")
    pattern = re.compile(re.escape(BEGIN) + r".*?" + re.escape(END), re.S)
    if not pattern.search(page):
        sys.exit(f"{PAGE} has no {BEGIN} ... {END} block")
    current = re.search(r'<script id="edupage-data" type="application/json">\n(.*?)\n</script>', page, re.S)
    if current and json.loads(current.group(1).replace("<\\/", "</")).get("items") == items:
        print(f"No changes ({len(items)} items)")
        return 0
    synced = dt.datetime.now(TZ).replace(microsecond=0).isoformat()
    PAGE.write_text(pattern.sub(lambda _: render(items, synced), page, count=1), encoding="utf-8")
    print(f"Updated {PAGE.name}: {len(items)} items, synced {synced}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
