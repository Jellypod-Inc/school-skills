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
