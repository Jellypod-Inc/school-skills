---
name: lesson-plan
description: One-shot standards-aligned lesson plans — Common Core, NGSS, TEKS, IB, Cambridge, state frameworks. Takes a topic, grade, and duration; returns a fully formatted plan with objectives, standards, materials, Gradual Release pedagogy (I do / we do / you do), 13 sections, and ELL/SPED/Gifted differentiation. Covers K-12, college, and homeschool. USE THIS SKILL when the user says "write a lesson plan," "I need a lesson on X for Y grade," "plan a lesson," "45-minute lesson on," "Common Core lesson," "NGSS lesson," "emergency sub plan," "homeschool lesson," "multi-day unit," "IB MYP lesson," "first-year-teacher SOS," "TEKS-aligned lesson," or any phrase combining a topic + a grade + a duration. Output: markdown with YAML footer for sibling-skill handoff; optional PDF.
license: MIT
---

# Lesson Plan Skill

Generate standards-aligned, pedagogy-grounded lesson plans ready to print or drop into a planner.

## When to use this skill

Trigger on any phrase combining topic + grade + duration, or any of these concrete cues:

- "Write me a lesson plan on [topic] for [grade]."
- "I need a [duration] lesson on [topic] by tomorrow."
- "Plan a [grade] NGSS lesson on [topic]."
- "Build a Common Core ELA lesson on [topic] for [grade]."
- "Make a homeschool lesson on [topic] for my [grade]er."
- "Give me a [duration] high school [subject] lesson on [topic]."
- "Draft a kindergarten lesson on [topic]."
- "I need an emergency sub plan for [grade] [subject]."
- "Plan a multi-day unit on [topic] for [grade]."
- "Create an IB MYP lesson on [topic]."
- "Cambridge / IGCSE / A Level lesson on [topic]."
- "TEKS-aligned lesson on [topic] for [grade]."
- "First-year-teacher SOS — [duration] lesson on [topic]."

## Inputs

Required:
- **Topic** — free-text.
- **Grade** — K, 1, 2, … 12, college, grad, or homeschool-equivalent.
- **Duration** — minutes (or days × minutes for units).

Optional (reasonable defaults applied if absent):
- Standards framework — defaults by subject (CCSS for ELA/Math, NGSS for Science, general best practice otherwise).
- Pedagogy — default **Gradual Release** (Fisher & Frey "I do / we do / you do"), with **UDL** as the lens for differentiation. Auto-overrides to **5E** for Science lessons unless user specifies otherwise.
- Class size, prior knowledge level, accommodations (ELL/SPED/Gifted).

## Output

- **Markdown** lesson plan (default). 13 sections — see `references/templates/lesson-plan.md` for the skeleton.
- **YAML footer** — machine-readable handoff block for sibling skills (`worksheet`, `quiz-generator`, `rubric`). Spec in `references/output-contract.md`.
- **Optional PDF** — via `shared/scripts/pdf_render.py` if the user asks for a printable version.

## Inferring grade from phrasing (before asking)

Ask about grade ONLY if you cannot confidently infer it. Use these cues first:

| Cue in user's phrasing | Likely grade band |
|---|---|
| "my kindergartener," "my 5yo," "circle time," "calendar math" | K |
| "my 3rd grader," "multiplication tables," "book report" | 3-5 |
| "middle school," "pre-algebra," "ratios," "5 paragraph essay" | 6-8 |
| "AP ___," "PSAT," "thesis statement," "MLA works cited" | 9-12 |
| "syllabus," "semester," "lecture," "TA," "office hours" | College |
| "dissertation," "my students' IRB," "cohort" | Grad |
| "my ELL/EB student," "newcomer," "WIDA" | pair with grade + add ELL strategies |
| "homeschool," "my own kid" | use grade number; add home-friendly mods |

If confidence is still low, ask ONE clarifying question in this exact shape:

> Quick check so I can calibrate this — which grade is this for? (e.g. **K · 3rd · 7th · 10th · college**)

Do not stack questions. Do not ask for framework, duration, class size, etc. unless the user explicitly wants tight customization.

## Workflow (summary — full details in `references/workflow.md`)

1. **Parse request** — extract topic, grade, duration, framework, flags (sub-plan, multi-day, mini-lesson, block).
2. **Infer, then clarify** — attempt grade inference from the table above first. Only ask one question if grade is still unclear. Duration defaults to 45 min if unspecified.
3. **Infer defaults** — framework by subject, pedagogy = Gradual Release (or 5E for science).
4. **Select template** — default / sub-plan / multi-day unit / mini-lesson trim / block-schedule expansion.
5. **Load standards reference** — read only the file(s) matching the framework.
6. **Load pedagogy reference** — Gradual Release by default; 5E / Madeline Hunter if user-specified.
7. **Load differentiation catalog** — plus learner-category file(s) as needed.
8. **Load grade-calibration rules** — tone, vocabulary, session structure.
9. **Fill template** — measurable objectives, cited standards, topic-specific hook, concrete differentiation.
10. **Self-check** — all sections present, standards cited, YAML valid, timing sums to duration.
11. **Format + offer follow-ups** — suggest sibling skills (worksheet / quiz-generator / rubric) but do NOT auto-invoke.

## Progressive disclosure — reference files

Load on demand based on the request. Do NOT read all references for every request.

### Standards (load one matching the user's framework)

- `references/standards/common-core-ela.md` — CCSS ELA strands (RL, RI, W, SL, L, RH, RST, WHST) K-12.
- `references/standards/common-core-math.md` — CCSS Math domains + Mathematical Practices K-12.
- `references/standards/ngss.md` — NGSS Performance Expectations, DCIs, SEPs, CCCs.
- `references/standards/state-frameworks.md` — TEKS, NY NGLS, CA, FL B.E.S.T., VA SOL (+ pointers to other states).
- `references/standards/ib.md` — PYP, MYP, DP.
- `references/standards/cambridge.md` — Primary, Lower Secondary, IGCSE, A Level.

### Pedagogy

- `references/pedagogy/gradual-release.md` — **default** — Fisher & Frey.
- `references/pedagogy/udl.md` — **always apply** — Universal Design for Learning lens.
- `references/pedagogy/5e.md` — auto-override for Science.
- `references/pedagogy/madeline-hunter.md` — on explicit user request.

### Differentiation

- `references/differentiation/catalog.md` — **always load** — cross-cutting strategy index.
- `references/differentiation/ell-strategies.md` — WIDA + SIOP scaffolds.
- `references/differentiation/sped-strategies.md` — IEP / 504 accommodations.
- `references/differentiation/gifted-strategies.md` — depth-not-pace extensions.

### Templates

- `references/templates/lesson-plan.md` — **default** 13-section template.
- `references/templates/sub-plan.md` — emergency substitute plan.
- `references/templates/multi-day-unit.md` — unit with daily sub-sections.

### Meta

- `references/grade-calibration.md` — tone + length + vocabulary + activity rules by band.
- `references/workflow.md` — step-by-step generation procedure.
- `references/edge-cases.md` — sub-plan, multi-day, mini-lesson, block schedule, cross-grade, sensitive topics, non-English-primary.
- `references/output-contract.md` — YAML footer spec.

## Locked defaults

| Setting | Default |
|---|---|
| Pedagogy | Gradual Release (I do / we do / you do) |
| Differentiation lens | UDL (multiple means of engagement / representation / action & expression) |
| Framework — ELA | CCSS ELA |
| Framework — Math | CCSS Math |
| Framework — Science | NGSS (+ auto-override pedagogy to 5E) |
| Framework — other | General best practice |
| Output | Markdown + YAML footer |
| Cross-skill invocation | None — offer sibling-skill suggestions, do not auto-invoke. |

## Micro-example

**User:** "45-minute lesson on photosynthesis for my 7th grader"

**Inferred:** grade 7 (explicit), subject=Science → NGSS + 5E pedagogy, duration 45.
**Skill responds (no clarifying question needed):** fully formed plan starting —

```
# Photosynthesis: How Plants Make Food (7th Grade Science)

**Standards:** NGSS MS-LS1-6 — Construct a scientific explanation based on evidence
for the role of photosynthesis in the cycling of matter and flow of energy…

**Objective:** Students will model the chemical equation of photosynthesis and
explain how light energy is captured by chloroplasts and converted into chemical
energy in glucose, with 80% accuracy on the exit ticket.

## 5E Workflow (45 min)
1. **Engage (5 min)** — Show a sped-up timelapse of a seedling sprouting in light…
2. **Explore (10 min)** — Lab: observe two elodea sprigs, one in light one in dark…
…
```

Full YAML footer follows the plan. Sibling-skill suggestions appear at the end.

## PDF export (optional)

When the user asks for a PDF, run the shared script from the repo root:

```bash
python3 shared/scripts/pdf_render.py \
  --input <markdown-file.md> \
  --output <output-file.pdf> \
  --style lesson-plan
```

The script expects lesson-plan-style formatting (letterhead, section headers). If the `--style lesson-plan` flag is unsupported (first-time run against a worksheet-only script), fall back to `--style default` and note to the user: *"PDF rendered with default style — the lesson-plan-specific template is planned for a later update."*

## Quality bar

Every generated plan must satisfy:

- All required template sections present.
- Standards cited with framework + code + full text (or explicit "no framework applies" note).
- Objectives use measurable Bloom's verbs (NOT "understand," "know," "learn about" as sole verb).
- Differentiation has ELL + SPED + Gifted subsections with 2+ concrete strategies each.
- Materials list matches activity requirements.
- Timing sums to the requested duration.
- Grade-band calibration applied.
- YAML footer present and valid.

## What NOT to do

- Do not invent standards codes. If uncertain, describe the strand and note "Verify the specific code with your district."
- Do not use "understand," "know," or "learn about" as the sole verb in any objective.
- Do not skip the Differentiation section, even for short lessons.
- Do not auto-invoke sibling skills — just suggest.
