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
