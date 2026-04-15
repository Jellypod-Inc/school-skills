# rubric — Skill Design Spec

**Date:** 2026-04-14
**Parent spec:** [2026-04-14-marketplace-design.md](./2026-04-14-marketplace-design.md)
**Status:** Draft pending user review

## 1. Purpose

Turn an assignment prompt into a grading rubric instantly. Teachers paste (or link to) an assignment and get back a usable, defensible rubric — holistic or analytic, aligned to a recognized taxonomy (Bloom's, DOK, SOLO) or to state/Common Core standards, with fully populated level descriptors. Zero blank cells. Ready to print, share with students, or drop into an LMS.

The skill replaces the single most time-consuming part of assignment design that teachers routinely skip or copy-paste from web templates: writing the per-criterion, per-level descriptors.

## 2. Triggers

`SKILL.md` description must fire on phrasings from teachers and professors:

1. "I need a rubric for [assignment]"
2. "Make me a rubric for this essay"
3. "Grade this essay assignment" / "help me grade…"
4. "Build a scoring guide for [project]"
5. "Write an analytic rubric for a lab report"
6. "Holistic rubric for a 6th-grade narrative"
7. "4-point mastery rubric for …"
8. "Rubric aligned to DOK" / "aligned to Bloom's" / "aligned to CCSS"
9. "Scoring criteria for a group project"
10. "How should I grade this?"
11. "Turn this assignment prompt into a rubric"
12. "Make a student-facing rubric I can hand out"

Descriptions should surface both "rubric" and "scoring guide" / "grading guide" as synonyms — many teachers don't use the word *rubric*.

## 3. Inputs

Required:
- **Assignment prompt** — pasted text, uploaded PDF/DOCX, photo of a handout, or a URL to a class page.

Optional (the skill asks only for what it needs; otherwise picks defaults from §8):
- **Grade level** — K-2, 3-5, 6-8, 9-12, college, grad.
- **Subject** — ELA, math, science, social studies, CS, art, PE, world language, other.
- **Rubric type** — `holistic` | `analytic` (default: analytic for 3-12 and college; holistic for K-2 and grad narrative).
- **Number of criteria** — 3-6 (default: 4).
- **Number of performance levels** — 3-5 (default: 4).
- **Alignment** — `bloom` | `dok` | `solo` | `ccss` | `ngss` | `state:<code>` | `ib` | `none` (default: `bloom` unless subject/standard is obvious from prompt).
- **Scoring style** — `points` (with total) | `qualitative` (labels only) | `hybrid` (labels + points). Default: `points` for 6-12, `qualitative` for K-5.
- **Total points** — if `points`, optional; default 100 distributed by criterion weight.
- **Student-facing vs. teacher-facing** — student version uses plain language and "I can" framing; teacher version keeps taxonomic/standards language.
- **Output formats requested** — any subset of §4; default markdown table + CSV.

## 4. Outputs

Every run produces, by default:

1. **Markdown table** — criteria as rows, performance levels as columns, descriptors in every cell. Emitted inline in the chat for quick review.
2. **CSV** — columns: `criterion, weight, level_1_label, level_1_descriptor, level_1_points, …, level_N_points, criterion_total`. Machine-readable; imports cleanly into Google Sheets and most LMS gradebooks.
3. **Printable PDF** — rendered via `shared/scripts/pdf_render.py` from a rubric HTML template. Landscape orientation, fits one page for 4×4 analytic; paginates gracefully otherwise.

On request:

4. **Google Classroom–ready format** — flat CSV matching the Classroom rubric import schema (criterion title, criterion description, level title, level points, level description — one row per level).
5. **Student-facing handout** — markdown + PDF, plain language, includes a self-check column.
6. **Separate answer key / exemplar column** — sample student work pinned to each level, if exemplars are provided or requested.

All outputs write to `./rubric-<slug>-<timestamp>.<ext>` in the working dir and are listed at the end of the run.

## 5. Workflow

1. **Ingest assignment prompt.** Accept text, URL (fetch), PDF/image (extract). Confirm the extracted prompt back to the user in 2-3 lines if ingestion was non-trivial.
2. **Identify the task.** Determine assignment type (essay, lab report, project, presentation, coding assignment, portfolio, performance task, etc.) and the verbs used in the prompt.
3. **Extract skills assessed.** Map assignment verbs to the chosen taxonomy:
   - Bloom's: remember/understand/apply/analyze/evaluate/create.
   - DOK: recall / skill-concept / strategic thinking / extended thinking.
   - SOLO: prestructural → extended abstract.
   - Standards: parse CCSS/NGSS/state codes from the prompt when present.
4. **Propose criteria.** Generate 3-6 criteria that collectively cover what the prompt actually asks students to do. Favor criteria that are *observable* and *non-overlapping*. Typical set for an essay: Thesis & Argument, Evidence & Analysis, Organization, Language & Conventions.
5. **Generate level descriptors.** For each criterion × level cell, write a concrete, measurable descriptor. Use parallel phrasing across levels (see §7). No empty cells, no "same as above," no level that's just "less of the previous."
6. **Align & label.** Attach taxonomy/standard tag per criterion (e.g., *Analyze — Bloom's 4*, *CCSS.ELA-Literacy.W.9-10.1*).
7. **Weight and score.** Distribute points by criterion (default equal; adjustable). Verify level points within each criterion are monotonic and sum to criterion total; verify criterion totals sum to overall total.
8. **Format and emit.** Render markdown → CSV → PDF (and any optional formats). Print a one-line summary per file with absolute path.
9. **Offer refinements.** "Want me to simplify for students?", "Re-weight?", "Swap criterion X for Y?".

## 6. Bundled scripts

Minimal. This skill is mostly prompt + references.

- `shared/scripts/pdf_render.py` — already shared across skills. Consumes an HTML template and writes PDF. Rubric uses a dedicated `shared/templates/rubric.html` (landscape, repeating table header on overflow).

No skill-local scripts in V1. CSV is emitted directly by the model (tiny, regular shape). A potential V2 script `scripts/validate_rubric.py` could sanity-check point totals and cell completeness, but is not required.

## 7. References (`skills/rubric/references/`)

Loaded on demand, not inlined into `SKILL.md`.

- `taxonomies.md` — Bloom's (revised 2001), Webb's DOK, SOLO. Verb banks per level. Quick-pick guidance on which taxonomy fits which subject/assignment type.
- `frameworks.md` — common rubric frameworks with worked examples:
  - 4-point mastery (1 Beginning, 2 Developing, 3 Proficient, 4 Exemplary) — the default.
  - 1-5 analytic.
  - Holistic 1-6 (AP-style).
  - 3-level standards-based (Approaching / Meeting / Exceeding).
  - Single-point rubric (criteria only; notes for above/below).
- `criterion-writing.md` — best practices: observable verbs; one trait per criterion; non-overlap; student-friendly names; 3-6 criteria cap (research on rater reliability).
- `descriptor-phrasing.md` — parallel phrasing patterns across levels; quantifier ladders ("consistently / usually / sometimes / rarely"; "all / most / some / few"; "sophisticated / clear / partial / limited"); common anti-patterns to avoid (subjective aesthetics, negation chains, comparative-only descriptors).
- `standards-crosswalk.md` — quick pointers to CCSS (ELA, Math), NGSS SEPs/CCCs, C3 (social studies), and common state portals.
- `examples/` — 8-10 reference rubrics across grade bands and subjects (narrative essay, lab report, coding project, art portfolio, group presentation, oral exam, kindergarten letter formation, grad thesis proposal).

## 8. Grade / level calibration

| Band | Default rubric type | Levels | Language | Notes |
|---|---|---|---|---|
| **K-2** | Holistic, picture-based | 3 (smiley icons or stars) | "I can…" sentences, ≤8 words each | Picture rubric template in `examples/`. No points. Teacher reads aloud. |
| **3-5** | Analytic, simple | 3-4 | 1 sentence per cell, grade-appropriate vocab | Points optional. Include a "next step" column. |
| **6-8** | Analytic | 4 | 2 sentences per cell | Points default; introduce taxonomy labels (Bloom's verbs) on teacher version only. |
| **9-12** | Analytic | 4-5 | 2-3 sentences per cell | Full taxonomy + standards alignment on teacher version; plain-language student version offered. |
| **College** | Analytic, detailed | 4-5 | 3-4 sentences per cell; discipline-specific terminology | Narrative notes per criterion permitted; cite relevant course learning outcomes if provided. |
| **Grad** | Narrative holistic (optional analytic) | 3-4 | Paragraph per level | Emphasis on argumentation, originality, methodology; taxonomies often omitted in favor of program-specific competencies. |

## 9. Evals (`skills/rubric/evals/evals.json`)

Five test prompts; each with 3-5 objective assertions.

1. **9th-grade persuasive essay, DOK-aligned.**
   Prompt: "Make a rubric for a 9th grade persuasive essay on climate policy, aligned to DOK, 4 criteria, 4 levels, 100 points."
   Assertions: file `rubric-*.md` exists; table has exactly 4 criteria rows and 4 level columns; every cell non-empty; DOK level tag present per criterion; point totals per criterion sum to 100 ±0.

2. **Elementary picture rubric.**
   Prompt: "1st grade rubric for drawing a self-portrait; 3 levels; no points."
   Assertions: 3 levels; no numeric scores; each descriptor ≤8 words; "I can" phrasing in student version.

3. **AP Bio lab report, CCSS/NGSS.**
   Prompt: "Analytic rubric for an AP Biology lab report on enzyme kinetics, aligned to NGSS practices, 5 criteria, 4 levels."
   Assertions: 5 criteria × 4 levels = 20 populated cells; ≥3 NGSS practice codes referenced; monotonically increasing points per criterion.

4. **Group project.**
   Prompt: "Rubric for a 7th grade group project on a historical figure; include individual contribution."
   Assertions: ≥1 criterion explicitly labeled "Individual Contribution"; ≥1 criterion addressing teamwork/collaboration; distinct teacher and student versions offered.

5. **College CS — coding project.**
   Prompt: "Rubric for a college intro-CS final project (Python), 4 criteria, 5 levels, 100 points."
   Assertions: criteria cover correctness, code quality, documentation, and design/testing (or near-synonyms); total points = 100; Bloom's tags attached; PDF generated via `pdf_render.py` exits 0.

All evals: no cell may be blank or literally repeat a neighboring cell; CSV must parse; point arithmetic must reconcile.

## 10. Edge cases

- **Group project rubrics** — add an explicit individual-accountability criterion; optionally emit a companion peer-evaluation form.
- **Self-assessment rubrics** — first-person phrasing, reflection prompts per criterion, no points (or student-assigned points with teacher column alongside).
- **Portfolio rubrics** — criteria evaluate the *collection* (growth, range, selection, reflection) not any single artifact.
- **Subject-specific:**
  - *Lab report*: hypothesis, methods, data/analysis, conclusion, scientific communication.
  - *Coding project*: correctness, code quality, testing, documentation, design.
  - *Art*: concept, craft/technique, use of medium, composition, reflection.
  - *Presentation*: content, organization, delivery, visuals, response to questions.
  - *Math problem set*: strategy, execution, justification, communication.
- **Standards-based grading (no points)** — emit 3-level Approaching/Meeting/Exceeding with mastery codes instead of numeric scores.
- **Single-point rubrics** — criteria column + "Areas for Growth" + "Areas of Strength"; no level matrix.
- **Accommodations / IEP** — if requested, generate an alternate rubric with modified criteria (e.g., scribed responses permitted, fewer required elements), clearly labeled.
- **Re-grading existing work** — if user supplies a rubric already in use and sample work, the skill scores the work against the rubric rather than generating a new one (hand off to a `grade-work` flow or offer to regenerate the rubric).
- **Very short prompts** ("rubric for writing") — ask one clarifying question (assignment type + grade) before guessing.
- **Non-English prompts** — detect language and mirror it in the output; taxonomy labels stay in English by default with a parenthetical translation on request.

## 11. Open questions

1. **Default alignment framework — Bloom's vs DOK?** Both are widely used; DOK is more common in US K-12 assessment circles, Bloom's in lesson planning and higher ed. Current proposal: **Bloom's as default**, switch to **DOK** when the prompt mentions assessment, state testing, or the user's subject is math/science. Revisit after dogfooding.
2. **Competing / overlapping standards** — if a prompt cites CCSS *and* a state standard that differs, do we show both, prefer state, or ask? Proposal: show both as tags on each criterion; ask only if they materially conflict.
3. **Points vs. qualitative default** — research leans qualitative (descriptors drive learning more than scores), but most teachers expect points. Proposal: points by default 6-12 and college; qualitative K-5; make the swap trivial.
4. **LMS export parity** — Google Classroom's rubric schema is the only widely-documented one. Canvas, Schoology, and Moodle formats differ. V1 ships Classroom + generic CSV; others are V2.
5. **Exemplar generation** — should the skill fabricate sample student work per level? Useful for teachers, but risks modeling sub-par writing. Proposal: off by default; opt-in with clear "AI-generated exemplar" watermark on the PDF.
6. **Rater-reliability guidance** — do we ship a short "how to use this rubric with consistency" teacher note alongside every rubric, or keep output clean? Proposal: offer as a flag, not default.
