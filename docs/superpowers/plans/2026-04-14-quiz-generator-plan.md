# quiz-generator Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the `quiz-generator` skill inside the `school-skills` mega-plugin — producing assessment-grade quizzes (MC, SA, T/F, cloze, matching, essay) from topic/notes/URL/PDF/photo input, rendered to markdown, printable PDF, Google Forms CSV, and Kahoot CSV from a single internal JSON representation.

**Architecture:** A progressive-disclosure SKILL.md instructs Claude to produce a `quiz.schema.json` intermediate representation, then call pure-Python renderer scripts for each output format. PDF rendering uses the shared Playwright-based `shared/scripts/pdf_render.py`. Each renderer is idempotent, consumes the same JSON, and has deterministic output that makes evals objective.

**Tech Stack:** Python 3.11+ (renderers + validators), Jinja2 (HTML/markdown templates), Playwright via `shared/scripts/pdf_render.py`, KaTeX for math, pytest for script tests, stdlib `csv` for Google Forms + Kahoot exports, `jsonschema` for validation.

---

## File Structure

```
skills/quiz-generator/
├── SKILL.md                                   # <300 lines, progressive disclosure
├── quiz.schema.json                           # JSON Schema for the intermediate representation
├── scripts/
│   ├── validate_quiz.py                       # lints quiz.json (must pass before any renderer)
│   ├── render_markdown.py                     # quiz.json -> .md (+ optional separate answer file)
│   ├── render_google_forms_csv.py             # quiz.json -> Google Forms CSV
│   ├── render_kahoot_csv.py                   # quiz.json -> Kahoot CSV (warns on truncation)
│   ├── render_pdf.py                          # quiz.json -> HTML -> shared/scripts/pdf_render.py
│   └── _common.py                             # shared helpers: slug, load/dump json, schema load
├── references/
│   ├── question-type-best-practices.md
│   ├── answer-distractor-heuristics.md
│   ├── blooms-alignment.md
│   ├── grade-level-calibration.md
│   ├── rubric-templates.md
│   ├── google-forms-import.md
│   └── kahoot-import.md
├── templates/
│   ├── quiz.html                              # student-facing (answers hidden)
│   └── quiz-answer-key.html                   # teacher-facing
├── evals/
│   ├── evals.json                             # 5 prompts + assertions
│   └── fixtures/
│       ├── eigenvectors.pdf                   # fixture for Eval 4
│       └── sample_notes.md                    # fixture for Eval 5
└── tests/
    ├── test_validate_quiz.py
    ├── test_render_markdown.py
    ├── test_render_google_forms_csv.py
    ├── test_render_kahoot_csv.py
    └── test_render_pdf.py

shared/
├── scripts/
│   └── pdf_render.py                          # (assumed pre-existing) Playwright HTML -> PDF
└── templates/                                 # (no quiz template here — lives in skill dir)
```

**Dependencies** (add to repo-root `requirements-dev.txt` or skill-local `pyproject.toml`):
- `jsonschema>=4.21`
- `jinja2>=3.1`
- `pytest>=8.0`
- `playwright>=1.42` (already pulled in by `shared/scripts/pdf_render.py`)
- (no KaTeX python dep — load via CDN `<script>` in the HTML template, rendered at PDF time by the headless browser)

---

## SKILL.md Outline

Target: under 300 lines. Sections in this order:

1. **Frontmatter** — `name: quiz-generator`, pushy 60-80 word `description` listing trigger phrases from both teachers ("generate a 20-question multiple choice quiz on…") and students ("quiz me on this", "turn these notes into practice questions"), allowed `tools`.
2. **When to use this skill** — 8-10 concrete trigger examples split Teacher/Student × Formal/Casual.
3. **Inputs accepted** — bullet list: topic string, pasted notes, URL, PDF, photo (OCR), or a mix. One-line note that the skill asks a single clarifying question if `source` ambiguous.
4. **Configuration parameters** — table with defaults: `num_questions=10`, `question_types=["multiple_choice","short_answer","true_false"]`, `grade_level=9-12`, `difficulty_mix=balanced`, `blooms_mix` (grade-banded default), `output_formats=["markdown"]`, `answer_key="appended"|"separate_file"|"hidden"`, `kahoot_time_limit=20`.
5. **Workflow** — the 8-step loop (parse → ingest → plan slate → generate items → self-critique → assemble JSON → render → report). Each step one paragraph. Self-critique bullet list inline (unambiguous correct, plausible distractors, complete stem, no double-negatives, reading level matches band).
6. **Intermediate representation** — one-sentence explanation that every output is rendered from a single `quiz.json` file matching `quiz.schema.json`, with a minimal example object. Instruct: **always write `quiz.json` first, always run `scripts/validate_quiz.py` against it, then call renderer scripts.**
7. **Output formats + which script to call** — table:
   | format | script | output filename |
   |---|---|---|
   | markdown | `scripts/render_markdown.py` | `quiz-<slug>-<YYYYMMDD>.md` |
   | google_forms_csv | `scripts/render_google_forms_csv.py` | `quiz-<slug>-google-forms.csv` |
   | kahoot_csv | `scripts/render_kahoot_csv.py` | `quiz-<slug>-kahoot.csv` |
   | pdf | `scripts/render_pdf.py` | `quiz-<slug>.pdf` + `quiz-<slug>-answer-key.pdf` |
8. **Deep-dive references (load on demand)** — one-line pointer per file in `references/`. Explicit: "Load these only when the question the user asked requires that specific knowledge."
9. **Edge cases + failure modes** — 10 bullets mirroring spec §10 (missing source, too-broad topic, sparse source, OCR failure, non-English, math notation, dupes, Kahoot truncation, sensitive topics, copyright) — each with the one-line action to take.
10. **Grade-level calibration cheat sheet** — compact 6-row table pointer + "see `references/grade-level-calibration.md` for full spec."
11. **How to run evals** — one-liner: `pytest skills/quiz-generator/tests/` for script tests; `evals/evals.json` is consumed by the repo-level eval harness.

---

## scripts/ contents

### `_common.py`
Helpers reused by every renderer:
- `load_quiz(path) -> dict` — read + jsonschema-validate against `quiz.schema.json`, raise `QuizValidationError` with readable diagnostics on failure.
- `slug(title: str) -> str` — lowercase, hyphenated, stripped of non-alnum, max 40 chars.
- `today_yyyymmdd() -> str`.
- `ensure_output_dir(path)`.
- `QuizValidationError(Exception)`.

### `validate_quiz.py`
CLI: `python validate_quiz.py --input quiz.json`.
Checks:
1. JSON Schema conformance (structure + enum fields).
2. `questions` has ≥1 entry; unique `id` values.
3. Every MC item: 3 ≤ `len(options)` ≤ 5; exactly one `correct` value; `correct` appears verbatim in `options`.
4. Every T/F item: `options == ["True", "False"]`; `correct ∈ {"True","False"}`.
5. Every cloze item: stem contains `______` (6+ underscores).
6. Every matching item: `options` non-empty and `correct` is a list of pairings of equal length.
7. Every essay item: `correct is None` and `rubric` present with `len(rubric) >= 3`.
8. No duplicate-stem detection (exact-match; fuzzy dedup left to the model at generation time).
Exits non-zero on first violation with `jq`-friendly path (e.g. `questions[4].options`).

### `render_markdown.py`
CLI: `python render_markdown.py --input quiz.json --output quiz.md [--answer-mode appended|separate|hidden]`.
- Emits `# <title>` header with grade/time/total points line.
- Renders each question in spec §4.1 format, tagging `[Type, N pts, Bloom: X]`.
- `appended`: single file, answer key as trailing section.
- `separate`: writes `quiz.md` + sibling `quiz-answers.md`; quiz body has no answers.
- `hidden`: single file using `<details><summary>Show answer</summary>…</details>` per question.
- Math passthrough: stems with `$…$` left untouched.

### `render_google_forms_csv.py`
CLI: `python render_google_forms_csv.py --input quiz.json --output quiz-google-forms.csv`.
- Header row exactly: `Question,Question Type,Option 1,Option 2,Option 3,Option 4,Option 5,Correct Answer,Points,Feedback for Correct Answer,Feedback for Incorrect Answer,Required`.
- Type map: `multiple_choice→MULTIPLE_CHOICE`, `short_answer→SHORT_ANSWER`, `true_false→TRUE_FALSE`, `cloze→SHORT_ANSWER` (stem left with `_____`), `matching→DROPDOWN` (one row per left-term), `essay→PARAGRAPH` (blank Correct Answer).
- `Correct Answer` is option text (not letter) for MC.
- CSV written via stdlib `csv.writer` with QUOTE_MINIMAL.
- `Required` column always `TRUE`.

### `render_kahoot_csv.py`
CLI: `python render_kahoot_csv.py --input quiz.json --output quiz-kahoot.csv [--time-limit 20]`.
- Header exactly: `Question,Answer 1,Answer 2,Answer 3,Answer 4,Time limit (sec),Correct answer(s)`.
- Skips non-MC items with a `WARN: skipped item N (type=X)` log to stderr.
- Enforces 120-char question, 75-char answer caps; on truncation, logs per-item warning and exits 0 but prints a trailing summary line: `TRUNCATED: N items` to stderr.
- `Correct answer(s)` is 1-indexed option number(s).

### `render_pdf.py`
CLI: `python render_pdf.py --input quiz.json --output quiz.pdf [--variant student|answer-key]`.
- Loads the matching Jinja template from `skills/quiz-generator/templates/`.
- Renders HTML to a temp file, shells out to `shared/scripts/pdf_render.py --html <tmp> --output <pdf>`.
- KaTeX is loaded via CDN `<script>` in the template; the headless browser executes it before PDF is captured (add a small "wait for KaTeX ready" hook in the template).
- Must write **both** PDFs when `--variant all` (default): `quiz-<slug>.pdf` (student) and `quiz-<slug>-answer-key.pdf` (teacher).

---

## references/ contents

Each file is 100-250 lines, markdown, loaded only when needed.

- **`question-type-best-practices.md`** — one subsection per type: when to use, stem construction rules, option rules, common pitfalls, 2-3 good/bad examples per type.
- **`answer-distractor-heuristics.md`** — distractor taxonomy (common misconception, off-by-one, near-synonym, partially-correct-missing-qualifier), parallel grammatical form rule, length parity, ban-list ("all of the above", "none of the above", "both A and B"), randomized correct-answer position.
- **`blooms-alignment.md`** — verb-cue table per level, grade-band default `blooms_mix` (e.g. K-2 → 80% Remember / 20% Understand; 9-12 → 10/20/30/25/10/5).
- **`grade-level-calibration.md`** — full table from spec §8 plus prose on distractor subtlety per band, essay prompt scaling, T/F discouragement above 6-8.
- **`rubric-templates.md`** — boilerplate 4-level rubrics (Exemplary/Proficient/Developing/Beginning) for SA (2 variants) and essay (3 variants: describe, compare, evaluate).
- **`google-forms-import.md`** — exact column spec, step-by-step Forms "Import questions" add-on procedure, FAQ (Forms collapses duplicate options, UTF-8-BOM needed? no).
- **`kahoot-import.md`** — exact Kahoot template spec, 120/75 char limits, 2-4 options only, supported correct-answer formats, gotcha: Kahoot rejects empty answer columns (emit "—" placeholder and warn).

---

## evals/evals.json

```json
{
  "skill": "quiz-generator",
  "harness_version": "1",
  "cases": [
    {
      "id": "eval-1-basic-mc",
      "prompt": "Generate a 10-question multiple choice quiz on the water cycle for 5th grade.",
      "inputs": {},
      "assertions": [
        {"type": "file_exists", "glob": "quiz-*.md"},
        {"type": "quiz_json_field", "path": "$.questions.length", "op": "==", "value": 10},
        {"type": "quiz_json_all", "path": "$.questions[*].type", "op": "==", "value": "multiple_choice"},
        {"type": "quiz_json_all", "path": "$.questions[*].options.length", "op": "==", "value": 4},
        {"type": "quiz_json_all", "path": "$.questions[*].correct", "op": "in_options"},
        {"type": "markdown_section_present", "heading": "Answer Key"},
        {"type": "flesch_kincaid_grade", "op": "<=", "value": 5.5}
      ]
    },
    {
      "id": "eval-2-mixed-unit-test",
      "prompt": "Create a 20-question unit test on cell biology for 10th grade: 10 MC, 5 short answer, 3 true/false, 2 essay. Output markdown and PDF.",
      "inputs": {},
      "assertions": [
        {"type": "quiz_json_field", "path": "$.questions.length", "op": "==", "value": 20},
        {"type": "quiz_json_type_counts", "value": {"multiple_choice": 10, "short_answer": 5, "true_false": 3, "essay": 2}},
        {"type": "file_exists", "glob": "quiz-*.pdf"},
        {"type": "file_exists", "glob": "quiz-*-answer-key.pdf"},
        {"type": "pdf_page_count", "glob": "quiz-*.pdf", "op": ">=", "value": 1},
        {"type": "pdf_valid", "glob": "quiz-*-answer-key.pdf"},
        {"type": "quiz_json_all", "path": "$.questions[?(@.type=='essay')].rubric.length", "op": ">=", "value": 3},
        {"type": "quiz_json_distinct_count", "path": "$.questions[*].blooms", "op": ">=", "value": 3}
      ]
    },
    {
      "id": "eval-3-google-forms-csv",
      "prompt": "Build a 15-question quiz on the French Revolution for 9th grade and give me the Google Forms CSV.",
      "inputs": {},
      "assertions": [
        {"type": "file_exists", "glob": "quiz-*-google-forms.csv"},
        {"type": "csv_header_exact", "glob": "quiz-*-google-forms.csv", "header": "Question,Question Type,Option 1,Option 2,Option 3,Option 4,Option 5,Correct Answer,Points,Feedback for Correct Answer,Feedback for Incorrect Answer,Required"},
        {"type": "csv_row_count", "glob": "quiz-*-google-forms.csv", "op": "==", "value": 16},
        {"type": "csv_column_enum", "glob": "quiz-*-google-forms.csv", "column": "Question Type", "allowed": ["MULTIPLE_CHOICE","CHECKBOXES","SHORT_ANSWER","PARAGRAPH","TRUE_FALSE","DROPDOWN"]},
        {"type": "csv_mc_correct_matches_option", "glob": "quiz-*-google-forms.csv"}
      ]
    },
    {
      "id": "eval-4-from-pdf-college",
      "prompt": "Here is a lecture PDF on linear algebra eigenvectors (attached). Generate a 10-question college-level quiz with 60% apply-level Bloom's.",
      "inputs": {"attachments": ["evals/fixtures/eigenvectors.pdf"]},
      "assertions": [
        {"type": "quiz_json_field", "path": "$.questions.length", "op": "==", "value": 10},
        {"type": "quiz_json_count_where", "path": "$.questions[*].blooms", "in": ["Apply","Analyze"], "op": ">=", "value": 6},
        {"type": "source_keyword_overlap", "source": "evals/fixtures/eigenvectors.pdf", "min_ratio": 0.8},
        {"type": "no_extraneous_concepts", "source": "evals/fixtures/eigenvectors.pdf", "banlist": ["determinant beyond 3x3","Jordan form","SVD"]}
      ]
    },
    {
      "id": "eval-5-student-self-test-hidden",
      "prompt": "Quiz me on these notes — hide the answers until I ask for them.",
      "inputs": {"inline_notes_file": "evals/fixtures/sample_notes.md"},
      "assertions": [
        {"type": "markdown_section_absent_inline", "heading": "Answer Key"},
        {"type": "answer_key_hidden_or_separate", "glob_options": ["quiz-*-answers.md"], "alt_html_tag": "<details>"},
        {"type": "quiz_json_field", "path": "$.questions.length", "op": "==", "value": 10},
        {"type": "quiz_json_distinct_count", "path": "$.questions[*].type", "op": ">=", "value": 3},
        {"type": "response_mentions_reveal_instruction", "keywords": ["reveal","show answers","ask me"]}
      ]
    }
  ]
}
```

---

## Ordered Tasks

### Task 1: Scaffold skill directory + SKILL.md frontmatter

**Files:**
- Create: `skills/quiz-generator/SKILL.md`
- Create: `skills/quiz-generator/quiz.schema.json`
- Create: `skills/quiz-generator/scripts/__init__.py` (empty)
- Create: `skills/quiz-generator/tests/__init__.py` (empty)

- [ ] **Step 1: Write SKILL.md frontmatter + outline stubs**

Frontmatter block (YAML) with `name`, pushy 60-80 word `description` containing both teacher and student trigger phrases, and `tools: Read,Write,Edit,Bash,Glob,Grep`. Then all 11 section headers from the outline above, each with a one-line placeholder comment that **will be filled in later tasks** — do not leave any section purely empty; include the first paragraph of prose for each so reviewers can scan the structure.

- [ ] **Step 2: Commit**

```bash
git add skills/quiz-generator/SKILL.md skills/quiz-generator/scripts/__init__.py skills/quiz-generator/tests/__init__.py
git commit -m "feat(quiz-generator): scaffold skill directory"
```

**Acceptance:** `SKILL.md` parses as valid YAML frontmatter; description between 60 and 80 words; section headers match outline.

---

### Task 2: Author `quiz.schema.json`

**Files:**
- Create: `skills/quiz-generator/quiz.schema.json`

- [ ] **Step 1: Write full JSON Schema**

Schema covers spec §4.5 exactly: top-level `title`, `grade_level` (enum of the 6 bands), `estimated_minutes` (int), `total_points` (int), `questions[]`. Each question has `id` (int, unique), `type` (6-way enum), `stem` (str), `options` (array[str] nullable), `correct` (str | array[str] | null), `points` (int), `blooms` (6-way enum), `difficulty` (3-way enum), `rationale` (str), `rubric` (array of `{level, points, criteria}` or null). `additionalProperties: false` at every level.

- [ ] **Step 2: Verify the schema loads under `jsonschema`**

Run: `python -c "import json,jsonschema; jsonschema.Draft202012Validator.check_schema(json.load(open('skills/quiz-generator/quiz.schema.json')))"`
Expected: no output, exit 0.

- [ ] **Step 3: Commit**

```bash
git add skills/quiz-generator/quiz.schema.json
git commit -m "feat(quiz-generator): add quiz.schema.json intermediate representation"
```

**Acceptance:** Schema validates as draft-2020-12; every field from spec §4.5 represented; enums exact.

---

### Task 3: `scripts/_common.py` + tests

**Files:**
- Create: `skills/quiz-generator/scripts/_common.py`
- Create: `skills/quiz-generator/tests/test_common.py`

- [ ] **Step 1: Write failing tests for `slug`, `today_yyyymmdd`, `load_quiz`**

```python
# tests/test_common.py
import json, pytest
from pathlib import Path
from scripts._common import slug, today_yyyymmdd, load_quiz, QuizValidationError

def test_slug_basic():
    assert slug("Causes of WWI!") == "causes-of-wwi"

def test_slug_truncates_to_40():
    assert len(slug("x" * 200)) == 40

def test_today_yyyymmdd_format():
    s = today_yyyymmdd()
    assert len(s) == 8 and s.isdigit()

def test_load_quiz_rejects_missing_field(tmp_path):
    bad = tmp_path / "q.json"
    bad.write_text(json.dumps({"title": "x"}))  # missing everything else
    with pytest.raises(QuizValidationError):
        load_quiz(bad)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest skills/quiz-generator/tests/test_common.py -v`
Expected: 4 failures (ImportError).

- [ ] **Step 3: Implement `_common.py`**

Write helpers per "scripts/ contents → `_common.py`" above. `load_quiz` loads JSON, finds schema at `skills/quiz-generator/quiz.schema.json` relative to this file, validates with `jsonschema.Draft202012Validator`, raises `QuizValidationError` wrapping the first `ValidationError` with the `json_path`.

- [ ] **Step 4: Run tests to verify pass**

Run: `pytest skills/quiz-generator/tests/test_common.py -v`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add skills/quiz-generator/scripts/_common.py skills/quiz-generator/tests/test_common.py
git commit -m "feat(quiz-generator): add _common helpers"
```

**Acceptance:** All four tests pass; `slug` is deterministic; `load_quiz` raises structured error with json path.

---

### Task 4: `validate_quiz.py` + tests

**Files:**
- Create: `skills/quiz-generator/scripts/validate_quiz.py`
- Create: `skills/quiz-generator/tests/test_validate_quiz.py`
- Create: `skills/quiz-generator/tests/fixtures/valid_quiz.json`
- Create: `skills/quiz-generator/tests/fixtures/mc_missing_correct.json`

- [ ] **Step 1: Write fixtures**

`valid_quiz.json`: 3 items (one MC, one T/F, one essay with 4-level rubric). All fields present.
`mc_missing_correct.json`: same as valid but the MC item's `correct` string does not appear in any of its `options`.

- [ ] **Step 2: Write failing tests**

```python
# tests/test_validate_quiz.py
import subprocess, sys
from pathlib import Path

SCRIPT = Path("skills/quiz-generator/scripts/validate_quiz.py")

def test_valid_passes():
    r = subprocess.run([sys.executable, SCRIPT, "--input", "skills/quiz-generator/tests/fixtures/valid_quiz.json"], capture_output=True, text=True)
    assert r.returncode == 0, r.stderr

def test_mc_correct_not_in_options_fails():
    r = subprocess.run([sys.executable, SCRIPT, "--input", "skills/quiz-generator/tests/fixtures/mc_missing_correct.json"], capture_output=True, text=True)
    assert r.returncode != 0
    assert "questions[" in r.stderr
    assert "correct" in r.stderr.lower()
```

- [ ] **Step 3: Run to confirm failure**

Run: `pytest skills/quiz-generator/tests/test_validate_quiz.py -v`
Expected: 2 failures.

- [ ] **Step 4: Implement `validate_quiz.py`**

CLI with `argparse`: `--input PATH`. Calls `_common.load_quiz` (which runs schema check), then the 8 structural checks from the scripts section. On any violation, print `questions[i].field: <message>` to stderr, exit 1. On success, print `OK: <n> questions valid` to stdout, exit 0.

- [ ] **Step 5: Run tests, verify pass**

Run: `pytest skills/quiz-generator/tests/test_validate_quiz.py -v`
Expected: 2 passed.

- [ ] **Step 6: Commit**

```bash
git add skills/quiz-generator/scripts/validate_quiz.py skills/quiz-generator/tests/test_validate_quiz.py skills/quiz-generator/tests/fixtures/
git commit -m "feat(quiz-generator): add validate_quiz.py with structural checks"
```

**Acceptance:** Script exits 0 on valid fixture and 1 on invalid, printing a jq-style path.

---

### Task 5: `render_markdown.py` + tests

**Files:**
- Create: `skills/quiz-generator/scripts/render_markdown.py`
- Create: `skills/quiz-generator/tests/test_render_markdown.py`

- [ ] **Step 1: Write failing tests**

```python
# tests/test_render_markdown.py
import subprocess, sys, pathlib

SCRIPT = "skills/quiz-generator/scripts/render_markdown.py"
FIX = "skills/quiz-generator/tests/fixtures/valid_quiz.json"

def test_appended_mode(tmp_path):
    out = tmp_path / "q.md"
    subprocess.run([sys.executable, SCRIPT, "--input", FIX, "--output", str(out), "--answer-mode", "appended"], check=True)
    text = out.read_text()
    assert "# " in text
    assert "## Answer Key" in text
    assert "### 1." in text

def test_separate_mode(tmp_path):
    out = tmp_path / "q.md"
    subprocess.run([sys.executable, SCRIPT, "--input", FIX, "--output", str(out), "--answer-mode", "separate"], check=True)
    assert out.exists()
    assert (tmp_path / "q-answers.md").exists()
    assert "## Answer Key" not in out.read_text()

def test_hidden_mode(tmp_path):
    out = tmp_path / "q.md"
    subprocess.run([sys.executable, SCRIPT, "--input", FIX, "--output", str(out), "--answer-mode", "hidden"], check=True)
    text = out.read_text()
    assert "<details>" in text
    assert "## Answer Key" not in text
```

- [ ] **Step 2: Run to confirm failure**

Run: `pytest skills/quiz-generator/tests/test_render_markdown.py -v`
Expected: 3 failures.

- [ ] **Step 3: Implement `render_markdown.py`**

`argparse` for `--input`, `--output`, `--answer-mode {appended,separate,hidden}` (default appended). Loads via `_common.load_quiz`. Builds markdown per §4.1; `appended` concatenates answer section; `separate` writes answers to sibling `<stem>-answers.md`; `hidden` wraps each answer in `<details><summary>Show answer</summary>…</details>` placed immediately under each question.

- [ ] **Step 4: Run tests, verify pass**

Run: `pytest skills/quiz-generator/tests/test_render_markdown.py -v`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add skills/quiz-generator/scripts/render_markdown.py skills/quiz-generator/tests/test_render_markdown.py
git commit -m "feat(quiz-generator): add render_markdown with appended/separate/hidden modes"
```

**Acceptance:** All three answer modes produce files matching spec §4.1.

---

### Task 6: `render_google_forms_csv.py` + tests

**Files:**
- Create: `skills/quiz-generator/scripts/render_google_forms_csv.py`
- Create: `skills/quiz-generator/tests/test_render_google_forms_csv.py`
- Create: `skills/quiz-generator/tests/fixtures/mixed_20_quiz.json` (10 MC, 5 SA, 3 T/F, 2 essay — reused for later tasks)

- [ ] **Step 1: Write fixture `mixed_20_quiz.json`**

20 items with exact type distribution {MC:10, SA:5, TF:3, essay:2}. Essays carry a 4-level rubric.

- [ ] **Step 2: Write failing tests**

```python
import subprocess, sys, csv

SCRIPT = "skills/quiz-generator/scripts/render_google_forms_csv.py"
FIX = "skills/quiz-generator/tests/fixtures/mixed_20_quiz.json"
HEADER = "Question,Question Type,Option 1,Option 2,Option 3,Option 4,Option 5,Correct Answer,Points,Feedback for Correct Answer,Feedback for Incorrect Answer,Required"

def test_header_exact(tmp_path):
    out = tmp_path / "gf.csv"
    subprocess.run([sys.executable, SCRIPT, "--input", FIX, "--output", str(out)], check=True)
    assert out.read_text().splitlines()[0] == HEADER

def test_row_count_and_types(tmp_path):
    out = tmp_path / "gf.csv"
    subprocess.run([sys.executable, SCRIPT, "--input", FIX, "--output", str(out)], check=True)
    rows = list(csv.DictReader(out.open()))
    assert len(rows) == 20
    allowed = {"MULTIPLE_CHOICE","CHECKBOXES","SHORT_ANSWER","PARAGRAPH","TRUE_FALSE","DROPDOWN"}
    assert all(r["Question Type"] in allowed for r in rows)

def test_mc_correct_answer_matches_option(tmp_path):
    out = tmp_path / "gf.csv"
    subprocess.run([sys.executable, SCRIPT, "--input", FIX, "--output", str(out)], check=True)
    for r in csv.DictReader(out.open()):
        if r["Question Type"] == "MULTIPLE_CHOICE":
            options = [r[f"Option {i}"] for i in range(1,6) if r[f"Option {i}"]]
            assert r["Correct Answer"] in options

def test_essay_has_blank_correct(tmp_path):
    out = tmp_path / "gf.csv"
    subprocess.run([sys.executable, SCRIPT, "--input", FIX, "--output", str(out)], check=True)
    for r in csv.DictReader(out.open()):
        if r["Question Type"] == "PARAGRAPH":
            assert r["Correct Answer"] == ""
```

- [ ] **Step 3: Run to confirm failure**

Run: `pytest skills/quiz-generator/tests/test_render_google_forms_csv.py -v`
Expected: 4 failures.

- [ ] **Step 4: Implement `render_google_forms_csv.py`**

CLI: `--input`, `--output`. Load quiz, iterate, emit one row per question per the type map in scripts section; matching items expand to N rows (one per left-term), each `DROPDOWN` with the right-column values in Option 1-5. Write via `csv.writer` with `QUOTE_MINIMAL`.

- [ ] **Step 5: Run tests, verify pass**

Run: `pytest skills/quiz-generator/tests/test_render_google_forms_csv.py -v`
Expected: 4 passed.

- [ ] **Step 6: Commit**

```bash
git add skills/quiz-generator/scripts/render_google_forms_csv.py skills/quiz-generator/tests/test_render_google_forms_csv.py skills/quiz-generator/tests/fixtures/mixed_20_quiz.json
git commit -m "feat(quiz-generator): add Google Forms CSV renderer"
```

**Acceptance:** CSV header exact; every MC `Correct Answer` appears verbatim in an Option column; essays have blank `Correct Answer`.

---

### Task 7: `render_kahoot_csv.py` + tests

**Files:**
- Create: `skills/quiz-generator/scripts/render_kahoot_csv.py`
- Create: `skills/quiz-generator/tests/test_render_kahoot_csv.py`
- Create: `skills/quiz-generator/tests/fixtures/long_stems_quiz.json` (5 MC items with stems >120 chars for truncation warning test)

- [ ] **Step 1: Write fixture with intentionally long stems**

- [ ] **Step 2: Write failing tests**

```python
import subprocess, sys, csv
SCRIPT = "skills/quiz-generator/scripts/render_kahoot_csv.py"
FIX = "skills/quiz-generator/tests/fixtures/mixed_20_quiz.json"
LONG = "skills/quiz-generator/tests/fixtures/long_stems_quiz.json"
HEADER = "Question,Answer 1,Answer 2,Answer 3,Answer 4,Time limit (sec),Correct answer(s)"

def test_header_and_mc_only(tmp_path):
    out = tmp_path / "k.csv"
    r = subprocess.run([sys.executable, SCRIPT, "--input", FIX, "--output", str(out)], capture_output=True, text=True)
    assert r.returncode == 0
    lines = out.read_text().splitlines()
    assert lines[0] == HEADER
    # only MC items from mixed_20 (10 of them)
    assert len(lines) == 11
    assert "skipped" in r.stderr.lower()

def test_truncation_warning(tmp_path):
    out = tmp_path / "k.csv"
    r = subprocess.run([sys.executable, SCRIPT, "--input", LONG, "--output", str(out)], capture_output=True, text=True)
    assert "TRUNCATED" in r.stderr
    for row in csv.reader(out.open()):
        if row[0] == "Question": continue
        assert len(row[0]) <= 120

def test_correct_answer_is_1_indexed(tmp_path):
    out = tmp_path / "k.csv"
    subprocess.run([sys.executable, SCRIPT, "--input", FIX, "--output", str(out)], check=True)
    for row in list(csv.reader(out.open()))[1:]:
        correct = row[-1]
        assert correct in {"1","2","3","4"}
```

- [ ] **Step 3: Run to confirm failure**

Expected: 3 failures.

- [ ] **Step 4: Implement `render_kahoot_csv.py`**

CLI: `--input`, `--output`, `--time-limit` (default 20). Skip non-MC with stderr `WARN: skipped item {id} (type={t})`. Truncate stems to 120 chars and each answer to 75; on any truncation, count and print `TRUNCATED: {n} items` to stderr before exit. `Correct answer(s)` is the 1-indexed option position.

- [ ] **Step 5: Run tests, verify pass**

Expected: 3 passed.

- [ ] **Step 6: Commit**

```bash
git add skills/quiz-generator/scripts/render_kahoot_csv.py skills/quiz-generator/tests/test_render_kahoot_csv.py skills/quiz-generator/tests/fixtures/long_stems_quiz.json
git commit -m "feat(quiz-generator): add Kahoot CSV renderer with truncation warnings"
```

**Acceptance:** MC-only; truncation enforced; warning surface for skipped/truncated items.

---

### Task 8: HTML templates + `render_pdf.py` + tests

**Files:**
- Create: `skills/quiz-generator/templates/quiz.html`
- Create: `skills/quiz-generator/templates/quiz-answer-key.html`
- Create: `skills/quiz-generator/scripts/render_pdf.py`
- Create: `skills/quiz-generator/tests/test_render_pdf.py`

- [ ] **Step 1: Write `quiz.html` (student) and `quiz-answer-key.html` (teacher)**

Jinja2 templates. Both include header with `{{ title }}`, grade, estimated time, total points. Student template renders each question without `correct`/`rationale`; answer-key variant annotates correct options (bold + `[CORRECT]`) and includes the per-question rationale inline. Both templates load KaTeX via CDN `<script>` + `<link>` and auto-render on `window.onload`:

```html
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"
  onload="renderMathInElement(document.body, {delimiters:[{left:'$',right:'$',display:false}]}); window.__quizReady = true;"></script>
```

Print CSS: `@page { size: letter; margin: 0.75in; }`, `body { font-family: Georgia, serif; }`, page-break-inside: avoid for each `.question`.

- [ ] **Step 2: Write failing tests**

```python
import subprocess, sys, pathlib
from pypdf import PdfReader  # add to requirements-dev

SCRIPT = "skills/quiz-generator/scripts/render_pdf.py"
FIX = "skills/quiz-generator/tests/fixtures/mixed_20_quiz.json"

def test_renders_both_pdfs(tmp_path):
    out = tmp_path / "q.pdf"
    subprocess.run([sys.executable, SCRIPT, "--input", FIX, "--output", str(out), "--variant", "all"], check=True)
    student = out
    ak = tmp_path / "q-answer-key.pdf"
    assert student.exists() and ak.exists()
    assert PdfReader(str(student)).pages
    assert PdfReader(str(ak)).pages

def test_answer_key_contains_correct_marker(tmp_path):
    out = tmp_path / "q.pdf"
    subprocess.run([sys.executable, SCRIPT, "--input", FIX, "--output", str(out), "--variant", "answer-key"], check=True)
    reader = PdfReader(str(out))
    text = "\n".join(p.extract_text() or "" for p in reader.pages)
    assert "CORRECT" in text.upper()
```

- [ ] **Step 3: Run tests, confirm failure**

Expected: 2 failures (script missing).

- [ ] **Step 4: Implement `render_pdf.py`**

CLI: `--input`, `--output`, `--variant {student,answer-key,all}` (default `all`). Renders Jinja template to a temp HTML file, shells out to `shared/scripts/pdf_render.py --html <tmp.html> --output <pdf>` and waits for completion. In `all` mode, produces `<output>` (student) and sibling `<output stem>-answer-key.pdf` (teacher). The subprocess call must wait for `window.__quizReady === true` before PDF capture — if `pdf_render.py` supports a `--wait-for-js` flag, use it; otherwise pass `--wait-ms 1500`.

- [ ] **Step 5: Run tests, verify pass**

Expected: 2 passed. (Playwright must be installed; if CI lacks it, mark these tests with `@pytest.mark.skipif(not playwright_installed)`.)

- [ ] **Step 6: Commit**

```bash
git add skills/quiz-generator/templates/ skills/quiz-generator/scripts/render_pdf.py skills/quiz-generator/tests/test_render_pdf.py
git commit -m "feat(quiz-generator): add PDF renderer + HTML templates"
```

**Acceptance:** Both PDFs generated from a single call; answer key contains `CORRECT` marker; KaTeX math renders (verified by manual inspection or a stem containing `$x^2$`).

---

### Task 9: Write all seven `references/*.md` files

**Files:**
- Create: `skills/quiz-generator/references/question-type-best-practices.md`
- Create: `skills/quiz-generator/references/answer-distractor-heuristics.md`
- Create: `skills/quiz-generator/references/blooms-alignment.md`
- Create: `skills/quiz-generator/references/grade-level-calibration.md`
- Create: `skills/quiz-generator/references/rubric-templates.md`
- Create: `skills/quiz-generator/references/google-forms-import.md`
- Create: `skills/quiz-generator/references/kahoot-import.md`

- [ ] **Step 1: Write each file per the "references/ contents" section above**

Each file between 100 and 250 lines. Full tables, full examples, no placeholders. `grade-level-calibration.md` must contain the full table from spec §8 verbatim plus the four "additional calibrations" bullets. `rubric-templates.md` must include at least 5 full rubric blocks (2 SA + 3 essay).

- [ ] **Step 2: Lint: every references file has content >500 chars**

Run (bash):
```bash
for f in skills/quiz-generator/references/*.md; do
  n=$(wc -c < "$f"); test "$n" -gt 500 || { echo "too short: $f"; exit 1; }
done
```
Expected: no output, exit 0.

- [ ] **Step 3: Commit**

```bash
git add skills/quiz-generator/references/
git commit -m "docs(quiz-generator): add 7 reference files loaded on demand"
```

**Acceptance:** All 7 files present; none is a stub; calibration and rubric files carry the full spec content.

---

### Task 10: Fill in SKILL.md body (sections 2-10)

**Files:**
- Modify: `skills/quiz-generator/SKILL.md`

- [ ] **Step 1: Expand each section from Task 1 stubs to full content**

Every section per the SKILL.md outline. Section 7 (Output formats table) must list every script with its exact CLI invocation. Section 9 (Edge cases) is 10 bullets verbatim from spec §10. Section 6 (Intermediate representation) contains an inline minimal example `quiz.json` with exactly 2 questions (1 MC, 1 essay) that validates against `quiz.schema.json`.

- [ ] **Step 2: Verify SKILL.md under 300 lines**

Run: `wc -l skills/quiz-generator/SKILL.md`
Expected: line count ≤ 300.

- [ ] **Step 3: Verify embedded example `quiz.json` validates**

Extract the example JSON block (inline Python heredoc) and run `validate_quiz.py` against it.
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add skills/quiz-generator/SKILL.md
git commit -m "docs(quiz-generator): fill in SKILL.md workflow + output tables"
```

**Acceptance:** SKILL.md ≤ 300 lines; inline example validates; all 10 edge cases present.

---

### Task 11: Author `evals/evals.json` + fixtures

**Files:**
- Create: `skills/quiz-generator/evals/evals.json`
- Create: `skills/quiz-generator/evals/fixtures/eigenvectors.pdf` (source: a short public-domain linear algebra chapter or a hand-generated 3-page PDF)
- Create: `skills/quiz-generator/evals/fixtures/sample_notes.md` (200-word notes block on a single topic for Eval 5)

- [ ] **Step 1: Write `evals.json` verbatim per the section above**

- [ ] **Step 2: Generate `sample_notes.md` (≥200 words, single topic, plain prose)**

- [ ] **Step 3: Produce `eigenvectors.pdf`**

Option A (preferred): write a short `eigenvectors.md`, render it with `shared/scripts/pdf_render.py` into a 2-3 page PDF. Only mention 2x2/3x3 determinants, characteristic polynomial, and eigenvalues/eigenvectors — intentionally avoid Jordan form, SVD, and higher-dim determinants so the `no_extraneous_concepts` assertion is satisfiable by a well-behaved quiz.

- [ ] **Step 4: Validate `evals.json` parses**

Run: `python -c "import json; json.load(open('skills/quiz-generator/evals/evals.json'))"`
Expected: no output, exit 0.

- [ ] **Step 5: Commit**

```bash
git add skills/quiz-generator/evals/
git commit -m "test(quiz-generator): add evals.json + fixtures for 5 cases"
```

**Acceptance:** 5 cases, each with ≥3 objective assertions; fixture PDF and notes file present.

---

### Task 12: Integration test — full pipeline round-trip

**Files:**
- Create: `skills/quiz-generator/tests/test_pipeline_integration.py`

- [ ] **Step 1: Write failing test**

```python
import subprocess, sys
from pathlib import Path

def test_full_pipeline(tmp_path):
    fix = "skills/quiz-generator/tests/fixtures/mixed_20_quiz.json"
    # 1. validate
    subprocess.run([sys.executable, "skills/quiz-generator/scripts/validate_quiz.py", "--input", fix], check=True)
    # 2. markdown
    md = tmp_path / "q.md"
    subprocess.run([sys.executable, "skills/quiz-generator/scripts/render_markdown.py", "--input", fix, "--output", str(md)], check=True)
    assert md.exists()
    # 3. google forms csv
    gf = tmp_path / "q-gf.csv"
    subprocess.run([sys.executable, "skills/quiz-generator/scripts/render_google_forms_csv.py", "--input", fix, "--output", str(gf)], check=True)
    assert gf.exists()
    # 4. kahoot
    kh = tmp_path / "q-kh.csv"
    subprocess.run([sys.executable, "skills/quiz-generator/scripts/render_kahoot_csv.py", "--input", fix, "--output", str(kh)], check=True)
    assert kh.exists()
    # 5. pdf (student + answer key)
    pdf = tmp_path / "q.pdf"
    subprocess.run([sys.executable, "skills/quiz-generator/scripts/render_pdf.py", "--input", fix, "--output", str(pdf), "--variant", "all"], check=True)
    assert pdf.exists() and (tmp_path / "q-answer-key.pdf").exists()
```

- [ ] **Step 2: Run tests**

Run: `pytest skills/quiz-generator/tests/test_pipeline_integration.py -v`
Expected: 1 passed (all earlier tasks already implement the scripts).

- [ ] **Step 3: Commit**

```bash
git add skills/quiz-generator/tests/test_pipeline_integration.py
git commit -m "test(quiz-generator): end-to-end pipeline integration test"
```

**Acceptance:** Single test runs all five scripts back-to-back from the same `quiz.json`.

---

### Task 13: Run the eval harness against evals.json

**Files:** (no new files — verification task)

- [ ] **Step 1: Run repo-level eval harness**

Run: `python tools/run_evals.py --skill quiz-generator` (or the repo-equivalent command). If the harness does not yet exist at repo level, run each case manually via Claude Code CLI and tick off the assertions.
Expected: 5/5 cases pass, with every assertion objectively satisfied.

- [ ] **Step 2: Capture output to `skills/quiz-generator/evals/last-run.txt`**

- [ ] **Step 3: If any assertion fails, open an issue per failure and loop back to the owning task**

Do not mark the skill complete if any case fails.

- [ ] **Step 4: Commit eval run log**

```bash
git add skills/quiz-generator/evals/last-run.txt
git commit -m "test(quiz-generator): record passing eval run"
```

**Acceptance:** All 5 eval cases pass; run log committed.

---

### Task 14: Register skill in plugin manifest + README

**Files:**
- Modify: `.claude-plugin/plugin.json` — add quiz-generator entry to the `skills` array with its `path`, `name`, `description` (copied from SKILL.md frontmatter), `triggers` (5-10 trigger phrases).
- Modify: `README.md` — add a quiz-generator row to the skill catalog table under "V1 skill catalog", with a one-paragraph summary + install-time triggers.

- [ ] **Step 1: Edit `plugin.json`**

Append the new skill entry. Validate JSON parses.

- [ ] **Step 2: Edit `README.md`**

Add row: `| quiz-generator | Multiple choice, short answer, T/F, cloze, matching, essay. Markdown / PDF / Google Forms CSV / Kahoot CSV. | "generate a quiz on…", "quiz me on this" |`.

- [ ] **Step 3: Verify plugin.json parses**

Run: `python -c "import json; json.load(open('.claude-plugin/plugin.json'))"`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add .claude-plugin/plugin.json README.md
git commit -m "feat(plugin): register quiz-generator skill in manifest + README"
```

**Acceptance:** `plugin.json` parses; quiz-generator is discoverable in the skill catalog.

---

## Self-Review

**Spec coverage:**
- §1 Purpose + §2 Triggers → SKILL.md §§2-3 (Task 1, 10).
- §3 Inputs + config params → SKILL.md §§3-4 (Task 10).
- §4 Outputs (markdown, Google Forms CSV, PDF, Kahoot CSV, schema) → Tasks 2, 5, 6, 7, 8.
- §5 Workflow → SKILL.md §5 (Task 10).
- §6 Bundled scripts (validate + 4 renderers, `forms_push.py` deferred per spec open-question 1) → Tasks 3-8.
- §7 References (all 7 files) → Task 9.
- §8 Grade-level calibration → reference file (Task 9) + SKILL.md cheat sheet (Task 10).
- §9 Evals (5 cases) → Task 11.
- §10 Edge cases → SKILL.md §9 (Task 10); duplicate detection handled by `validate_quiz.py` note (exact-match only; fuzzy dedup is generator-side).
- §11 Open questions — resolved per spec recommendations: forms_push deferred; KaTeX pre-render in HTML template; Bloom's only (taxonomy flag deferred); single-quiz only in V1.

**Placeholders:** None — every task has exact files, exact commands, full code blocks.

**Type consistency:** `quiz.schema.json` defines the canonical field names; every renderer and test reads them identically (`type`, `stem`, `options`, `correct`, `points`, `blooms`, `difficulty`, `rationale`, `rubric`). `_common.load_quiz` is the single entry point used by every script. CLI flag `--answer-mode` used consistently between `render_markdown.py` tests and implementation. `--variant` on `render_pdf.py` accepts `student|answer-key|all` in both tests and spec.

**Open items for implementer (none block the plan):**
- Whether `shared/scripts/pdf_render.py` exposes `--wait-for-js` vs `--wait-ms`. Implementer picks whichever the script supports and documents it in `render_pdf.py`'s docstring.
- Eval harness location (`tools/run_evals.py`) may be a sibling plan's deliverable; Task 13 falls back to manual case execution if not present.
