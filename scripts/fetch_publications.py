#!/usr/bin/env python3
"""
Автоматический импорт публикаций лаборатории из OpenAlex (https://openalex.org).

Как работает:
  1. Берёт ORCID сотрудников из data/team.yaml (поле orcid, заполняется в Pages CMS → Команда).
  2. Для каждого ORCID запрашивает у OpenAlex все работы автора.
  3. Убирает дубли (одна статья нескольких сотрудников = одна запись), препринты и служебные записи.
  4. Записывает результат в data/publications_auto.yaml.

Ручной список data/publications.yaml скрипт НЕ трогает. Если статья есть в обоих
файлах (совпадает DOI), на сайте показывается ручная версия. Чтобы скрыть
автоматически найденную статью, добавьте её DOI в ручной список с «Скрыть: да».

Запуск вручную:   python3 scripts/fetch_publications.py
Только Python 3.8+ и PyYAML (pip install pyyaml).
"""
import json
import os
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEAM = os.path.join(ROOT, "data", "team.yaml")
OUT = os.path.join(ROOT, "data", "publications_auto.yaml")

API = "https://api.openalex.org/works"
MAILTO = os.environ.get("OPENALEX_MAILTO", "ipbbkz@gmail.com")  # «вежливый» доступ к API
FROM_YEAR = int(os.environ.get("PUBS_FROM_YEAR", "2010"))      # статьи старше не берём

# Типы OpenAlex, которые показываем на сайте
KEEP_TYPES = {"article", "review", "book", "book-chapter", "letter"}
BOOK_TYPES = {"book", "book-chapter"}

ORCID_RE = re.compile(r"\d{4}-\d{4}-\d{4}-\d{3}[\dX]")


def clean_orcid(value):
    m = ORCID_RE.search(str(value or ""))
    return m.group(0) if m else None


def http_get_json(url, tries=4):
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": f"plantmolgenlab-site (mailto:{MAILTO})"})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except Exception as e:  # сеть, 429, 5xx — пробуем ещё раз
            if attempt == tries - 1:
                raise
            wait = 2 ** attempt * 3
            print(f"  повтор через {wait} с: {e}", file=sys.stderr)
            time.sleep(wait)


def fetch_works_for_orcid(orcid, getter=http_get_json):
    """Все работы автора из OpenAlex (с постраничной загрузкой через cursor)."""
    works, cursor = [], "*"
    while cursor:
        params = {
            "filter": f"author.orcid:{orcid},publication_year:>{FROM_YEAR - 1}",
            "per-page": "200",
            "cursor": cursor,
            "mailto": MAILTO,
        }
        data = getter(API + "?" + urllib.parse.urlencode(params))
        works.extend(data.get("results", []))
        cursor = (data.get("meta") or {}).get("next_cursor")
        if not data.get("results"):
            break
    return works


def short_name(display_name):
    """'Yerlan Turuspekov' → 'Turuspekov Y.'"""
    parts = [p for p in re.split(r"\s+", (display_name or "").strip()) if p]
    if not parts:
        return ""
    if len(parts) == 1:
        return parts[0]
    initials = "".join(p[0].upper() + "." for p in parts[:-1] if p[0].isalpha())
    return f"{parts[-1]} {initials}"


def format_authors(authorships, lab_orcids, limit=15):
    names = []
    for a in authorships or []:
        author = a.get("author") or {}
        name = short_name(author.get("display_name"))
        if not name:
            continue
        if clean_orcid(author.get("orcid")) in lab_orcids:
            name = f"**{name}**"  # сотрудники лаборатории выделяются жирным
        names.append(name)
    if len(names) > limit:
        names = names[:limit] + ["et al."]
    return ", ".join(names)


def format_source(work):
    loc = work.get("primary_location") or {}
    source = (loc.get("source") or {}).get("display_name") or ""
    b = work.get("biblio") or {}
    vol, issue = b.get("volume"), b.get("issue")
    fp, lp = b.get("first_page"), b.get("last_page")
    s = source
    if vol:
        s += f" {vol}"
        if issue:
            s += f"({issue})"
    if fp:
        s += f": {fp}" + (f"–{lp}" if lp and lp != fp else "")
    return s.strip()


def norm_title(t):
    t = unicodedata.normalize("NFKD", t or "").lower()
    return re.sub(r"[^a-z0-9а-яё]+", "", t)


def strip_tags(t):
    return re.sub(r"<[^>]+>", "", t or "").strip()


def convert(works_by_orcid, lab_orcids):
    seen, items = {}, []
    for orcid, works in works_by_orcid.items():
        for w in works:
            if w.get("is_retracted") or w.get("is_paratext"):
                continue
            wtype = w.get("type") or ""
            if wtype not in KEEP_TYPES:
                continue
            title = strip_tags(w.get("title") or w.get("display_name"))
            if not title or title.lower().startswith(("additional file", "supplementary")):
                continue
            src = (((w.get("primary_location") or {}).get("source") or {}).get("display_name") or "").lower()
            if any(k in src for k in ("figshare", "zenodo", "dryad")):
                continue
            doi = (w.get("doi") or "").lower().replace("https://doi.org/", "")
            key = doi or norm_title(title)
            if key in seen:
                continue
            seen[key] = True
            items.append({
                "type": "book" if wtype in BOOK_TYPES else "article",
                "year": w.get("publication_year"),
                "title": title,
                "authors": format_authors(w.get("authorships"), lab_orcids),
                "journal": format_source(w),
                "doi": doi,
                "url": "" if doi else ((w.get("primary_location") or {}).get("landing_page_url") or ""),
                "citations": w.get("cited_by_count") or 0,
                "openalex": (w.get("id") or "").replace("https://openalex.org/", ""),
            })
    items.sort(key=lambda x: (-(x["year"] or 0), x["title"].lower()))
    return items


def main(getter=http_get_json, out_path=OUT):
    with open(TEAM, encoding="utf-8") as f:
        team = yaml.safe_load(f) or {}
    lab_orcids = {o for o in (clean_orcid(m.get("orcid")) for m in team.get("members", [])) if o}
    if not lab_orcids:
        print("В data/team.yaml нет ни одного ORCID — нечего загружать.")
        return 0

    works_by_orcid = {}
    for orcid in sorted(lab_orcids):
        works = fetch_works_for_orcid(orcid, getter)
        print(f"{orcid}: {len(works)} работ в OpenAlex")
        works_by_orcid[orcid] = works

    items = convert(works_by_orcid, lab_orcids)
    header = (
        "# ФАЙЛ СОЗДАЁТСЯ АВТОМАТИЧЕСКИ (scripts/fetch_publications.py, раз в неделю).\n"
        "# Не редактируйте его вручную — изменения будут перезаписаны.\n"
        "# Исправить или скрыть статью: добавьте её с тем же DOI в data/publications.yaml.\n"
    )
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(header)
        yaml.safe_dump({"items": items}, f, allow_unicode=True, sort_keys=False, width=1000)
    print(f"Записано {len(items)} публикаций в {os.path.relpath(out_path, ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
