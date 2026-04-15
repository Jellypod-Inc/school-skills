# Lesson-Plan Generation Workflow

Follow these steps in order when generating a lesson plan. SKILL.md references this file for the full procedure.

## Step 1 — Parse the request

Extract from the user prompt:
- **Topic** — free text.
- **Grade** — K / 1 / … / 12 / college / grad / homeschool.
- **Duration** — minutes (or days × minutes for a unit).
- **Standards framework** — CCSS / NGSS / TEKS / IB / Cambridge / state-specific / "none."
- **Special flags** — "sub plan," "emergency," "substitute," "multi-day," "unit," "mini-lesson," "block schedule."
- **Pedagogy preference** — Gradual Release (default), 5E, Madeline Hunter, UDL-forward.
- **Accommodations** — ELL level, IEP/504 notes, gifted, behavioral.

## Step 2 — Clarify if needed

Ask AT MOST ONE concise question if a required field is missing. Example questions:
- "Which grade?"
- "How long is the class period — 30, 45, 60, or 90 minutes?"

Never ask more than one question per turn. If two fields are missing, ask the most critical one first; infer the other.

## Step 3 — Infer defaults

- If no standards framework specified and subject is ELA → default to CCSS ELA.
- If no framework specified and subject is Math → default to CCSS Math.
- If no framework specified and subject is Science → default to NGSS.
- If no framework specified and subject is Social Studies / History → default to state-agnostic objectives (cite "general best practice").
- If subject is Art / Music / PE / SEL → cite discipline best-practice references (National Core Arts, SHAPE America, CASEL) as available; standards framework optional.
- If pedagogy unspecified: **Gradual Release** (locked default), EXCEPT subject = Science where **5E** auto-overrides (log the override in Teacher Notes).

## Step 4 — Select template

- Default → `references/templates/lesson-plan.md` (13 sections).
- Sub-plan triggers (words: "sub," "substitute," "out sick," "emergency") → `references/templates/sub-plan.md`.
- Multi-day / unit triggers (words: "unit," "multi-day," "5-day," "week-long") → `references/templates/multi-day-unit.md`.
- Duration < 20 min → default template with mini-lesson trim (drop Independent Practice OR combine Closure with Formative Assessment).
- Duration ≥ 90 min → default template with inserted movement break + second guided→independent cycle.

## Step 5 — Standards lookup

Load the relevant standards reference file(s):
- CCSS ELA → `references/standards/common-core-ela.md`.
- CCSS Math → `references/standards/common-core-math.md`.
- NGSS → `references/standards/ngss.md`.
- State specific → `references/standards/state-frameworks.md`.
- IB → `references/standards/ib.md`.
- Cambridge → `references/standards/cambridge.md`.

Select 1-3 most relevant standard codes. Quote them exactly. Include the full text, not just the code.

If no standards apply, write: *"No standards framework applies — aligned to general best practice."* in the Standards Alignment section.

## Step 6 — Load pedagogy reference

- Gradual Release → `references/pedagogy/gradual-release.md`.
- 5E → `references/pedagogy/5e.md`.
- Madeline Hunter → `references/pedagogy/madeline-hunter.md`.
- UDL is always loaded → `references/pedagogy/udl.md` (the lens for Differentiation).

## Step 7 — Load differentiation reference

Always load `references/differentiation/catalog.md`. Load the specific learner-category files (`ell-strategies.md`, `sped-strategies.md`, `gifted-strategies.md`) when the user request implies specific populations or when writing the full Differentiation section.

## Step 8 — Load grade calibration

Load `references/grade-calibration.md` and apply the section matching the grade band.

## Step 9 — Fill the template

Section-by-section, using:
- Measurable Bloom's verbs in Objectives (never "understand," "know," "learn about" as sole verb).
- Concrete, topic-specific hook (not generic).
- Key vocabulary (3-8 terms) in Direct Instruction.
- CFU questions in Guided Practice.
- Exit criteria in Independent Practice.
- Specific formative assessment type.
- Differentiation with 2+ strategies per subsection (ELL, SPED, Gifted), tied to the lesson.
- Common misconceptions in Teacher Notes.

## Step 10 — Self-check

Before output:

- [ ] All required sections present (evals `contains_all`).
- [ ] Standards codes cited with framework + code + full text.
- [ ] Objectives use measurable verbs.
- [ ] Differentiation has ELL + SPED + Gifted subsections, each with 2+ concrete strategies.
- [ ] Materials list matches what activities require.
- [ ] Timing sums to the requested duration.
- [ ] Grade-band calibration applied (vocabulary, session length, activity type).
- [ ] YAML footer present and valid (see `references/output-contract.md`).

## Step 11 — Format output

- Markdown body.
- YAML footer as last element.
- If the user requested PDF, invoke `shared/scripts/pdf_render.py` with the markdown → HTML pipeline (see SKILL.md "PDF Export" section).

## Step 12 — Offer follow-ups

After the plan, suggest:
- "Want a matching worksheet? The `worksheet` skill can consume this lesson's objectives."
- "Want a quiz aligned to these objectives? Try the `quiz-generator` skill."
- "Want a rubric for the Independent Practice task? Try the `rubric` skill."

Do NOT auto-invoke sibling skills (per marketplace locked default: no cross-skill delegation in V1).
