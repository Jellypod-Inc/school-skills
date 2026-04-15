# Rubric Frameworks Reference

Five rubric frameworks with worked examples. Pick a framework before writing criteria — the framework determines the column structure.

## 1. 4-Point Mastery (DEFAULT)

Four performance levels: Beginning -> Developing -> Proficient -> Exemplary.

| Level | Label      | Typical points   | Meaning                                                       |
|------:|------------|------------------|---------------------------------------------------------------|
| 1     | Beginning  | 25% of total     | Minimal evidence; significant gaps                            |
| 2     | Developing | 50% of total     | Partial evidence; some gaps                                   |
| 3     | Proficient | 75-85% of total  | Meets expectations for the grade level                        |
| 4     | Exemplary  | 100% of total    | Exceeds expectations; sophisticated demonstration             |

**Point distribution example** (100 total, 4 criteria, equal weight, 25 points each):
Level 1 = 6 pts, Level 2 = 13 pts, Level 3 = 19 pts, Level 4 = 25 pts. Round down so the top level hits the criterion total exactly.

## 2. 1-5 Analytic

Five levels: Far Below / Below / Approaches / Meets / Exceeds. Use when the user asks for "5 levels" or for high-stakes assessments where middle granularity matters.

| Level | Label         | Typical points |
|------:|---------------|----------------|
| 1     | Far Below     | 20%            |
| 2     | Below         | 40%            |
| 3     | Approaches    | 60%            |
| 4     | Meets         | 80%            |
| 5     | Exceeds       | 100%           |

## 3. Holistic 1-6 (AP-style)

Six levels, descriptor paragraph per level, no per-criterion breakdown. Use for single-trait holistic scoring (e.g., AP essay). Output is a single column of 6 descriptor paragraphs, not a matrix.

Levels: 1 (inadequate) · 2 (underdeveloped) · 3 (uneven) · 4 (adequate) · 5 (effective) · 6 (sophisticated).

## 4. 3-Level Standards-Based

Three levels: Approaching Standard / Meeting Standard / Exceeding Standard. No points by default; attach a mastery code per criterion (e.g., `CCSS.ELA-Literacy.W.9-10.1.B`).

Useful for schools on standards-based report cards. The "Meeting" column is where you describe grade-level proficiency as the target; "Approaching" and "Exceeding" calibrate from there.

## 5. Single-Point Rubric

Single column of criteria with target descriptors. Two side columns: "Areas of Strength" (left blank for teacher annotation) and "Areas for Growth" (left blank). No level matrix, no points. Popular with formative-assessment communities.

| Areas of Strength | Criterion (target descriptor) | Areas for Growth |
|-------------------|-------------------------------|------------------|
|                   | Claim is debatable, stated early, and precise. |                  |
|                   | Evidence is cited, relevant, and linked to claim. |               |

## Worked example: 4-point mastery, 9th-grade persuasive essay

Criteria (4): Claim & Thesis · Evidence & Reasoning · Organization · Language & Conventions.
100 points total · 25 points per criterion · equal weight.

| Criterion             | 1 Beginning (6 pts)             | 2 Developing (13 pts)             | 3 Proficient (19 pts)                       | 4 Exemplary (25 pts)                                                |
|-----------------------|----------------------------------|-----------------------------------|---------------------------------------------|---------------------------------------------------------------------|
| Claim & Thesis        | No clear claim.                  | Claim present but vague.          | Clear, debatable claim stated early.        | Nuanced, precise claim anticipating counterargument.                |
| Evidence & Reasoning  | Few or irrelevant sources.       | Some evidence; weak links.        | Adequate, cited evidence linked to claim.   | Integrated, diverse evidence with explicit warrant for each link.   |
| Organization          | No discernible structure.        | Partial structure; abrupt shifts. | Clear structure; transitions present.       | Intentional structure that builds cumulative force.                 |
| Language & Conventions| Frequent errors impede meaning.  | Errors occasional; meaning intact.| Largely error-free; appropriate diction.    | Precise, varied syntax; deliberate rhetorical choices.              |

Column point totals: 24 / 52 / 76 / 100. Each row sums 6+13+19+25=63 per-row... *wait* — in the 4-point mastery distribution each CRITERION row gets points scaled to its share of the total. For a 4-criterion 100-pt rubric with equal weight (25 pts/criterion), the Exemplary column across all 4 criteria = 100; the Beginning column = 24. Student's earned score = sum of one cell per row.

## Which framework should I pick?

```
User specified levels count?
├── 3 levels           → 3-Level Standards-Based
├── 4 levels (default) → 4-Point Mastery
├── 5 levels           → 1-5 Analytic
└── 6 levels           → Holistic 1-6 (single column)

User said "single-point"? → Single-Point Rubric (no matrix)
User said "holistic"?     → Holistic 1-6
User said "standards-based" or "no points"? → 3-Level Standards-Based
```
