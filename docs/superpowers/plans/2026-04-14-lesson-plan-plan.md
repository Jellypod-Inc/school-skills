# lesson-plan Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `lesson-plan` skill — a prompt-heavy Claude Code skill that generates standards-aligned, pedagogy-grounded lesson plans (Common Core / NGSS / IB / state frameworks) from topic + grade + duration, calibrated to grade band, with ELL/SPED/Gifted differentiation baked in.

**Architecture:** Pure prompt-engineering skill. No skill-local scripts — PDF export delegates to the shared `shared/scripts/pdf_render.py`. Knowledge lives in `references/` (standards summaries, pedagogy frameworks, differentiation catalog, templates) loaded on demand per the progressive-disclosure pattern. Output is markdown with a YAML frontmatter footer block so sibling skills (`worksheet`, `quiz-generator`, `rubric`) can consume objectives + standards without re-asking. Locked defaults: Gradual Release (I do / we do / you do) as pedagogy default, with UDL woven into differentiation.

**Tech Stack:** Markdown (SKILL.md + references), YAML (frontmatter footer contract + evals.json-equivalent fields), JSON (`evals/evals.json`), Playwright-based `shared/scripts/pdf_render.py` (external dependency — consumed, not built here).

---

## File Structure

Lives under `skills/lesson-plan/` in the `school-skills` repo. Layout:

```
skills/lesson-plan/
├── SKILL.md                                   # entry point, <300 lines, pushy triggers
├── evals/
│   └── evals.json                             # 5 prompts + assertions
└── references/
    ├── output-contract.md                     # YAML frontmatter footer spec
    ├── grade-calibration.md                   # grade-band tone/length/vocab rules
    ├── workflow.md                            # step-by-step generation workflow
    ├── edge-cases.md                          # sub-plans, multi-day, mini-lesson, etc.
    ├── standards/
    │   ├── common-core-ela.md                 # CCSS ELA strands (RL, RI, W, SL, L) K-12
    │   ├── common-core-math.md                # CCSS Math domains + practices K-12
    │   ├── ngss.md                            # NGSS PEs, DCIs, SEPs, CCCs by grade band
    │   ├── state-frameworks.md                # TEKS, NY NGLS, CA, FL B.E.S.T., VA SOL
    │   ├── ib.md                              # PYP/MYP/DP summary
    │   └── cambridge.md                       # Primary / Lower Sec / IGCSE / A-Level
    ├── pedagogy/
    │   ├── gradual-release.md                 # DEFAULT — Fisher & Frey I do/We do/You do
    │   ├── udl.md                             # DEFAULT differentiation framework
    │   ├── 5e.md                              # Engage/Explore/Explain/Elaborate/Evaluate
    │   └── madeline-hunter.md                 # 7-step lesson design
    ├── differentiation/
    │   ├── catalog.md                         # cross-cutting strategy index
    │   ├── ell-strategies.md                  # WIDA, sentence frames, SIOP
    │   ├── sped-strategies.md                 # IEP/504 accommodations, exec-function
    │   └── gifted-strategies.md               # depth-not-pace, Renzulli, open-endedness
    └── templates/
        ├── lesson-plan.md                     # 13-section markdown skeleton (default)
        ├── sub-plan.md                        # emergency-sub simplified template
        └── multi-day-unit.md                  # unit-level with daily sub-sections
```

**No `scripts/` directory.** PDF export path is documented in `SKILL.md` as invoking `shared/scripts/pdf_render.py` from the repo root. `scripts/standards_lookup.py` is deferred per spec §6 — only built if evals show hallucinated standards codes.

Each reference is its own focused file so SKILL.md can Read only what the current request needs (e.g., a 7th-grade NGSS photosynthesis request loads `standards/ngss.md` + `pedagogy/5e.md` + `differentiation/catalog.md`, not the whole tree).

---

## Task Sequencing Rationale

TDD for prompt-heavy skills works differently than code — the "test" is the evals harness. So we write `evals/evals.json` **first** (Task 2), then the skeleton SKILL.md (Task 3), then references in dependency order (templates → standards → pedagogy → differentiation → meta files), then wire the output contract, then polish SKILL.md, then run evals.

---

## Task 1: Scaffold the skill directory

**Files:**
- Create: `skills/lesson-plan/` (directory)
- Create: `skills/lesson-plan/references/` (directory)
- Create: `skills/lesson-plan/references/standards/` (directory)
- Create: `skills/lesson-plan/references/pedagogy/` (directory)
- Create: `skills/lesson-plan/references/differentiation/` (directory)
- Create: `skills/lesson-plan/references/templates/` (directory)
- Create: `skills/lesson-plan/evals/` (directory)
- Create: `skills/lesson-plan/.gitkeep` files in each empty dir as needed

- [ ] **Step 1: Create directory tree**

```bash
mkdir -p skills/lesson-plan/evals \
         skills/lesson-plan/references/standards \
         skills/lesson-plan/references/pedagogy \
         skills/lesson-plan/references/differentiation \
         skills/lesson-plan/references/templates
```

- [ ] **Step 2: Verify structure**

```bash
find skills/lesson-plan -type d
```
Expected output:
```
skills/lesson-plan
skills/lesson-plan/evals
skills/lesson-plan/references
skills/lesson-plan/references/standards
skills/lesson-plan/references/pedagogy
skills/lesson-plan/references/differentiation
skills/lesson-plan/references/templates
```

- [ ] **Step 3: Commit**

```bash
git add skills/lesson-plan
git commit -m "feat(lesson-plan): scaffold skill directory tree"
```

---

## Task 2: Write evals/evals.json (5 prompts + assertions)

**Rationale:** Evals are the acceptance contract — write them before the skill body so every later task has a concrete target. Assertions mix objective checks (regex for standards codes, string presence, section count) with one LLM-as-judge assertion ("objectives are measurable").

**Files:**
- Create: `skills/lesson-plan/evals/evals.json`

- [ ] **Step 1: Write evals.json**

```json
{
  "skill": "lesson-plan",
  "version": "0.1.0",
  "judge_model": "claude-opus-4-6",
  "cases": [
    {
      "id": "ngss-photosynthesis-7th",
      "prompt": "Write a 45-min 7th grade NGSS lesson on photosynthesis.",
      "assertions": [
        {"type": "contains_all", "values": ["Learning Objectives", "Standards Alignment", "Hook", "Direct Instruction", "Guided Practice", "Independent Practice", "Formative Assessment", "Closure", "Differentiation", "ELL", "SPED", "Gifted", "Materials", "Teacher Notes"]},
        {"type": "regex", "pattern": "MS-LS1-[0-9]+", "description": "Cites an NGSS MS-LS1 performance expectation code"},
        {"type": "contains_all", "values": ["ELL", "SPED", "Gifted"], "scope": "section:Differentiation"},
        {"type": "section_nonempty", "section": "Materials"},
        {"type": "judge", "criterion": "All stated objectives use measurable Bloom's verbs (analyze, model, explain, compare, justify, etc.). No objective relies solely on 'understand', 'know', or 'learn about'."}
      ]
    },
    {
      "id": "ccss-ela-theme-9th",
      "prompt": "Common Core ELA lesson on theme for 9th grade, 50 minutes.",
      "assertions": [
        {"type": "regex", "pattern": "CCSS\\.ELA-LITERACY\\.RL\\.9-10\\.[1-9]", "description": "Cites a CCSS ELA RL.9-10 standard"},
        {"type": "section_nonempty", "section": "Hook"},
        {"type": "section_nonempty", "section": "Formative Assessment"},
        {"type": "contains_any", "values": ["exit ticket", "exit criteria", "success criteria"], "scope": "section:Independent Practice"},
        {"type": "judge", "criterion": "The hook is topic-relevant (mentions theme, story, character, or text) and not a generic icebreaker."}
      ]
    },
    {
      "id": "kindergarten-shapes-20min",
      "prompt": "Kindergarten lesson on shapes, 20 minutes.",
      "assertions": [
        {"type": "max_section_minutes", "value": 8, "description": "No single activity block exceeds 8 minutes of seat time"},
        {"type": "contains_any", "values": ["song", "movement", "manipulative", "manipulatives", "dance", "sort", "touch"], "description": "Uses age-appropriate modality"},
        {"type": "not_contains_in_section", "section": "Homework", "values": ["worksheet", "practice problems", "written homework"]},
        {"type": "judge", "criterion": "Vocabulary is Tier-1 and kindergarten-appropriate. No academic jargon that a 5-year-old could not understand."}
      ]
    },
    {
      "id": "emergency-sub-plan-6th",
      "prompt": "Emergency sub plan for 6th grade social studies, 50 minutes.",
      "assertions": [
        {"type": "contains_all", "values": ["Substitute", "Behavior", "Management"], "description": "Uses sub-plan template with behavior notes"},
        {"type": "section_nonempty", "section": "Behavior / Management"},
        {"type": "not_contains", "values": ["see previous lesson", "continue from yesterday", "as we discussed"], "description": "Self-contained; no prior-teacher context required"},
        {"type": "judge", "criterion": "Materials are low-tech and printable-only — no required projector, computer cart, or specialty equipment."}
      ]
    },
    {
      "id": "multi-day-unit-am-rev-8th",
      "prompt": "Multi-day unit on the American Revolution, 8th grade, 5 days x 50 min.",
      "assertions": [
        {"type": "contains_all", "values": ["Unit Overview", "Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Summative Assessment"]},
        {"type": "distinct_objectives_per_day", "min_days": 5, "description": "Each of the 5 days has at least one distinct objective"},
        {"type": "regex", "pattern": "(CCSS\\.ELA-LITERACY\\.(RH|WHST)\\.6-8\\.[0-9]+|D2\\.His)", "description": "Cites CCSS literacy-in-history or C3 history standard at unit level"},
        {"type": "section_nonempty", "section": "Summative Assessment"},
        {"type": "judge", "criterion": "The five days form a coherent arc: hook/context -> content exploration -> synthesis -> assessment. Not five disconnected lessons."}
      ]
    }
  ]
}
```

- [ ] **Step 2: Validate JSON**

```bash
python3 -c "import json; json.load(open('skills/lesson-plan/evals/evals.json')); print('OK')"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add skills/lesson-plan/evals/evals.json
git commit -m "test(lesson-plan): add 5 eval prompts with assertions"
```

---

## Task 3: Write references/output-contract.md (YAML frontmatter footer spec)

**Rationale:** The YAML frontmatter footer is the handoff contract to sibling skills. Lock it before writing templates so every template references the same field names.

**Files:**
- Create: `skills/lesson-plan/references/output-contract.md`

- [ ] **Step 1: Write output-contract.md**

````markdown
# Output Contract — Markdown + YAML Footer

Every lesson-plan output is **markdown** followed by a **YAML frontmatter-style block** appended at the end of the document. The YAML block is the machine-readable handoff to sibling skills (`worksheet`, `quiz-generator`, `rubric`, `flashcards`) so they can consume this lesson's objectives and standards without asking the user again.

## Placement

The YAML block is the **last** thing in the document, fenced as frontmatter:

```markdown
... lesson plan markdown body ...

---
lesson_plan:
  topic: "Photosynthesis"
  grade: "7"
  subject: "Science"
  duration_minutes: 45
  pedagogy: "gradual-release"
  standards:
    - framework: "NGSS"
      code: "MS-LS1-6"
      text: "Construct a scientific explanation..."
  objectives:
    - "SWBAT model the inputs and outputs of photosynthesis..."
    - "SWBAT explain the role of chlorophyll..."
  key_vocabulary:
    - "chlorophyll"
    - "glucose"
    - "chloroplast"
  materials:
    - "Leaf diagrams (printed)"
    - "Colored pencils"
  assessment_types:
    - "exit ticket"
    - "CFU questions"
  sibling_handoff:
    worksheet: true
    quiz_generator: true
    rubric: false
---
```

## Required fields

| Field | Type | Notes |
|-------|------|-------|
| `topic` | string | Free-text topic label. |
| `grade` | string | `"K"`, `"1"`..`"12"`, `"college"`, or `"grad"`. |
| `subject` | string | `"ELA"`, `"Math"`, `"Science"`, `"Social Studies"`, `"Art"`, `"Music"`, `"PE"`, `"SEL"`, `"Other"`. |
| `duration_minutes` | integer | Total session length. Multi-day units use `duration_minutes_per_session` + `num_days` instead. |
| `pedagogy` | enum | `"gradual-release"` (default), `"5e"`, `"madeline-hunter"`, `"udl-forward"`. |
| `standards` | array | Each entry: `framework` (`"CCSS-ELA"`, `"CCSS-Math"`, `"NGSS"`, `"TEKS"`, `"IB-PYP"`, `"IB-MYP"`, `"IB-DP"`, `"Cambridge"`, `"State-CA"`, `"State-NY"`, etc.), `code`, `text`. Empty array allowed with `standards_note` field set. |
| `objectives` | array of strings | SWBAT-form, measurable verbs. |
| `key_vocabulary` | array of strings | 3-8 terms. |
| `materials` | array of strings | Consumable + reusable items. |
| `assessment_types` | array of strings | Values drawn from a controlled list: `"exit ticket"`, `"CFU questions"`, `"3-2-1"`, `"thumbs"`, `"observation"`, `"quiz"`, `"project"`, `"performance task"`. |
| `sibling_handoff` | object | Booleans — which sibling skills the lesson-plan author thinks would make sense as follow-ups. |

## Multi-day unit variant

For multi-day units, replace `duration_minutes` with:

```yaml
duration_minutes_per_session: 50
num_days: 5
```

And add a `daily_breakdown` array:

```yaml
daily_breakdown:
  - day: 1
    objective: "..."
    pedagogy_focus: "hook + context"
  - day: 2
    objective: "..."
    pedagogy_focus: "direct instruction"
  # ... etc
```

## Sub-plan variant

Sub-plan output adds:

```yaml
sub_plan: true
low_tech: true
behavior_notes: true
```

## Invariants

1. The YAML block MUST parse as valid YAML. Validate with `python3 -c "import yaml, sys; yaml.safe_load(sys.stdin.read())"` before finalizing.
2. No required field may be `null`. Use empty string, empty array, or a defensible default.
3. `objectives` must have at least one entry with a measurable Bloom's verb.
4. `standards` may be empty ONLY when `standards_note` explains why (e.g., `"No standards framework applies — art"`).
````

- [ ] **Step 2: Commit**

```bash
git add skills/lesson-plan/references/output-contract.md
git commit -m "docs(lesson-plan): add YAML footer output contract for sibling-skill handoff"
```

---

## Task 4: Write references/templates/ (the three markdown skeletons)

**Files:**
- Create: `skills/lesson-plan/references/templates/lesson-plan.md`
- Create: `skills/lesson-plan/references/templates/sub-plan.md`
- Create: `skills/lesson-plan/references/templates/multi-day-unit.md`

- [ ] **Step 1: Write the default 13-section template**

Write `skills/lesson-plan/references/templates/lesson-plan.md`:

````markdown
# Lesson Plan Template (Default, 13 sections)

Use this template for any single-session lesson plan. Fill **every** section unless the session is under 20 minutes (mini-lesson — see §edge-cases). Keep section headings exact so the evals assertion `contains_all` passes.

```markdown
# {{TITLE}}

| | |
|---|---|
| **Grade** | {{GRADE}} |
| **Subject** | {{SUBJECT}} |
| **Duration** | {{DURATION_MIN}} minutes |
| **Date** | _________________ |
| **Teacher** | _________________ |

## Learning Objectives

Students will be able to (SWBAT):

1. {{OBJECTIVE_1}}
2. {{OBJECTIVE_2}}
3. {{OBJECTIVE_3_OPTIONAL}}

## Standards Alignment

- **{{FRAMEWORK}}** — `{{CODE}}` — {{FULL_TEXT}}
- **{{FRAMEWORK_2_OPTIONAL}}** — `{{CODE_2}}` — {{FULL_TEXT_2}}

## Materials & Setup

- {{MATERIAL_1}}
- {{MATERIAL_2}}
- ...

**Prep time:** {{PREP_MIN}} minutes
**Room setup:** {{ROOM_NOTES}}
**Tech needed:** {{TECH_NOTES_OR_NONE}}

## Hook / Anticipatory Set ({{HOOK_MIN}} min)

{{HOOK_DESCRIPTION_TIED_TO_TOPIC}}

## Direct Instruction — "I Do" ({{DI_MIN}} min)

Teacher-led. Present the concept, worked example, and key vocabulary.

**Key vocabulary:** {{VOCAB_LIST}}

**Worked example:**
{{WORKED_EXAMPLE}}

## Guided Practice — "We Do" ({{GP_MIN}} min)

Teacher + students together. Check for understanding at each step.

{{GUIDED_PRACTICE_STEPS}}

**Checks for understanding:**
- {{CFU_1}}
- {{CFU_2}}

## Independent Practice — "You Do" ({{IP_MIN}} min)

Students work alone or in pairs.

**Task:** {{TASK}}
**Exit criteria:** {{EXIT_CRITERIA}}

## Formative Assessment

- {{ASSESSMENT_TYPE_1}} (e.g., exit ticket, 3-2-1, thumbs)
- Teacher looks for: {{LOOK_FORS}}

## Closure ({{CLOSURE_MIN}} min)

- Recap: {{RECAP}}
- Preview next lesson: {{PREVIEW}}
- Student reflection prompt: {{REFLECTION}}

## Differentiation

### ELL

- {{ELL_SCAFFOLD_1}}
- {{ELL_SCAFFOLD_2}}

### SPED / IEP-504

- {{SPED_ACCOMMODATION_1}}
- {{SPED_ACCOMMODATION_2}}

### Gifted / Extension

- {{GIFTED_EXTENSION_1}}
- {{GIFTED_EXTENSION_2}}

## Homework / Extension

{{HOMEWORK_OR_NONE}}

## Teacher Notes

- **Common misconceptions:** {{MISCONCEPTIONS}}
- **Pacing warnings:** {{PACING}}
- **Classroom management tips:** {{MANAGEMENT}}

---
lesson_plan:
  topic: "{{TOPIC}}"
  grade: "{{GRADE}}"
  subject: "{{SUBJECT}}"
  duration_minutes: {{DURATION_MIN}}
  pedagogy: "gradual-release"
  standards:
    - framework: "{{FRAMEWORK}}"
      code: "{{CODE}}"
      text: "{{FULL_TEXT}}"
  objectives:
    - "{{OBJECTIVE_1}}"
  key_vocabulary:
    - "{{VOCAB_TERM_1}}"
  materials:
    - "{{MATERIAL_1}}"
  assessment_types:
    - "{{ASSESSMENT_TYPE_1}}"
  sibling_handoff:
    worksheet: true
    quiz_generator: true
    rubric: false
---
```

## Section timing guidance

Rough allocation for a 45-minute lesson (scale proportionally):

| Section | Minutes |
|---|---|
| Hook | 5 |
| Direct Instruction | 12 |
| Guided Practice | 12 |
| Independent Practice | 12 |
| Closure | 4 |

For 30-min, drop Guided Practice by half. For 60-min, add a second guided→independent cycle. For 90-min block, insert a 5-min movement break between cycles.
````

- [ ] **Step 2: Write the sub-plan template**

Write `skills/lesson-plan/references/templates/sub-plan.md`:

````markdown
# Sub-Plan Template (Emergency / Substitute)

Use this when the user says "sub plan," "substitute," "out sick," "emergency," or the teacher clearly will not be present. Simpler than the default template — self-contained, low-tech, behavior-management-forward, printable.

```markdown
# Substitute Lesson Plan — {{TITLE}}

| | |
|---|---|
| **Grade** | {{GRADE}} |
| **Subject** | {{SUBJECT}} |
| **Duration** | {{DURATION_MIN}} minutes |
| **Date** | _________________ |
| **Regular Teacher** | _________________ |
| **Substitute** | _________________ |

## Welcome to the Classroom, Substitute!

Thank you for covering today. This plan is **self-contained** — you do not need any prior context from previous lessons.

## What students will do today

In one sentence: {{ONE_SENTENCE_GOAL}}.

## Materials (all low-tech / printable)

- {{MATERIAL_1}}
- {{MATERIAL_2}}

**Tech needed:** None required.

## Schedule

| Time | Activity |
|---|---|
| 0-5 min | **Attendance + settle** — Take attendance, have students read the warm-up on the board. |
| 5-15 min | **Warm-up / Do Now** — {{WARM_UP}} |
| 15-{{MID}} min | **Main Activity** — {{MAIN_ACTIVITY}} |
| {{MID}}-{{EXIT}} min | **Independent Work** — {{INDEPENDENT_WORK}} |
| Last 5 min | **Exit Ticket** — {{EXIT_TICKET}} |

## Behavior / Management Notes

- **If students finish early:** {{EARLY_FINISHER_ACTIVITY}}
- **Bathroom passes:** Follow school policy. {{SCHOOL_POLICY_IF_KNOWN_ELSE_PLACEHOLDER}}
- **Noise level expectation:** {{NOISE_EXPECTATION}} (e.g., "Level 1 voices — whisper only" for independent work).
- **If a student refuses to work:** Document the name and behavior. Do not argue. Offer a choice: do the work now or during lunch.
- **Phones:** Collect at the door / away in backpacks (follow school policy).

## What to leave for the regular teacher

- Attendance list.
- Exit tickets (collected).
- Note any students who were disruptive, absent, or struggled.

## Standards Alignment

- {{FRAMEWORK}} — {{CODE}} — {{FULL_TEXT}}

---
lesson_plan:
  topic: "{{TOPIC}}"
  grade: "{{GRADE}}"
  subject: "{{SUBJECT}}"
  duration_minutes: {{DURATION_MIN}}
  pedagogy: "gradual-release"
  sub_plan: true
  low_tech: true
  behavior_notes: true
  standards:
    - framework: "{{FRAMEWORK}}"
      code: "{{CODE}}"
      text: "{{FULL_TEXT}}"
  objectives:
    - "{{OBJECTIVE_1}}"
  materials:
    - "{{MATERIAL_1}}"
  assessment_types:
    - "exit ticket"
  sibling_handoff:
    worksheet: true
    quiz_generator: false
    rubric: false
---
```
````

- [ ] **Step 3: Write the multi-day unit template**

Write `skills/lesson-plan/references/templates/multi-day-unit.md`:

````markdown
# Multi-Day Unit Template

Use when the user requests a unit spanning 2+ days. Produce one **Unit Overview** section followed by one **Day N** sub-section per day. Each Day N sub-section is a compressed version of the default template (Hook / Direct / Guided / Independent / Closure / Differentiation — trimmed).

```markdown
# Unit: {{UNIT_TITLE}}

| | |
|---|---|
| **Grade** | {{GRADE}} |
| **Subject** | {{SUBJECT}} |
| **Sessions** | {{NUM_DAYS}} days x {{MIN_PER_DAY}} minutes |
| **Teacher** | _________________ |

## Unit Overview

### Essential Question

{{ESSENTIAL_QUESTION}}

### Unit-level Objectives (SWBAT)

1. {{UNIT_OBJECTIVE_1}}
2. {{UNIT_OBJECTIVE_2}}
3. {{UNIT_OBJECTIVE_3}}

### Standards Alignment (Unit Level)

- {{FRAMEWORK}} — {{CODE}} — {{FULL_TEXT}}

### Unit Arc

| Day | Focus | Pedagogy Emphasis |
|---|---|---|
| 1 | Hook + context | Engagement, prior-knowledge activation |
| 2 | Content exploration | Direct instruction + guided practice |
| 3 | Content deepening | Guided → independent practice |
| 4 | Synthesis | Project work / discussion / application |
| 5 | Assessment | Summative + reflection |

### Summative Assessment

{{SUMMATIVE_DESCRIPTION}} — assesses unit-level objectives {{WHICH_ONES}}.

### Materials (Full Unit)

- {{MATERIAL_1}}
- {{MATERIAL_2}}

---

## Day 1: {{DAY_1_TITLE}}

**Objective:** SWBAT {{DAY_1_OBJECTIVE}}.

**Hook (5 min):** {{DAY_1_HOOK}}

**Direct Instruction (10 min):** {{DAY_1_DI}}

**Guided Practice (15 min):** {{DAY_1_GP}}

**Independent Practice (15 min):** {{DAY_1_IP}}

**Closure (5 min):** {{DAY_1_CLOSURE}}

**Formative Assessment:** {{DAY_1_FA}}

**Differentiation today:** {{DAY_1_DIFF}}

---

## Day 2: {{DAY_2_TITLE}}

*(same structure as Day 1)*

---

## Day 3: {{DAY_3_TITLE}}

*(same structure)*

---

## Day 4: {{DAY_4_TITLE}}

*(same structure)*

---

## Day 5: {{DAY_5_TITLE}} — Summative

**Summative Assessment:** {{SUMMATIVE}}

**Reflection:** {{REFLECTION_PROMPT}}

---
lesson_plan:
  topic: "{{UNIT_TITLE}}"
  grade: "{{GRADE}}"
  subject: "{{SUBJECT}}"
  duration_minutes_per_session: {{MIN_PER_DAY}}
  num_days: {{NUM_DAYS}}
  pedagogy: "gradual-release"
  standards:
    - framework: "{{FRAMEWORK}}"
      code: "{{CODE}}"
      text: "{{FULL_TEXT}}"
  objectives:
    - "{{UNIT_OBJECTIVE_1}}"
  daily_breakdown:
    - day: 1
      objective: "{{DAY_1_OBJECTIVE}}"
      pedagogy_focus: "hook + context"
    - day: 2
      objective: "{{DAY_2_OBJECTIVE}}"
      pedagogy_focus: "direct instruction + guided practice"
    - day: 3
      objective: "{{DAY_3_OBJECTIVE}}"
      pedagogy_focus: "guided to independent practice"
    - day: 4
      objective: "{{DAY_4_OBJECTIVE}}"
      pedagogy_focus: "synthesis"
    - day: 5
      objective: "{{DAY_5_OBJECTIVE}}"
      pedagogy_focus: "summative assessment"
  materials:
    - "{{MATERIAL_1}}"
  assessment_types:
    - "performance task"
    - "exit ticket"
  sibling_handoff:
    worksheet: true
    quiz_generator: true
    rubric: true
---
```
````

- [ ] **Step 4: Commit**

```bash
git add skills/lesson-plan/references/templates/
git commit -m "docs(lesson-plan): add default/sub-plan/multi-day markdown templates"
```

---

## Task 5: Write references/standards/ (Common Core ELA/Math + NGSS)

**Rationale:** These three are the highest-traffic frameworks per eval cases 1, 2, 5. Write them first; state + IB + Cambridge follow in Task 6.

**Files:**
- Create: `skills/lesson-plan/references/standards/common-core-ela.md`
- Create: `skills/lesson-plan/references/standards/common-core-math.md`
- Create: `skills/lesson-plan/references/standards/ngss.md`

- [ ] **Step 1: Write common-core-ela.md**

Write `skills/lesson-plan/references/standards/common-core-ela.md`:

````markdown
# Common Core State Standards — ELA/Literacy

Official source: https://corestandards.org/ela-literacy/

## Strand codes

| Strand | Code prefix | Grades |
|---|---|---|
| Reading: Literature | `CCSS.ELA-LITERACY.RL.<grade>.<n>` | K-12 |
| Reading: Informational Text | `CCSS.ELA-LITERACY.RI.<grade>.<n>` | K-12 |
| Reading: Foundational Skills | `CCSS.ELA-LITERACY.RF.<grade>.<n>` | K-5 |
| Writing | `CCSS.ELA-LITERACY.W.<grade>.<n>` | K-12 |
| Speaking & Listening | `CCSS.ELA-LITERACY.SL.<grade>.<n>` | K-12 |
| Language | `CCSS.ELA-LITERACY.L.<grade>.<n>` | K-12 |
| Literacy in History/Social Studies | `CCSS.ELA-LITERACY.RH.<band>.<n>` | 6-12 |
| Literacy in Science/Technical | `CCSS.ELA-LITERACY.RST.<band>.<n>` | 6-12 |
| Writing in History/Science/Technical | `CCSS.ELA-LITERACY.WHST.<band>.<n>` | 6-12 |

Grades 9-10 and 11-12 use band notation: `RL.9-10.2`, `RL.11-12.2`.

## High-frequency anchor standards by grade band

### K-2 (foundational + early literature)

- `RL.K.1` — With prompting, ask and answer questions about key details.
- `RL.K.2` — Retell familiar stories including key details.
- `RF.K.1` — Demonstrate understanding of the organization and basic features of print.
- `RF.K.3` — Know and apply grade-level phonics and word analysis skills.
- `W.K.2` — Use a combination of drawing, dictating, and writing to compose informative/explanatory texts.
- `L.K.1` — Demonstrate command of the conventions of standard English grammar when writing or speaking.
- `RL.1.2` — Retell stories, including key details, and demonstrate understanding of their central message.
- `RL.2.2` — Recount stories and determine their central message, lesson, or moral.

### 3-5 (comprehension, main idea, text structure)

- `RL.3.2` — Recount stories; determine central message, lesson, or moral; explain how it is conveyed through key details.
- `RL.4.2` — Determine a theme of a story, drama, or poem from details in the text; summarize the text.
- `RL.5.2` — Determine a theme of a story, drama, or poem from details in the text, including how characters respond to challenges; summarize the text.
- `RI.4.2` — Determine the main idea of a text and explain how it is supported by key details.
- `W.4.1` — Write opinion pieces on topics or texts, supporting a point of view with reasons and information.

### 6-8 (argument, citation, analysis)

- `RL.6.2` — Determine a theme or central idea of a text and how it is conveyed through particular details.
- `RL.7.2` — Determine a theme or central idea of a text and analyze its development over the course of the text.
- `RL.8.2` — Determine a theme or central idea of a text and analyze its development over the course of the text, including its relationship to the characters, setting, and plot.
- `RI.7.1` — Cite several pieces of textual evidence to support analysis of what the text says explicitly as well as inferences drawn.
- `W.7.1` — Write arguments to support claims with clear reasons and relevant evidence.
- `RH.6-8.2` — Determine the central ideas or information of a primary or secondary source; provide an accurate summary of the source.
- `WHST.6-8.1` — Write arguments focused on discipline-specific content.

### 9-12 (literary analysis, rhetorical argument, research)

- `RL.9-10.2` — Determine a theme or central idea of a text and analyze in detail its development over the course of the text, including how it emerges and is shaped and refined by specific details; provide an objective summary of the text.
- `RL.11-12.2` — Determine two or more themes or central ideas of a text and analyze their development over the course of the text, including how they interact and build on one another to produce a complex account.
- `RI.9-10.6` — Determine an author's point of view or purpose in a text and analyze how an author uses rhetoric to advance that point of view or purpose.
- `W.9-10.1` — Write arguments to support claims in an analysis of substantive topics or texts.
- `W.11-12.7` — Conduct short as well as more sustained research projects to answer a question (including a self-generated question) or solve a problem.
- `RH.9-10.2` / `RH.11-12.2` — Determine the central ideas or information of a primary or secondary source; provide an accurate summary.

## Lookup heuristics

1. **Theme / central idea lesson** → `RL.<grade>.2` or `RL.<band>.2` at 9-12.
2. **Main idea / informational** → `RI.<grade>.2`.
3. **Argumentative writing** → `W.<grade>.1`.
4. **Citing textual evidence** → `RL.<grade>.1` or `RI.<grade>.1`.
5. **Research** → `W.<grade>.7`.
6. **History or science reading at 6-12** → prefer `RH.*` or `RST.*` over `RI.*`.
7. **Unknown strand for a generic ELA topic** → default `RL.<grade>.2` for literature, `RI.<grade>.2` for non-fiction.

## What NOT to do

- Do NOT invent codes (e.g., `CCSS.ELA.COMPREHENSION.1` does not exist).
- Do NOT mix strands incorrectly (`RL` is literature, `RI` is informational — a lesson on a news article is `RI`, not `RL`).
- Do NOT cite grade-9 standard `RL.9.2` — use the band form `RL.9-10.2`.
````

- [ ] **Step 2: Write common-core-math.md**

Write `skills/lesson-plan/references/standards/common-core-math.md`:

````markdown
# Common Core State Standards — Mathematics

Official source: https://corestandards.org/math/

## Structure

`CCSS.MATH.CONTENT.<grade>.<domain>.<cluster>.<standard>`

Example: `CCSS.MATH.CONTENT.4.NF.A.1` means Grade 4, Number & Operations — Fractions, Cluster A, Standard 1.

In high school, domain codes replace grade prefixes: `CCSS.MATH.CONTENT.HSA.SSE.A.1` (Algebra — Seeing Structure in Expressions).

## Domains by grade band

### K-5 domains

| Code | Domain | Grades |
|---|---|---|
| `CC` | Counting & Cardinality | K |
| `OA` | Operations & Algebraic Thinking | K-5 |
| `NBT` | Number & Operations in Base Ten | K-5 |
| `NF` | Number & Operations — Fractions | 3-5 |
| `MD` | Measurement & Data | K-5 |
| `G` | Geometry | K-5 (K-8 continuous) |

### 6-8 domains

| Code | Domain |
|---|---|
| `RP` | Ratios & Proportional Relationships |
| `NS` | The Number System |
| `EE` | Expressions & Equations |
| `F` | Functions (8th only) |
| `G` | Geometry |
| `SP` | Statistics & Probability |

### High School (9-12) conceptual categories

| Code | Category |
|---|---|
| `HSN` | Number & Quantity |
| `HSA` | Algebra |
| `HSF` | Functions |
| `HSG` | Geometry |
| `HSS` | Statistics & Probability |

## Standards for Mathematical Practice (K-12, all grades)

Cite one or more alongside content standards:

1. `MP1` — Make sense of problems and persevere in solving them.
2. `MP2` — Reason abstractly and quantitatively.
3. `MP3` — Construct viable arguments and critique the reasoning of others.
4. `MP4` — Model with mathematics.
5. `MP5` — Use appropriate tools strategically.
6. `MP6` — Attend to precision.
7. `MP7` — Look for and make use of structure.
8. `MP8` — Look for and express regularity in repeated reasoning.

## High-frequency standards by grade

### Fractions (3-5)

- `3.NF.A.1` — Understand a fraction 1/b as the quantity formed by 1 part when a whole is partitioned into b equal parts.
- `4.NF.A.1` — Explain why a fraction a/b is equivalent to (n*a)/(n*b).
- `4.NF.B.3` — Understand a fraction a/b with a>1 as a sum of fractions 1/b.
- `5.NF.A.1` — Add and subtract fractions with unlike denominators.

### Operations (K-5)

- `K.OA.A.1` — Represent addition and subtraction with objects, fingers, mental images, drawings, sounds, acting out, verbal explanations, or equations.
- `1.OA.A.1` — Use addition and subtraction within 20 to solve word problems.
- `3.OA.A.1` — Interpret products of whole numbers (equal groups, arrays).
- `4.NBT.B.5` — Multiply a whole number of up to four digits by a one-digit whole number, and multiply two two-digit numbers.

### Ratios & Proportions (6-7)

- `6.RP.A.1` — Understand the concept of a ratio.
- `7.RP.A.2` — Recognize and represent proportional relationships.

### Expressions & Equations (6-8)

- `6.EE.B.7` — Solve real-world and mathematical problems by writing and solving one-step equations.
- `7.EE.B.4` — Use variables to represent quantities in a real-world or mathematical problem, and construct simple equations and inequalities.
- `8.EE.C.7` — Solve linear equations in one variable.

### Functions (8, 9-12)

- `8.F.A.1` — Understand that a function is a rule that assigns to each input exactly one output.
- `HSF.IF.A.1` — Understand the concept of a function and use function notation.
- `HSF.LE.A.1` — Distinguish between situations that can be modeled with linear vs. exponential functions.

### Algebra (9-12)

- `HSA.SSE.A.1` — Interpret expressions that represent a quantity in terms of its context.
- `HSA.SSE.B.3` — Choose and produce an equivalent form of an expression to reveal and explain properties of the quantity represented.
- `HSA.APR.B.3` — Identify zeros of polynomials when suitable factorizations are available.
- `HSA.REI.B.4` — Solve quadratic equations in one variable (by factoring, completing the square, quadratic formula, taking roots).

### Geometry (K-12)

- `K.G.A.2` — Correctly name shapes regardless of their orientations or overall size.
- `1.G.A.1` — Distinguish between defining attributes versus non-defining attributes of shapes.
- `7.G.B.6` — Solve real-world and mathematical problems involving area, volume, and surface area.
- `HSG.CO.C.10` — Prove theorems about triangles.

## Lookup heuristics

1. **"Fractions" + grade 3-5** → `<grade>.NF.*`.
2. **"Long division" + grade 4-6** → `4.NBT.B.6`, `5.NBT.B.6`, or `6.NS.B.2`.
3. **"Quadratic factoring" + high school** → `HSA.SSE.B.3` + `HSA.APR.B.3` + `HSA.REI.B.4`.
4. **"Linear equations" + grade 8** → `8.EE.C.7`.
5. **Any problem-solving lesson** → also cite relevant MP (at minimum `MP1`).

## What NOT to do

- Do NOT cite `CCSS.MATH.4.FRACTIONS` — that code format does not exist.
- Do NOT use HS content-category codes for grade 7-8 content.
- Always include at least one Mathematical Practice standard in lessons where students reason, model, or argue (essentially all of them).
````

- [ ] **Step 3: Write ngss.md**

Write `skills/lesson-plan/references/standards/ngss.md`:

````markdown
# Next Generation Science Standards (NGSS)

Official source: https://nextgenscience.org/

## Three-dimensional structure

Every NGSS Performance Expectation (PE) integrates:

1. **Disciplinary Core Idea (DCI)** — the content (e.g., `LS1.C — Organization for Matter and Energy Flow in Organisms`).
2. **Science and Engineering Practice (SEP)** — the verb (e.g., "Developing and Using Models").
3. **Crosscutting Concept (CCC)** — the lens (e.g., "Energy and Matter: Flows, Cycles, and Conservation").

## Performance Expectation code format

`<grade-band>-<disciplinary-letter><topic-number>-<pe-number>`

- Grade bands: `K`, `1`, `2`, `3`, `4`, `5`, `MS` (middle school 6-8), `HS` (high school 9-12).
- Disciplinary letters: `PS` (Physical Science), `LS` (Life Science), `ESS` (Earth & Space Science), `ETS` (Engineering, Technology & Applications of Science).

Examples:
- `MS-LS1-6` — Middle School Life Science, Topic 1 (From Molecules to Organisms), PE 6.
- `HS-PS1-2` — High School Physical Science, Topic 1 (Matter), PE 2.
- `5-PS2-1` — Grade 5, Physical Science, Topic 2 (Motion and Stability), PE 1.

## High-frequency PEs by band and topic

### Life Science — Middle School

- `MS-LS1-1` — Cells as the basic unit of life.
- `MS-LS1-6` — Construct a scientific explanation of how photosynthesis cycles matter and flows energy into and out of organisms.
- `MS-LS1-7` — Develop a model to describe how food is rearranged through chemical reactions.
- `MS-LS2-3` — Develop a model to describe the cycling of matter and flow of energy among living and nonliving parts of an ecosystem.

### Life Science — High School

- `HS-LS1-5` — Use a model to illustrate how photosynthesis transforms light energy into stored chemical energy.
- `HS-LS1-7` — Use a model to illustrate that cellular respiration is a chemical process.
- `HS-LS2-4` — Use mathematical representations to support claims for the cycling of matter and flow of energy.

### Earth & Space Science — plate tectonics (7th grade high-traffic)

- `MS-ESS2-2` — Construct an explanation based on evidence for how geoscience processes have changed Earth's surface at varying time and spatial scales.
- `MS-ESS2-3` — Analyze and interpret data on the distribution of fossils and rocks, continental shapes, and seafloor structures to provide evidence of past plate motions.

### Physical Science — K-5

- `K-PS2-1` — Plan and conduct an investigation to compare the effects of different strengths or directions of pushes and pulls.
- `3-PS2-1` — Plan and conduct an investigation to provide evidence of the effects of balanced and unbalanced forces.
- `5-PS1-1` — Develop a model to describe that matter is made of particles too small to be seen.

### Engineering (all bands)

- `MS-ETS1-1` — Define the criteria and constraints of a design problem.
- `HS-ETS1-2` — Design a solution to a complex real-world problem by breaking it down into smaller, more manageable problems.

## Science & Engineering Practices (SEPs)

All 8 SEPs, cite by name in lesson plan:

1. Asking Questions and Defining Problems
2. Developing and Using Models
3. Planning and Carrying Out Investigations
4. Analyzing and Interpreting Data
5. Using Mathematics and Computational Thinking
6. Constructing Explanations and Designing Solutions
7. Engaging in Argument from Evidence
8. Obtaining, Evaluating, and Communicating Information

## Crosscutting Concepts (CCCs)

1. Patterns
2. Cause and Effect
3. Scale, Proportion, and Quantity
4. Systems and System Models
5. Energy and Matter
6. Structure and Function
7. Stability and Change

## Lookup heuristics

1. **"Photosynthesis" + grade 6-8** → `MS-LS1-6` (primary), `MS-LS1-7` (respiration sibling).
2. **"Photosynthesis" + grade 9-12** → `HS-LS1-5`.
3. **"Plate tectonics" + grade 6-8** → `MS-ESS2-2` or `MS-ESS2-3`.
4. **"Ecosystems"** → `MS-LS2-*` or `HS-LS2-*`.
5. **"Forces / motion"** → `K-PS2-*`, `3-PS2-*`, `MS-PS2-*`, `HS-PS2-*`.
6. **Any engineering-design lesson** → add an `ETS1-*` PE.

## Pedagogy implication

NGSS is best taught with the **5E model** (see `references/pedagogy/5e.md`). When the user asks for an NGSS lesson without specifying a pedagogy, **override the default Gradual Release and use 5E** — note the override in Teacher Notes.

## What NOT to do

- Do NOT cite `NGSS.LS1.6` — the format requires the grade-band prefix.
- Do NOT cite only a DCI or only an SEP as a "standard" — cite the Performance Expectation.
- Do NOT confuse Common Core Science (no such thing) with NGSS.
````

- [ ] **Step 4: Commit**

```bash
git add skills/lesson-plan/references/standards/common-core-ela.md \
        skills/lesson-plan/references/standards/common-core-math.md \
        skills/lesson-plan/references/standards/ngss.md
git commit -m "docs(lesson-plan): add CCSS ELA, CCSS Math, and NGSS standards references"
```

---

## Task 6: Write references/standards/ (state frameworks + IB + Cambridge)

**Files:**
- Create: `skills/lesson-plan/references/standards/state-frameworks.md`
- Create: `skills/lesson-plan/references/standards/ib.md`
- Create: `skills/lesson-plan/references/standards/cambridge.md`

- [ ] **Step 1: Write state-frameworks.md**

Write `skills/lesson-plan/references/standards/state-frameworks.md`:

````markdown
# State Frameworks (TEKS, NY NGLS, CA, FL B.E.S.T., VA SOL)

**Important:** State standards shift over time. This file bundles a V1 snapshot; always include a disclaimer: *"Standards verified as of 2026-04-14. Confirm with your district / state education agency (SEA) before printing final plans."*

## Coverage in V1

First-class (structure + high-frequency codes listed here):

- **Texas (TEKS)** — Texas Essential Knowledge and Skills.
- **New York (NGLS)** — Next Generation Learning Standards.
- **California** — Content Standards (ELA/Math aligned with CCSS; Science based on NGSS-CA; History-Social Science is CA-specific).
- **Florida (B.E.S.T.)** — Benchmarks for Excellent Student Thinking.
- **Virginia (SOL)** — Standards of Learning.

Pointers-only (cite structure and link to SEA):

- PA Academic Standards, IL Learning Standards, NC Standard Course of Study, GA Standards of Excellence, OH Learning Standards, MI Academic Standards, WA K-12 Learning Standards.

## Texas — TEKS

Code format: `§<chapter>.<section>(<grade>)(<letter>)(<number>)` or simplified as `TEKS.<subject>.<grade>.<strand>.<num>`.

Common shorthand used in lesson plans:
- `TEKS Math 5.3(A)` — Grade 5 Math, Knowledge/Skills Statement 3, Standard A.
- `TEKS ELAR 4.6(F)` — Grade 4 English Language Arts and Reading, Knowledge/Skills 6, Standard F.

Subjects in V1: Math, English Language Arts and Reading (ELAR), Science, Social Studies.

**Heuristic:** if user says "Texas" + subject + grade, look up the chapter & section in the TEA (Texas Education Agency) online scope-and-sequence. If uncertain, cite the strand (e.g., `TEKS Math 5 — Number and Operations`) and add a disclaimer.

## New York — Next Generation Learning Standards

Code format mirrors CCSS with `NY-` prefix for English and Math since NY's NGLS diverged from CCSS in 2017 with clarifying revisions.

Examples:
- `NY-4.NF.1` — Grade 4 Number & Operations — Fractions, Standard 1.
- `NYSSLS-MS-LS1-6` — NY Science Learning Standards version of NGSS PE.

Social Studies uses the **NYS K-12 Social Studies Framework**: `SS.<grade>.<unit>.<num>`. Example: `SS.8.7` — Civil War.

## California

- **ELA/Math:** CCSS directly — use the CCSS reference files.
- **Science:** CA NGSS — same codes as NGSS with occasional CA-specific PEs. Reference as `CA-NGSS MS-LS1-6`.
- **History-Social Science:** CA-specific — code format `HSS <grade>.<standard>`. Example: `HSS 8.10` (Civil War).
- **ELD (English Language Development) Standards:** Part I, Part II, Part III. Reference `CA ELD PI.1.1` etc. — important when the lesson targets ELLs in CA.

## Florida B.E.S.T.

Code format: `<subject>.<grade>.<strand>.<cluster>.<standard>`. Examples:
- `MA.4.NSO.1.1` — Math, Grade 4, Number Sense & Operations, Cluster 1, Standard 1.
- `ELA.6.R.2.2` — ELA, Grade 6, Reading, Strand 2, Standard 2.
- `SC.7.L.15.1` — Science, Grade 7, Life Science, Standard Group 15, Standard 1.

B.E.S.T. replaced MAFS/LAFS in Florida around 2021.

## Virginia SOL

Code format: `<subject>.<grade>.<num>`. Examples:
- `VA SOL Math 4.5` — Grade 4 Math SOL 5.
- `VA SOL English 5.4` — Grade 5 English SOL 4.
- `VA SOL Science 6.5` — Grade 6 Science SOL 5.

## Heuristic when user says "state standards" without a state

1. Look at user locale / stated state — if absent, ASK: "Which state's standards?"
2. If state is in V1 first-class list, cite codes from the appropriate section above.
3. If pointer-only state, cite the **strand / domain** descriptively and point to the SEA URL. Example: *"Aligned to PA Academic Standards for English Language Arts, Grade 5 — see https://pdesas.org for the specific code."*

## What NOT to do

- Do NOT fabricate state codes. If uncertain, describe the strand + grade + topic and note "verify specific code at [SEA URL]".
- Do NOT treat every state as CCSS — after 2014 many states diverged (TX never adopted CCSS, FL replaced MAFS with B.E.S.T., etc.).
- Always include the "verified as of" disclaimer in the plan's Teacher Notes when using state codes.
````

- [ ] **Step 2: Write ib.md**

Write `skills/lesson-plan/references/standards/ib.md`:

````markdown
# International Baccalaureate (IB)

IB has three school-level programs and one career program. Each has a distinct structure — do not conflate them.

## PYP — Primary Years Programme (ages 3-12)

Organized around **6 Transdisciplinary Themes**:

1. Who We Are
2. Where We Are in Place and Time
3. How We Express Ourselves
4. How the World Works
5. How We Organize Ourselves
6. Sharing the Planet

Each unit is a "Unit of Inquiry" framed by a **Central Idea** and **Lines of Inquiry**. Lessons cite:
- Transdisciplinary Theme.
- Central Idea.
- Key Concepts: form, function, causation, change, connection, perspective, responsibility, reflection.
- Approaches to Learning (ATL) skills: thinking, social, communication, self-management, research.
- Learner Profile attributes (inquirer, knowledgeable, thinker, communicator, principled, open-minded, caring, risk-taker, balanced, reflective).

Example citation in a lesson plan:
> **IB PYP** — Theme: How the World Works; Central Idea: "Plants respond to their environment to survive"; Key Concept: Function; ATL: Research (information-literacy).

## MYP — Middle Years Programme (ages 11-16)

Organized around **8 Subject Groups**:

1. Language and Literature
2. Language Acquisition
3. Individuals and Societies
4. Sciences
5. Mathematics
6. Arts
7. Physical and Health Education
8. Design

Framed by **Global Contexts**:
- Identities and Relationships
- Orientation in Space and Time
- Personal and Cultural Expression
- Scientific and Technical Innovation
- Globalization and Sustainability
- Fairness and Development

And **Key Concepts** (16 total, vary by subject group) + **Related Concepts** (subject-specific).

Each unit has a **Statement of Inquiry** + **Inquiry Questions** (factual, conceptual, debatable).

Subjects use **Assessment Criteria A-D**, each with achievement levels 1-8. Example: Sciences Criterion B: Inquiring and Designing.

Example citation:
> **IB MYP Sciences** — Key Concept: Systems; Related Concept: Interaction; Global Context: Scientific and Technical Innovation; Criterion B: Inquiring and Designing; Statement of Inquiry: "Cellular systems interact to transform energy for survival."

## DP — Diploma Programme (ages 16-19)

**Six Subject Groups** (students take one from each):

1. Studies in Language and Literature
2. Language Acquisition
3. Individuals and Societies
4. Sciences
5. Mathematics
6. The Arts (or second subject from groups 1-4)

Plus **Core**: Extended Essay (EE), Theory of Knowledge (TOK), Creativity/Activity/Service (CAS).

Each subject offers **SL** (Standard Level, ~150 hrs) and **HL** (Higher Level, ~240 hrs). Assessment via **Internal Assessment (IA)** + **External Assessment (exams)**.

Lesson plan citations reference the syllabus **topic** and the **assessment objective**. Example:
> **IB DP Biology SL** — Topic 2.9: Photosynthesis; Assessment Objective 2: Apply knowledge and understanding of biology concepts.

## Lookup heuristics

1. User says "IB PYP" → cite Theme + Central Idea + Key Concept + ATL.
2. User says "IB MYP" → cite Subject Group + Key Concept + Global Context + Statement of Inquiry + Criterion.
3. User says "IB DP" → cite Subject + Topic + Assessment Objective + SL/HL.
4. User says just "IB" + grade → infer program: K-5 = PYP, 6-10 = MYP, 11-12 = DP.

## What NOT to do

- Do NOT invent "IB standard codes" — IB does not use numeric codes like CCSS. Cite by descriptive name.
- Do NOT mix PYP/MYP/DP vocabulary in the same plan.
- Do NOT skip the Statement of Inquiry (MYP) or Central Idea (PYP) — these are required by the program.
````

- [ ] **Step 3: Write cambridge.md**

Write `skills/lesson-plan/references/standards/cambridge.md`:

````markdown
# Cambridge International (CAIE)

Four school-level stages:

1. **Cambridge Primary** (ages 5-11) — Stages 1-6.
2. **Cambridge Lower Secondary** (ages 11-14) — Stages 7-9.
3. **Cambridge IGCSE** (ages 14-16) — 2-year course, external exam.
4. **Cambridge Upper Secondary / AS & A Level** (ages 16-19) — AS = 1 year, A Level = 2 years.

## Structure

Each stage has a **Curriculum Framework** per subject, divided into **Strands** → **Sub-strands** → **Learning Objectives**.

Code format (Primary + Lower Secondary): `<subject>.<stage>.<strand>.<objective>`. Example:
- `Mathematics 5.Nf.03` — Stage 5 Mathematics, Number: Fractions, Objective 03.
- `English 8.Rv.04` — Stage 8 English, Reading: Vocabulary, Objective 04.

IGCSE and A Level use **Syllabus codes** (4-digit numbers):
- `0580` — Mathematics IGCSE.
- `0620` — Chemistry IGCSE.
- `9702` — Physics A Level.
- `9700` — Biology A Level.

Each syllabus has numbered sections with learning objectives; cite as:
> `IGCSE Biology 0610 — 6.2 Photosynthesis — LO 6.2.1: Define photosynthesis as the process by which plants manufacture carbohydrates from raw materials using energy from light.`

## Subjects in V1 (first-class)

Primary/Lower Secondary: Mathematics, English, Science, Global Perspectives.
IGCSE: Mathematics (0580), English First Language (0500), English as a Second Language (0510), Biology (0610), Chemistry (0620), Physics (0625), Combined Science (0653), History (0470), Geography (0460).
A Level: Mathematics (9709), Further Mathematics (9231), Biology (9700), Chemistry (9701), Physics (9702), English Literature (9695), History (9489).

## Lookup heuristics

1. User says "Cambridge" + grade K-6 → Cambridge Primary, stage = `grade + 1` (kindergarten = Stage 1).
2. User says "Cambridge" + grade 7-9 → Cambridge Lower Secondary.
3. User says "IGCSE" or "GCSE" → IGCSE; ask for year 1 vs year 2 if unclear.
4. User says "A Level" or "AS Level" → Upper Secondary; use the 4-digit syllabus code.

## What NOT to do

- Do NOT use CCSS codes for Cambridge lessons.
- Do NOT confuse Cambridge Primary stage numbers with US grades (Stage 5 = Year 5 = ~age 10 = US Grade 4).
- Always cite the syllabus code for IGCSE / A Level.
````

- [ ] **Step 4: Commit**

```bash
git add skills/lesson-plan/references/standards/state-frameworks.md \
        skills/lesson-plan/references/standards/ib.md \
        skills/lesson-plan/references/standards/cambridge.md
git commit -m "docs(lesson-plan): add state frameworks, IB, Cambridge standards references"
```

---

## Task 7: Write references/pedagogy/ (Gradual Release, UDL, 5E, Madeline Hunter)

**Rationale:** Gradual Release and UDL are locked defaults per spec §marketplace. They must exist before SKILL.md references them. 5E is the auto-override for NGSS. Madeline Hunter is available as a named option.

**Files:**
- Create: `skills/lesson-plan/references/pedagogy/gradual-release.md`
- Create: `skills/lesson-plan/references/pedagogy/udl.md`
- Create: `skills/lesson-plan/references/pedagogy/5e.md`
- Create: `skills/lesson-plan/references/pedagogy/madeline-hunter.md`

- [ ] **Step 1: Write gradual-release.md**

Write `skills/lesson-plan/references/pedagogy/gradual-release.md`:

````markdown
# Gradual Release of Responsibility (Default)

**Source:** Fisher & Frey, *Better Learning Through Structured Teaching* (2008, 2014).

**One-line summary:** Shift cognitive load from teacher to student across four phases: I Do → We Do → You Do Together → You Do Alone.

## The four phases

### 1. Focused Instruction — "I Do"

- Teacher demonstrates the concept, skill, or strategy.
- Think-alouds: teacher narrates their reasoning.
- Keep it **short**: 5-15 minutes depending on grade band.
- Introduce key vocabulary explicitly.

### 2. Guided Instruction — "We Do"

- Teacher + students work together on a similar problem.
- High frequency of Checks for Understanding (CFU).
- Scaffolds are still present (sentence starters, partial solutions, think-pair-share).
- Teacher moves from "leading" to "prompting" as students take over.

### 3. Collaborative Learning — "You Do Together"

- Students work in pairs or small groups.
- Productive struggle is the goal; teacher monitors and intervenes selectively.
- Accountable talk structures: "I agree because…", "Can you say more about…".

### 4. Independent Learning — "You Do Alone"

- Students apply the skill solo.
- Exit tickets or short tasks assess whether the learning transferred.
- This is where the formative assessment evidence for the day typically comes from.

## Section mapping to the default 13-section template

| Template section | Phase |
|---|---|
| Direct Instruction | I Do |
| Guided Practice | We Do |
| (Implicit) Collaborative | You Do Together |
| Independent Practice | You Do Alone |
| Formative Assessment | evidence gathered during You Do Alone |

## Grade-band calibration

- **K-2:** Shorten each phase (I Do 5 min max). Use manipulatives and physical gestures. Skip "You Do Together" if class is whole-group — jump to You Do Alone with teacher circulating.
- **3-5:** Standard gradual release. Partner talk (You Do Together) fits well here.
- **6-8:** Discourse-heavy. We Do uses Socratic prompts. You Do Together becomes structured group work with roles.
- **9-12:** I Do compresses (students often read / preview before class). Emphasis shifts to You Do Together + You Do Alone.
- **College:** Lecture + active-learning breaks function as compressed I Do + We Do cycles; You Do is often homework / problem sets.

## When to NOT use Gradual Release

- Pure inquiry lessons in science — use **5E** instead.
- Seminar-style discussion at 9-12 — use Socratic seminar structure.
- Exploratory art / open-ended creative projects — UDL-forward with minimal direct instruction.

## Common mistakes

- **Too long on I Do.** Students disengage after ~10 min of direct teacher talk (much less in lower grades).
- **Skipping We Do.** Going straight from I Do to You Do Alone — the gap kills transfer.
- **Never releasing.** If the teacher is still leading at minute 40 of 50, it's not gradual release.

## Required vocabulary in lesson plan output

When using Gradual Release (default), the lesson plan sections MUST use these headings exactly so the evals pass:

- `## Direct Instruction — "I Do"`
- `## Guided Practice — "We Do"`
- `## Independent Practice — "You Do"`
````

- [ ] **Step 2: Write udl.md**

Write `skills/lesson-plan/references/pedagogy/udl.md`:

````markdown
# Universal Design for Learning (UDL)

**Source:** CAST (Center for Applied Special Technology). UDL Guidelines 3.0 (2024).

**One-line summary:** Design lessons with variability in mind from the start — provide **multiple means** of engagement, representation, and action/expression so all learners have access without retrofitting accommodations.

## The three principles

### 1. Multiple Means of Engagement ("Why" of learning)

Recruit interest, sustain effort and persistence, build self-regulation.

Checkpoints:
- Provide options for recruiting interest: choice, relevance, cultural assets.
- Provide options for sustaining effort: vary demands, foster collaboration, provide mastery-oriented feedback.
- Provide options for self-regulation: goal-setting, coping skills, self-assessment.

**In a lesson plan, this shows up as:**
- Topic choice within a shared objective.
- Real-world connection in the Hook.
- Clear success criteria shared with students.
- Partner structures that reduce isolation.

### 2. Multiple Means of Representation ("What" of learning)

Perception, language/symbols, comprehension.

Checkpoints:
- Provide options for perception: text + audio + image, adjustable size/color.
- Provide options for language & symbols: pre-teach vocabulary, use graphics alongside text, clarify syntax.
- Provide options for comprehension: activate background knowledge, highlight big ideas, guide information processing.

**In a lesson plan, this shows up as:**
- Anchor charts + read-aloud + visual diagrams.
- Pre-taught vocabulary with image cards.
- Graphic organizers (Frayer model, concept map, T-chart).
- Multiple representations of the same concept (e.g., fraction as area model + number line + set model).

### 3. Multiple Means of Action & Expression ("How" of learning)

Physical action, expression & communication, executive functions.

Checkpoints:
- Provide options for physical action: accessible tools, alternative keyboards, voice input.
- Provide options for expression: speak / write / draw / build / code / video.
- Provide options for executive function: goal-setting scaffolds, planning templates, progress monitoring.

**In a lesson plan, this shows up as:**
- Student choice of product: written response OR sketch-note OR voice recording.
- Scaffolded planning templates (outlines, storyboards).
- Checklists and rubrics shared in advance.

## UDL in the default Differentiation section

The `Differentiation` section of the lesson plan has three sub-sections (ELL / SPED / Gifted). UDL is the **design philosophy** that shapes all three: by building options in, we reduce the retrofits needed.

In output, explicitly name UDL principles when relevant:
> "Engagement: students choose one of three historical figures to research (interest + self-regulation)."
> "Representation: plant-cell diagram provided alongside text explanation (perception)."
> "Action/Expression: students can submit their model as a drawing, a 3D clay model, or a short video (expression)."

## Grade-band calibration

- **K-2:** Emphasize perception + physical action (visuals, manipulatives, movement). Choice limited to 2 options.
- **3-5:** Pre-teach vocabulary, anchor charts, graphic organizers. Choice among 3 products.
- **6-8+:** Student self-regulation checkpoints, goal-setting, self-assessment rubrics. Open-ended product options.

## Common mistakes

- Treating UDL as "one strategy for each disability." UDL is universal — it benefits all learners.
- Offering "choice" that all boils down to the same task (not real variability).
- Writing "UDL" in the differentiation section without naming specific options.

## Required in the differentiation section

When the pedagogy frontmatter is `gradual-release` (default), the Differentiation section MUST weave in at least one UDL option from each of the three principles. The evals do not enforce this structurally, but the quality bar demands it.
````

- [ ] **Step 3: Write 5e.md**

Write `skills/lesson-plan/references/pedagogy/5e.md`:

````markdown
# The 5E Instructional Model

**Source:** Biological Sciences Curriculum Study (BSCS), Rodger Bybee et al.

**One-line summary:** Inquiry-based cycle especially well-suited for NGSS science lessons: Engage → Explore → Explain → Elaborate → Evaluate.

## The five phases

### 1. Engage (5-10 min)

- Hook students with a phenomenon, puzzling observation, or driving question.
- Activate prior knowledge; surface misconceptions.
- Example: show a time-lapse of a plant bending toward light. Ask: "What's happening? Why?"

### 2. Explore (15-25 min)

- Students investigate the phenomenon directly — hands-on, minds-on.
- Lab work, data collection, simulation, field observation.
- Teacher is a facilitator, not an explainer, at this stage.

### 3. Explain (10-15 min)

- Students articulate their findings.
- Teacher introduces formal vocabulary and scientific explanations AFTER exploration (not before).
- Connect student observations to the DCI (Disciplinary Core Idea).

### 4. Elaborate (10-15 min)

- Apply the new understanding to a new context or extended problem.
- Transfer; design a solution; model a related phenomenon.

### 5. Evaluate (5-10 min, or ongoing)

- Formative throughout, summative at the end of the cycle.
- Students demonstrate understanding: claim-evidence-reasoning (CER) writing, model sketches, exit tickets.

## When to use 5E (auto-override default)

**Auto-override Gradual Release with 5E when:**

- Subject is Science (NGSS or state science standards).
- Topic involves a natural phenomenon students can observe.
- User explicitly asks for 5E or "inquiry."

Do NOT use 5E for rote procedural content (balancing equations, solving linear systems) — use Gradual Release there.

## Section mapping to the default 13-section template

The 13 sections remap when using 5E:

| 5E phase | Template section |
|---|---|
| Engage | Hook / Anticipatory Set |
| Explore | Direct Instruction is REPLACED by student exploration — still write it in the `Direct Instruction` section but label the content "Explore — student investigation" |
| Explain | Guided Practice |
| Elaborate | Independent Practice |
| Evaluate | Formative Assessment + Closure |

Note in Teacher Notes: *"Pedagogy override: 5E used instead of Gradual Release — aligns with NGSS three-dimensional learning."*

## Grade-band calibration

- **K-2:** Simplified — one Explore activity with manipulatives, short Explain, quick draw-what-you-learned evaluate.
- **3-5:** Full 5E, Explore often uses simple materials (seeds, magnets, ramps).
- **6-8:** Full 5E with structured lab notebooks and CER writing.
- **9-12:** Extended 5E, possibly across multiple days — one lesson = Engage + Explore, next = Explain + Elaborate, next = Evaluate.

## Common mistakes

- Explaining before exploring ("frontloading") — this kills the inquiry.
- Skipping Elaborate — students need transfer or the learning stays in one context.
- Running Evaluate only at the end — ongoing formative evidence during Explore & Explain is what makes 5E powerful.

## Output frontmatter change

When using 5E, set `pedagogy: "5e"` in the YAML footer.
````

- [ ] **Step 4: Write madeline-hunter.md**

Write `skills/lesson-plan/references/pedagogy/madeline-hunter.md`:

````markdown
# Madeline Hunter's 7-Step Lesson Design

**Source:** Hunter, *Mastery Teaching* (1982). Widely used in teacher training and in many teacher-evaluation rubrics (Danielson, Marzano).

**One-line summary:** A structured 7-step lesson flow: Anticipatory Set → Objective/Purpose → Input → Modeling → Checking for Understanding → Guided Practice → Independent Practice (+ Closure).

## The 7 (really 8) steps

1. **Anticipatory Set** — hook; activate prior knowledge.
2. **Objective and Purpose** — state what students will learn and why.
3. **Input** — direct teaching of content.
4. **Modeling** — show worked examples; think-aloud.
5. **Checking for Understanding** — CFU questions, signal checks.
6. **Guided Practice** — teacher supports students practicing.
7. **Independent Practice** — students do it alone.
8. **Closure** (implicit 8th step in most modern adaptations) — recap + exit.

## When to use Madeline Hunter

- User explicitly asks for Madeline Hunter or "Hunter model."
- District / principal uses a Hunter-based evaluation rubric and the teacher wants alignment.
- Skill-building lessons with clear procedural content.

Otherwise prefer Gradual Release (default) or 5E (science).

## Section mapping

| Madeline Hunter | Template section |
|---|---|
| Anticipatory Set | Hook |
| Objective and Purpose | (fold into header + objectives — state purpose in opening lines) |
| Input | Direct Instruction |
| Modeling | Direct Instruction (worked example sub-section) |
| Checking for Understanding | (fold into Guided Practice CFU bullets) |
| Guided Practice | Guided Practice |
| Independent Practice | Independent Practice |
| Closure | Closure |

## Output frontmatter change

Set `pedagogy: "madeline-hunter"` in the YAML footer.

## Common mistakes

- Treating all 7 steps as equal duration. Input + Modeling are short; Guided + Independent take the bulk of time.
- Confusing "Objective" (step 2) with the lesson objective header — in Hunter, "Objective" means **telling students** what they'll learn, not the teacher's private objective.
````

- [ ] **Step 5: Commit**

```bash
git add skills/lesson-plan/references/pedagogy/
git commit -m "docs(lesson-plan): add pedagogy references (gradual-release, UDL, 5E, Hunter)"
```

---

## Task 8: Write references/differentiation/ (catalog + ELL + SPED + Gifted)

**Files:**
- Create: `skills/lesson-plan/references/differentiation/catalog.md`
- Create: `skills/lesson-plan/references/differentiation/ell-strategies.md`
- Create: `skills/lesson-plan/references/differentiation/sped-strategies.md`
- Create: `skills/lesson-plan/references/differentiation/gifted-strategies.md`

- [ ] **Step 1: Write catalog.md**

Write `skills/lesson-plan/references/differentiation/catalog.md`:

````markdown
# Differentiation Catalog — Cross-Cutting Index

A strategy-to-when-to-use index. Use this as the **first read** when populating the Differentiation section; it points to the three learner-category files for depth.

## By UDL principle

### Engagement

- **Interest-based choice** → offer topic or product choice within a shared objective. Use in Explore / Independent Practice. See gifted-strategies.md for depth-not-pace extensions.
- **Relevance hooks** → connect topic to student identities, community, current events. Use in Hook.
- **Collaborative structures** → think-pair-share, numbered heads, jigsaw. Use in Guided Practice. Good for ELL (see ell-strategies.md).
- **Success criteria shared upfront** → reduces anxiety; helps SPED and ELL especially.

### Representation

- **Multimodal input** → text + image + audio + video. Critical for ELL and many SPED students.
- **Pre-taught vocabulary** → Frayer model, word wall, image cards. Use before Direct Instruction. See ell-strategies.md.
- **Graphic organizers** → T-chart, Venn, concept map, timeline. Use in Direct Instruction and Independent Practice. See sped-strategies.md for executive-function supports.
- **Chunking** → break long text/tasks into smaller units. Critical for SPED.

### Action & Expression

- **Multiple product options** → written, oral, visual, kinesthetic. Apply at Independent Practice.
- **Sentence frames / stems** → "I think ___ because ___." Critical for ELL. Useful for SPED too.
- **Assistive tech cues** → text-to-speech, speech-to-text, word prediction. Note in SPED subsection.
- **Planning scaffolds** → outlines, storyboards, checklists. Critical for SPED executive function.

## By common special population

### English Language Learners (ELL)

Default scaffolds (include at minimum 3 in the ELL subsection):

1. Visual supports alongside text.
2. Sentence frames for speaking and writing.
3. Strategic L1 use (partner with a L1-speaking buddy if possible).
4. Pre-teach 3-5 key vocabulary words with images.
5. Total Physical Response (TPR) for K-5.
6. Wait time increased (10 seconds) for responses.

Calibrate to WIDA level (1 Entering → 6 Reaching). See ell-strategies.md.

### Special Education (SPED / IEP-504)

Default accommodations (include at minimum 3 in SPED subsection):

1. Extended time.
2. Chunked task with checkpoints.
3. Graphic organizer provided.
4. Quiet workspace option.
5. Written + oral directions.
6. Reduced items (quality over quantity).
7. Assistive tech cues: text-to-speech, fidget tools, calculators where appropriate.

See sped-strategies.md for common IEP/504 accommodations by disability category.

### Gifted / High-Achieving

Default extensions (include at minimum 2 in Gifted subsection):

1. Depth, not pace — deeper analysis, not just more problems.
2. Socratic / open-ended prompts.
3. Real-world application / authentic product.
4. Compacting — skip already-mastered content.
5. Student-generated questions; teach back to peers.
6. Interdisciplinary connections.

Avoid: "more of the same," "just give them the hard sheet," unsupervised independent research without structure. See gifted-strategies.md.

## By scenario

| Scenario | Go-to strategies |
|---|---|
| Newcomer ELL (WIDA 1-2) | Visual supports, bilingual glossary, TPR, gesture, image-based assessment, pair with L1 buddy. |
| Student with dyslexia | Text-to-speech, decodable text option, chunked reading, audio-book version. |
| Student with ADHD | Movement breaks, chunked tasks, visual timer, clear checklists, preferred seating. |
| Gifted student finishing early | Extension task with open-ended prompt (NOT more problems). |
| Student with IEP for math | Graphic organizer, manipulatives, reduced-item set, calculator per IEP, written steps. |
| Autistic student (varies widely) | Clear routines, visual schedule, advance warning of transitions, quiet space option, respect for special interests. |
| Twice-exceptional (gifted + SPED) | Strengths-based + accommodation. Open-ended + scaffolded. |

## Quality check

Before finalizing the Differentiation section, verify:

- [ ] At least 2 strategies listed in each of ELL, SPED, Gifted.
- [ ] Strategies are concrete (name the tool, not "support as needed").
- [ ] At least one UDL-Engagement, one UDL-Representation, one UDL-Action option across the three subsections.
- [ ] No strategy requires materials not listed in the Materials section.
````

- [ ] **Step 2: Write ell-strategies.md**

Write `skills/lesson-plan/references/differentiation/ell-strategies.md`:

````markdown
# ELL Differentiation Strategies

**Frameworks:** WIDA (World-Class Instructional Design and Assessment), SIOP (Sheltered Instruction Observation Protocol).

## WIDA levels (K-12 English proficiency)

1. **Entering** — student uses pictorial / graphic representations; single words, memorized phrases.
2. **Emerging** — phrases, short sentences; heavy context clues needed.
3. **Developing** — simple and compound sentences; general academic vocabulary.
4. **Expanding** — a variety of sentence types; specific academic vocabulary; minor errors.
5. **Bridging** — complex sentences; technical academic vocabulary; few errors impede meaning.
6. **Reaching** — on par with native English peers for the grade.

When writing an ELL subsection, specify which WIDA level the scaffold targets if known; otherwise write for levels 2-4 (the most common).

## Core scaffolds

### Visual supports

- Pictures, diagrams, real objects ("realia") paired with every key vocabulary word.
- Anchor charts with words + images.
- Videos with captions in English (and L1 if available).

### Vocabulary pre-teaching

- Frayer model: definition / characteristics / examples / non-examples.
- 3-5 words max per lesson (don't overwhelm).
- Use the word in context (example sentence) before abstract definition.

### Sentence frames

- Level 1-2: "I see ___." "This is a ___."
- Level 3-4: "I think ___ because ___." "First, ___. Then, ___."
- Level 5-6: "Although ___, I would argue that ___ because ___."

### Language objectives alongside content objectives

Every lesson for ELLs should have a **language objective** paired with the content objective. Example:
- Content: "SWBAT model photosynthesis."
- Language: "SWBAT explain the process using the words *absorb*, *convert*, *produce* in complete sentences."

### Partner / small group structures

- Pair newcomer ELLs with L1-speaking peers when possible.
- Use structured talk moves: "I agree because ___." "Can you say more about ___?"

### Strategic L1 use

- Allow L1 for thinking, planning, peer discussion.
- Offer L1 glossary for key terms.
- Accept L1 writing for brainstorming; English for final product.

### SIOP features (abbreviated)

- Lesson preparation: clear objectives, supplementary materials.
- Building background: link to prior experiences, emphasize key vocabulary.
- Comprehensible input: slower speech, enunciation, variety of techniques (visual, modeled).
- Strategies: scaffolding (sentence frames, graphic organizers), student problem-solving.
- Interaction: frequent opportunities to talk, grouping for oral practice.
- Practice/application: hands-on, all four language domains (listening, speaking, reading, writing).
- Lesson delivery: pacing appropriate, high engagement.
- Review/assessment: review vocabulary + concepts, regular informal CFU.

## Common mistakes

- Assuming ELL = SPED (it is not).
- Translating the worksheet into L1 without teaching the English vocabulary (misses the point).
- Reducing content rigor instead of scaffolding language (rigor stays high; access increases).
- Ignoring newcomers during whole-class discussion. Use partner talk first, then volunteer.
````

- [ ] **Step 3: Write sped-strategies.md**

Write `skills/lesson-plan/references/differentiation/sped-strategies.md`:

````markdown
# SPED / IEP-504 Differentiation Strategies

**Key principle:** Accommodations must follow the student's IEP (Individualized Education Program) or 504 Plan. This file provides common accommodations by category — the lesson plan should note "Per student IEP" since the teacher owns the legal document.

## Categories of accommodations (common but not exhaustive)

### Presentation

- Read test aloud / text-to-speech.
- Large print / high-contrast print.
- Highlighted key vocabulary.
- Chunked reading (one paragraph at a time).
- Advance organizer / outline before instruction.

### Response

- Scribe / speech-to-text.
- Type instead of handwrite.
- Word processor with spell-check.
- Verbal response instead of written.
- Use of calculator / math chart / formula sheet per IEP.

### Setting

- Quiet / distraction-reduced workspace.
- Preferred seating (near teacher, away from distractions).
- Individual or small-group testing.
- Sensory breaks as needed.

### Timing & scheduling

- Extended time (1.5x or 2x per IEP).
- Breaks as needed.
- Shortened / chunked task.
- Multiple sittings for long tasks.

### Executive function supports

- Task analysis: break task into numbered steps.
- Visual schedule / checklist.
- Graphic organizer provided (pre-populated partially for scaffolding).
- Timer / visible countdown.
- Fidget tools / standing desk per IEP.

## By common disability category

### Learning disability (specific, e.g., dyslexia, dyscalculia)

- Text-to-speech + decodable text option.
- Audio books / read-aloud for grade-level content.
- Multi-sensory phonics (for dyslexia).
- Manipulatives + visual models (for dyscalculia).

### ADHD

- Movement breaks (every 10-15 min for K-5, every 20 min for 6-12).
- Chunked tasks with visible progress.
- Visual timer.
- Clear, concise directions (written + oral).
- Preferred seating, fidget tool per IEP.

### Autism spectrum

- Clear, predictable routines.
- Visual schedule; advance warning of transitions.
- Literal language (avoid idioms without explanation).
- Quiet space / sensory break option.
- Respect for special interests — leverage as a motivator.
- Social scripts for group work if social skills are a goal.

### Emotional / behavioral

- De-escalation plan per IEP.
- Choice within structure.
- Predictable consequences.
- Break card / pass.

### Physical / motor

- Adapted writing tools (pencil grip, slant board).
- Typed responses instead of handwritten.
- Accessible materials placement.

### Speech/language

- Allow extended response time.
- Accept partial responses.
- Visual communication options (picture cards, AAC devices).

## In the lesson plan output

The SPED subsection should:

1. Name 2-4 concrete accommodations relevant to the lesson's demands.
2. Include the phrase "per student IEP / 504 Plan" or similar once.
3. Use plain-English accommodation names, not jargon or abbreviations only.
4. Never list a disability diagnosis in the plan itself (HIPAA / FERPA); refer to accommodations only.

Example output:

> **SPED / IEP-504**
> - Graphic organizer provided pre-populated with the first row as a model.
> - Text-to-speech available for the reading passage.
> - Task chunked into 3 parts with check-ins at each transition.
> - Extended time per student IEP / 504 Plan.

## Common mistakes

- Generic "differentiation as needed" with no specifics.
- Listing diagnoses instead of accommodations.
- Ignoring accommodations in favor of "just give them less work" (reducing quantity is sometimes appropriate but should not be the default).
````

- [ ] **Step 4: Write gifted-strategies.md**

Write `skills/lesson-plan/references/differentiation/gifted-strategies.md`:

````markdown
# Gifted / Extension Differentiation Strategies

**Core principle:** **Depth, not pace.** The default failure mode is "more of the same" or "give them the hard sheet." Gifted extensions should add cognitive depth, not quantity.

## Frameworks

### Renzulli's Enrichment Triad

1. **Type I — General Exploratory Activities:** broad exposure to topics beyond the curriculum.
2. **Type II — Group Training Activities:** process skills (research methods, creative thinking, critical analysis).
3. **Type III — Individual and Small Group Investigations of Real Problems:** student-driven, authentic products for real audiences.

In a single lesson, lean Type II: process-skill extension (e.g., "defend a counter-argument" instead of "write the same argument").

### Depth & Complexity (Sandra Kaplan)

Eight prompts that deepen any topic:

1. **Language of the Discipline** — use expert vocabulary.
2. **Details** — go deeper into specifics.
3. **Patterns** — identify recurring structures.
4. **Trends** — analyze changes over time.
5. **Unanswered Questions** — surface ambiguity.
6. **Rules** — identify explicit and implicit rules.
7. **Ethics** — examine moral/ethical dimensions.
8. **Big Ideas** — connect to universal themes.

Tag the gifted extension with one or two of these prompts.

### Bloom's highest tiers

Extensions should push into **Analyze / Evaluate / Create**, not stay at Remember / Understand / Apply.

## Concrete strategies

### Open-ended prompts

- Instead of "Solve 15 equations," ask "Create three equations that all have x = 5 as the solution. Explain your reasoning."
- Instead of "Summarize the chapter," ask "Identify the author's unstated assumptions. How would the argument change if one were false?"

### Socratic questioning

- "What evidence would change your mind?"
- "How does this connect to [previous unit]?"
- "What would happen if ___ were different?"

### Real-world / authentic product

- Teach the concept to a younger class.
- Write a letter to a local official applying the concept.
- Design a product / experiment / model / artwork based on the learning.

### Curriculum compacting

- Pretest; if student demonstrates mastery, skip the drill and move to extension.
- Replace redundant practice with enrichment.

### Interdisciplinary connections

- Connect math to music (ratios, rhythm).
- Connect history to current events.
- Connect science to ethics.

### Peer teaching / accountable expertise

- Student becomes the class expert on a sub-topic and teaches peers.

### Student-generated essential questions

- Let the gifted student propose the next inquiry question for the class.

## Avoid

- **"Give them more problems."** This is the #1 failure mode.
- **Unsupervised independent research with no structure.** Gifted students need scaffolding too — just different scaffolding.
- **Assuming gifted = good student.** Many gifted students underachieve, are twice-exceptional, or struggle with perfectionism.
- **Treating gifted as homogeneous.** A math-gifted student may need ELL or SPED support in other areas.

## In the lesson plan output

The Gifted subsection should:

1. Name 2-4 concrete extensions.
2. Use action verbs: "analyze," "design," "critique," "justify," "create."
3. Tie to the lesson objective — an extension that goes off-topic is not an extension.
4. Specify the product or deliverable (not vague "explore more deeply").

Example:

> **Gifted / Extension**
> - Students construct a counter-argument to the author's thesis using 2+ outside sources.
> - Identify the "unanswered questions" the text leaves open; propose a research method to investigate one.
> - Teach the big idea to a 5th-grade partner class through a 3-minute explainer video.

## Common mistakes

- Extensions that are just "more work" at the same cognitive level.
- No product or clear deliverable.
- Tied loosely or not at all to the lesson objective.
- Presumption that the student will self-manage without any scaffolding.
````

- [ ] **Step 5: Commit**

```bash
git add skills/lesson-plan/references/differentiation/
git commit -m "docs(lesson-plan): add differentiation catalog + ELL/SPED/Gifted strategy references"
```

---

## Task 9: Write references/grade-calibration.md and references/workflow.md

**Files:**
- Create: `skills/lesson-plan/references/grade-calibration.md`
- Create: `skills/lesson-plan/references/workflow.md`

- [ ] **Step 1: Write grade-calibration.md**

Write `skills/lesson-plan/references/grade-calibration.md`:

````markdown
# Grade-Band Calibration Rules

Calibrates tone, vocabulary, session structure, and activity complexity to the student's grade band.

## K-2 (ages 5-8)

- **Active block length:** 5-10 min max per segment. No single teacher-led block over 8 min.
- **Session length:** 15-30 min total active learning; the rest is play, snack, transitions.
- **Activities:** song, movement, manipulatives, read-aloud, play-based centers.
- **Vocabulary:** Tier 1 (everyday words). Any new word gets an image + gesture.
- **Reading:** picture books, shared reading, repeated readings. No long independent reading.
- **Writing:** drawing + dictation + emerging print. Do not expect paragraphs.
- **Grouping:** whole group + short partner turns. No complex group projects.
- **Assessment:** teacher observation, thumbs, draw-what-you-learned, show-with-fingers.
- **Homework:** usually none or "share with family." Never worksheets for homework in K.
- **Sections to trim in template:** Homework often set to "None — talk about what you learned at dinner tonight." Teacher Notes emphasizes sensory / attention management.

## 3-5 (ages 8-11)

- **Active block length:** 10-15 min.
- **Session length:** 30-45 min typical.
- **Activities:** gradual release fits perfectly; centers work well; partner talk ubiquitous.
- **Vocabulary:** Tier 1 base + Tier 2 academic vocabulary explicitly pre-taught.
- **Reading:** chapter books, informational texts, close reading of short excerpts.
- **Writing:** paragraphs; early essay structures; graphic organizers scaffolding.
- **Grouping:** partner + small group (3-4). Roles help.
- **Assessment:** exit tickets, short written responses, 3-2-1, quick quizzes.
- **Homework:** light — 10-20 min typical; practice or family-involved tasks.

## 6-8 (ages 11-14)

- **Active block length:** 15-20 min.
- **Session length:** 45-55 min.
- **Activities:** discourse-heavy, structured collaboration, Socratic seminar (adapted), labs, projects.
- **Vocabulary:** Tier 2 + Tier 3 (domain-specific). Word walls, Frayer models.
- **Reading:** complex texts; multiple texts; citing evidence.
- **Writing:** multi-paragraph essays; claim + evidence + reasoning (CER).
- **Grouping:** small groups with defined roles; whole-class discussions.
- **Assessment:** more formal exit tickets, writing samples, quizzes, performance tasks.
- **Homework:** 20-40 min per night per subject; mix of practice + short reading.
- **Identity-safe framing:** middle schoolers are tracking belonging. Avoid public failure, stereotype threat; emphasize growth mindset.

## 9-12 (ages 14-18)

- **Active block length:** 20-30 min on traditional schedule; longer cycles on block schedule.
- **Session length:** 50-60 min (traditional) or 80-90 min (block).
- **Activities:** inquiry, seminar, debate, labs, extended projects, simulations.
- **Vocabulary:** full academic discipline-specific language; argumentation vocabulary.
- **Reading:** full-length works, primary sources, research articles.
- **Writing:** essays, research papers, lab reports, creative argumentation.
- **Grouping:** student-led groups; Socratic seminars; debates.
- **Assessment:** formal writing, lab reports, projects, presentations, exams.
- **Homework:** 30-90 min per night per subject.
- **On block schedule (90 min):** insert a movement break at ~45 min; allow 2 cycles of guided → independent.

## College / adult learners

- **Session length:** 50 min (lecture), 75 min (expanded lecture or section), 180 min (seminar or lab).
- **Activities:** lecture with active-learning breaks every 15-20 min (think-pair-share, quick problem, 1-minute paper). Seminar discussions. Problem sets. Case studies.
- **Vocabulary:** domain-specific; assume prerequisites satisfied but define new key terms.
- **Reading:** assigned before class; discussion-based.
- **Assessment:** problem sets, exams, projects, papers, presentations.
- **Differentiation:** UDL principles still apply. Accommodations per Disability Services Office. Multilingual learners may request subtitled recordings.

## Homeschool

- Default to the child's grade band calibration.
- Add a note: "In a 1:1 or small-group homeschool setting, the direct instruction can compress to 3-5 minutes while hands-on and conversation time expand. Skip formal whole-group structures."

## Multi-age / cross-grade classrooms

- Generate the base plan for the younger grade.
- Add a "Cross-age extension" bullet in the Gifted subsection for the older sibling(s): open-ended task at a higher cognitive tier, same topic.
- Example: lesson on the water cycle for 2nd grader with 5th-grader sibling. Base = 2nd grade lesson. Extension = 5th grader creates a labeled diagram + explains how local weather illustrates one of the cycle stages.
````

- [ ] **Step 2: Write workflow.md**

Write `skills/lesson-plan/references/workflow.md`:

````markdown
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
````

- [ ] **Step 3: Commit**

```bash
git add skills/lesson-plan/references/grade-calibration.md \
        skills/lesson-plan/references/workflow.md
git commit -m "docs(lesson-plan): add grade calibration rules and generation workflow"
```

---

## Task 10: Write references/edge-cases.md

**Files:**
- Create: `skills/lesson-plan/references/edge-cases.md`

- [ ] **Step 1: Write edge-cases.md**

Write `skills/lesson-plan/references/edge-cases.md`:

````markdown
# Edge Cases

Handle these special inputs explicitly. Triggers, decisions, and output changes are listed.

## Sub-plan / emergency

- **Triggers (case-insensitive):** "sub plan," "substitute," "out sick," "emergency," "last minute coverage," "need someone to cover."
- **Action:** switch to `references/templates/sub-plan.md`.
- **Constraints:** fully self-contained (no prior context), low-tech / printable, behavior-management section required, materials list = printable paper + pencils / pens only.
- **YAML footer:** set `sub_plan: true`, `low_tech: true`, `behavior_notes: true`.

## Multi-day unit

- **Triggers:** "unit," "multi-day," "N-day," "week-long," "across multiple days," "<number> days x <minutes> min."
- **Action:** switch to `references/templates/multi-day-unit.md`.
- **Constraints:** one Unit Overview + one Day N sub-section per day. Each day has distinct objective. Summative assessment at the end. Coherent arc (hook/context → exploration → deepening → synthesis → assessment).
- **YAML footer:** include `num_days`, `duration_minutes_per_session`, `daily_breakdown`.

## Mini-lesson (< 20 minutes)

- **Triggers:** duration explicitly under 20 min, "mini-lesson," "quick lesson," "15 minutes on X."
- **Action:** default template with trimmed sections.
- **Keep:** Header, Objectives (1 only), Hook, Direct Instruction, Quick CFU, Closure, YAML footer.
- **Drop or combine:** Guided Practice + Independent Practice combined into one "Quick Practice" section. Differentiation compressed to one-line-each.
- **Homework:** always "None."

## Block schedule / long class (≥ 90 min)

- **Triggers:** duration ≥ 90 min, "block schedule," "2-hour class."
- **Action:** default template + movement break at midpoint + second guided→independent cycle.
- **Insert after first Independent Practice:** a `### Movement Break (5 min)` sub-section.
- **Add second cycle:** repeat Guided Practice + Independent Practice with a new application or extension problem.

## Cross-subject / interdisciplinary

- **Triggers:** "ELA + history," "interdisciplinary," "STEAM," "cross-curricular."
- **Action:** cite standards from BOTH frameworks in Standards Alignment. Keep one unified set of objectives, tag each with the domain in parentheses. Example: "SWBAT analyze how geographic features shaped the settlement of the Americas (Social Studies + ELA RI.4.5)."

## Cross-grade / multi-age (homeschool or one-room)

- **Triggers:** "my 2nd grader and my 5th grader," "multi-age," "one-room schoolhouse," "homeschool with siblings."
- **Action:** generate base plan at the younger grade. Add a "Cross-age extension" bullet in the Gifted subsection for the older sibling(s) — same topic, higher cognitive tier.
- **Example:** Water cycle lesson for 2nd grader + 5th grader. Base = 2nd grade lesson. Extension = 5th grader creates a labeled diagram + explains how local weather illustrates one of the cycle stages.

## Religious / politically sensitive topics

- **Triggers:** evolution vs. creationism, political figures, historical atrocities, sex education, drugs/alcohol, religion, gender/sexuality.
- **Action:**
  1. Present age-appropriate, balanced framing.
  2. Stick to evidence and standards-aligned content.
  3. Surface the sensitivity in **Teacher Notes** with language like: *"This topic may be sensitive in some communities. Review your district's curriculum guidelines and consider sending parents an advance notice."*
- **Do not:** self-censor to the point of abandoning content. Do not provide one-sided political framings. Do not use source materials that assume a specific religious or political position.

## Subjects with weak standards coverage (Art, Music, PE, SEL, electives)

- **Triggers:** subject = Art, Music, PE, SEL, Drama, Electives, Maker.
- **Action:** standards framework optional.
  - Art → National Core Arts Standards (NCAS).
  - Music → NCAS (music subset).
  - PE → SHAPE America's National Standards & Grade-Level Outcomes.
  - SEL → CASEL 5 Core Competencies.
  - Other electives → cite "general best practice" if no standard exists.
- **Standards Alignment section:** cite what applies; if nothing, write "No standards framework applies — aligned to general best practice" and proceed.

## Standards that the user names loosely

- **Example:** user says "third grade writing standards."
- **Action:** infer the specific code (CCSS ELA Writing → `W.3.*`). In the Standards Alignment section, cite the inferred code and add: *"(Inferred from user request. Confirm with your district.)"*

## Non-English-primary classrooms

- **Triggers:** "ELL-majority class," "Spanish-dominant students," "dual-language immersion."
- **Action:** produce the plan in English (V1 default). Emphasize ELL scaffolds heavily in the Differentiation section. Offer to translate key vocabulary (accept the offer if the user asks).
- **Localization to UK / AU / international English + metric units** — deferred to V2.

## Very short or very long durations that don't match common schedules

- **< 10 min:** decline politely and ask user to confirm — likely a typo. "10 minutes is very short for a full lesson. Did you mean 30 or 40? Or is this a mini-lesson within a longer class?"
- **> 180 min single session:** confirm — "3 hours in one block? That's a studio / seminar / lab format. Should I plan it with 2-3 movement breaks and multiple cycles?"

## User requests standards the skill doesn't have first-class support for

- **Example:** "OECD standards," "Russian federal education standard."
- **Action:** acknowledge the framework, describe the topic + grade + objective descriptively, add a Teacher Notes bullet: *"Specific standard codes not bundled in this skill. Verify with [SEA / ministry URL]."*

## Ambiguous grade / mixed-grade requests

- **"High school"** (no specific grade) → default to 10th grade.
- **"Elementary"** → default to 3rd grade.
- **"Middle school"** → default to 7th grade.
- **Note the default choice** in Teacher Notes: *"Defaulted to Grade X — adjust as needed."*
````

- [ ] **Step 2: Commit**

```bash
git add skills/lesson-plan/references/edge-cases.md
git commit -m "docs(lesson-plan): add edge-cases reference covering sub-plan, multi-day, mini-lesson, block, cross-subject, sensitive topics"
```

---

## Task 11: Write SKILL.md

**Rationale:** Now all references exist. Write the SKILL.md entry point last so it can accurately point at the files. Under 300 lines. Pushy description with both teacher + student trigger phrasings. Progressive disclosure — loads references only when needed.

**Files:**
- Create: `skills/lesson-plan/SKILL.md`

- [ ] **Step 1: Write SKILL.md**

Write `skills/lesson-plan/SKILL.md`:

````markdown
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

## Workflow (summary — full details in `references/workflow.md`)

1. **Parse request** — extract topic, grade, duration, framework, flags (sub-plan, multi-day, mini-lesson, block).
2. **Clarify** — at most one concise question if a required field is missing.
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
- Do not include PII (student names, IDs, IEP diagnoses) in the output.
````

- [ ] **Step 2: Verify SKILL.md is under 300 lines**

```bash
wc -l skills/lesson-plan/SKILL.md
```
Expected: line count < 300.

- [ ] **Step 3: Commit**

```bash
git add skills/lesson-plan/SKILL.md
git commit -m "feat(lesson-plan): add SKILL.md entry point with pushy triggers and progressive disclosure"
```

---

## Task 12: Dry-run evals against the skill

**Rationale:** We cannot programmatically run the evals harness (it lives outside this task's scope), but we can hand-trace each eval prompt through the workflow to verify assertion logic would pass.

**Files:** no new files; read-only review.

- [ ] **Step 1: Read evals.json and walk each case**

For each case in `skills/lesson-plan/evals/evals.json`, mentally trace:

1. Read the prompt.
2. Simulate the workflow (Task 9's `workflow.md`).
3. Identify which template would be selected.
4. Identify which standards file would be loaded + likely citation.
5. Check each assertion against expected output shape.

Case 1 (`ngss-photosynthesis-7th`):
- Template: default.
- Standards: `references/standards/ngss.md` → `MS-LS1-6`.
- Pedagogy: Science auto-override → 5E.
- Sections: 13 default template sections all present.
- Assertions: `contains_all` passes (all section headings match). `regex MS-LS1-[0-9]+` passes. `contains_all` ELL/SPED/Gifted within Differentiation passes. `section_nonempty Materials` passes. Judge: objectives use measurable Bloom's verbs.

Case 2 (`ccss-ela-theme-9th`):
- Template: default.
- Standards: `CCSS.ELA-LITERACY.RL.9-10.2`.
- Pedagogy: Gradual Release (default).
- Assertions: regex for RL.9-10.* passes. Hook + Formative Assessment nonempty. Independent Practice contains "exit criteria." Judge: topic-relevant hook.

Case 3 (`kindergarten-shapes-20min`):
- Template: default with mini-lesson trim (duration = 20 min is borderline; spec says mini-lesson is < 20).
- Decision: treat 20 min as K-2 default template with K-2 grade-calibration rules → blocks ≤ 8 min.
- Assertions: max section minutes ≤ 8 (passes if K-2 calibration is applied). Contains "song / movement / manipulatives" (K-2 rule). Homework = "share with family" (no worksheet). Judge: Tier-1 vocabulary.

Case 4 (`emergency-sub-plan-6th`):
- Template: sub-plan.
- Standards: CCSS or state-specific social studies.
- Assertions: contains "Substitute / Behavior / Management" (sub-plan template includes these). Behavior/Management section nonempty. No "see previous lesson" (self-contained). Judge: low-tech materials.

Case 5 (`multi-day-unit-am-rev-8th`):
- Template: multi-day unit.
- Standards: CCSS ELA-Literacy RH.6-8.* + maybe NY state social studies `SS.8.*`.
- Assertions: contains "Unit Overview, Day 1-5, Summative Assessment." Distinct objectives per day (template enforces). Regex for CCSS RH or C3 D2.His passes. Summative Assessment nonempty. Judge: coherent arc.

- [ ] **Step 2: Document any assertion gap**

If walking through any case reveals the skill cannot satisfy an assertion, note it in `evals/evals.json` as a known-limitation comment and revise either the reference files or the assertion. Any revision goes in a follow-up commit.

- [ ] **Step 3: Commit (no-op if no changes; skip if nothing to commit)**

```bash
git status
# If any changes: git add ... && git commit -m "docs(lesson-plan): refine evals after dry-run"
```

---

## Task 13: Final structural verification

**Files:** read-only.

- [ ] **Step 1: Verify file tree matches the File Structure section of this plan**

```bash
find skills/lesson-plan -type f | sort
```

Expected output:
```
skills/lesson-plan/SKILL.md
skills/lesson-plan/evals/evals.json
skills/lesson-plan/references/differentiation/catalog.md
skills/lesson-plan/references/differentiation/ell-strategies.md
skills/lesson-plan/references/differentiation/gifted-strategies.md
skills/lesson-plan/references/differentiation/sped-strategies.md
skills/lesson-plan/references/edge-cases.md
skills/lesson-plan/references/grade-calibration.md
skills/lesson-plan/references/output-contract.md
skills/lesson-plan/references/pedagogy/5e.md
skills/lesson-plan/references/pedagogy/gradual-release.md
skills/lesson-plan/references/pedagogy/madeline-hunter.md
skills/lesson-plan/references/pedagogy/udl.md
skills/lesson-plan/references/standards/cambridge.md
skills/lesson-plan/references/standards/common-core-ela.md
skills/lesson-plan/references/standards/common-core-math.md
skills/lesson-plan/references/standards/ib.md
skills/lesson-plan/references/standards/ngss.md
skills/lesson-plan/references/standards/state-frameworks.md
skills/lesson-plan/references/templates/lesson-plan.md
skills/lesson-plan/references/templates/multi-day-unit.md
skills/lesson-plan/references/templates/sub-plan.md
skills/lesson-plan/references/workflow.md
```

- [ ] **Step 2: Verify SKILL.md line count**

```bash
wc -l skills/lesson-plan/SKILL.md
```
Expected: < 300 lines.

- [ ] **Step 3: Verify evals.json parses**

```bash
python3 -c "import json; d=json.load(open('skills/lesson-plan/evals/evals.json')); assert len(d['cases'])==5, 'Expected 5 cases'; print('5 cases, OK')"
```

Expected: `5 cases, OK`.

- [ ] **Step 4: Tag completion**

```bash
git tag lesson-plan-v0.1.0
```

---

## Self-Review Notes

1. **Spec coverage** — walked each section of `2026-04-14-lesson-plan-design.md`:
   - §1 Purpose → SKILL.md intro.
   - §2 Triggers → SKILL.md "When to use."
   - §3 Inputs → SKILL.md "Inputs."
   - §4 Outputs → SKILL.md "Output" + `output-contract.md` + templates.
   - §5 Workflow → `workflow.md` + SKILL.md summary.
   - §6 Bundled scripts → none (deferred per spec); PDF delegated to `shared/scripts/pdf_render.py`.
   - §7 References → exhaustively covered (standards × 6, pedagogy × 4, differentiation × 4, templates × 3, meta × 4).
   - §8 Grade calibration → `grade-calibration.md`.
   - §9 Evals → `evals/evals.json`.
   - §10 Edge cases → `edge-cases.md`.
   - §11 Open questions → locked defaults addressed (Gradual Release + UDL locked; 5E auto-override for Science called out in SKILL.md + pedagogy/ngss references).

2. **Placeholder scan** — no TBDs, no "handle edge cases" without specifics. All code / markdown blocks contain full content.

3. **Type consistency** — YAML footer field names consistent across `output-contract.md`, all three templates, and SKILL.md. Pedagogy enum values (`gradual-release`, `5e`, `madeline-hunter`, `udl-forward`) consistent. Section heading exact forms (`Direct Instruction — "I Do"`) consistent between templates and evals assertions.

4. **No skill-local scripts** intentional — matches spec §6. PDF export path is external (`shared/scripts/pdf_render.py`).
