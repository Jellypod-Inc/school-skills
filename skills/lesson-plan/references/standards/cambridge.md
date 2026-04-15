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
