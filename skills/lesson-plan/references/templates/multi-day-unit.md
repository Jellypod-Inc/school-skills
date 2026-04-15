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
