# lesson-plan — Design Spec

**Date:** 2026-04-14
**Status:** Draft pending user review
**Part of:** School Skills Marketplace (see `2026-04-14-marketplace-design.md`)

## 1. Purpose

One-shot, standards-aligned lesson plans that save teachers (and homeschool parents) hours of prep time. User gives a topic, grade, and duration; skill returns a fully formatted lesson plan ready to print or drop into a planner. Covers the "I need a lesson on X by tomorrow morning" use case as its primary job.

## 2. Triggers

SKILL.md description lists concrete phrasings:

1. "Write me a lesson plan on fractions for 4th grade."
2. "I need a 45-minute lesson on photosynthesis by tomorrow."
3. "Plan a 7th grade NGSS lesson on plate tectonics."
4. "Build a Common Core ELA lesson on theme for 9th graders."
5. "Make a homeschool lesson on the water cycle for my 2nd grader."
6. "Give me a 60-minute high school algebra lesson on quadratic factoring."
7. "Draft a kindergarten circle-time-adjacent lesson on shapes."
8. "I need an emergency sub plan for 6th grade social studies."
9. "Plan a multi-day unit on the American Revolution for 8th grade."
10. "Create an IB MYP lesson on cellular respiration."
11. "Can you write a lesson plan aligned to TEKS for 5th grade math fractions?"
12. "First-year-teacher SOS — need a full 50-min lesson on the Bill of Rights."

## 3. Inputs

Required:
- **Topic** — free-text ("photosynthesis", "subject-verb agreement", "the Boston Tea Party").
- **Grade level** — K, 1, 2, … 12, "college," or homeschool-equivalent.
- **Duration** — preset (30 / 45 / 60 / 90 min) or custom minutes. Multi-day units ask for number of days + session length.

Optional (reasonable defaults if absent):
- **Standards framework** — Common Core (ELA, Math), NGSS, TEKS, state-specific (CA, NY, FL, VA, etc.), IB (PYP/MYP/DP), Cambridge (Primary/Lower Secondary/IGCSE/A-Level), or "none / district-agnostic." Default: Common Core for ELA/Math, NGSS for science, state-agnostic objectives otherwise.
- **Class size** — affects grouping suggestions. Default 24.
- **Prior knowledge level** — none / some / strong. Calibrates the hook and direct instruction depth.
- **Special accommodations** — ELL level (WIDA 1-6), IEP/504 notes, gifted extension needed, behavioral considerations.
- **Pedagogical model** — 5E, Madeline Hunter, Gradual Release (I do / We do / You do), UDL-forward. Default: Gradual Release.
- **Format preference** — markdown (default) or PDF export.

## 4. Outputs

Markdown lesson plan with these sections, in order:

1. **Header** — Title, Grade, Subject, Duration, Date slot, Teacher name slot.
2. **Learning Objectives** — 2-4 measurable objectives in "Students will be able to (SWBAT) …" form, verbs anchored to Bloom's / DOK.
3. **Standards Alignment** — framework code + full text (e.g. `CCSS.ELA-LITERACY.RL.4.2 — Determine a theme …`).
4. **Materials & Setup** — bulleted list, room arrangement notes, tech requirements, prep time estimate.
5. **Hook / Anticipatory Set** (5-10 min) — concrete attention-grabber tied to topic.
6. **Direct Instruction** (10-20 min) — teacher-led explanation, key vocabulary, worked example(s).
7. **Guided Practice** (10-15 min) — "We do" — teacher + students together, checking for understanding.
8. **Independent Practice** (10-15 min) — "You do" — task + exit criteria.
9. **Formative Assessment** — what the teacher looks for, exit ticket, 3-2-1, thumbs, CFU questions.
10. **Closure** (3-5 min) — recap, preview next lesson, student reflection prompt.
11. **Differentiation** — three sub-sections:
    - **ELL** (scaffolds: visuals, sentence frames, L1 support, vocabulary pre-teaching).
    - **SPED / IEP-504** (chunking, extended time, graphic organizers, assistive tech cues).
    - **Gifted / Extension** (depth-not-pace: Socratic prompts, open-ended extensions, compacting).
12. **Homework / Extension** — optional, grade-appropriate quantity (K-2 often "none / read with family").
13. **Teacher Notes** — common misconceptions, pacing warnings, classroom management tips.

**Optional PDF export** via `shared/scripts/pdf_render.py` when the teacher wants a printable handout.

Also emits a machine-readable footer block (YAML frontmatter) so downstream skills (`worksheet`, `quiz-generator`, `rubric`) can pick up objectives and standards without re-asking.

## 5. Workflow

1. **Parse request** — extract topic, grade, duration, framework (explicit or inferred from phrasing / user locale).
2. **Clarify if missing** — one concise question if a required field is absent (e.g. "Which grade?"). Never ask more than one question at a time.
3. **Standards lookup** — consult `references/standards/*.md` for the correct framework + grade + subject. Select 1-3 most relevant standard codes. If no standards match (art, music, SEL), note "No standards framework applies — aligned to general best practice" and proceed.
4. **Model selection** — pick pedagogical scaffold (default Gradual Release) based on grade + user preference.
5. **Generate plan** — fill the 13-section template. Calibrate tone, vocabulary, and activity complexity to grade band (see §8).
6. **Self-check** — verify each required section present, objectives are measurable (no "understand," "know," or "learn about" as sole verb), standards are cited with codes, differentiation covers all three learner categories.
7. **Format output** — markdown by default. If user asks for PDF, call `shared/scripts/pdf_render.py` with the lesson-plan HTML template.
8. **Offer follow-ups** — "Want a matching worksheet?" / "Want me to build a rubric?" / "Want a quiz?" — pointing to sibling skills.

## 6. Bundled scripts

Prompt-heavy skill — minimal scripts:

- **No skill-specific scripts required** for core functionality.
- **Uses shared** `shared/scripts/pdf_render.py` for optional PDF export (same template system as `worksheet`, styled for lesson plans — letterhead, section headers).
- **Optional helper** `scripts/standards_lookup.py` — small utility that takes `(framework, grade, subject, keyword)` and returns matching standard codes + full text from a bundled JSON index. Keeps the model from hallucinating standard codes. Built if the reference-markdown approach proves insufficient in evals; otherwise deferred.

## 7. References (loaded on demand)

Files under `skills/lesson-plan/references/`:

- `standards/common-core-ela.md` — grade-indexed summary of CCSS ELA strands (RL, RI, W, SL, L).
- `standards/common-core-math.md` — grade-indexed CCSS Math domains + practices.
- `standards/ngss.md` — K-12 NGSS performance expectations by grade band, DCIs, SEPs, CCCs.
- `standards/state-frameworks.md` — TEKS (Texas), NY NGLS, CA content standards, FL B.E.S.T., VA SOL, with pointers to official sources for codes not bundled.
- `standards/ib.md` — PYP transdisciplinary themes, MYP subject groups + ATL skills, DP subject syllabus highlights.
- `standards/cambridge.md` — Primary/Lower Secondary/IGCSE/A-Level learning objectives summary.
- `pedagogy/madeline-hunter.md` — 7-step lesson design (anticipatory set → closure).
- `pedagogy/5e.md` — Engage, Explore, Explain, Elaborate, Evaluate (science-forward).
- `pedagogy/gradual-release.md` — I do / We do / You do / You do together, Fisher & Frey.
- `pedagogy/udl.md` — Universal Design for Learning — multiple means of engagement, representation, action/expression.
- `differentiation/ell-strategies.md` — WIDA levels, sentence frames, SIOP features.
- `differentiation/sped-strategies.md` — common IEP accommodations, executive-function supports.
- `differentiation/gifted-strategies.md` — depth-not-pace, Renzulli triad, open-endedness.
- `differentiation/catalog.md` — cross-cutting index mapping strategy → when-to-use.
- `templates/lesson-plan.md` — the 13-section markdown skeleton.
- `templates/sub-plan.md` — simplified, behavior-forward template for emergency sub days.
- `templates/multi-day-unit.md` — unit-level template with daily breakdown sub-sections.

## 8. Grade / level calibration

| Band | Session length | Pedagogy notes | Language |
|------|----------------|----------------|----------|
| **K-2** | 15-30 min active blocks, play-based | Heavy use of song, movement, manipulatives, read-alouds. Short direct instruction (5-8 min max). Sensory + visual supports standard. | Simple sentences, Tier 1 vocabulary, concrete examples. |
| **3-5** | 30-45 min | Gradual Release fits well. Center rotations common. Partner talk + turn-and-talk. | Tier 2 academic vocab introduced explicitly. |
| **6-8** | 45-55 min | 5E works especially for science. Student discourse + structured collaboration. Identity-safe framing. | Academic vocab, content-specific vocabulary pre-taught. |
| **9-12** | 50-90 min (block) | Inquiry, seminar, lab-based. Stronger independent practice, longer exit tasks. | Discipline-specific academic language, argumentation. |
| **College / syllabus-alignable lectures** | 50-80 min lecture or 2-3 hr seminar | Learning objectives map to course outcomes. Lecture outline + active-learning breaks every 15-20 min. Reading assignments + discussion prompts. | Domain-specific; assume prerequisites satisfied. |

Homeschool parent requests default to the child's grade band with a note that ratios (1:1 or 1:few) allow compressed direct instruction and more hands-on time.

## 9. Evals

`skills/lesson-plan/evals/evals.json` — 5 prompts, 3-5 assertions each.

1. **"Write a 45-min 7th grade NGSS lesson on photosynthesis."**
   - All 13 required sections present.
   - At least one NGSS performance expectation code cited (expect MS-LS1-6 or adjacent).
   - Differentiation section contains ELL, SPED, and Gifted sub-sections.
   - Materials list non-empty.
   - Objectives use measurable verbs (no "understand" / "know" as the sole verb).

2. **"Common Core ELA lesson on theme for 9th grade, 50 minutes."**
   - CCSS.ELA-LITERACY.RL.9-10.2 (or sibling) cited.
   - Hook present and topic-relevant.
   - Formative assessment specified.
   - Independent practice has exit criteria.

3. **"Kindergarten lesson on shapes, 20 minutes."**
   - Session broken into sub-segments ≤8 min each.
   - Uses movement or song or manipulatives (calibration check).
   - Homework absent or "share with family" style.
   - Vocabulary is Tier 1 / grade-appropriate.

4. **"Emergency sub plan for 6th grade social studies, 50 minutes."**
   - Sub-plan template used (not regular template).
   - Behavior / management notes section present.
   - Activity is self-contained and requires no prior teacher context.
   - Materials are low-tech / printable-only.

5. **"Multi-day unit on the American Revolution, 8th grade, 5 days × 50 min."**
   - Unit-level template used.
   - 5 daily sub-plans produced with distinct objectives.
   - Summative assessment at end of unit included.
   - Standards (CCSS for literacy, state history standards) cited at unit level.
   - Arc shows progression (hook → content → synthesis → assessment).

Assertions run via the shared evals harness — a mix of string-presence checks, regex for standards codes, and a lightweight LLM-as-judge for "objectives are measurable."

## 10. Edge cases

- **Subjects with weak standards coverage** (art, music, PE, SEL, electives) — proceed without framework; cite best-practice references (National Core Arts Standards, SHAPE America, CASEL) where they exist; otherwise output "aligned to general best practice" and emphasize skill-building over standard codes.
- **Multi-day units** — detect multi-day request and switch to unit template. Produce daily plans as sub-sections with a unit arc header.
- **Emergency sub plans** — detect "sub plan," "substitute," "out sick," "emergency" → switch to sub template: self-contained, low-prep, behavior-management-forward, printable.
- **Cross-grade / multi-age classrooms** (common in homeschool + one-room settings) — generate a base plan at the younger grade with a gifted/extension track for older siblings; note explicitly.
- **Cross-subject / interdisciplinary** (e.g., ELA + history) — cite standards from both frameworks; keep one set of objectives but tag each to its domain.
- **Very short durations** (<20 min) — treat as mini-lesson: hook + one objective + quick CFU + exit, drop redundant sections.
- **Very long durations** (90+ min block) — insert transition/movement breaks; allow two cycles of guided → independent practice.
- **Standards the user invents or names loosely** ("third grade writing standards") — infer (CCSS ELA Writing W.3) and confirm in the output header.
- **Religious / politically sensitive topics** — present balanced, age-appropriate framing; surface the sensitivity in Teacher Notes so the teacher can calibrate for their community.
- **Non-English-primary classrooms** — accept language flag; still produce the plan in English but emphasize ELL scaffolds heavily and offer to translate key vocabulary.

## 11. Open questions

- **Which standards frameworks are first-class in V1?** Proposed priority: Common Core (ELA/Math), NGSS, TEKS, IB, Cambridge, and 3-4 large states (CA, NY, FL, VA). Others referenced via pointers. Confirm before implementation.
- **How do we keep state-specific standards current?** Official standards documents shift. Options: (a) bundle a snapshot with a "last updated" date and a disclaimer, (b) link out to the SEA (state education agency) page for verification, (c) lazily fetch on demand. Leaning (a) + (b) for V1.
- **Standards code verification** — do we ship a lookup script (`scripts/standards_lookup.py`) with a bundled JSON index, or trust the model + references? Gated on eval results.
- **Default pedagogical model** — Gradual Release is a safe default but science teachers often prefer 5E. Do we auto-switch by subject, or always ask? Proposed: auto-switch for science to 5E, default Gradual Release otherwise, allow override.
- **Alignment with sibling skills** — the YAML frontmatter footer. What exact fields do `worksheet`, `quiz-generator`, `rubric` need to consume this? Spec the contract during implementation, not here.
- **PDF styling** — does the lesson-plan PDF reuse the worksheet template or get its own letterhead-style template? Leaning its own.
- **Localization** — UK / AU / international English + metric units + UK national curriculum. Deferred to V2 unless trivial.
