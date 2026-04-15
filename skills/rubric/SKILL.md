---
name: rubric
description: Turn an assignment prompt into a ready-to-use grading rubric (a.k.a. scoring guide / grading guide) with zero blank cells. USE THIS SKILL when a teacher, professor, TA, or parent says "I need a rubric for…", "make me a scoring guide", "how should I grade this?", "build an analytic rubric", "holistic rubric for a narrative", "4-point mastery rubric", "rubric aligned to Bloom's / DOK / SOLO / CCSS / NGSS", "turn this assignment into a rubric", "student-facing rubric I can hand out", "grading criteria for [project]", "help me grade this essay", "what should I look for when grading", or "rubric for my kid's homeschool project". Handles K-2 through graduate, analytic or holistic, points or qualitative. Outputs markdown table + CSV with fully populated descriptors in every cell.
license: MIT
---

# rubric

Build defensible, fully-populated grading rubrics from an assignment prompt. Holistic or analytic, 3-6 criteria x 3-5 levels, aligned to Bloom's (default), DOK, SOLO, or standards. Every cell is written — no "TBD", no "same as above", no cells that are just "less of the previous level."

## When to trigger

Fire on any phrase combining "rubric / scoring guide / grading guide / criteria" with an assignment, or on any of these cues. Teachers rarely say "rubric" — cover the synonyms.

- "I need a rubric for [assignment]."
- "Make me a rubric for this essay."
- "Grade this essay assignment" / "help me grade…"
- "Build a scoring guide for [project]."
- "Write an analytic rubric for a lab report."
- "Holistic rubric for a 6th-grade narrative."
- "4-point mastery rubric for…"
- "Rubric aligned to DOK" / "aligned to Bloom's" / "aligned to CCSS."
- "Scoring criteria for a group project."
- "How should I grade this?"
- "Turn this assignment prompt into a rubric."
- "Make a student-facing rubric I can hand out."
- "What should I look for when grading [X]?"

## Inputs

**Required:**
- **Assignment prompt** — pasted text, uploaded PDF/DOCX, photo of a handout, or URL to a class page.

**Optional** (ask only if ambiguous after inference; otherwise use defaults from § Grade-band defaults):

- `grade` — K-2 | 3-5 | 6-8 | 9-12 | college | grad
- `subject` — ELA | math | science | social studies | CS | art | PE | world language | other
- `rubric_type` — `holistic` | `analytic`
- `criteria_count` — 3-6 (default 4)
- `levels_count` — 3-5 (default 4)
- `alignment` — `bloom` (default) | `dok` | `solo` | `ccss` | `ngss` | `state:<code>` | `ib` | `none`
- `scoring_style` — `points` | `qualitative` | `hybrid`
- `total_points` — integer (default 100 when `scoring_style=points`)
- `audience` — `teacher` (default) | `student` | `both`
- `outputs` — any subset of {`markdown`, `csv`, `classroom_csv`, `student_handout`}

## Inferring grade / assignment-type from phrasing (before asking)

Infer first; ask ONLY if you cannot confidently pin down the grade band AND the assignment type.

| Cue in user's phrasing | Likely grade band | Likely assignment type |
|---|---|---|
| "my kindergartener," "my 5yo," "picture rubric," "stars or smileys" | K-2 | performance / drawing / letter formation |
| "my 3rd grader," "book report," "show your work" | 3-5 | short essay / math problem set |
| "middle school," "5-paragraph essay," "historical figure project" | 6-8 | essay / group project / lab |
| "AP ___," "thesis statement," "persuasive essay," "MLA cited" | 9-12 | essay / lab report / research paper |
| "syllabus," "semester," "final project," "TA," "office hours" | college | capstone / coding project / paper |
| "dissertation," "proposal," "IRB," "cohort" | grad | thesis / proposal (narrative holistic) |
| "state test," "STAAR," "NWEA," "performance task" | — | prefer DOK alignment |
| "CCSS," "Common Core," "W.9-10.1" | — | prefer CCSS tags |
| "NGSS," "SEP," "phenomenon," "3-dimensional" | — | prefer NGSS SEP tags |
| "group project," "team," "collaborative" | — | add Individual Contribution + Collaboration criteria |
| "my ELL / newcomer / bilingual student" | — | mirror language; add plain-language student version |
| "my kid's homeschool" / "for my own kid" | use stated grade | grade-appropriate; home-friendly |

If grade is still unclear, ask ONE clarifying question in this exact shape:

> Quick check so I can calibrate this — which grade is this for? (e.g. **K · 3rd · 7th · 10th · college**)

Do not stack questions. Do not ask about alignment, levels, or points unless the user explicitly asks for tight customization.

## Workflow

1. **Ingest assignment prompt.** Accept text, URL (fetch), PDF/image (extract). If ingestion was non-trivial, confirm the extracted prompt back in 2-3 lines.
2. **Identify the task type.** Essay, lab report, project, presentation, coding assignment, portfolio, performance task, etc. Note the verbs used in the prompt ("analyze," "design," "compare," "evaluate").
3. **Pick taxonomy.** Default `bloom`. If the prompt mentions assessment / state testing / performance task, or the subject is math/science, prefer `dok`. If user supplied `alignment`, honor it. See `references/taxonomies.md` for verb banks + decision tree.
4. **Propose 3-6 criteria.** Observable, non-overlapping, one-trait-per-criterion. See `references/criterion-writing.md` for rules and criterion-set templates by assignment type.
5. **Generate level descriptors.** For each criterion x level cell, write a concrete, measurable descriptor. Use parallel phrasing + one quantifier ladder per row. No empty cells; no "same as above"; no "less of the previous." See `references/descriptor-phrasing.md`.
6. **Align & label.** Attach a taxonomy/standard tag per criterion, e.g. `*Analyze — Bloom's 4*` or `*CCSS.ELA-Literacy.W.9-10.1*`. For standards, see `references/standards-crosswalk.md`.
7. **Weight and score.** Default equal weights. If `scoring_style=points`, distribute `total_points` by weight, round to integers, and verify: (a) level points within each criterion are monotonically increasing, (b) criterion totals sum to `total_points` exactly.
8. **Self-check before emitting.** Every cell populated. Each row uses the same quantifier family. CSV shape valid. Point arithmetic reconciles.
9. **Emit outputs.** Markdown + CSV by default (see § Outputs). Print a one-line summary per file with absolute path.
10. **Offer refinements.** "Simplify for students?", "Re-weight?", "Swap criterion X for Y?", "Emit Google Classroom CSV?"

## Outputs

Default outputs (every run):

1. **Markdown table** — criteria as rows, levels as columns, full descriptors in every cell. Emit inline in chat.
2. **CSV** — one row per criterion. Columns: `criterion, weight, level_1_label, level_1_descriptor, level_1_points, …, level_N_label, level_N_descriptor, level_N_points, criterion_total`.

On request:

3. **Google Classroom CSV** — flat schema (one row per criterion x level): `criterion_title, criterion_description, level_title, level_points, level_description`.
4. **Student-facing handout** — markdown, plain-language "I can" phrasing, self-check column.
5. **Exemplar column** — sample student work pinned to each level (opt-in; watermarked "AI-generated exemplar").

Write files to `./rubric-<slug>-<timestamp>.<ext>` in the working directory. Slug = kebab-case of the assignment title (<=40 chars). Timestamp = `YYYYMMDD-HHMMSS`.

> **Printable PDF is coming in a later update.** The shared PDF renderer is not yet built. For now, teachers who need print can paste the markdown into Google Docs / Word and print from there, or import the CSV into their LMS.

## Grade-band defaults

Use these unless the user overrides. Full rationale in `references/frameworks.md`.

| Band     | Rubric type              | Levels | Scoring      | Language                                 |
|----------|--------------------------|--------|--------------|------------------------------------------|
| K-2      | Holistic, picture-based  | 3      | qualitative  | "I can…" sentences, <=8 words per cell   |
| 3-5      | Analytic, simple         | 3-4    | qualitative  | 1 sentence per cell, grade-appropriate   |
| 6-8      | Analytic                 | 4      | points       | 2 sentences per cell                     |
| 9-12     | Analytic                 | 4-5    | points       | 2-3 sentences per cell                   |
| college  | Analytic, detailed       | 4-5    | points       | 3-4 sentences per cell; discipline terms |
| grad     | Narrative holistic       | 3-4    | qualitative  | paragraph per level                      |

**Locked defaults:**

| Setting | Default |
|---|---|
| Taxonomy | **Bloom's** (switch to DOK via `alignment=dok` or when prompt mentions state testing / assessment) |
| Matrix | **4 criteria x 4 levels** when unspecified |
| Scoring — 6-12, college | **points** (total = 100) |
| Scoring — K-5 | **qualitative** (no numeric scores) |
| Scoring — grad | **qualitative** (narrative holistic) |
| Weighting | Equal across criteria |
| Outputs | markdown + CSV |
| Audience | teacher (offer student version as refinement) |

## Micro-example (what a generated rubric looks like — compact)

**User:** "4-point rubric for a 9th-grade persuasive essay on climate policy, 3 criteria, 100 points."

**Inferred:** grade 9 (explicit), subject=ELA, alignment=Bloom's (default), 3 criteria x 4 levels, 100 pts total, ~33 pts/criterion.
**No clarifying question needed.** Skill emits:

```
# Rubric: 9th-Grade Persuasive Essay — Climate Policy
Alignment: Bloom's · 3 criteria x 4 levels · 100 pts total (~33 per criterion)

| Criterion                          | 1 Beginning (8 pts)           | 2 Developing (17 pts)                    | 3 Proficient (26 pts)                               | 4 Exemplary (33 pts)                                                   |
|------------------------------------|-------------------------------|------------------------------------------|-----------------------------------------------------|------------------------------------------------------------------------|
| Claim & Thesis *Evaluate — Bloom's 5* | No debatable claim stated.    | Claim present but vague or non-debatable.| Clear, debatable claim stated in the introduction.  | Precise, nuanced claim that anticipates counterargument.               |
| Evidence & Reasoning *Analyze — Bloom's 4* | 0-1 sources; not tied to claim.| 2 sources; at least one loosely linked.  | 3+ cited sources, each tied to a specific claim.    | 4+ diverse sources with explicit warrant linking each to the claim.    |
| Language & Conventions *Apply — Bloom's 3* | Frequent errors impede meaning.| Occasional errors; meaning intact.       | Largely error-free; appropriate academic diction.   | Precise, varied syntax; deliberate rhetorical choices.                 |

Totals: 8+17+26+33 per criterion column · 24/51/78/99 grand total per level
CSV: ./rubric-climate-policy-essay-20260414-143022.csv
```

Followed by refinement offer: "Want a student-facing version with 'I can' phrasing? A Google Classroom CSV?"

## References (loaded on demand)

- `references/taxonomies.md` — Bloom's (revised 2001), Webb's DOK, SOLO. Verb banks. Selection decision tree.
- `references/frameworks.md` — 4-point mastery (default), 1-5 analytic, holistic 1-6, 3-level standards-based, single-point. Worked example.
- `references/criterion-writing.md` — observable-verb rules, one trait per criterion, non-overlap, student-friendly names, rater-reliability cap at 6, criterion-set templates by assignment type.
- `references/descriptor-phrasing.md` — parallel phrasing, quantifier ladders, concrete indicators, anti-patterns, self-check list.
- `references/standards-crosswalk.md` — CCSS (ELA, Math), NGSS SEPs/CCCs, C3, IB, state standard pointers. Tag syntax.
- `references/examples/*.md` — 8 worked rubrics across grade bands and subjects.

Load a reference only when the current task requires it (e.g., load `taxonomies.md` when picking DOK vs Bloom's; load `descriptor-phrasing.md` when writing cells).

## Edge cases

- **Group project** — include explicit "Individual Contribution" + "Collaboration" criteria. Offer a companion peer-evaluation form.
- **Self-assessment** — first-person phrasing, reflection prompt per criterion, student-assigned scores with teacher column alongside.
- **Portfolio** — criteria evaluate the collection (growth, range, selection, reflection), not individual artifacts.
- **Lab report** — Hypothesis · Methods · Data/Analysis · Conclusion · Scientific Communication.
- **Coding project** — Correctness · Code Quality · Testing · Documentation · Design.
- **Art** — Concept · Craft/Technique · Use of Medium · Composition · Reflection.
- **Presentation** — Content · Organization · Delivery · Visuals · Response to Questions.
- **Math problem set** — Strategy · Execution · Justification · Communication.
- **Standards-based grading (no points)** — 3-level Approaching / Meeting / Exceeding with mastery codes.
- **Single-point rubric** — criteria column + "Areas of Strength" + "Areas for Growth"; no level matrix.
- **Accommodations / IEP** — on request, emit an alternate rubric with modified criteria, clearly labeled.
- **Very short prompts** ("rubric for writing") — ask exactly one clarifying question (assignment type + grade) before guessing.
- **Non-English prompts** — mirror the prompt's language in descriptors; keep taxonomy labels in English with a parenthetical translation on request.
- **Re-grading existing work** — if the user supplies a rubric + sample work, this skill does NOT grade. Offer to regenerate the rubric.

## Quality bar

Every generated rubric must satisfy:

- Every cell has text. No blanks, no "TBD," no "same as above."
- Within each row, cells use the same quantifier family and describe the same features.
- Lowest level says what IS present, not just what's missing.
- Criterion tags reference the chosen taxonomy / standard using the syntax in `references/standards-crosswalk.md`.
- If `scoring_style=points`: level points monotonically increase within each criterion, and criterion totals sum to `total_points` exactly.
- CSV parses with the documented column schema.
- 3-6 criteria, 3-5 levels — no more, no less.

## What NOT to do

- Do not invent standards codes. If uncertain, describe the strand and note "Verify the specific code with your district."
- Do not leave any cell blank or write "same as above."
- Do not emit a rubric with more than 6 criteria (rater reliability collapses).
- Do not grade submitted student work — this skill builds rubrics, it does not score. Offer to hand off.
