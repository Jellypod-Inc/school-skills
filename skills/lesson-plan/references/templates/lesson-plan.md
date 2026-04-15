# Lesson Plan Template (Default, 13 sections)

Use this template for any single-session lesson plan. Fill **every** section unless the session is under 20 minutes (mini-lesson — see `references/edge-cases.md`). Keep section headings exact so the evals assertion `contains_all` passes.

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
