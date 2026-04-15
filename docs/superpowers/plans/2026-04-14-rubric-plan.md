# Rubric Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `rubric` skill that turns an assignment prompt into a defensible grading rubric (markdown table + CSV + PDF) aligned to Bloom's (default), DOK, or SOLO, with grade-calibrated defaults (4×4 analytic for 6-12/college with points; holistic qualitative for K-5).

**Architecture:** Prompt-heavy skill with a progressive-disclosure `SKILL.md` (<300 lines) and detailed `references/*.md` loaded on demand. No skill-local scripts in V1 — PDF rendering uses shared `shared/scripts/pdf_render.py` with a new `shared/templates/rubric.html`. CSV is emitted directly by the model in a fixed schema. Evals assert structural invariants (cell counts, non-empty cells, point arithmetic, CSV parseability, PDF exit code).

**Tech Stack:** Markdown (SKILL.md + references), HTML/CSS (rubric PDF template), Python (shared pdf_render.py — already exists), JSON (evals), CSV (Google Classroom + generic schemas).

---

## File Structure

**Created in this plan:**

```
skills/rubric/
├── SKILL.md                              # Main skill entrypoint (<300 lines)
├── references/
│   ├── taxonomies.md                     # Bloom's + DOK + SOLO tables & verb banks
│   ├── frameworks.md                     # 4-point mastery, 1-5 analytic, holistic 1-6, 3-level SBG, single-point
│   ├── criterion-writing.md              # Best practices for writing criteria
│   ├── descriptor-phrasing.md            # Parallel phrasing, quantifier ladders, anti-patterns
│   ├── standards-crosswalk.md            # CCSS, NGSS, C3 quick pointers
│   └── examples/
│       ├── narrative-essay-9-12.md
│       ├── lab-report-ap-bio.md
│       ├── coding-project-college.md
│       ├── art-portfolio-6-8.md
│       ├── group-presentation-7.md
│       ├── kindergarten-letter-formation.md
│       ├── grad-thesis-proposal.md
│       └── math-problem-set-6-8.md
└── evals/
    └── evals.json                        # 5 prompts, objective assertions

shared/templates/
└── rubric.html                           # Landscape PDF template (repeating header)
```

**Responsibilities:**

- `SKILL.md` — triggers, inputs, workflow, output formats, grade-band defaults summary table, pointers into `references/`. Keep under 300 lines.
- `references/taxonomies.md` — three full taxonomies with verb banks; selection heuristics.
- `references/frameworks.md` — five rubric framework presets with worked examples.
- `references/criterion-writing.md` — observable-verb rules, non-overlap, one-trait-per-criterion, rater-reliability research.
- `references/descriptor-phrasing.md` — level-descriptor phrasing patterns + anti-patterns.
- `references/standards-crosswalk.md` — quick-reference standard codes.
- `references/examples/*.md` — 8 worked rubrics across grade bands / subjects.
- `shared/templates/rubric.html` — HTML template consumed by `pdf_render.py`, landscape, repeating thead for overflow.
- `evals/evals.json` — 5 prompts, each with 3-5 objective assertions.

**Not created (deferred or shared):**

- `scripts/` — no skill-local scripts in V1. `shared/scripts/pdf_render.py` is assumed to exist (built in the marketplace plan). If missing at implementation time, gate that dependency in Task 11.

---

## Task 1: Scaffold skill directory structure

**Files:**
- Create: `skills/rubric/SKILL.md` (empty stub)
- Create: `skills/rubric/references/.gitkeep`
- Create: `skills/rubric/references/examples/.gitkeep`
- Create: `skills/rubric/evals/.gitkeep`

- [ ] **Step 1: Create directories and placeholder files**

```bash
mkdir -p skills/rubric/references/examples skills/rubric/evals
touch skills/rubric/references/.gitkeep skills/rubric/references/examples/.gitkeep skills/rubric/evals/.gitkeep
```

- [ ] **Step 2: Create SKILL.md stub with frontmatter only**

```markdown
---
name: rubric
description: STUB — filled in Task 2
---
```

Write that to `skills/rubric/SKILL.md`.

- [ ] **Step 3: Verify directory layout**

Run: `ls -R skills/rubric`
Expected output includes `SKILL.md`, `references/examples/`, `evals/`.

- [ ] **Step 4: Commit**

```bash
git add skills/rubric/
git commit -m "feat(rubric): scaffold skill directory structure"
```

---

## Task 2: Write SKILL.md — description + triggers + inputs

**Files:**
- Modify: `skills/rubric/SKILL.md` (replace stub)

- [ ] **Step 1: Write the description frontmatter (pushy, 60-80 words, teacher + professor phrasings)**

Replace the file contents with:

```markdown
---
name: rubric
description: Turn an assignment prompt into a ready-to-use grading rubric (a.k.a. scoring guide / grading guide). Use whenever a teacher or professor says "I need a rubric for…", "make me a scoring guide", "how should I grade this?", "build an analytic rubric", "holistic rubric for a narrative", "4-point mastery rubric", "rubric aligned to Bloom's / DOK / CCSS / NGSS", "turn this assignment into a rubric", or "give me a student-facing rubric I can hand out". Handles K-2 through graduate. Outputs markdown table, CSV, and printable PDF with zero blank cells.
---

# rubric

Build defensible, fully-populated grading rubrics from an assignment prompt. Holistic or analytic, 3-6 criteria × 3-5 levels, aligned to Bloom's (default), DOK, SOLO, or standards. Every cell is written — no "TBD", no "same as above", no cells that are just "less of the previous level".
```

- [ ] **Step 2: Append the Triggers section (for fuzzy trigger coverage)**

Append:

```markdown
## Triggers

Fire on any of these (teachers rarely say "rubric" — cover the synonyms):

- "I need a rubric for [assignment]"
- "Make me a rubric for this essay"
- "Grade this essay assignment" / "help me grade…"
- "Build a scoring guide for [project]"
- "Write an analytic rubric for a lab report"
- "Holistic rubric for a 6th-grade narrative"
- "4-point mastery rubric for…"
- "Rubric aligned to DOK" / "aligned to Bloom's" / "aligned to CCSS"
- "Scoring criteria for a group project"
- "How should I grade this?"
- "Turn this assignment prompt into a rubric"
- "Make a student-facing rubric I can hand out"
```

- [ ] **Step 3: Append the Inputs section**

Append:

```markdown
## Inputs

**Required:**
- Assignment prompt — pasted text, uploaded PDF/DOCX, photo of a handout, or URL to a class page.

**Optional (ask only if ambiguous; otherwise use the defaults in § Grade-band defaults):**
- `grade` — K-2 | 3-5 | 6-8 | 9-12 | college | grad
- `subject` — ELA | math | science | social studies | CS | art | PE | world language | other
- `rubric_type` — `holistic` | `analytic`
- `criteria_count` — 3-6 (default 4)
- `levels_count` — 3-5 (default 4)
- `alignment` — `bloom` (default) | `dok` | `solo` | `ccss` | `ngss` | `state:<code>` | `ib` | `none`
- `scoring_style` — `points` | `qualitative` | `hybrid`
- `total_points` — integer (default 100 when scoring_style=points)
- `audience` — `teacher` (default) | `student` | `both`
- `outputs` — any subset of {`markdown`, `csv`, `pdf`, `classroom_csv`, `student_handout`}
```

- [ ] **Step 4: Verify the file is valid markdown with frontmatter**

Run: `head -3 skills/rubric/SKILL.md`
Expected: three lines — `---`, `name: rubric`, `description: Turn an assignment prompt...`

- [ ] **Step 5: Commit**

```bash
git add skills/rubric/SKILL.md
git commit -m "feat(rubric): add description, triggers, and inputs to SKILL.md"
```

---

## Task 3: SKILL.md — Workflow + Outputs sections

**Files:**
- Modify: `skills/rubric/SKILL.md`

- [ ] **Step 1: Append the Workflow section (9 numbered steps)**

Append:

```markdown
## Workflow

1. **Ingest assignment prompt.** Accept text, URL (fetch), PDF/image (extract). If ingestion was non-trivial, confirm the extracted prompt back to the user in 2-3 lines.
2. **Identify the task type.** Essay, lab report, project, presentation, coding assignment, portfolio, performance task, etc. Note the verbs used in the prompt ("analyze", "design", "compare", "evaluate").
3. **Pick taxonomy.** Default `bloom`. If the prompt mentions assessment, state testing, or the subject is math/science, prefer `dok`. If the user supplied `alignment`, honor it. See `references/taxonomies.md` for verb banks and selection heuristics.
4. **Propose 3-6 criteria.** Observable, non-overlapping, one-trait-per-criterion. See `references/criterion-writing.md`. Typical essay set: Thesis & Argument, Evidence & Analysis, Organization, Language & Conventions.
5. **Generate level descriptors.** For each criterion × level cell, write a concrete, measurable descriptor. Use parallel phrasing across levels. No empty cells; no "same as above"; no level that is only "less of the previous". See `references/descriptor-phrasing.md`.
6. **Align & label.** Attach a taxonomy/standard tag per criterion (e.g., *Analyze — Bloom's 4* or *CCSS.ELA-Literacy.W.9-10.1*). For standards, see `references/standards-crosswalk.md`.
7. **Weight and score.** Default equal weights. If `scoring_style=points`, distribute `total_points` by weight, round to integers, and verify: (a) level points within each criterion are monotonically increasing, (b) criterion totals sum to `total_points` exactly.
8. **Emit outputs.** Write markdown + CSV + PDF by default (see § Outputs). Print a one-line summary per file with its absolute path.
9. **Offer refinements.** "Simplify for students?", "Re-weight?", "Swap criterion X for Y?", "Emit Google Classroom CSV?"
```

- [ ] **Step 2: Append the Outputs section**

Append:

```markdown
## Outputs

Default outputs (every run):

1. **Markdown table** — criteria as rows, levels as columns, full descriptors in every cell. Emit inline in chat.
2. **CSV** — one row per criterion. Columns: `criterion, weight, level_1_label, level_1_descriptor, level_1_points, …, level_N_label, level_N_descriptor, level_N_points, criterion_total`.
3. **Printable PDF** — rendered via `shared/scripts/pdf_render.py` from `shared/templates/rubric.html`. Landscape; one page for 4×4 analytic; paginates gracefully otherwise.

On request:

4. **Google Classroom CSV** — flat schema (one row per level): `criterion_title, criterion_description, level_title, level_points, level_description`.
5. **Student-facing handout** — markdown + PDF, plain-language "I can" phrasing, self-check column.
6. **Exemplar column** — sample student work pinned to each level (opt-in; watermarked "AI-generated exemplar").

Write all files to `./rubric-<slug>-<timestamp>.<ext>` in the working directory. Slug = kebab-case of the assignment title (≤40 chars). Timestamp = `YYYYMMDD-HHMMSS`.

### How to render the PDF

```bash
python shared/scripts/pdf_render.py \
  --template shared/templates/rubric.html \
  --data <path-to-json-with-rubric-data> \
  --out ./rubric-<slug>-<timestamp>.pdf \
  --landscape
```

The JSON payload must contain: `title`, `grade`, `subject`, `alignment`, `scoring_style`, `total_points`, `criteria[]` (each with `name`, `weight`, `tag`, `levels[]`), and `levels[]` (each with `label`, `points`).
```

- [ ] **Step 3: Verify line count still under 300**

Run: `wc -l skills/rubric/SKILL.md`
Expected: line count < 300.

- [ ] **Step 4: Commit**

```bash
git add skills/rubric/SKILL.md
git commit -m "feat(rubric): add workflow and outputs sections to SKILL.md"
```

---

## Task 4: SKILL.md — Grade-band defaults table + References index + Edge cases

**Files:**
- Modify: `skills/rubric/SKILL.md`

- [ ] **Step 1: Append Grade-band defaults section**

Append:

```markdown
## Grade-band defaults

Use these unless the user overrides. Summary; full rationale in `references/frameworks.md`.

| Band     | Rubric type              | Levels | Scoring      | Language                                 |
|----------|--------------------------|--------|--------------|------------------------------------------|
| K-2      | Holistic, picture-based  | 3      | qualitative  | "I can…" sentences, ≤8 words per cell    |
| 3-5      | Analytic, simple         | 3-4    | qualitative  | 1 sentence per cell, grade-appropriate   |
| 6-8      | Analytic                 | 4      | points       | 2 sentences per cell                     |
| 9-12     | Analytic                 | 4-5    | points       | 2-3 sentences per cell                   |
| college  | Analytic, detailed       | 4-5    | points       | 3-4 sentences per cell; discipline terms |
| grad     | Narrative holistic       | 3-4    | qualitative  | paragraph per level                      |

**Locked defaults:**
- Taxonomy: **Bloom's** (switch to DOK via `alignment=dok` or when the prompt mentions state testing / assessment).
- Matrix: **4 criteria × 4 levels** when unspecified.
- Scoring: **points** for 6-12 and college; **qualitative** for K-5.
```

- [ ] **Step 2: Append References index**

Append:

```markdown
## References (loaded on demand)

- `references/taxonomies.md` — Bloom's (revised 2001), Webb's DOK, SOLO. Verb banks. Taxonomy-selection heuristics.
- `references/frameworks.md` — 4-point mastery (default), 1-5 analytic, holistic 1-6, 3-level standards-based, single-point.
- `references/criterion-writing.md` — observable verbs, one trait per criterion, non-overlap, student-friendly names, rater-reliability cap at 6.
- `references/descriptor-phrasing.md` — parallel phrasing patterns, quantifier ladders, anti-patterns.
- `references/standards-crosswalk.md` — CCSS (ELA, Math), NGSS SEPs/CCCs, C3, state portals.
- `references/examples/*.md` — 8 worked rubrics across grade bands and subjects.

Load a reference only when the current task requires it (e.g., load `taxonomies.md` when picking DOK vs Bloom's; load `descriptor-phrasing.md` when writing cells).
```

- [ ] **Step 3: Append Edge cases section**

Append:

```markdown
## Edge cases

- **Group project** — include an explicit "Individual Contribution" criterion and a "Collaboration" criterion. Offer a companion peer-evaluation form.
- **Self-assessment** — first-person phrasing, reflection prompt per criterion, student-assigned scores with teacher column alongside.
- **Portfolio** — criteria evaluate the collection (growth, range, selection, reflection), not individual artifacts.
- **Lab report** — hypothesis, methods, data/analysis, conclusion, scientific communication.
- **Coding project** — correctness, code quality, testing, documentation, design.
- **Art** — concept, craft/technique, use of medium, composition, reflection.
- **Presentation** — content, organization, delivery, visuals, response to questions.
- **Math problem set** — strategy, execution, justification, communication.
- **Standards-based grading (no points)** — 3-level Approaching / Meeting / Exceeding with mastery codes.
- **Single-point rubric** — criteria column + "Areas of Strength" + "Areas for Growth"; no level matrix.
- **Accommodations / IEP** — on request, emit an alternate rubric with modified criteria (scribed responses permitted, fewer required elements), clearly labeled.
- **Very short prompts** ("rubric for writing") — ask exactly one clarifying question (assignment type + grade) before guessing.
- **Non-English prompts** — mirror the prompt's language in descriptors; keep taxonomy labels in English with a parenthetical translation on request.
- **Re-grading existing work** — if the user supplies a rubric + sample work, this skill does NOT grade. Offer to regenerate the rubric or hand off.
```

- [ ] **Step 4: Verify final SKILL.md is under 300 lines**

Run: `wc -l skills/rubric/SKILL.md`
Expected: line count < 300. If over, trim prose; do not delete any section.

- [ ] **Step 5: Commit**

```bash
git add skills/rubric/SKILL.md
git commit -m "feat(rubric): add grade-band defaults, references index, edge cases"
```

---

## Task 5: Write `references/taxonomies.md`

**Files:**
- Create: `skills/rubric/references/taxonomies.md`

- [ ] **Step 1: Write Bloom's Taxonomy (Revised 2001) section**

Write to the file:

```markdown
# Taxonomies Reference

The three cognitive taxonomies this skill can align to, with verb banks and selection heuristics.

## Bloom's Taxonomy (Revised, Anderson & Krathwohl, 2001) — DEFAULT

Six cognitive levels, from concrete to abstract. Most common in lesson planning and higher ed.

| Level | Label       | Description                                         | Verb bank (use in criterion names & descriptors)                                               |
|------:|-------------|-----------------------------------------------------|-----------------------------------------------------------------------------------------------|
| 1     | Remember    | Retrieve relevant knowledge from memory             | define, list, recall, identify, name, recognize, label, state, describe, match                 |
| 2     | Understand  | Construct meaning from instructional messages       | explain, summarize, paraphrase, classify, compare, interpret, infer, exemplify, illustrate     |
| 3     | Apply       | Use a procedure in a given situation                | execute, implement, use, solve, demonstrate, calculate, show, operate                          |
| 4     | Analyze     | Break material into parts; detect relationships     | differentiate, organize, attribute, deconstruct, outline, integrate, compare, contrast         |
| 5     | Evaluate    | Make judgments based on criteria and standards      | critique, judge, justify, defend, argue, appraise, assess, recommend, prioritize               |
| 6     | Create      | Put elements together to form a coherent whole      | design, construct, produce, plan, generate, compose, author, invent, devise, synthesize        |

**How to tag criteria:** `*<Verb> — Bloom's <level-number>*`. Example: `*Analyze — Bloom's 4*`.
```

- [ ] **Step 2: Append Webb's Depth of Knowledge (DOK) section**

Append:

```markdown
## Webb's Depth of Knowledge (DOK) — default for math/science assessment

Four cognitive-demand levels. Widely used in US K-12 state assessment and standards documents.

| DOK | Label                 | Description                                                       | Verb / task bank                                                                 |
|----:|-----------------------|-------------------------------------------------------------------|----------------------------------------------------------------------------------|
| 1   | Recall & Reproduction | Recall a fact, term, or simple procedure                          | recall, identify, compute, define, list, measure                                 |
| 2   | Skills & Concepts     | Use information or conceptual knowledge; two or more steps        | summarize, estimate, classify, organize, compare, interpret a graph              |
| 3   | Strategic Thinking    | Requires reasoning, planning, evidence; more than one correct path| justify, cite evidence, formulate, hypothesize, critique, investigate            |
| 4   | Extended Thinking     | Requires extended investigation, synthesis across sources, time   | design and conduct an experiment, develop a model, author an extended argument   |

**How to tag:** `*DOK <n>: <label>*`. Example: `*DOK 3: Strategic Thinking*`.

**Selection heuristic:** Prefer DOK when the prompt mentions state testing, performance tasks, or cognitive rigor. Most math & science prompts fit DOK more naturally than Bloom's.
```

- [ ] **Step 3: Append SOLO Taxonomy section**

Append:

```markdown
## SOLO Taxonomy (Biggs & Collis, 1982)

Five structural complexity levels. Useful for narrative / extended-writing rubrics; maps cleanly onto holistic scoring.

| Level | Label              | Description                                                           |
|------:|--------------------|-----------------------------------------------------------------------|
| 1     | Prestructural      | Misses the point; unrelated information                               |
| 2     | Unistructural      | One relevant aspect addressed                                         |
| 3     | Multistructural    | Several relevant aspects, but treated independently                   |
| 4     | Relational         | Aspects integrated into a coherent structure                          |
| 5     | Extended Abstract  | Generalized beyond the given context; hypothesizes, theorizes         |

**How to tag:** `*SOLO <n>: <label>*`.

**Selection heuristic:** Prefer SOLO for holistic ELA or humanities rubrics where the quality question is "how integrated / how generalized is the student's thinking?"
```

- [ ] **Step 4: Append taxonomy-selection decision tree**

Append:

````markdown
## Which taxonomy should I pick?

```
Did the user specify one?
├── Yes → Use it.
└── No → Does the prompt mention state testing, assessment rigor, or performance task?
         ├── Yes → DOK
         └── No → Is subject math, science, or CS?
                  ├── Yes → DOK (preferred); Bloom's acceptable
                  └── No → Is it a holistic essay / extended-writing rubric?
                           ├── Yes → SOLO
                           └── No → Bloom's (default)
```

When uncertain, Bloom's is the safe default — it's the most widely recognized across audiences.
````

- [ ] **Step 5: Commit**

```bash
git add skills/rubric/references/taxonomies.md
git commit -m "feat(rubric): add taxonomies reference (Bloom's, DOK, SOLO)"
```

---

## Task 6: Write `references/frameworks.md`

**Files:**
- Create: `skills/rubric/references/frameworks.md`

- [ ] **Step 1: Write framework catalog**

Write to the file:

````markdown
# Rubric Frameworks Reference

Five rubric frameworks with worked examples. Pick a framework before writing criteria — the framework determines the column structure.

## 1. 4-Point Mastery (DEFAULT)

Four performance levels: Beginning → Developing → Proficient → Exemplary.

| Level | Label      | Typical points | Meaning                                                       |
|------:|------------|----------------|---------------------------------------------------------------|
| 1     | Beginning  | 25% of total   | Minimal evidence; significant gaps                            |
| 2     | Developing | 50% of total   | Partial evidence; some gaps                                   |
| 3     | Proficient | 75-85% of total| Meets expectations for the grade level                        |
| 4     | Exemplary  | 100% of total  | Exceeds expectations; sophisticated demonstration             |

**Point distribution example** (100 total, 4 criteria, equal weight, 25 points each):
Level 1 = 6 pts, Level 2 = 13 pts, Level 3 = 19 pts, Level 4 = 25 pts. Round down so the top level hits the criterion total exactly.

## 2. 1-5 Analytic

Five levels: Far Below / Below / Approaches / Meets / Exceeds. Use when the user asks for "5 levels" or for high-stakes assessments where middle granularity matters.

## 3. Holistic 1-6 (AP-style)

Six levels, descriptor paragraph per level, no per-criterion breakdown. Use for single-trait holistic scoring (e.g., AP essay). Output is a single column of 6 descriptor paragraphs, not a matrix.

## 4. 3-Level Standards-Based

Three levels: Approaching Standard / Meeting Standard / Exceeding Standard. No points by default; attach a mastery code per criterion (e.g., `CCSS.ELA-Literacy.W.9-10.1.B`).

## 5. Single-Point Rubric

Single column of criteria with target descriptors. Two side columns: "Areas of Strength" (left blank for teacher annotation) and "Areas for Growth" (left blank). No level matrix, no points. Popular with formative-assessment communities.

## Worked example: 4-point mastery, 9th-grade persuasive essay

Criteria (4): Claim & Thesis · Evidence & Reasoning · Organization · Language & Conventions.
100 points total · 25 points per criterion · equal weight.

| Criterion            | 1 Beginning (6 pts)       | 2 Developing (13 pts)           | 3 Proficient (19 pts)                      | 4 Exemplary (25 pts)                                                |
|----------------------|----------------------------|---------------------------------|--------------------------------------------|---------------------------------------------------------------------|
| Claim & Thesis       | No clear claim             | Claim present but vague         | Clear, debatable claim stated early        | Nuanced, precise claim anticipating counterargument                 |
| Evidence & Reasoning | Few or irrelevant sources  | Some evidence; weak links       | Adequate, cited evidence linked to claim   | Integrated, diverse evidence with explicit warrant for each link    |
| Organization         | No discernible structure   | Partial structure; abrupt shifts| Clear structure; transitions present       | Intentional structure that builds cumulative force                  |
| Language & Conventions| Frequent errors impede meaning | Errors occasional; meaning intact | Largely error-free; appropriate diction  | Precise, varied syntax; deliberate rhetorical choices              |

## Which framework should I pick?

```
User specified levels count?
├── 3 levels           → 3-Level Standards-Based
├── 4 levels (default) → 4-Point Mastery
├── 5 levels           → 1-5 Analytic
└── 6 levels           → Holistic 1-6 (single column)

User said "single-point"? → Single-Point Rubric (no matrix)
User said "holistic"?     → Holistic 1-6
```
````

- [ ] **Step 2: Commit**

```bash
git add skills/rubric/references/frameworks.md
git commit -m "feat(rubric): add frameworks reference with worked 4-point example"
```

---

## Task 7: Write `references/criterion-writing.md`

**Files:**
- Create: `skills/rubric/references/criterion-writing.md`

- [ ] **Step 1: Write the full criterion-writing guide**

Write to the file:

````markdown
# Criterion-Writing Best Practices

How to name and scope the rows of a rubric. Get this right before writing any descriptors.

## Rules

1. **One trait per criterion.** "Organization AND grammar" is two criteria, not one. A student can be strong in one and weak in the other.
2. **Observable, not inferential.** "Shows effort" is not observable; "submits all required drafts" is. Use verbs from the Bloom's / DOK verb banks.
3. **Non-overlapping.** If evidence for Criterion A would also score Criterion B, merge them or redraw the boundary. Overlap is the #1 cause of double-counting.
4. **Student-friendly name on the student version.** Teacher name: "Use of textual evidence with inline citations." Student name: "Backing up claims with quotes."
5. **3-6 criteria maximum.** Rater-reliability research (Jonsson & Svingby, 2007; Brookhart, 2013) shows reliability drops sharply past 6 criteria — raters can't hold more in mind at once. Fewer is usually better.
6. **Every criterion must be gradable from the submitted work alone.** No criterion that requires observing process the teacher didn't see (unless process is explicitly submitted, e.g., drafts).
7. **Weight by importance, not by length.** A 10-point "Thesis" criterion is fine even if the thesis is one sentence — weight reflects instructional priority, not word count.

## Criterion-set templates by assignment type

- **Essay (any grade):** Thesis/Claim · Evidence & Reasoning · Organization · Language & Conventions
- **Lab report:** Hypothesis & Background · Methods · Data & Analysis · Conclusion · Scientific Communication
- **Coding project:** Correctness · Code Quality · Testing · Documentation · Design
- **Presentation:** Content · Organization · Delivery · Visuals · Response to Questions
- **Group project:** Content Quality · Collaboration · Individual Contribution · Final Product · Reflection
- **Art portfolio:** Concept · Craft/Technique · Use of Medium · Composition · Reflection
- **Math problem set:** Strategy · Execution · Justification · Communication
- **Performance task (K-5):** Following Directions · Effort/Persistence · Quality of Work · Sharing/Explaining

## Red flags — never write these as criteria

- "Creativity" (subjective; prefer "originality of <specific element>")
- "Effort" (not observable from submitted work)
- "Neatness" alone (prefer "legibility" with concrete indicators)
- "Overall quality" (too vague; this is what the whole rubric measures)
- Any criterion that's a negation ("avoids plagiarism" — make it positive: "attributes sources")

## Weighting guidance

- **Equal weights** are a defensible default.
- **Unequal weights** must be justifiable from the assignment prompt. If the prompt says "your argument is the most important part," weight argument higher.
- **Keep weights round.** 40/30/20/10 is easier to compute than 37/28/22/13 and students trust it more.
````

- [ ] **Step 2: Commit**

```bash
git add skills/rubric/references/criterion-writing.md
git commit -m "feat(rubric): add criterion-writing best-practices reference"
```

---

## Task 8: Write `references/descriptor-phrasing.md`

**Files:**
- Create: `skills/rubric/references/descriptor-phrasing.md`

- [ ] **Step 1: Write descriptor-phrasing patterns and anti-patterns**

Write to the file:

````markdown
# Level-Descriptor Phrasing Reference

How to write the cells inside the rubric so levels are distinguishable, parallel, and concrete.

## Rule 1: Parallel structure across levels

Each cell in a row must describe the **same features** at different quality levels. If Level 3 says "The student cites 3+ sources," Level 2 should also talk about source count — not suddenly introduce tone.

**Bad (features shift across levels):**
- L1: "Few sources."
- L2: "Writing is unclear."            ← feature switched
- L3: "Uses 3 sources correctly."
- L4: "Sophisticated argument."        ← feature switched again

**Good (features parallel across levels):**
- L1: "Cites 0-1 sources; sources not tied to claims."
- L2: "Cites 2 sources; at least one loosely tied to a claim."
- L3: "Cites 3+ sources; each tied to a specific claim."
- L4: "Cites 4+ sources, each with explicit warrant linking evidence to claim and anticipating counter-evidence."

## Rule 2: Use quantifier ladders

Pick one quantifier family per row and stick to it. Mixing ("often" in L3, "most" in L4) confuses readers.

**Frequency ladder:** rarely → sometimes → usually → consistently → always
**Coverage ladder:** few / some / most / all → (or: none / some / most / all)
**Quality ladder:** limited → partial → clear → sophisticated
**Accuracy ladder:** many errors → occasional errors → minor errors → no errors that impede meaning
**Independence ladder:** with substantial help → with some help → independently → independently and extends to new contexts

## Rule 3: Make each level substantive, not subtractive

A level defined only as "less than the previous" is a failure. Each cell must describe what IS present at that level, not just what is missing.

**Bad:** "L2: Does not meet all L3 criteria."
**Good:** "L2: Claim is stated but not debatable; evidence listed without connection to claim."

## Rule 4: Concrete indicators over adjectives

Replace aesthetic adjectives with observable indicators.

| Replace…           | With…                                                                    |
|--------------------|--------------------------------------------------------------------------|
| "well-organized"   | "uses topic sentences and transitions between paragraphs"                |
| "strong evidence"  | "cites at least 3 sources, each quoted or paraphrased with citation"     |
| "creative"         | "uses at least one original example not given in class discussion"       |
| "clear writing"    | "sentences average 15-25 words; no run-ons; consistent subject-verb agreement" |
| "engaging"         | "opens with a hook; uses at least 2 rhetorical devices intentionally"    |

## Rule 5: Length parity

Cells within the same row should be roughly the same length. Huge length disparity ("L1 = 3 words, L4 = 50 words") signals under-written low levels. Fill them out.

## Anti-patterns to strike on sight

- **"Same as above."** Rewrite it.
- **"See level 3."** Rewrite it.
- **Negation chains.** "Does not lack clarity." → "Is clear."
- **Comparative-only descriptors.** "Better organization than L2." → Describe what organization looks like at L3.
- **Subjective aesthetics alone.** "Beautiful writing." → Use observable indicators (see Rule 4).
- **Conjoined traits.** "Clear and creative and well-cited." → Split into separate criteria.
- **Time-based descriptors.** "Submitted on time" is a separate compliance issue, not part of quality descriptors.

## Self-check before emitting

1. Every cell has text. (No blanks, no "TBD", no ellipses.)
2. Within each row, cells use the same quantifier family and describe the same features.
3. Lowest level says what IS present, not just what's missing.
4. Adjacent cells can be told apart by a specific, observable difference.
5. No cell is more than 2× the length of any other cell in the same row.
````

- [ ] **Step 2: Commit**

```bash
git add skills/rubric/references/descriptor-phrasing.md
git commit -m "feat(rubric): add descriptor-phrasing reference with anti-patterns"
```

---

## Task 9: Write `references/standards-crosswalk.md`

**Files:**
- Create: `skills/rubric/references/standards-crosswalk.md`

- [ ] **Step 1: Write the standards crosswalk reference**

Write to the file:

````markdown
# Standards Crosswalk

Quick pointers for attaching standards to criteria. This is NOT a complete standards database — it's a code-shape reference so the skill can tag criteria correctly when the user supplies or mentions a standard.

## Common Core State Standards (CCSS)

### ELA code shape

`CCSS.ELA-Literacy.<strand>.<grade>.<number>[.<sub>]`

- Strands: `RL` (Reading Literature), `RI` (Reading Informational), `W` (Writing), `SL` (Speaking & Listening), `L` (Language).
- Grades: `K` through `12`; high-school bands are `9-10` and `11-12`.
- Examples: `CCSS.ELA-Literacy.W.9-10.1` (argument writing), `CCSS.ELA-Literacy.RL.6.1` (textual evidence, grade 6).

### Math code shape

`CCSS.Math.Content.<grade>.<domain>.<cluster>.<standard>`

- Grades: `K` through `8`; HS uses `HSA`, `HSF`, `HSG`, `HSN`, `HSS` (domains, not grades).
- Example: `CCSS.Math.Content.7.RP.A.2` (proportional relationships).

### Practice standards (use as criterion tags for any math rubric)

`CCSS.Math.Practice.MP1` … `MP8` — Make sense of problems / Reason abstractly / Construct arguments / Model / Use tools / Attend to precision / Look for structure / Look for regularity.

## Next Generation Science Standards (NGSS)

### Performance expectation shape

`<grade-or-band>-<DCI-code>-<number>` — e.g., `HS-LS1-2`, `MS-PS2-1`, `5-PS1-3`.

### Science & Engineering Practices (SEPs) — preferred criterion tags

1. Asking questions / defining problems
2. Developing and using models
3. Planning and carrying out investigations
4. Analyzing and interpreting data
5. Using mathematics and computational thinking
6. Constructing explanations / designing solutions
7. Engaging in argument from evidence
8. Obtaining, evaluating, and communicating information

### Crosscutting Concepts (CCCs)

1. Patterns · 2. Cause and effect · 3. Scale, proportion, quantity · 4. Systems and system models · 5. Energy and matter · 6. Structure and function · 7. Stability and change.

## C3 Framework (Social Studies)

Four-dimension structure: `D1` Developing Questions · `D2` Applying Disciplinary Concepts · `D3` Evaluating Sources and Using Evidence · `D4` Communicating Conclusions.

Indicator shape: `D<n>.<discipline-code>.<grade-band>` — e.g., `D2.Civ.1.9-12`.

## IB (International Baccalaureate)

IB assessment criteria are subject-specific (e.g., MYP Language & Literature has criteria A-D). When a prompt mentions IB, ask for the subject and year; don't guess.

## State standards

When a user references a state standard (e.g., "TEKS", "BEST Standards", "NY Next Generation"), treat the code as opaque and tag criteria with the verbatim code the user supplied. Do not attempt to decode state codes unless the user provides the mapping.

## Tagging syntax in rubrics

Append the tag in italics after the criterion name, separated by an em-dash or comma:

- `Thesis & Argument — *CCSS.ELA-Literacy.W.9-10.1*`
- `Data Analysis — *NGSS SEP 4*`
- `Historical Sourcing — *C3 D3.His.14.9-12*`

If multiple standards apply, comma-separate: `*CCSS.ELA-Literacy.W.9-10.1, Bloom's 5*`.
````

- [ ] **Step 2: Commit**

```bash
git add skills/rubric/references/standards-crosswalk.md
git commit -m "feat(rubric): add standards crosswalk reference"
```

---

## Task 10: Write `references/examples/` — 8 worked rubrics

**Files:**
- Create: `skills/rubric/references/examples/narrative-essay-9-12.md`
- Create: `skills/rubric/references/examples/lab-report-ap-bio.md`
- Create: `skills/rubric/references/examples/coding-project-college.md`
- Create: `skills/rubric/references/examples/art-portfolio-6-8.md`
- Create: `skills/rubric/references/examples/group-presentation-7.md`
- Create: `skills/rubric/references/examples/kindergarten-letter-formation.md`
- Create: `skills/rubric/references/examples/grad-thesis-proposal.md`
- Create: `skills/rubric/references/examples/math-problem-set-6-8.md`

- [ ] **Step 1: narrative-essay-9-12.md — 4×4 analytic, Bloom's, 100 points**

Write a complete rubric file with: frontmatter (title, grade, subject, alignment, framework, total_points), brief assignment description (2-3 sentences), full 4-criterion × 4-level markdown table with every cell populated (Thesis/Narrative Arc · Character & Setting · Language & Voice · Conventions), criterion tags referencing Bloom's levels, and a "Notes for teachers" paragraph at the end.

- [ ] **Step 2: lab-report-ap-bio.md — 5×4 analytic, NGSS SEPs**

Same structure; 5 criteria (Hypothesis & Background · Methods · Data & Analysis · Conclusion · Scientific Communication), each tagged with an NGSS SEP code; 4 levels (Beginning → Exemplary); 100 points with weights 15/20/30/20/15. Every cell populated.

- [ ] **Step 3: coding-project-college.md — 4×5 analytic, Bloom's, 100 points**

4 criteria (Correctness · Code Quality · Testing · Design & Documentation) × 5 levels (1-5); Python intro final project; Bloom's tags. Every cell populated.

- [ ] **Step 4: art-portfolio-6-8.md — 5×3 analytic, SOLO, qualitative**

5 criteria (Concept · Craft/Technique · Use of Medium · Composition · Reflection) × 3 levels (Approaching / Meeting / Exceeding); SOLO tags; no points. Every cell populated.

- [ ] **Step 5: group-presentation-7.md — 5×4 analytic with required Individual Contribution criterion**

5 criteria (Content · Organization · Delivery · Visuals · Individual Contribution) × 4 levels; 100 points; Bloom's tags; includes companion peer-evaluation form below the main rubric. Every cell populated.

- [ ] **Step 6: kindergarten-letter-formation.md — 3×3 picture rubric, qualitative, "I can" language**

3 criteria (I can form the letter · I can stay on the line · I can space my letters) × 3 levels (smiley / neutral / trying); no points; each cell ≤8 words; "I can" phrasing throughout.

- [ ] **Step 7: grad-thesis-proposal.md — 4×4 narrative holistic, program-competency aligned**

4 criteria (Originality & Significance · Literature Engagement · Methodology · Scholarly Communication) × 4 levels; each cell is a paragraph (3-5 sentences); no taxonomic tags (grad uses program-specific competencies); qualitative.

- [ ] **Step 8: math-problem-set-6-8.md — 4×4 analytic, DOK, 100 points**

4 criteria (Strategy · Execution · Justification · Communication) × 4 levels; DOK tags; 100 points, weights 25/25/30/20.

- [ ] **Step 9: Verify every example file has zero blank cells and parallel phrasing**

For each file, spot-check: every `|` row inside the table has the same number of non-empty columns; no cell says "same as above", "TBD", or is a single word.

- [ ] **Step 10: Commit**

```bash
git add skills/rubric/references/examples/
git commit -m "feat(rubric): add 8 worked rubric examples across grade bands and subjects"
```

---

## Task 11: Write `shared/templates/rubric.html`

**Files:**
- Create: `shared/templates/rubric.html`

- [ ] **Step 1: Write landscape-oriented HTML template**

Write to the file a self-contained HTML template with:

- `<!DOCTYPE html>` + `<html>` + `<head>` with `<meta charset="utf-8">` and inline `<style>`.
- `@page { size: Letter landscape; margin: 0.5in; }` in CSS.
- Table with `thead` that uses `display: table-header-group;` so headers repeat across pages.
- Template-variable syntax consumed by `shared/scripts/pdf_render.py` (whatever engine that script uses — Jinja2 is typical). The README inside the file header should note: "This template expects a data dict with `title`, `grade`, `subject`, `alignment`, `scoring_style`, `total_points`, `criteria` (list of dicts with `name`, `weight`, `tag`, `levels` list of descriptor strings), and `levels` (list of dicts with `label` and `points`)."
- Top banner: title, grade/subject, alignment tag, total points.
- Table columns: Criterion (with weight + tag), then one column per level (label + points).
- Table rows: one per criterion, with descriptor cells.
- CSS: `table { border-collapse: collapse; width: 100%; }`, `th, td { border: 1px solid #333; padding: 6px 8px; vertical-align: top; font-size: 10pt; }`, `th { background: #f2f2f2; }`, `.criterion { width: 18%; font-weight: 600; }`.
- A footer line: `Generated by school-skills/rubric on {{generated_at}}`.

- [ ] **Step 2: Sanity-check the template renders valid HTML**

Run: `python -c "from html.parser import HTMLParser; import sys; HTMLParser().feed(open('shared/templates/rubric.html').read()); print('ok')"`
Expected: `ok`.

- [ ] **Step 3: Verify `shared/scripts/pdf_render.py` exists (dependency check)**

Run: `test -f shared/scripts/pdf_render.py && echo "ok" || echo "MISSING — build this in the marketplace plan before running rubric evals"`
Expected: `ok`. If `MISSING`, note in the commit message and continue — the SKILL.md still works; only the PDF eval assertion will need the script to be present.

- [ ] **Step 4: Commit**

```bash
git add shared/templates/rubric.html
git commit -m "feat(rubric): add landscape rubric HTML template for PDF rendering"
```

---

## Task 12: Write `evals/evals.json`

**Files:**
- Create: `skills/rubric/evals/evals.json`

- [ ] **Step 1: Write the 5 evals with objective assertions**

Write to the file:

```json
{
  "skill": "rubric",
  "evals": [
    {
      "id": "rubric-01-persuasive-essay-dok",
      "prompt": "Make a rubric for a 9th grade persuasive essay on climate policy, aligned to DOK, 4 criteria, 4 levels, 100 points.",
      "assertions": [
        {"type": "file_exists", "glob": "./rubric-*.md"},
        {"type": "markdown_table_shape", "file_glob": "./rubric-*.md", "rows": 4, "cols": 5, "note": "4 criteria rows + 1 header row; 1 criterion col + 4 level cols"},
        {"type": "no_empty_cells", "file_glob": "./rubric-*.md"},
        {"type": "regex_match_each_row", "file_glob": "./rubric-*.md", "pattern": "DOK\\s*[1-4]", "scope": "criterion_column"},
        {"type": "points_sum", "file_glob": "./rubric-*.csv", "expected": 100, "tolerance": 0}
      ]
    },
    {
      "id": "rubric-02-kindergarten-self-portrait",
      "prompt": "1st grade rubric for drawing a self-portrait; 3 levels; no points.",
      "assertions": [
        {"type": "markdown_table_shape", "file_glob": "./rubric-*.md", "cols": 4, "note": "1 criterion col + 3 level cols"},
        {"type": "no_numeric_scores", "file_glob": "./rubric-*.md"},
        {"type": "cell_max_words", "file_glob": "./rubric-*.md", "max_words": 8},
        {"type": "regex_match_any", "file_glob": "./rubric-*student*.md", "pattern": "^I can\\b", "scope": "cells"}
      ]
    },
    {
      "id": "rubric-03-ap-bio-lab-report",
      "prompt": "Analytic rubric for an AP Biology lab report on enzyme kinetics, aligned to NGSS practices, 5 criteria, 4 levels.",
      "assertions": [
        {"type": "markdown_table_shape", "file_glob": "./rubric-*.md", "rows": 5, "cols": 5},
        {"type": "populated_cell_count", "file_glob": "./rubric-*.md", "expected": 20},
        {"type": "regex_count", "file_glob": "./rubric-*.md", "pattern": "SEP\\s*[1-8]", "min": 3},
        {"type": "monotonic_points_per_row", "file_glob": "./rubric-*.csv", "direction": "increasing"}
      ]
    },
    {
      "id": "rubric-04-group-project",
      "prompt": "Rubric for a 7th grade group project on a historical figure; include individual contribution.",
      "assertions": [
        {"type": "criterion_name_contains", "file_glob": "./rubric-*.md", "needle": "Individual Contribution"},
        {"type": "criterion_name_matches_any", "file_glob": "./rubric-*.md", "patterns": ["Collaboration", "Teamwork", "Group Work"]},
        {"type": "file_exists", "glob": "./rubric-*-teacher.md"},
        {"type": "file_exists", "glob": "./rubric-*-student.md"}
      ]
    },
    {
      "id": "rubric-05-college-cs-coding-project",
      "prompt": "Rubric for a college intro-CS final project (Python), 4 criteria, 5 levels, 100 points.",
      "assertions": [
        {"type": "criterion_names_cover", "file_glob": "./rubric-*.md", "concepts": ["correctness", "code quality", "documentation", "design"], "synonyms_allowed": true},
        {"type": "points_sum", "file_glob": "./rubric-*.csv", "expected": 100, "tolerance": 0},
        {"type": "regex_match_each_row", "file_glob": "./rubric-*.md", "pattern": "Bloom'?s\\s*[1-6]", "scope": "criterion_column"},
        {"type": "pdf_generated", "file_glob": "./rubric-*.pdf", "render_script": "shared/scripts/pdf_render.py", "expected_exit_code": 0}
      ]
    }
  ],
  "global_assertions": [
    {"type": "no_empty_cells_any", "note": "No rubric cell may be blank, 'TBD', or literally repeat a neighboring cell."},
    {"type": "csv_parses", "file_glob": "./rubric-*.csv"},
    {"type": "point_arithmetic_reconciles", "file_glob": "./rubric-*.csv", "note": "criterion_total == sum of level points within row; overall total == sum of criterion_totals"}
  ]
}
```

- [ ] **Step 2: Verify the JSON parses**

Run: `python -c "import json; json.load(open('skills/rubric/evals/evals.json')); print('ok')"`
Expected: `ok`.

- [ ] **Step 3: Verify exactly 5 evals present**

Run: `python -c "import json; d=json.load(open('skills/rubric/evals/evals.json')); assert len(d['evals'])==5, len(d['evals']); print('ok')"`
Expected: `ok`.

- [ ] **Step 4: Commit**

```bash
git add skills/rubric/evals/evals.json
git commit -m "feat(rubric): add 5 evals with objective structural assertions"
```

---

## Task 13: End-to-end dry-run check

**Files:**
- Read-only: all files created in Tasks 1-12.

- [ ] **Step 1: Confirm SKILL.md line count**

Run: `wc -l skills/rubric/SKILL.md`
Expected: under 300 lines.

- [ ] **Step 2: Confirm all references exist and are non-empty**

Run:
```bash
for f in taxonomies.md frameworks.md criterion-writing.md descriptor-phrasing.md standards-crosswalk.md; do
  test -s "skills/rubric/references/$f" && echo "ok $f" || echo "MISSING $f"
done
```
Expected: `ok` for all five.

- [ ] **Step 3: Confirm 8 example files exist**

Run: `ls skills/rubric/references/examples/ | grep -c '\.md$'`
Expected: `8`.

- [ ] **Step 4: Confirm template exists**

Run: `test -f shared/templates/rubric.html && echo ok`
Expected: `ok`.

- [ ] **Step 5: Re-verify evals.json is valid + has 5 evals**

Run: `python -c "import json; d=json.load(open('skills/rubric/evals/evals.json')); assert len(d['evals'])==5; print('ok')"`
Expected: `ok`.

- [ ] **Step 6: Manually trace one eval through SKILL.md**

Open `skills/rubric/SKILL.md` and `skills/rubric/evals/evals.json`. For eval `rubric-01-persuasive-essay-dok`, walk the workflow steps 1-8 from SKILL.md on paper: would the skill (a) pick DOK because the user said so, (b) pick 4 criteria × 4 levels matching the user's spec, (c) distribute 100 points, (d) emit markdown + CSV + PDF with absolute paths? If any workflow step is ambiguous or blocks the eval assertions, fix SKILL.md now.

- [ ] **Step 7: Final commit (only if Step 6 required fixes)**

```bash
git add skills/rubric/SKILL.md
git commit -m "fix(rubric): resolve ambiguity found during dry-run trace"
```

If no fixes needed, skip this step — no empty commits.

---

## Self-review results

- **Spec coverage:** every section of `2026-04-14-rubric-design.md` maps to a task. §1-§2 → Task 2. §3 → Task 2. §4 → Task 3. §5 → Task 3. §6 → Task 11. §7 → Tasks 5-10. §8 → Task 4. §9 → Task 12. §10 → Task 4. §11 (open questions) → resolved by locked defaults in marketplace spec and noted inline in SKILL.md grade-band section.
- **Placeholder scan:** Tasks 10 steps 1-8 describe the content of each example file at the structural level (criteria, levels, tagging) without writing out every descriptor cell. This is intentional — writing 8 full rubric tables inline would bloat the plan past usefulness — but is a documented deviation from "show the code". Implementers MUST produce zero-blank-cell tables; Task 10 Step 9 enforces that. All other tasks show complete content.
- **Type consistency:** CSV schema in SKILL.md Outputs matches the eval assertions (`points_sum`, `monotonic_points_per_row`, `csv_parses`). Criterion tag format (`*<Label> — <taxonomy>*`) is consistent across taxonomies.md, criterion-writing.md, standards-crosswalk.md, and the eval regex patterns.
