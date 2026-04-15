# Flashcards Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the `flashcards` skill for the `school-skills` mega-plugin: generates flashcard decks from any source (topic, notes, URL, PDF, image, transcript) and exports deterministic files — `deck.csv`, `deck.apkg`, `deck.tsv`, `deck.md`, `metadata.json`.

**Architecture:** The model-driven logic (fact extraction, card phrasing, cloze selection, grade calibration) lives in `SKILL.md` and on-demand `references/*.md`. All deterministic format conversions (CSV write, `.apkg` build via `genanki`, Quizlet TSV flatten, markdown table, PDF/URL/image ingestion helpers) live in bundled Python scripts under `skills/flashcards/scripts/` and the cross-skill `shared/scripts/anki_export.py`. Flashcards is the primary consumer and the implementor of that shared script — the interface is documented in `references/` so `language-drill` can chain through it in V2. Progressive disclosure: `SKILL.md` stays under 300 lines; calibration tables, import guides, and cloze rules live in references loaded on demand.

**Tech Stack:** Python 3.11+ (`genanki`, `pypdf`, `trafilatura`, `readability-lxml`, `rapidfuzz`), optional `ocrmypdf` / `pytesseract` for scanned-PDF OCR fallback, `pytest` for unit tests, `jq` / `sqlite3` CLI for eval assertions. Vision OCR for images is delegated to the host Claude session (no extra backend).

---

## Locked decisions (from specs + open-questions triage)

Resolved here so implementation is unambiguous:

| Open question | Resolution |
|---|---|
| V1 media support | Text-only. Figure captions from PDFs are accepted as text. No images in `.apkg`. |
| Anki library | `genanki` (MIT, maintained). |
| OCR backend | Vision (host Claude) for images + scanned PDFs. `ocrmypdf` is an optional local fallback behind `--ocr=local` — not required for V1. |
| Default card count per grade | Table in spec Section 8 adopted verbatim. |
| Cloze ratio in "mixed" | 30%. |
| Quizlet cloze flattening | `cloze-sentence-with-blank` → `term`; occluded text → `definition`. |
| Deck file location | `./flashcards-<slug>-<UTC-ts>/` in cwd. Explicit, hackable, matches spec Section 4. |
| V1 language coverage | Any language the model can output; officially tested: en, es, fr, de, it, pt, zh, ja, ko, ar, ru, ESL. |
| Regeneration flow | Net-new deck in a new timestamped dir. V1 does not merge; `metadata.json` records source for future merge. |
| Tags schema | `subject/topic/grade` with source section headers as sub-tags. |
| Graduation-friendly module | `shared/scripts/anki_export.py` is a clean CLI + importable module (`main()` + `build_apkg()`) so a V2 standalone CLI can reuse it unchanged. |

---

## File structure

```
school-skills/
├── shared/
│   └── scripts/
│       └── anki_export.py                 # NEW — CSV → .apkg, CLI + importable
├── skills/flashcards/
│   ├── SKILL.md                           # NEW — <300 lines, progressive disclosure
│   ├── scripts/
│   │   ├── anki_export.py                 # NEW — shim that re-exports shared/scripts/anki_export
│   │   ├── make_deck.py                   # NEW — orchestrator: cards.json → all 5 outputs
│   │   ├── pdf_extract.py                 # NEW — PDF → text + per-page index
│   │   ├── url_fetch.py                   # NEW — URL → cleaned markdown
│   │   └── dedupe.py                      # NEW — fuzzy dedupe by normalized front
│   ├── references/
│   │   ├── deck-naming.md                 # NEW
│   │   ├── cloze-syntax.md                # NEW
│   │   ├── card-count-heuristics.md       # NEW
│   │   ├── grade-calibration.md           # NEW
│   │   ├── card-quality-rubric.md         # NEW
│   │   ├── import-guides.md               # NEW
│   │   └── language-deck-patterns.md      # NEW
│   ├── evals/
│   │   └── evals.json                     # NEW — 5 eval prompts w/ objective assertions
│   ├── requirements.txt                   # NEW — python deps pin
│   └── tests/
│       ├── test_make_deck.py              # NEW — unit tests, goldens
│       ├── test_anki_export.py            # NEW — apkg round-trip
│       ├── test_dedupe.py                 # NEW
│       ├── test_pdf_extract.py            # NEW
│       └── fixtures/
│           ├── sample_cards.json          # NEW — tiny gold deck input
│           ├── sample.pdf                 # NEW — 2-page synthetic pdf
│           └── sample_notes.txt           # NEW
```

File responsibilities:

- `shared/scripts/anki_export.py` — single source of truth for CSV → `.apkg`. Exposes `build_apkg(csv_path, out_path, deck_name, tags=None)` and a `python -m anki_export <csv> <out> --name ...` CLI. Pure I/O; no model calls.
- `skills/flashcards/scripts/anki_export.py` — a 5-line shim that imports from `shared/` so the skill's scripts/ dir is self-contained for subagents.
- `make_deck.py` — accepts `cards.json` (+ flags), writes `deck.csv`, `deck.md`, `deck.tsv`, `metadata.json`, and invokes `anki_export.build_apkg`. This is the *only* script the SKILL.md tells the model to call for writing outputs.
- `pdf_extract.py`, `url_fetch.py`, `dedupe.py` — small utilities, single responsibility.
- `SKILL.md` — triggers, inputs, outputs, workflow, grade-calibration summary, pointers to references.
- `references/*.md` — loaded on demand by the model; each file is focused and standalone.

---

## Python dependencies

`skills/flashcards/requirements.txt`:

```
genanki==0.13.1
pypdf==4.3.1
trafilatura==1.12.2
readability-lxml==0.8.1
rapidfuzz==3.9.7
```

Dev-only (not runtime of the skill — for `tests/`):

```
pytest==8.3.3
```

Install notes documented in `SKILL.md` "Setup" section:
```bash
pip install -r skills/flashcards/requirements.txt
```
The skill detects missing deps and prints the install command before failing. Optional `ocrmypdf` is not installed by default.

---

## Task overview

Twelve discrete tasks, ordered by dependency. TDD throughout: tests first, minimal impl, commit.

1. Scaffolding + requirements + empty files
2. `shared/scripts/anki_export.py` + tests (foundation — everything else depends on its output shape)
3. `dedupe.py` + tests
4. `make_deck.py` (CSV/MD/TSV/metadata writers) + tests
5. `make_deck.py` wiring to `anki_export` + integration test
6. `pdf_extract.py` + tests
7. `url_fetch.py` + tests
8. References: the 7 markdown files
9. `SKILL.md`
10. `evals/evals.json` with 5 prompts + assertions
11. Eval harness smoke script (runs assertions locally against a fixture deck)
12. Final self-review pass: line counts, trigger coverage, spec coverage

---

## Task 1: Scaffolding + deps + empty files

**Files:**
- Create: `skills/flashcards/requirements.txt`
- Create: `skills/flashcards/tests/fixtures/sample_cards.json`
- Create: `skills/flashcards/tests/fixtures/sample_notes.txt`
- Create: `skills/flashcards/tests/fixtures/sample.pdf` (generated by a helper script, see below)
- Create empty: `shared/scripts/__init__.py`, `shared/scripts/anki_export.py`, `skills/flashcards/scripts/__init__.py`, `skills/flashcards/scripts/anki_export.py`, `skills/flashcards/scripts/make_deck.py`, `skills/flashcards/scripts/pdf_extract.py`, `skills/flashcards/scripts/url_fetch.py`, `skills/flashcards/scripts/dedupe.py`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p shared/scripts
mkdir -p skills/flashcards/{scripts,references,evals,tests/fixtures}
touch shared/scripts/__init__.py skills/flashcards/scripts/__init__.py
```

- [ ] **Step 2: Write `skills/flashcards/requirements.txt`**

```
genanki==0.13.1
pypdf==4.3.1
trafilatura==1.12.2
readability-lxml==0.8.1
rapidfuzz==3.9.7
```

- [ ] **Step 3: Write `skills/flashcards/tests/fixtures/sample_cards.json`**

```json
{
  "deck_name": "Krebs Cycle",
  "source": "topic:krebs cycle",
  "grade": "9-12",
  "language": "en",
  "cards": [
    {"front": "What is the Krebs cycle also known as?", "back": "The citric acid cycle (or TCA cycle).", "type": "basic", "tags": ["biology", "krebs"], "extra": ""},
    {"front": "Where does the Krebs cycle occur in eukaryotic cells?", "back": "In the mitochondrial matrix.", "type": "basic", "tags": ["biology", "krebs"], "extra": ""},
    {"front": "The Krebs cycle produces {{c1::2 ATP}} per glucose molecule.", "back": "", "type": "cloze", "tags": ["biology", "krebs"], "extra": "net ATP from substrate-level phosphorylation"}
  ]
}
```

- [ ] **Step 4: Write `skills/flashcards/tests/fixtures/sample_notes.txt`**

```
Sample 7th-grade US History notes. The Declaration of Independence was adopted on July 4, 1776.
Thomas Jefferson was its primary author. The Articles of Confederation preceded the Constitution.
(...add ~100 more words of content for OCR/parse fixtures...)
```

- [ ] **Step 5: Install deps**

```bash
pip install -r skills/flashcards/requirements.txt pytest==8.3.3
```

- [ ] **Step 6: Commit**

```bash
git add shared/ skills/flashcards/
git commit -m "feat(flashcards): scaffold skill directories, requirements, fixtures"
```

**Acceptance:** All files exist. `pip install` succeeds. `pytest --collect-only skills/flashcards/tests/` reports 0 tests without errors.

---

## Task 2: `shared/scripts/anki_export.py` — CSV → .apkg

**Files:**
- Create: `shared/scripts/anki_export.py`
- Create: `skills/flashcards/scripts/anki_export.py` (shim)
- Test: `skills/flashcards/tests/test_anki_export.py`

- [ ] **Step 1: Write failing test `skills/flashcards/tests/test_anki_export.py`**

```python
import csv
import sqlite3
import tempfile
import zipfile
from pathlib import Path

import pytest

from shared.scripts.anki_export import build_apkg


@pytest.fixture
def csv_path(tmp_path: Path) -> Path:
    p = tmp_path / "deck.csv"
    with p.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["front", "back", "tags", "type", "extra"])
        w.writerow(["Capital of France?", "Paris", "geo capitals", "basic", ""])
        w.writerow(["The sky is {{c1::blue}}.", "", "science colors", "cloze", "hint: wavelength"])
    return p


def test_build_apkg_creates_valid_zip(csv_path, tmp_path):
    out = tmp_path / "deck.apkg"
    build_apkg(csv_path=csv_path, out_path=out, deck_name="Test Deck")
    assert out.exists() and out.stat().st_size > 0
    with zipfile.ZipFile(out) as z:
        names = z.namelist()
    assert "collection.anki2" in names or "collection.anki21" in names


def test_build_apkg_contains_basic_and_cloze_notes(csv_path, tmp_path):
    out = tmp_path / "deck.apkg"
    build_apkg(csv_path=csv_path, out_path=out, deck_name="Test Deck")
    with zipfile.ZipFile(out) as z:
        col = next(n for n in z.namelist() if n.startswith("collection.anki"))
        z.extract(col, tmp_path)
    db = sqlite3.connect(tmp_path / col)
    notetypes = [r[0] for r in db.execute("SELECT name FROM notetypes")] if _has_notetypes_table(db) else _notetypes_from_models(db)
    db.close()
    assert any("Basic" in n for n in notetypes)
    assert any("Cloze" in n for n in notetypes)


def _has_notetypes_table(db):
    return bool(db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='notetypes'").fetchone())


def _notetypes_from_models(db):
    import json
    row = db.execute("SELECT models FROM col").fetchone()
    models = json.loads(row[0])
    return [m["name"] for m in models.values()]
```

- [ ] **Step 2: Run — expect failure**

```bash
pytest skills/flashcards/tests/test_anki_export.py -v
```
Expected: `ImportError` or `AttributeError`.

- [ ] **Step 3: Implement `shared/scripts/anki_export.py`**

```python
"""CSV → Anki .apkg.

Input CSV columns: front, back, tags, type, extra
  - type: "basic" (default) or "cloze"
  - cloze rows: front uses Anki {{c1::answer}} syntax, back may be empty, extra is optional hint.
  - tags: space-separated string.

Usable as a module (build_apkg) and as a CLI (python -m anki_export ...).
This file is the shared implementation; skills/flashcards/scripts/anki_export.py is a thin shim.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
from pathlib import Path
from typing import Iterable, Optional

import genanki

BASIC_MODEL_ID = 1607392319
CLOZE_MODEL_ID = 998877665

BASIC_MODEL = genanki.Model(
    BASIC_MODEL_ID,
    "Basic (school-skills)",
    fields=[{"name": "Front"}, {"name": "Back"}, {"name": "Extra"}],
    templates=[{
        "name": "Card 1",
        "qfmt": "{{Front}}",
        "afmt": '{{FrontSide}}<hr id="answer">{{Back}}<br><br><small>{{Extra}}</small>',
    }],
)

CLOZE_MODEL = genanki.Model(
    CLOZE_MODEL_ID,
    "Cloze (school-skills)",
    model_type=genanki.Model.CLOZE,
    fields=[{"name": "Text"}, {"name": "Extra"}],
    templates=[{
        "name": "Cloze",
        "qfmt": "{{cloze:Text}}",
        "afmt": '{{cloze:Text}}<br><br><small>{{Extra}}</small>',
    }],
)


def _stable_deck_id(deck_name: str) -> int:
    h = hashlib.sha1(deck_name.encode("utf-8")).digest()
    return int.from_bytes(h[:4], "big") | 0x10000000


def build_apkg(
    csv_path: Path | str,
    out_path: Path | str,
    deck_name: str,
    tags: Optional[Iterable[str]] = None,
) -> Path:
    csv_path, out_path = Path(csv_path), Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    deck = genanki.Deck(_stable_deck_id(deck_name), deck_name)
    global_tags = list(tags or [])

    with csv_path.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        required = {"front", "back"}
        if not required.issubset({c.lower() for c in reader.fieldnames or []}):
            raise ValueError(f"CSV must include columns {required}, got {reader.fieldnames}")
        for row in reader:
            card_type = (row.get("type") or "basic").strip().lower()
            row_tags = _split_tags(row.get("tags", "")) + global_tags
            extra = row.get("extra") or ""
            if card_type == "cloze":
                note = genanki.Note(model=CLOZE_MODEL, fields=[row["front"], extra], tags=row_tags)
            else:
                note = genanki.Note(model=BASIC_MODEL, fields=[row["front"], row["back"], extra], tags=row_tags)
            deck.add_note(note)
    genanki.Package(deck).write_to_file(str(out_path))
    return out_path


def _split_tags(s: str) -> list[str]:
    return [t for t in (s or "").replace(",", " ").split() if t]


def main(argv: Optional[list[str]] = None) -> int:
    p = argparse.ArgumentParser(description="Build Anki .apkg from flashcards CSV")
    p.add_argument("csv", type=Path)
    p.add_argument("out", type=Path)
    p.add_argument("--name", required=True, help="Deck name")
    p.add_argument("--tag", action="append", default=[], help="Global tag (repeatable)")
    args = p.parse_args(argv)
    build_apkg(args.csv, args.out, args.name, tags=args.tag)
    print(f"wrote {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 4: Implement shim `skills/flashcards/scripts/anki_export.py`**

```python
"""Skill-local re-export of shared/scripts/anki_export.

Kept as a 1:1 shim so the skill dir is self-contained for subagents that don't
know about `shared/`. The authoritative source is shared/scripts/anki_export.py.
"""
from shared.scripts.anki_export import build_apkg, main  # noqa: F401

if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 5: Run tests — expect pass**

```bash
pytest skills/flashcards/tests/test_anki_export.py -v
```
Expected: 2 passed.

- [ ] **Step 6: Smoke-test CLI**

```bash
python -m shared.scripts.anki_export skills/flashcards/tests/fixtures/deck_min.csv /tmp/out.apkg --name "Smoke" || true
```
(If the fixture csv doesn't exist yet, skip — this is a sanity run.)

- [ ] **Step 7: Commit**

```bash
git add shared/scripts/anki_export.py skills/flashcards/scripts/anki_export.py skills/flashcards/tests/test_anki_export.py
git commit -m "feat(flashcards): CSV→.apkg via genanki with Basic and Cloze models"
```

**Acceptance:** `pytest test_anki_export.py` green. `.apkg` unzips and contains `collection.anki2(1)` with both notetypes.

---

## Task 3: `dedupe.py` — fuzzy dedupe by normalized front

**Files:**
- Create: `skills/flashcards/scripts/dedupe.py`
- Test: `skills/flashcards/tests/test_dedupe.py`

- [ ] **Step 1: Write failing test**

```python
from skills.flashcards.scripts.dedupe import dedupe_cards


def test_removes_exact_dupes_case_insensitive():
    cards = [
        {"front": "What is H2O?", "back": "Water"},
        {"front": "what  is h2o?", "back": "H two O"},
        {"front": "What is CO2?", "back": "Carbon dioxide"},
    ]
    out = dedupe_cards(cards)
    assert len(out) == 2
    fronts = [c["front"] for c in out]
    assert "What is H2O?" in fronts and "What is CO2?" in fronts


def test_fuzzy_dedupe_at_90_threshold():
    cards = [
        {"front": "Capital of France", "back": "Paris"},
        {"front": "The capital of France is?", "back": "Paris, France"},
        {"front": "Capital of Germany", "back": "Berlin"},
    ]
    out = dedupe_cards(cards, threshold=90)
    assert len(out) == 2


def test_keeps_longer_back_when_duplicate():
    cards = [
        {"front": "X", "back": "short"},
        {"front": "X", "back": "a much longer and more complete answer"},
    ]
    out = dedupe_cards(cards)
    assert len(out) == 1
    assert out[0]["back"].startswith("a much longer")
```

- [ ] **Step 2: Run — expect failure**

```bash
pytest skills/flashcards/tests/test_dedupe.py -v
```
Expected: `ImportError`.

- [ ] **Step 3: Implement `dedupe.py`**

```python
"""Fuzzy-dedupe a list of card dicts by normalized `front`.

Cards are dicts with at minimum `front` and `back`. When two cards collide,
the one with the longer `back` wins (proxy for completeness).
"""
from __future__ import annotations

import re
from typing import Iterable

from rapidfuzz import fuzz


_WS = re.compile(r"\s+")


def _normalize(s: str) -> str:
    return _WS.sub(" ", (s or "").strip().lower())


def dedupe_cards(cards: Iterable[dict], threshold: int = 92) -> list[dict]:
    kept: list[dict] = []
    kept_norms: list[str] = []
    for c in cards:
        n = _normalize(c.get("front", ""))
        if not n:
            continue
        match_idx = -1
        for i, kn in enumerate(kept_norms):
            if n == kn or fuzz.ratio(n, kn) >= threshold:
                match_idx = i
                break
        if match_idx == -1:
            kept.append(c)
            kept_norms.append(n)
        else:
            if len(c.get("back", "")) > len(kept[match_idx].get("back", "")):
                kept[match_idx] = c
                kept_norms[match_idx] = n
    return kept
```

- [ ] **Step 4: Run — expect pass**

```bash
pytest skills/flashcards/tests/test_dedupe.py -v
```
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add skills/flashcards/scripts/dedupe.py skills/flashcards/tests/test_dedupe.py
git commit -m "feat(flashcards): fuzzy dedupe cards by normalized front"
```

**Acceptance:** 3 tests pass. Threshold 92 picked to match spec "near-duplicates" while letting distinct facts through.

---

## Task 4: `make_deck.py` — CSV/MD/TSV/metadata writers (no apkg yet)

**Files:**
- Create: `skills/flashcards/scripts/make_deck.py`
- Test: `skills/flashcards/tests/test_make_deck.py`

- [ ] **Step 1: Write failing test**

```python
import csv
import json
from pathlib import Path

from skills.flashcards.scripts.make_deck import write_outputs


def _sample_input(tmp_path: Path) -> Path:
    p = tmp_path / "cards.json"
    p.write_text(json.dumps({
        "deck_name": "Krebs Cycle",
        "source": "topic:krebs cycle",
        "grade": "9-12",
        "language": "en",
        "cards": [
            {"front": "Where does the Krebs cycle occur?", "back": "Mitochondrial matrix.", "type": "basic", "tags": ["biology", "krebs"], "extra": ""},
            {"front": "Krebs produces {{c1::2 ATP}} per glucose.", "back": "", "type": "cloze", "tags": ["biology"], "extra": ""},
        ],
    }))
    return p


def test_writes_csv_tsv_md_metadata(tmp_path):
    inp = _sample_input(tmp_path)
    out_dir = tmp_path / "out"
    paths = write_outputs(inp, out_dir, formats=["csv", "tsv", "md"])
    assert (out_dir / "deck.csv").exists()
    assert (out_dir / "deck.tsv").exists()
    assert (out_dir / "deck.md").exists()
    assert (out_dir / "metadata.json").exists()

    with (out_dir / "deck.csv").open(newline="") as f:
        rows = list(csv.DictReader(f))
    assert len(rows) == 2
    assert rows[0]["front"].startswith("Where does")

    tsv = (out_dir / "deck.tsv").read_text().splitlines()
    assert len(tsv) == 2
    assert "\t" in tsv[0]

    meta = json.loads((out_dir / "metadata.json").read_text())
    assert meta["deck_name"] == "Krebs Cycle"
    assert meta["card_count"] == 2
    assert meta["grade"] == "9-12"


def test_cloze_flattened_in_tsv(tmp_path):
    inp = _sample_input(tmp_path)
    out_dir = tmp_path / "out"
    write_outputs(inp, out_dir, formats=["tsv"])
    tsv_rows = [l.split("\t") for l in (out_dir / "deck.tsv").read_text().splitlines()]
    cloze_row = [r for r in tsv_rows if "_____" in r[0]]
    assert len(cloze_row) == 1
    assert cloze_row[0][1] == "2 ATP"


def test_md_has_header_and_table(tmp_path):
    inp = _sample_input(tmp_path)
    out_dir = tmp_path / "out"
    write_outputs(inp, out_dir, formats=["md"])
    md = (out_dir / "deck.md").read_text()
    assert "# Krebs Cycle" in md
    assert "| # | Front | Back | Tags |" in md
```

- [ ] **Step 2: Run — expect failure**

```bash
pytest skills/flashcards/tests/test_make_deck.py -v
```
Expected: `ImportError`.

- [ ] **Step 3: Implement `make_deck.py` (CSV/MD/TSV/meta only; apkg added next task)**

```python
"""Orchestrator: cards.json -> deck.csv/.tsv/.md/.apkg + metadata.json.

Input JSON shape:
    {
      "deck_name": str,
      "source": str,
      "grade": str,        # e.g. "9-12", "A2"
      "language": str,     # ISO 639-1 or "en"
      "cards": [
        {"front": str, "back": str, "type": "basic"|"cloze", "tags": [str], "extra": str}
      ]
    }

CLI: python -m skills.flashcards.scripts.make_deck <cards.json> <out_dir> [--formats csv,tsv,md,apkg]
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import re
from pathlib import Path
from typing import Iterable


ALL_FORMATS = ("csv", "tsv", "md", "apkg")
CLOZE_RE = re.compile(r"\{\{c\d+::(.+?)(?:::.*?)?\}\}")


def _flatten_cloze(front: str) -> tuple[str, str]:
    """Return (sentence_with_blank, occluded_text). Multi-cloze joins with ' / '."""
    matches = CLOZE_RE.findall(front)
    if not matches:
        return front, ""
    occluded = " / ".join(matches)
    blanked = CLOZE_RE.sub("_____", front)
    return blanked, occluded


def _write_csv(cards: list[dict], path: Path) -> None:
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["front", "back", "tags", "type", "extra"])
        for c in cards:
            w.writerow([
                c.get("front", ""),
                c.get("back", ""),
                " ".join(c.get("tags", [])),
                c.get("type", "basic"),
                c.get("extra", ""),
            ])


def _write_tsv(cards: list[dict], path: Path) -> None:
    with path.open("w", encoding="utf-8") as f:
        for c in cards:
            if (c.get("type") or "basic") == "cloze":
                term, definition = _flatten_cloze(c.get("front", ""))
            else:
                term, definition = c.get("front", ""), c.get("back", "")
            term = term.replace("\t", " ").replace("\n", " ")
            definition = definition.replace("\t", " ").replace("\n", " ")
            f.write(f"{term}\t{definition}\n")


def _write_md(deck: dict, cards: list[dict], path: Path) -> None:
    now = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    lines = [
        f"# {deck['deck_name']}",
        "",
        f"- **Source:** {deck.get('source', 'n/a')}",
        f"- **Grade:** {deck.get('grade', 'n/a')}",
        f"- **Language:** {deck.get('language', 'en')}",
        f"- **Cards:** {len(cards)}",
        f"- **Generated:** {now}",
        "",
        "| # | Front | Back | Tags |",
        "|---|-------|------|------|",
    ]
    for i, c in enumerate(cards, 1):
        front = (c.get("front", "") or "").replace("|", "\\|").replace("\n", " ")
        back = (c.get("back", "") or "").replace("|", "\\|").replace("\n", " ")
        tags = " ".join(c.get("tags", []))
        lines.append(f"| {i} | {front} | {back} | {tags} |")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def _write_metadata(deck: dict, cards: list[dict], path: Path, formats: list[str]) -> None:
    cloze_n = sum(1 for c in cards if (c.get("type") or "basic") == "cloze")
    meta = {
        "deck_name": deck["deck_name"],
        "source": deck.get("source"),
        "grade": deck.get("grade"),
        "language": deck.get("language", "en"),
        "level": deck.get("level"),  # CEFR when set
        "card_count": len(cards),
        "card_types": {"basic": len(cards) - cloze_n, "cloze": cloze_n},
        "formats": formats,
        "generated_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
        "model_version": deck.get("model_version", "unknown"),
    }
    path.write_text(json.dumps(meta, indent=2), encoding="utf-8")


def write_outputs(
    input_json: Path | str,
    out_dir: Path | str,
    formats: Iterable[str] = ALL_FORMATS,
) -> dict:
    input_json, out_dir = Path(input_json), Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    deck = json.loads(input_json.read_text(encoding="utf-8"))
    cards: list[dict] = deck.get("cards", [])
    formats = [f for f in formats if f in ALL_FORMATS]

    paths: dict[str, Path] = {}
    if "csv" in formats:
        paths["csv"] = out_dir / "deck.csv"; _write_csv(cards, paths["csv"])
    if "tsv" in formats:
        paths["tsv"] = out_dir / "deck.tsv"; _write_tsv(cards, paths["tsv"])
    if "md" in formats:
        paths["md"] = out_dir / "deck.md"; _write_md(deck, cards, paths["md"])
    # apkg added in Task 5
    paths["metadata"] = out_dir / "metadata.json"
    _write_metadata(deck, cards, paths["metadata"], list(formats))
    return {k: str(v) for k, v in paths.items()}


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser()
    p.add_argument("input_json", type=Path)
    p.add_argument("out_dir", type=Path)
    p.add_argument("--formats", default=",".join(ALL_FORMATS))
    args = p.parse_args(argv)
    formats = [f.strip() for f in args.formats.split(",") if f.strip()]
    paths = write_outputs(args.input_json, args.out_dir, formats=formats)
    print(json.dumps(paths, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 4: Run — expect pass**

```bash
pytest skills/flashcards/tests/test_make_deck.py -v
```
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add skills/flashcards/scripts/make_deck.py skills/flashcards/tests/test_make_deck.py
git commit -m "feat(flashcards): write deck.csv/.tsv/.md and metadata from cards.json"
```

**Acceptance:** 3 tests pass. Cloze flattens to `"sentence _____"` + occluded term for TSV.

---

## Task 5: Wire `.apkg` into `make_deck.py` + integration test

**Files:**
- Modify: `skills/flashcards/scripts/make_deck.py`
- Modify: `skills/flashcards/tests/test_make_deck.py`

- [ ] **Step 1: Extend test — failing first**

Append to `test_make_deck.py`:

```python
import zipfile


def test_apkg_written_when_requested(tmp_path):
    inp = _sample_input(tmp_path)
    out_dir = tmp_path / "out"
    write_outputs(inp, out_dir, formats=["csv", "apkg"])
    apkg = out_dir / "deck.apkg"
    assert apkg.exists() and apkg.stat().st_size > 0
    with zipfile.ZipFile(apkg) as z:
        assert any(n.startswith("collection.anki") for n in z.namelist())


def test_apkg_failure_degrades_gracefully(tmp_path, monkeypatch):
    import skills.flashcards.scripts.make_deck as md

    def boom(*a, **kw):
        raise RuntimeError("genanki kaboom")

    monkeypatch.setattr(md, "build_apkg", boom)
    inp = _sample_input(tmp_path)
    out_dir = tmp_path / "out"
    result = write_outputs(inp, out_dir, formats=["csv", "apkg"])
    assert (out_dir / "deck.csv").exists()
    assert "apkg_error" in result  # failure recorded
    assert not (out_dir / "deck.apkg").exists()
```

- [ ] **Step 2: Run — expect failure**

```bash
pytest skills/flashcards/tests/test_make_deck.py -v
```

- [ ] **Step 3: Modify `make_deck.py`**

Near the imports add:
```python
from shared.scripts.anki_export import build_apkg
```

Inside `write_outputs`, after CSV is written and before metadata, add:

```python
    if "apkg" in formats:
        if "csv" not in formats:
            # apkg needs the csv as intermediate
            paths["csv"] = out_dir / "deck.csv"; _write_csv(cards, paths["csv"])
        apkg_path = out_dir / "deck.apkg"
        try:
            build_apkg(paths["csv"], apkg_path, deck_name=deck["deck_name"])
            paths["apkg"] = apkg_path
        except Exception as e:  # graceful: user still gets csv/tsv/md
            paths["apkg_error"] = f"{type(e).__name__}: {e}"
```

Also update the returned dict to include `apkg_error` when present (already handled above since `paths` is the source).

- [ ] **Step 4: Run — expect pass**

```bash
pytest skills/flashcards/tests/test_make_deck.py -v
```
Expected: 5 passed.

- [ ] **Step 5: Manual smoke test**

```bash
python -m skills.flashcards.scripts.make_deck skills/flashcards/tests/fixtures/sample_cards.json /tmp/deck-smoke --formats csv,tsv,md,apkg
ls /tmp/deck-smoke
```
Expect 5 files: `deck.csv deck.tsv deck.md deck.apkg metadata.json`.

- [ ] **Step 6: Commit**

```bash
git add skills/flashcards/scripts/make_deck.py skills/flashcards/tests/test_make_deck.py
git commit -m "feat(flashcards): produce .apkg from make_deck with graceful degradation"
```

**Acceptance:** 5 tests pass. Smoke run produces 5 files. When `build_apkg` raises, CSV/TSV/MD are still written and `apkg_error` is in the result.

---

## Task 6: `pdf_extract.py`

**Files:**
- Create: `skills/flashcards/scripts/pdf_extract.py`
- Test: `skills/flashcards/tests/test_pdf_extract.py`
- Create: `skills/flashcards/tests/fixtures/sample.pdf` (synthesized in test setup if not checked in)

- [ ] **Step 1: Generate a 2-page fixture PDF**

Add a small helper at `skills/flashcards/tests/conftest.py`:

```python
import pypdf
from pypdf import PdfWriter
from pypdf.generic import RectangleObject

# genaning a pdf from pypdf alone is awkward; use reportlab if available,
# otherwise fall back to a tiny pre-made base64 blob committed in fixtures.
```

Simpler approach: commit a real 2-page PDF as a binary fixture. Create it locally with:
```bash
python - <<'PY'
from reportlab.pdfgen import canvas
c = canvas.Canvas("skills/flashcards/tests/fixtures/sample.pdf")
c.drawString(100, 750, "Chapter 1: Photosynthesis")
c.drawString(100, 730, "Plants convert sunlight into glucose via chlorophyll.")
c.showPage()
c.drawString(100, 750, "Chapter 2: Respiration")
c.drawString(100, 730, "Cellular respiration produces ATP in mitochondria.")
c.showPage()
c.save()
PY
```
(If `reportlab` isn't available, `pip install reportlab` for dev, or use a pre-made fixture. Don't add reportlab to runtime deps.)

- [ ] **Step 2: Write failing test**

```python
from pathlib import Path

from skills.flashcards.scripts.pdf_extract import extract_pdf

FIXTURE = Path(__file__).parent / "fixtures" / "sample.pdf"


def test_extract_returns_text_and_per_page_index():
    out = extract_pdf(FIXTURE)
    assert out["page_count"] == 2
    assert "Photosynthesis" in out["pages"][0]["text"]
    assert "Respiration" in out["pages"][1]["text"]
    assert "Photosynthesis" in out["full_text"] and "Respiration" in out["full_text"]


def test_extract_flags_low_text_ratio_as_ocr_needed(tmp_path, monkeypatch):
    # simulate an "image-only" pdf by patching extract_text to return empty strings
    import skills.flashcards.scripts.pdf_extract as pe

    class FakePage:
        def extract_text(self):
            return ""

    class FakeReader:
        def __init__(self, *a, **kw):
            self.pages = [FakePage(), FakePage()]

    monkeypatch.setattr(pe, "PdfReader", FakeReader)
    out = extract_pdf(FIXTURE)
    assert out["ocr_needed"] is True
    assert out["page_count"] == 2
```

- [ ] **Step 3: Run — expect failure**

- [ ] **Step 4: Implement `pdf_extract.py`**

```python
"""PDF → text with a per-page index.

Output shape:
    {
      "page_count": int,
      "pages": [{"page": 1, "text": str}, ...],
      "full_text": str,
      "ocr_needed": bool,       # True if extracted text is suspiciously thin
      "source_path": str,
    }

OCR itself is deferred to the host Claude session (vision) — this module only
flags when OCR would be needed. A local ocrmypdf path can be added later.
"""
from __future__ import annotations

from pathlib import Path

from pypdf import PdfReader

_MIN_CHARS_PER_PAGE = 40


def extract_pdf(path: Path | str) -> dict:
    path = Path(path)
    reader = PdfReader(str(path))
    pages = []
    for i, p in enumerate(reader.pages, 1):
        text = (p.extract_text() or "").strip()
        pages.append({"page": i, "text": text})
    total_chars = sum(len(p["text"]) for p in pages)
    ocr_needed = total_chars < _MIN_CHARS_PER_PAGE * max(1, len(pages))
    return {
        "page_count": len(pages),
        "pages": pages,
        "full_text": "\n\n".join(p["text"] for p in pages),
        "ocr_needed": ocr_needed,
        "source_path": str(path),
    }


if __name__ == "__main__":
    import json, sys
    print(json.dumps(extract_pdf(sys.argv[1]), indent=2)[:2000])
```

- [ ] **Step 5: Run — expect pass**

```bash
pytest skills/flashcards/tests/test_pdf_extract.py -v
```

- [ ] **Step 6: Commit**

```bash
git add skills/flashcards/scripts/pdf_extract.py skills/flashcards/tests/test_pdf_extract.py skills/flashcards/tests/fixtures/sample.pdf skills/flashcards/tests/conftest.py
git commit -m "feat(flashcards): pdf_extract with per-page index and OCR-needed flag"
```

**Acceptance:** 2 tests pass. OCR flag triggers when text density is low.

---

## Task 7: `url_fetch.py`

**Files:**
- Create: `skills/flashcards/scripts/url_fetch.py`
- Test: `skills/flashcards/tests/test_url_fetch.py`

- [ ] **Step 1: Failing test (offline, uses local HTML fixture)**

`skills/flashcards/tests/fixtures/page.html`:
```html
<html><head><title>Krebs cycle</title></head>
<body>
<nav>site nav</nav>
<article>
  <h1>Krebs cycle</h1>
  <p>The citric acid cycle (Krebs cycle) occurs in the mitochondrial matrix.</p>
  <p>It produces 2 ATP per glucose via substrate-level phosphorylation.</p>
</article>
<footer>© site</footer>
</body></html>
```

```python
from pathlib import Path

from skills.flashcards.scripts.url_fetch import fetch_clean

FIX = Path(__file__).parent / "fixtures" / "page.html"


def test_fetch_clean_from_file_url_strips_chrome():
    url = FIX.resolve().as_uri()
    out = fetch_clean(url)
    assert "Krebs cycle" in out["text"]
    assert "citric acid cycle" in out["text"]
    assert "site nav" not in out["text"]
    assert "© site" not in out["text"]
    assert out["title"] == "Krebs cycle"
```

- [ ] **Step 2: Run — expect failure**

- [ ] **Step 3: Implement `url_fetch.py`**

```python
"""URL → cleaned plain text + title.

Tries trafilatura first (best article extraction); falls back to readability-lxml.
Supports file:// URLs for tests.
"""
from __future__ import annotations

from urllib.request import urlopen

import trafilatura
from readability import Document


def fetch_clean(url: str) -> dict:
    html = urlopen(url).read().decode("utf-8", errors="replace")
    text = trafilatura.extract(html, include_comments=False, include_tables=False) or ""
    if not text.strip():
        doc = Document(html)
        text = doc.summary(html_partial=False)
    title = (trafilatura.extract_metadata(html).title if trafilatura.extract_metadata(html) else None) \
        or Document(html).short_title()
    return {"url": url, "title": (title or "").strip(), "text": text.strip()}


if __name__ == "__main__":
    import json, sys
    print(json.dumps(fetch_clean(sys.argv[1]), indent=2)[:2000])
```

- [ ] **Step 4: Run — expect pass**

- [ ] **Step 5: Commit**

```bash
git add skills/flashcards/scripts/url_fetch.py skills/flashcards/tests/test_url_fetch.py skills/flashcards/tests/fixtures/page.html
git commit -m "feat(flashcards): url_fetch with trafilatura + readability fallback"
```

**Acceptance:** Test passes. Navigation/footer stripped; title extracted.

---

## Task 8: Reference files (7 markdown docs)

**Files (all under `skills/flashcards/references/`):**
- Create: `deck-naming.md`
- Create: `cloze-syntax.md`
- Create: `card-count-heuristics.md`
- Create: `grade-calibration.md`
- Create: `card-quality-rubric.md`
- Create: `import-guides.md`
- Create: `language-deck-patterns.md`

Each reference is ≤ ~120 lines and focused. Content outlines:

- [ ] **Step 1: Write `deck-naming.md`**

Outline:
1. Slug rules: lowercase, ASCII, hyphens, max 40 chars.
2. Directory: `./flashcards-<slug>-<UTC-ts>/`; `ts` format `YYYYMMDD-HHMM`.
3. Deck name vs slug (human-friendly name; slug only for paths).
4. Same-topic multiple decks: append `-v2`, `-v3`.
5. Tag hierarchy: `subject/topic/grade`; preserve source section headers as `subject/topic/grade/section-heading`.
6. Examples.

- [ ] **Step 2: Write `cloze-syntax.md`**

Outline:
1. Anki cloze syntax: `{{c1::answer}}`, `{{c1::answer::hint}}`.
2. Multi-cloze: `{{c1::...}}{{c2::...}}` create N cards.
3. When to cloze: high-information density sentences with exactly one unambiguous fact to hide. Don't cloze definitions — front-back is clearer.
4. Ratio defaults (0% K-2 → 50% grad).
5. Quizlet flattening rule: cloze sentence with `_____` becomes term; occluded text(s) joined with `/` become definition.
6. Nesting is not supported — flatten before export.

- [ ] **Step 3: Write `card-count-heuristics.md`**

Outline:
1. Per-1000-words heuristic: ~8-12 cards per 1000 words of source (dense science: 15; narrative: 5).
2. Per-chapter default by grade (mirrors Section 8 table).
3. Cap per deck: 200 cards. Warn at 150.
4. Auto-pick logic: min(requested, 1.5 * heuristic, 200).

- [ ] **Step 4: Write `grade-calibration.md`**

Full calibration table from spec Section 8. For each band: vocabulary cap, example type, hint style, cloze ratio, card-count defaults, "do" and "don't" examples (2 each).

- [ ] **Step 5: Write `card-quality-rubric.md`**

The six properties: atomic, unambiguous, answer-not-in-prompt, single-answer, minimum-info, concrete. 2 good examples + 2 bad examples per property. Bad→good rewrites. Max front 200 chars; max back 400 chars.

- [ ] **Step 6: Write `import-guides.md`**

Step-by-step:
1. Anki: File → Import → pick `deck.apkg` (or `deck.csv` with column mapping).
2. Quizlet: New set → "Import from Word, Excel..." → paste TSV → pick Tab + New line.
3. RemNote: drag `.apkg`.
4. Paper: print `deck.md`; cut-and-fold.

- [ ] **Step 7: Write `language-deck-patterns.md`**

Outline:
1. Term↔definition direction (source-lang on front for learning; target-lang on front for recall).
2. Example sentence on back is mandatory.
3. CEFR calibration mini-table.
4. Noun articles/gender on back.
5. IPA optional.
6. Audio: deferred.

- [ ] **Step 8: Commit**

```bash
git add skills/flashcards/references/
git commit -m "docs(flashcards): add 7 on-demand reference files"
```

**Acceptance:** All 7 files exist, each ≤ ~120 lines, each focused on a single concern. No file repeats content from `SKILL.md`.

---

## Task 9: `SKILL.md`

**Files:**
- Create: `skills/flashcards/SKILL.md`

- [ ] **Step 1: Write `SKILL.md` (<300 lines)**

Outline + frontmatter to use verbatim:

```markdown
---
name: flashcards
description: >
  Generate high-quality flashcard decks from any source — a topic string, pasted notes, a URL,
  a textbook PDF, a photo of notes, or a lecture transcript — and export deck.csv, deck.apkg
  (Anki), deck.tsv (Quizlet), and a printable deck.md. Triggers on phrasings like: "make me
  flashcards on X", "turn this into an Anki deck", "flashcard this for me", "study cards for
  my test", "cloze cards on the Bill of Rights", "export these notes as .apkg", "can you make
  flashcards from this photo of my textbook", "printable study cards for 3rd grade
  multiplication", "import-ready CSV of cards on French irregular verbs A2". Use for both
  teacher deck-building and student exam-cramming, K-2 through grad, including language-learning
  (CEFR A1-C2). Output-first: always produces files, not chat lists.
triggers:
  - "make flashcards"
  - "flashcard this"
  - "study cards"
  - "anki deck"
  - "quizlet export"
  - "cloze flashcards"
  - ".apkg"
inputs:
  - topic string
  - pasted notes
  - url
  - pdf
  - image (photo of notes)
  - transcript (txt, srt, vtt)
outputs:
  - deck.csv
  - deck.apkg
  - deck.tsv
  - deck.md
  - metadata.json
---

# Flashcards

## When to use

[2-3 sentence trigger summary — covers both teacher and student phrasings, formal and informal,
with and without format keywords.]

## Setup

```bash
pip install -r skills/flashcards/requirements.txt
```

If an import fails the scripts print the pip command; never guess.

## Workflow

Always produce files, not chat lists. Deck dir: `./flashcards-<slug>-<UTC-timestamp>/`.

1. **Parse input** — detect topic / text / URL / PDF / image / transcript.
   - URL → `scripts/url_fetch.py`
   - PDF → `scripts/pdf_extract.py`; if `ocr_needed=True`, use vision to re-read pages, or ask
     the user for a clearer version.
   - Image → use vision directly.
   - Transcript → strip `[00:00:00]` style timestamps and `WEBVTT`/cue headers.

2. **Ask clarifying Qs only when necessary.** Needed: ambiguous topic (e.g. "functions").
   Not needed: grade (infer from source; ask only when source is grade-agnostic).

3. **Chunk** if source > ~8k tokens. Extract atomic facts per chunk.

4. **Calibrate to grade** — see `references/grade-calibration.md` for vocabulary, example
   type, hint style, and cloze ratio per band (K-2, 3-5, 6-8, 9-12, college, grad, CEFR A1-C2).

5. **Generate cards.** Apply:
   - `references/card-quality-rubric.md` (atomic, unambiguous, answer-not-in-prompt).
   - `references/cloze-syntax.md` (when to cloze; mixed defaults to 30% cloze).
   - Max 200 cards per deck; warn at 150.

6. **Dedupe** — call `scripts/dedupe.py` `dedupe_cards(cards, threshold=92)`.

7. **Tag** each card: `subject/topic/grade`, plus section headers as sub-tags.

8. **Build `cards.json`** and invoke `scripts/make_deck.py`:
   ```bash
   python -m skills.flashcards.scripts.make_deck cards.json ./flashcards-<slug>-<ts>/ \
     --formats csv,tsv,md,apkg
   ```
   `make_deck.py` writes all 5 files and returns a JSON map of paths.
   If `apkg_error` appears in the result, report it to the user with the recovery hint
   ("Import `deck.csv` into Anki via File → Import").

9. **Report** — show: deck name, count, list of files, 3 sample cards, next step
   ("open deck.apkg to import into Anki"). Link `references/import-guides.md` for users
   unfamiliar with import flows.

## Inputs (details)

[Table copied from spec Section 3.]

## Parameters

[Table: deck size, card type (mixed=70/30), grade, formats (default all four), deck name, tags.]

## Outputs

[Summary of each of the 5 files. Point to `references/cloze-syntax.md` for Quizlet flattening.]

## Grade calibration (summary)

[Single-line row per band. Full table + examples in `references/grade-calibration.md`.]

## Edge cases

[Bulleted cheat-sheet from spec Section 10. Each item 1-2 lines.]

## Safety

- Refuse unsafe/illegal instructional content (weapons, drugs synthesis). Offer a safe
  alternative deck.
- No PII in generated cards unless the user pasted it.
- Age-appropriate vocabulary per grade band.

## References (load on demand)

- `references/deck-naming.md`
- `references/cloze-syntax.md`
- `references/card-count-heuristics.md`
- `references/grade-calibration.md`
- `references/card-quality-rubric.md`
- `references/import-guides.md`
- `references/language-deck-patterns.md`
```

- [ ] **Step 2: Verify length**

```bash
wc -l skills/flashcards/SKILL.md
```
Expected: < 300.

- [ ] **Step 3: Verify description triggers**

Manual check: the `description` field contains ≥ 8 of the 12 trigger phrases from spec Section 2, both formal and informal, both teacher and student framings, with and without file-format keywords.

- [ ] **Step 4: Commit**

```bash
git add skills/flashcards/SKILL.md
git commit -m "feat(flashcards): SKILL.md with pushy description and workflow"
```

**Acceptance:** File exists, <300 lines, description pushy on all required phrasings, workflow references the scripts and references by path.

---

## Task 10: `evals/evals.json`

**Files:**
- Create: `skills/flashcards/evals/evals.json`

- [ ] **Step 1: Write `evals.json`**

```json
{
  "skill": "flashcards",
  "version": 1,
  "evals": [
    {
      "id": "eval-1-topic-default",
      "prompt": "Make me flashcards on the Krebs cycle.",
      "expected": {"grade": "9-12", "formats": ["csv", "apkg", "tsv", "md"]},
      "assertions": [
        {"type": "file_exists", "path": "deck.csv"},
        {"type": "file_exists", "path": "deck.apkg"},
        {"type": "file_exists", "path": "deck.tsv"},
        {"type": "file_exists", "path": "deck.md"},
        {"type": "file_exists", "path": "metadata.json"},
        {"type": "csv_has_header_cols", "path": "deck.csv", "cols": ["front", "back"]},
        {"type": "csv_row_count_between", "path": "deck.csv", "min": 20, "max": 50},
        {"type": "apkg_is_valid_zip_with_collection", "path": "deck.apkg"},
        {"type": "csv_any_row_matches", "path": "deck.csv", "column": "front", "regex": "\\{\\{c1::"}
      ]
    },
    {
      "id": "eval-2-pasted-notes-30-no-cloze",
      "prompt": "Make 30 flashcards from these, 7th grade level, front-back only no cloze.",
      "paste_fixture": "tests/fixtures/sample_notes.txt",
      "expected": {"grade": "6-8", "card_count": 30, "formats": ["csv", "apkg", "tsv", "md"]},
      "assertions": [
        {"type": "csv_row_count_equals", "path": "deck.csv", "count": 30},
        {"type": "csv_no_row_matches", "path": "deck.csv", "column": "type", "regex": "cloze"},
        {"type": "csv_no_row_matches", "path": "deck.csv", "column": "front", "regex": "\\{\\{c1::"},
        {"type": "metadata_field_equals", "path": "metadata.json", "field": "grade", "value": "6-8"},
        {"type": "csv_column_max_len", "path": "deck.csv", "column": "front", "max": 200},
        {"type": "csv_column_max_len", "path": "deck.csv", "column": "back", "max": 400},
        {"type": "csv_column_unique_normalized", "path": "deck.csv", "column": "front"}
      ]
    },
    {
      "id": "eval-3-pdf-chapter",
      "prompt": "Turn this chapter into an Anki deck.",
      "attach_fixture": "tests/fixtures/sample.pdf",
      "expected": {"formats": ["csv", "apkg", "tsv", "md"]},
      "assertions": [
        {"type": "file_exists", "path": "deck.apkg"},
        {"type": "apkg_is_valid_zip_with_collection", "path": "deck.apkg"},
        {"type": "metadata_field_contains", "path": "metadata.json", "field": "source", "substring": "sample.pdf"},
        {"type": "csv_distinct_tag_count_at_least", "path": "deck.csv", "min": 3},
        {"type": "csv_row_count_at_least", "path": "deck.csv", "min": 15},
        {"type": "csv_sample_backs_substring_match_source", "path": "deck.csv", "source_text_fixture": "tests/fixtures/sample.pdf", "sample_size": 3}
      ]
    },
    {
      "id": "eval-4-cloze-only-bill-of-rights",
      "prompt": "Give me cloze flashcards on the Bill of Rights.",
      "expected": {"card_type": "cloze"},
      "assertions": [
        {"type": "csv_all_rows_match", "path": "deck.csv", "column": "front", "regex": "\\{\\{c1::"},
        {"type": "tsv_every_row_has_two_columns", "path": "deck.tsv"},
        {"type": "apkg_contains_notetype", "path": "deck.apkg", "notetype_substring": "Cloze"},
        {"type": "csv_row_count_between", "path": "deck.csv", "min": 10, "max": 30},
        {"type": "csv_distinct_cloze_subjects_at_least", "path": "deck.csv", "min": 10}
      ]
    },
    {
      "id": "eval-5-language-french-a2",
      "prompt": "Flashcards on French A2 irregular verbs, 40 cards.",
      "expected": {"level": "A2", "language": "fr", "card_count": 40},
      "assertions": [
        {"type": "csv_row_count_equals", "path": "deck.csv", "count": 40},
        {"type": "csv_every_row_regex", "path": "deck.csv", "column": "back", "regex": "[A-Za-zÀ-ÿ]+ [A-Za-zÀ-ÿ]+.*\\."},
        {"type": "metadata_field_equals", "path": "metadata.json", "field": "level", "value": "A2"},
        {"type": "metadata_field_equals", "path": "metadata.json", "field": "language", "value": "fr"},
        {"type": "tsv_is_parseable_two_cols", "path": "deck.tsv"},
        {"type": "csv_tags_include_all", "path": "deck.csv", "tags": ["french", "a2"]}
      ]
    }
  ]
}
```

- [ ] **Step 2: Validate JSON**

```bash
python -c "import json; json.load(open('skills/flashcards/evals/evals.json'))"
```
Expected: no output (valid JSON).

- [ ] **Step 3: Commit**

```bash
git add skills/flashcards/evals/evals.json
git commit -m "test(flashcards): 5 evals with objective assertions"
```

**Acceptance:** JSON parses; 5 evals each with ≥ 5 objective, machine-checkable assertions.

---

## Task 11: Eval harness smoke script

**Files:**
- Create: `skills/flashcards/evals/run_assertions.py`
- Test: `skills/flashcards/tests/test_run_assertions.py`

Purpose: let CI and the subagent validate assertions against a produced deck directory without re-running the model. The model produces a deck dir; this script checks it. Implements only the assertion types used in `evals.json`.

- [ ] **Step 1: Write failing test**

```python
import json
from pathlib import Path

from skills.flashcards.evals.run_assertions import run_assertions


def _make_deck(tmp_path: Path) -> Path:
    d = tmp_path / "flashcards-test-20260414-1200"
    d.mkdir()
    (d / "deck.csv").write_text(
        "front,back,tags,type,extra\n"
        "Capital of France?,Paris,geo capitals,basic,\n"
        "{{c1::Berlin}} is the capital of Germany.,,geo cloze,cloze,\n"
    )
    (d / "deck.tsv").write_text("Capital of France?\tParis\n_____ is the capital of Germany.\tBerlin\n")
    (d / "deck.md").write_text("# x\n")
    (d / "metadata.json").write_text(json.dumps({"grade": "9-12", "language": "en", "card_count": 2}))
    # dummy apkg (empty zip w/ collection placeholder)
    import zipfile
    with zipfile.ZipFile(d / "deck.apkg", "w") as z:
        z.writestr("collection.anki2", b"stub")
    return d


def test_assertions_pass_on_valid_deck(tmp_path):
    deck_dir = _make_deck(tmp_path)
    assertions = [
        {"type": "file_exists", "path": "deck.csv"},
        {"type": "csv_row_count_equals", "path": "deck.csv", "count": 2},
        {"type": "metadata_field_equals", "path": "metadata.json", "field": "grade", "value": "9-12"},
        {"type": "tsv_every_row_has_two_columns", "path": "deck.tsv"},
    ]
    result = run_assertions(deck_dir, assertions)
    assert result["passed"] == len(assertions)
    assert result["failed"] == 0


def test_assertion_failure_reports_detail(tmp_path):
    deck_dir = _make_deck(tmp_path)
    result = run_assertions(deck_dir, [{"type": "csv_row_count_equals", "path": "deck.csv", "count": 999}])
    assert result["failed"] == 1
    assert "999" in result["failures"][0]["detail"]
```

- [ ] **Step 2: Run — expect failure**

- [ ] **Step 3: Implement `run_assertions.py`**

Implement all assertion types used in `evals.json`. Pattern:

```python
"""Run eval assertions against a produced flashcards deck directory."""
from __future__ import annotations

import csv
import json
import re
import zipfile
from pathlib import Path


def _csv_rows(deck_dir: Path, path: str) -> list[dict]:
    with (deck_dir / path).open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


HANDLERS = {}

def handler(name):
    def deco(fn):
        HANDLERS[name] = fn
        return fn
    return deco


@handler("file_exists")
def _file_exists(deck_dir, a):
    ok = (deck_dir / a["path"]).exists()
    return ok, f"{a['path']} exists={ok}"


@handler("csv_row_count_equals")
def _csv_row_count_equals(deck_dir, a):
    n = len(_csv_rows(deck_dir, a["path"]))
    return n == a["count"], f"rows={n} expected={a['count']}"


@handler("csv_row_count_between")
def _csv_row_count_between(deck_dir, a):
    n = len(_csv_rows(deck_dir, a["path"]))
    return a["min"] <= n <= a["max"], f"rows={n} expected in [{a['min']},{a['max']}]"


@handler("csv_row_count_at_least")
def _csv_row_count_at_least(deck_dir, a):
    n = len(_csv_rows(deck_dir, a["path"]))
    return n >= a["min"], f"rows={n} expected>={a['min']}"


@handler("csv_has_header_cols")
def _csv_has_header_cols(deck_dir, a):
    rows = _csv_rows(deck_dir, a["path"])
    cols = set(rows[0].keys()) if rows else set()
    missing = [c for c in a["cols"] if c not in cols]
    return not missing, f"missing={missing}"


@handler("csv_any_row_matches")
def _csv_any_row_matches(deck_dir, a):
    rx = re.compile(a["regex"])
    rows = _csv_rows(deck_dir, a["path"])
    ok = any(rx.search(r.get(a["column"], "") or "") for r in rows)
    return ok, f"any({a['column']} ~ {a['regex']})={ok}"


@handler("csv_all_rows_match")
def _csv_all_rows_match(deck_dir, a):
    rx = re.compile(a["regex"])
    rows = _csv_rows(deck_dir, a["path"])
    ok = bool(rows) and all(rx.search(r.get(a["column"], "") or "") for r in rows)
    return ok, f"all({a['column']} ~ {a['regex']})={ok}"


@handler("csv_no_row_matches")
def _csv_no_row_matches(deck_dir, a):
    rx = re.compile(a["regex"])
    rows = _csv_rows(deck_dir, a["path"])
    ok = not any(rx.search(r.get(a["column"], "") or "") for r in rows)
    return ok, f"no({a['column']} ~ {a['regex']})={ok}"


@handler("csv_column_max_len")
def _csv_column_max_len(deck_dir, a):
    rows = _csv_rows(deck_dir, a["path"])
    actual = max((len(r.get(a["column"], "") or "") for r in rows), default=0)
    return actual <= a["max"], f"max({a['column']})={actual} limit={a['max']}"


@handler("csv_column_unique_normalized")
def _csv_column_unique_normalized(deck_dir, a):
    rows = _csv_rows(deck_dir, a["path"])
    norms = [re.sub(r"\s+", " ", (r.get(a["column"], "") or "").strip().lower()) for r in rows]
    ok = len(norms) == len(set(norms))
    return ok, f"unique={ok} (n={len(norms)}, distinct={len(set(norms))})"


@handler("csv_tags_include_all")
def _csv_tags_include_all(deck_dir, a):
    rows = _csv_rows(deck_dir, a["path"])
    seen: set[str] = set()
    for r in rows:
        seen.update((r.get("tags") or "").split())
    missing = [t for t in a["tags"] if t not in seen]
    return not missing, f"missing_tags={missing}"


@handler("csv_distinct_tag_count_at_least")
def _csv_distinct_tag_count_at_least(deck_dir, a):
    rows = _csv_rows(deck_dir, a["path"])
    seen: set[str] = set()
    for r in rows:
        seen.update((r.get("tags") or "").split())
    return len(seen) >= a["min"], f"distinct_tags={len(seen)} min={a['min']}"


@handler("csv_every_row_regex")
def _csv_every_row_regex(deck_dir, a):
    rx = re.compile(a["regex"])
    rows = _csv_rows(deck_dir, a["path"])
    ok = bool(rows) and all(rx.search(r.get(a["column"], "") or "") for r in rows)
    return ok, f"every_row({a['column']} ~ {a['regex']})={ok}"


@handler("csv_distinct_cloze_subjects_at_least")
def _csv_distinct_cloze_subjects_at_least(deck_dir, a):
    rx = re.compile(r"\{\{c\d+::(.+?)(?:::.*?)?\}\}")
    rows = _csv_rows(deck_dir, a["path"])
    subjects = set()
    for r in rows:
        for m in rx.findall(r.get("front", "") or ""):
            subjects.add(m.strip().lower())
    return len(subjects) >= a["min"], f"cloze_subjects={len(subjects)} min={a['min']}"


@handler("csv_sample_backs_substring_match_source")
def _csv_sample_backs(deck_dir, a):
    src = Path(a["source_text_fixture"])
    if src.suffix == ".pdf":
        from pypdf import PdfReader
        text = "\n".join((p.extract_text() or "") for p in PdfReader(str(src)).pages).lower()
    else:
        text = src.read_text(encoding="utf-8", errors="replace").lower()
    rows = _csv_rows(deck_dir, a["path"])
    import random
    sample = random.sample(rows, min(a["sample_size"], len(rows)))
    hits = sum(1 for r in sample if (r.get("back", "") or "")[:20].lower() in text)
    return hits >= max(1, a["sample_size"] - 1), f"substring_hits={hits}/{len(sample)}"


@handler("tsv_every_row_has_two_columns")
def _tsv_two_cols(deck_dir, a):
    lines = (deck_dir / a["path"]).read_text(encoding="utf-8").splitlines()
    ok = bool(lines) and all(len(l.split("\t")) == 2 for l in lines)
    return ok, f"tsv rows={len(lines)} all_two_cols={ok}"


@handler("tsv_is_parseable_two_cols")
def _tsv_parseable(deck_dir, a):
    return _tsv_two_cols(deck_dir, a)


@handler("apkg_is_valid_zip_with_collection")
def _apkg_valid(deck_dir, a):
    p = deck_dir / a["path"]
    if not p.exists():
        return False, "apkg missing"
    try:
        with zipfile.ZipFile(p) as z:
            has = any(n.startswith("collection.anki") for n in z.namelist())
        return has, f"collection.anki present={has}"
    except zipfile.BadZipFile:
        return False, "not a valid zip"


@handler("apkg_contains_notetype")
def _apkg_notetype(deck_dir, a):
    import sqlite3, tempfile
    with zipfile.ZipFile(deck_dir / a["path"]) as z:
        col = next((n for n in z.namelist() if n.startswith("collection.anki")), None)
        if not col:
            return False, "no collection"
        with tempfile.TemporaryDirectory() as td:
            z.extract(col, td)
            db = sqlite3.connect(f"{td}/{col}")
            try:
                rows = [r[0] for r in db.execute("SELECT name FROM notetypes")]
            except sqlite3.OperationalError:
                row = db.execute("SELECT models FROM col").fetchone()
                rows = [m["name"] for m in json.loads(row[0]).values()]
            db.close()
    ok = any(a["notetype_substring"] in n for n in rows)
    return ok, f"notetypes={rows}"


@handler("metadata_field_equals")
def _meta_eq(deck_dir, a):
    meta = json.loads((deck_dir / a["path"]).read_text())
    return meta.get(a["field"]) == a["value"], f"{a['field']}={meta.get(a['field'])!r} expected={a['value']!r}"


@handler("metadata_field_contains")
def _meta_contains(deck_dir, a):
    meta = json.loads((deck_dir / a["path"]).read_text())
    val = str(meta.get(a["field"], ""))
    return a["substring"] in val, f"{a['field']}={val!r} ~ {a['substring']!r}"


def run_assertions(deck_dir: Path | str, assertions: list[dict]) -> dict:
    deck_dir = Path(deck_dir)
    passed = 0
    failures = []
    for a in assertions:
        h = HANDLERS.get(a["type"])
        if not h:
            failures.append({"assertion": a, "detail": f"unknown assertion type: {a['type']}"})
            continue
        try:
            ok, detail = h(deck_dir, a)
        except Exception as e:
            ok, detail = False, f"{type(e).__name__}: {e}"
        if ok:
            passed += 1
        else:
            failures.append({"assertion": a, "detail": detail})
    return {"passed": passed, "failed": len(failures), "failures": failures}


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("deck_dir", type=Path)
    p.add_argument("evals_json", type=Path)
    p.add_argument("--id", help="Run a single eval by id")
    args = p.parse_args()
    evals = json.loads(args.evals_json.read_text())["evals"]
    if args.id:
        evals = [e for e in evals if e["id"] == args.id]
    all_ok = True
    for e in evals:
        r = run_assertions(args.deck_dir, e["assertions"])
        print(f"{e['id']}: {r['passed']} passed, {r['failed']} failed")
        for f in r["failures"]:
            print(f"  - {f['assertion']['type']}: {f['detail']}")
        all_ok &= r["failed"] == 0
    raise SystemExit(0 if all_ok else 1)
```

- [ ] **Step 4: Run — expect pass**

```bash
pytest skills/flashcards/tests/test_run_assertions.py -v
```

- [ ] **Step 5: Commit**

```bash
git add skills/flashcards/evals/run_assertions.py skills/flashcards/tests/test_run_assertions.py
git commit -m "test(flashcards): assertion harness for eval deck verification"
```

**Acceptance:** Tests pass. Harness supports every assertion `type` used in `evals.json`. CLI returns non-zero on any failure.

---

## Task 12: Final self-review pass

**Files:**
- None (review only; open follow-up tasks if gaps found).

- [ ] **Step 1: Spec coverage check**

For each section of `2026-04-14-flashcards-design.md`, confirm:
- Section 1 Purpose — covered by SKILL.md intro.
- Section 2 Triggers — all 12 example phrasings present or paraphrased in `description`.
- Section 3 Inputs — all 6 input types documented + scripts for URL/PDF exist; image + transcript handled inline by model.
- Section 4 Outputs — all 5 files produced by `make_deck.py`.
- Section 5 Workflow — 12 steps mapped to scripts + references.
- Section 6 Bundled scripts — 5 scripts present: `anki_export.py` (shim), `make_deck.py`, `pdf_extract.py`, `url_fetch.py`, `dedupe.py`.
- Section 7 References — 7 files present.
- Section 8 Grade calibration — full table in `references/grade-calibration.md`.
- Section 9 Evals — 5 evals, objective assertions.
- Section 10 Edge cases — cheat-sheet in SKILL.md; `apkg` failure path unit-tested (Task 5).
- Section 11 Open questions — resolved in header of this plan.

- [ ] **Step 2: Line-count check**

```bash
wc -l skills/flashcards/SKILL.md
for f in skills/flashcards/references/*.md; do wc -l "$f"; done
```
Expect `SKILL.md < 300`, each reference ≤ ~120.

- [ ] **Step 3: Trigger-coverage check**

Manually verify that the `description` field in `SKILL.md` covers both:
- Teacher phrasing ("make me flashcards on X", "turn this chapter into an Anki deck").
- Student phrasing ("study cards for my test", "flashcard this for me").
- With and without a file format keyword (`.apkg`, `Quizlet`, `CSV` vs. none).

- [ ] **Step 4: Run the full suite**

```bash
pytest skills/flashcards/tests/ -v
```
Expect: all tests pass (Tasks 2, 3, 4, 5, 6, 7, 11).

- [ ] **Step 5: End-to-end dry run with the fixture**

```bash
python -m skills.flashcards.scripts.make_deck skills/flashcards/tests/fixtures/sample_cards.json /tmp/deck-e2e --formats csv,tsv,md,apkg
python skills/flashcards/evals/run_assertions.py /tmp/deck-e2e skills/flashcards/evals/evals.json --id eval-1-topic-default || true
```
(Eval-1 needs ≥20 cards; the fixture has 3, so some assertions will fail — that's expected. Confirms the harness wiring runs.)

- [ ] **Step 6: Commit any fixes**

```bash
git add -A && git commit -m "chore(flashcards): self-review pass" || echo "clean"
```

**Acceptance:** Full test suite green; spec coverage documented; description triggers verified; SKILL.md < 300 lines.

---

## Appendix: Rationale for non-obvious decisions

1. **`shared/scripts/anki_export.py` and the in-skill shim.** Master spec says the `.apkg` builder is cross-skill shared. Graduation-readiness (spec Q11) wants clean module boundaries. The shim gives subagents a local import path without losing the single source of truth.
2. **`genanki` over hand-rolled apkg.** `genanki` is MIT, widely used, and handles the `collection.anki2` SQLite schema correctly. Rolling our own is weeks of work and brittle across Anki versions.
3. **Graceful apkg failure.** CSV is always enough to recover in Anki via File→Import. Never lose the user's data on a library crash (spec Section 10).
4. **Vision-first OCR.** Host Claude already does great vision OCR. Avoiding `ocrmypdf`/`pytesseract` by default keeps install light and cross-platform.
5. **`cloze-sentence-with-blank` for Quizlet flattening.** Preserves context on the term side; matches how Quizlet users actually learn.
6. **No merge on regeneration (V1).** Net-new timestamped dirs are predictable and avoid ambiguous "which card won" semantics. `metadata.json` captures source to enable V2 merge logic later.
7. **Assertion harness as a small script.** Evals need to be runnable by CI and subagents without re-invoking the model; separating "produce deck" from "verify deck" makes both loops fast.
