# quiz-generator — Design Spec

**Date:** 2026-04-14
**Author:** Pierson + Claude
**Status:** Draft pending user review
**Parent:** `2026-04-14-marketplace-design.md`

## 1. Purpose

Generate assessment-grade quizzes from a topic, notes, URL, PDF, or photo of a reading passage. Supports six question types: multiple choice, short answer, true/false, cloze (fill-in-the-blank), matching, and essay. Output formats target both the teacher workflow (markdown with answer key, printable PDF, Google Forms CSV, optional Kahoot CSV) and the student self-test workflow (markdown with hidden answers, scoring heuristics).

**Who:** Teachers (grades K-12, college, graduate) building formative or summative assessments; students building self-tests from their own notes or readings.

**Why:** Writing quality quiz items is slow — especially writing plausible distractors, balancing Bloom's levels, and calibrating to grade. A dedicated skill beats generic "write me a quiz" prompts because it enforces a difficulty mix, validates distractor quality, and produces import-ready files for Google Forms / Kahoot without the teacher hand-massaging CSV columns.

## 2. Triggers

Teacher, formal:
- "Generate a 20-question multiple choice quiz on the causes of WWI for 10th grade."
- "Build a mixed-format unit test covering chapters 4-6 of this textbook PDF."
- "Create a Google Forms–importable quiz on photosynthesis with 10 items."
- "I need a cloze quiz for vocabulary from this short story."

Teacher, casual:
- "Quiz my students on fractions."
- "Make me 15 questions from these lecture notes."
- "Throw together a pop quiz on the Civil Rights movement."

Student, formal:
- "Generate practice quiz questions from my biology notes for tomorrow's exam."
- "Create a self-test on this chapter with answer explanations."

Student, casual:
- "Quiz me on this."
- "Help me study — turn these notes into practice questions."
- "Give me 30 flashcard-style questions from this PDF."
- "Make me a practice test on derivatives."

## 3. Inputs

Accepted sources (any one, or a combination):
- **Topic string** — e.g. `"causes of WWI"`, `"Python list comprehensions"`, `"Krebs cycle"`.
- **Pasted notes** — free-form text, up to ~20k tokens. Lecture notes, outlines, prose.
- **URL** — fetched and parsed (HTML, PDF, or plain text).
- **PDF** — textbook chapter, handout, article. Parsed via Claude's native PDF support.
- **Photo of reading** — phone photo of a textbook page, printed handout, or whiteboard. OCR via Claude's vision.
- **Multiple sources** — user can mix (e.g. topic + pasted notes for scoping).

Accepted configuration parameters (all optional, with defaults):
- `num_questions` — integer, default `10`.
- `question_types` — list; default `["multiple_choice", "short_answer", "true_false"]`. Accepts any subset of `["multiple_choice", "short_answer", "true_false", "cloze", "matching", "essay"]`.
- `grade_level` — one of `K-2`, `3-5`, `6-8`, `9-12`, `college`, `grad`. Default `9-12`.
- `difficulty_mix` — one of `easy`, `balanced`, `hard`, or explicit `{easy: N, medium: N, hard: N}`. Default `balanced` (30% easy, 50% medium, 20% hard).
- `blooms_mix` — optional, constrains distribution across Remember/Understand/Apply/Analyze/Evaluate/Create. Default: weighted toward Understand + Apply for grades 6-12.
- `output_formats` — subset of `["markdown", "google_forms_csv", "pdf", "kahoot_csv"]`. Default `["markdown"]`; PDF auto-added for printable requests.
- `answer_key` — `"appended"` (default), `"separate_file"`, or `"hidden"` (student self-test mode).

## 4. Outputs

### 4.1 Markdown with answer key (default)

File: `quiz-<slug>-<YYYYMMDD>.md`.

Structure:
```
# <Title>
**Grade:** <grade_level>   **Time:** <estimated minutes>   **Total points:** <N>

## Instructions
<one short paragraph>

## Questions

### 1. [Multiple Choice, 2 pts, Bloom: Understand]
<stem>
- A) <option>
- B) <option>
- C) <option>
- D) <option>

### 2. [Cloze, 1 pt, Bloom: Remember]
The ______ is the powerhouse of the cell.

... (continues through N questions)

---

## Answer Key
1. B — <one-sentence rationale>
2. mitochondrion
...

## Rubrics (for essay/short-answer items)
### Q12 rubric
| Level | Points | Criteria |
|-------|--------|----------|
| Exemplary | 4 | ... |
...
```

### 4.2 Google Forms–importable CSV

File: `quiz-<slug>-google-forms.csv`.

Columns (exact, header row required for Google Forms Quiz import template):

```
Question,Question Type,Option 1,Option 2,Option 3,Option 4,Option 5,Correct Answer,Points,Feedback for Correct Answer,Feedback for Incorrect Answer,Required
```

- `Question Type` values: `MULTIPLE_CHOICE`, `CHECKBOXES`, `SHORT_ANSWER`, `PARAGRAPH`, `TRUE_FALSE`, `DROPDOWN`.
- Unused option columns left blank.
- `Correct Answer` is the option text (not the letter) for MC, literal answer for SHORT_ANSWER, `TRUE` / `FALSE` for T/F.
- Cloze items are emitted as `SHORT_ANSWER` with the blank represented as `_____` in the question text.
- Matching items are decomposed into N `DROPDOWN` items (one per left-column term).
- Essay items use `PARAGRAPH` and omit `Correct Answer`.

(Google Forms does not natively support a one-file quiz import; Claude outputs both the CSV and a short README explaining the two-step import via the "Import questions" add-on or Apps Script helper. The script in `skills/quiz-generator/scripts/forms_push.py` is optional — deferred if Apps Script credentials unavailable.)

### 4.3 Printable PDF

Rendered via `shared/scripts/pdf_render.py` from an HTML template `shared/templates/quiz.html` (new template added by this skill's implementation). Two PDFs produced:
- `quiz-<slug>.pdf` — student-facing, answers hidden, includes scantron-style bubbles for MC.
- `quiz-<slug>-answer-key.pdf` — teacher-facing, annotated with correct answers + rationales.

### 4.4 Kahoot-ready CSV (optional)

File: `quiz-<slug>-kahoot.csv`. Exact Kahoot template columns:

```
Question,Answer 1,Answer 2,Answer 3,Answer 4,Time limit (sec),Correct answer(s)
```

- Only multiple-choice items exported (Kahoot limitation — 2-4 options, no short answer).
- `Time limit (sec)` defaults to 20s; configurable via `kahoot_time_limit`.
- `Correct answer(s)` is the 1-indexed option number(s), comma-separated.
- Question text capped at 120 chars; answers at 75 chars (Kahoot limits). Skill warns if truncation occurred.

### 4.5 Schema summary

All outputs derive from a single internal JSON schema `quiz.schema.json`:

```
{
  "title": str,
  "grade_level": str,
  "estimated_minutes": int,
  "total_points": int,
  "questions": [
    {
      "id": int,
      "type": "multiple_choice" | "short_answer" | "true_false" | "cloze" | "matching" | "essay",
      "stem": str,
      "options": [str] | null,          # MC, T/F, matching
      "correct": str | [str] | null,    # essay → null
      "points": int,
      "blooms": "Remember" | "Understand" | "Apply" | "Analyze" | "Evaluate" | "Create",
      "difficulty": "easy" | "medium" | "hard",
      "rationale": str,
      "rubric": [{"level": str, "points": int, "criteria": str}] | null
    }
  ]
}
```

Renderers (markdown, Google Forms CSV, PDF, Kahoot CSV) all consume this intermediate representation.

## 5. Workflow

1. **Parse request.** Extract topic, source material, num_questions, question_types, grade_level, difficulty_mix, output_formats, blooms_mix.
2. **Ingest source.** If PDF/URL/photo: load and extract text. Summarize into a scoping outline (~10 bullet points) to ground later generation.
3. **Plan item slate.** Build a matrix of (type × difficulty × Bloom's level) totaling N questions. Apply `grade-level-calibration.md` table.
4. **Generate items.** One pass per question type. For multiple choice: generate stem + correct answer + 3 distractors, applying `answer-distractor-heuristics.md` (no "all of the above"; distractors plausible; roughly equal length; no grammatical tells).
5. **Self-critique.** For each MC item, verify: (a) exactly one unambiguously correct option; (b) distractors are factually wrong but topically adjacent; (c) stem is a complete question, not a sentence fragment; (d) no double-negatives; (e) reading level matches grade band.
6. **Assemble JSON.** Build the internal `quiz.schema.json` representation.
7. **Render.** Emit each requested output format by calling the appropriate renderer script.
8. **Report.** Summarize to the user: file paths, question-type counts, Bloom's distribution, estimated time, any warnings (truncation, essay items needing rubric review, source material too sparse).

## 6. Bundled scripts

`skills/quiz-generator/scripts/`:
- `render_markdown.py` — JSON → `.md` with answer key.
- `render_google_forms_csv.py` — JSON → Google Forms import CSV.
- `render_kahoot_csv.py` — JSON → Kahoot CSV; enforces length caps; warns on truncation.
- `validate_quiz.py` — lints a `quiz.schema.json`: unique IDs, exactly-one-correct for MC, distractor count, field completeness. Called before any renderer.
- `forms_push.py` (optional, stub in V1) — Apps Script helper to push directly to a Google Forms quiz if user provides credentials. Deferred behind a flag; V1 ships CSV only.

Shared (reused from `shared/scripts/`):
- `pdf_render.py` — HTML template → PDF. Template `shared/templates/quiz.html` added as part of this skill.

All renderer scripts accept `--input quiz.json --output <path>` and are idempotent.

## 7. References

Loaded on demand from `skills/quiz-generator/references/`:

- `question-type-best-practices.md` — one section per type (MC, SA, T/F, cloze, matching, essay). Covers stem construction, option rules, when to use each type, pitfalls.
- `answer-distractor-heuristics.md` — rules for plausible distractors: common misconceptions, off-by-one errors, near-synonyms, partially-correct-but-incomplete answers; parallel grammatical form; length parity; avoiding "all/none of the above"; randomized correct position.
- `blooms-alignment.md` — table mapping each Bloom's level to verb cues in the stem (Remember→"list, define"; Apply→"calculate, solve"; Analyze→"compare, contrast"; Evaluate→"critique, justify"; Create→"design, compose"). Used by the planning step to hit the requested `blooms_mix`.
- `grade-level-calibration.md` — see Section 8.
- `rubric-templates.md` — boilerplate 4-level rubrics for short-answer and essay items, to attach when user requests `essay` type.
- `google-forms-import.md` — exact CSV column spec, Forms import procedure, Apps Script setup.
- `kahoot-import.md` — Kahoot template spec, length limits, known gotchas.

## 8. Grade/level calibration

Loaded from `grade-level-calibration.md`. Summary table:

| Grade band | Reading level (Lexile) | Stem length | Distractor subtlety | Vocabulary | Typical Bloom's center |
|------------|------------------------|-------------|---------------------|------------|------------------------|
| K-2        | 100-500L               | ≤10 words   | Obvious             | Tier 1     | Remember               |
| 3-5        | 500-800L               | ≤15 words   | Obvious→plausible   | Tier 1-2   | Remember/Understand    |
| 6-8        | 800-1000L              | ≤20 words   | Plausible           | Tier 2     | Understand/Apply       |
| 9-12       | 1000-1300L             | ≤30 words   | Subtle              | Tier 2-3   | Apply/Analyze          |
| College    | 1300L+                 | No cap      | Subtle, near-miss   | Domain-specific | Analyze/Evaluate    |
| Grad       | 1300L+                 | No cap      | Expert-level near-miss | Jargon-appropriate | Evaluate/Create  |

Additional calibrations:
- **K-2 avoids MC with 4 options** — uses 2-3 options or picture-based matching (note: V1 emits text-only; image-based quizzes deferred).
- **9-12 and above** — distractors can include partially-correct statements that omit a qualifier.
- **Essay prompts** — scale from "describe" (6-8) → "compare" (9-12) → "evaluate and justify" (college) → "synthesize and defend a novel claim" (grad).
- **T/F items discouraged above 6-8** (guessing floor too high); skill warns if T/F >25% of items at 9-12+.

## 9. Evals

Five test prompts in `skills/quiz-generator/evals/evals.json`. Each prompt has ≥3 objective assertions.

### Eval 1: Basic multiple choice
**Prompt:** "Generate a 10-question multiple choice quiz on the water cycle for 5th grade."
**Assertions:**
- Output file `quiz-*.md` exists.
- Parsed quiz JSON has exactly 10 questions, all type `multiple_choice`.
- Each MC item has exactly 4 options and exactly one `correct`.
- Answer key section present and covers all 10 items.
- Reading level ≤ 800L (approximated via Flesch-Kincaid grade ≤ 5.5).

### Eval 2: Mixed format unit test
**Prompt:** "Create a 20-question unit test on cell biology for 10th grade: 10 MC, 5 short answer, 3 true/false, 2 essay. Output markdown and PDF."
**Assertions:**
- Quiz JSON has exactly 20 items with type counts {MC: 10, SA: 5, TF: 3, essay: 2}.
- `quiz-*.pdf` and `quiz-*-answer-key.pdf` both exist and are valid PDFs (>1 page).
- Each essay item has an attached `rubric` array of length ≥3.
- Bloom's distribution includes at least 3 distinct levels.

### Eval 3: Google Forms CSV
**Prompt:** "Build a 15-question quiz on the French Revolution for 9th grade and give me the Google Forms CSV."
**Assertions:**
- `quiz-*-google-forms.csv` exists.
- Header row matches exactly: `Question,Question Type,Option 1,Option 2,Option 3,Option 4,Option 5,Correct Answer,Points,Feedback for Correct Answer,Feedback for Incorrect Answer,Required`.
- CSV has 16 rows (header + 15).
- Every `Question Type` value ∈ allowed enum.
- For every `MULTIPLE_CHOICE` row, `Correct Answer` matches one of the Option N columns exactly.

### Eval 4: From PDF source
**Prompt:** "Here's a lecture PDF on linear algebra eigenvectors (attached). Generate a 10-question college-level quiz with 60% apply-level Bloom's."
**Assertions:**
- Quiz JSON has 10 items.
- ≥6 items have `blooms` ∈ {`Apply`, `Analyze`}.
- At least 80% of items reference concepts present in the source PDF (verified by keyword overlap check).
- No item references topics outside the source material (no hallucinated theorems).

### Eval 5: Student self-test mode
**Prompt:** "Quiz me on these notes — hide the answers until I ask for them." (notes pasted inline)
**Assertions:**
- Markdown output has NO `## Answer Key` section visible inline; answer key emitted to a separate file `quiz-*-answers.md` or included as HTML-collapsed `<details>` block.
- Quiz includes at least 3 distinct question types.
- `num_questions` defaults to 10.
- Skill's chat response describes how to reveal answers.

## 10. Edge cases + failure modes

- **Essay questions need a rubric.** Every essay item auto-attaches a 4-level rubric pulled from `rubric-templates.md`. If the user declines rubrics, skill warns that grading essays without a rubric is low-reliability.
- **Missing source material.** If user asks for a quiz "from my notes" but provides no notes, skill asks a single clarifying question: "Topic-only, or do you want to paste/attach source material?" Does not silently invent.
- **Topic too broad.** E.g. "quiz me on biology." Skill narrows: proposes 3-5 sub-topics and asks which to focus on, or generates a survey quiz and flags that coverage is intentionally shallow.
- **Source material too sparse.** If input text is <200 words and user wants 20+ questions, skill warns and caps at a calculated max (~1 question per 30 words of source) unless user overrides.
- **Photo OCR failure.** If a photo input yields unreadable text, skill reports OCR failure, shows what it extracted, and asks user to re-shoot or paste text.
- **Language other than English.** Skill supports non-English quizzes but warns that grade-level calibration table is English-centric; defers deeper calibration to `language-drill` for ESL/foreign-language items.
- **Math notation.** Stems containing math render as LaTeX inline (`$...$`) in markdown; PDF renders via MathJax in the HTML template. Google Forms / Kahoot CSV fall back to plain-text pseudo-notation (e.g. `x^2` not `$x^2$`) and warn.
- **Duplicate questions.** Validator flags items with cosine-similarity stems >0.9; regenerates offending items.
- **Kahoot truncation.** If >20% of items truncate at 120-char stem or 75-char answer, skill warns and suggests dropping Kahoot output or shortening the source topic scope.
- **Controversial / sensitive topics.** Skill accepts academic treatments (e.g. Holocaust, slavery, civil rights) but refuses to generate quiz items that quiz students on opinion/bias. Factual items only.
- **Copyright.** When source is a URL or PDF, quiz questions paraphrase and cite source; do not reproduce long passages verbatim beyond short quoted excerpts.

## 11. Open questions (need human decision)

1. **Google Forms push.** Should V1 ship `forms_push.py` (requires Apps Script credential flow), or CSV-only with a README pointing to Forms' "Import questions" add-on? Recommendation: CSV-only in V1, push helper in V2.
2. **Math rendering in PDF.** MathJax (runtime, requires JS in PDF renderer) vs. KaTeX pre-render vs. falling back to `latex_compile.py` for any quiz containing math. Recommendation: KaTeX pre-render in `pdf_render.py`; defer LaTeX compile path to `latex-paper` skill.
3. **Image-based items for K-2.** V1 text-only; when to add image-support (picture-matching, "circle the shape")? Recommendation: V2 once `coloring-page` SVG library is stable enough to reuse.
4. **Bloom's vs. DOK.** Default taxonomy for `blooms_mix` is Bloom's (revised). Should a DOK toggle be exposed now or deferred? Recommendation: Bloom's default in V1; expose `taxonomy: "blooms" | "dok"` flag but only implement Bloom's — parallel to `rubric` skill which also picks a default framework.
5. **Difficulty labels.** Are `easy / medium / hard` enough, or do we need per-grade-band calibration (e.g. a "hard" 5th-grade item vs. a "hard" college item)? Recommendation: labels are relative to the requested grade band and documented as such; no cross-band comparability claim.
6. **Quiz item banks.** Should the skill optionally append to a persistent item bank file (`quiz-bank.json`) for reuse across quizzes? Useful for teachers building tests over a semester. Recommendation: defer to V2; single-quiz output only in V1.
7. **Self-grading / scoring for student mode.** When a student completes a self-test in the chat, does the skill grade their answers? Recommendation: yes for MC/TF/cloze (deterministic); narrative feedback only for SA/essay with rubric.
