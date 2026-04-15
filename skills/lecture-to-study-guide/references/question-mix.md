# Practice Question Mix

Rules for generating the Practice Questions section (10-20 questions).

## Question-type taxonomy

### Recall (easiest — what is it?)
- "Define X."
- "List the three stages of Y."
- "What is the formula for Z?"
- "Which of the following is the correct definition of A?" (MCQ)
- "True or False: X does Y."

### Comprehension (why / how)
- "Explain in your own words why X happens."
- "Compare A and B."
- "Describe the relationship between X and Y."
- "Give an example of Z (not one used in the lecture)."
- "What would happen if X were removed from the system?"

### Application (solve / predict / apply)
- "Given [new scenario], predict what Y does."
- "Solve for x in the equation…"
- "Apply the Z framework to analyze [case]."
- "Design an experiment that would distinguish between hypothesis A and hypothesis B."
- Multi-step problems with intermediate answers.

## Default mix ratios (grade-calibrated)

| Level / exam-format hint | Recall | Comprehension | Application |
|---|---|---|---|
| 6-8 (default) | 60% | 30% | 10% |
| 9-12 (default) | 40% | 40% | 20% |
| College (default, no hint) | 30% | 40% | 30% |
| Graduate (default) | 20% | 30% | 50% |

### Exam-format adjustments (stack on grade default)

| Exam format | Adjustment |
|---|---|
| MCQ-heavy | +10% recall, −10% application |
| Essay | +15% comprehension, −15% recall |
| Problem-set | +20% application, −10% recall, −10% comprehension |

Apply grade default first, then adjust by exam-format hint if provided.

## Per-question requirements

Each question must:
1. **Trace to source.** Cite the source section or term (e.g. `— Slide 4 / Term: metaphase`). Place in italics after the question.
2. **Be unambiguous.** A single correct answer (MCQ/short answer) or a clear rubric (essay/explain).
3. **Have an answer.** Every question has an answer in the answer key.

## Answer-key convention

**Convention A — inline `<details>` per question (default):**

```markdown
1. Define metaphase. *(Slide 3 / Term: metaphase)*

   <details><summary>Answer</summary>
   The stage of mitosis in which chromosomes align along the cell's equatorial plane, attached to the spindle apparatus.
   </details>
```

**Convention B — trailing answer-key section:** used when the user requests a printable version, since `<details>` does not render in all PDF renderers.

```markdown
### Practice Questions
1. Define metaphase. *(Slide 3 / Term: metaphase)*
2. ...

### Answer Key
1. The stage of mitosis in which chromosomes align along the cell's equatorial plane…
2. ...
```

Pick Convention A by default. Switch to B if the user asks for PDF export or a printable version.

## Minimum counts

- Inputs < 500 words: 5-8 questions.
- Inputs 500-5000 words: 10-15 questions.
- Inputs > 5000 words or multi-lecture: 15-20 questions.
- Multi-lecture: ≥ 3 questions sourced from each lecture.
