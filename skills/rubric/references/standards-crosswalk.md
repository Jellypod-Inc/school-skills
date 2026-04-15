# Standards Crosswalk

Quick pointers for attaching standards to criteria. This is NOT a complete standards database — it's a code-shape reference so the skill can tag criteria correctly when the user supplies or mentions a standard.

## Common Core State Standards (CCSS)

### ELA code shape

`CCSS.ELA-Literacy.<strand>.<grade>.<number>[.<sub>]`

- Strands: `RL` (Reading Literature), `RI` (Reading Informational), `W` (Writing), `SL` (Speaking & Listening), `L` (Language), `RH` (Reading in History/Social Studies), `RST` (Reading in Science/Technical), `WHST` (Writing in History/Science/Technical).
- Grades: `K` through `12`; high-school bands are `9-10` and `11-12`.
- Examples:
  - `CCSS.ELA-Literacy.W.9-10.1` — argument writing, grade 9-10.
  - `CCSS.ELA-Literacy.RL.6.1` — textual evidence, grade 6 reading literature.
  - `CCSS.ELA-Literacy.SL.5.4` — report on a topic, grade 5 speaking.

### Math code shape

`CCSS.Math.Content.<grade>.<domain>.<cluster>.<standard>`

- Grades K-8; HS uses `HSA` (Algebra), `HSF` (Functions), `HSG` (Geometry), `HSN` (Number & Quantity), `HSS` (Statistics & Probability) — these are domains, not grades.
- Examples:
  - `CCSS.Math.Content.7.RP.A.2` — proportional relationships, grade 7.
  - `CCSS.Math.Content.HSA.REI.B.3` — solve linear equations, HS Algebra.

### Math Practice standards (use as criterion tags for any math rubric)

`CCSS.Math.Practice.MP1` … `MP8`:

1. Make sense of problems and persevere in solving them.
2. Reason abstractly and quantitatively.
3. Construct viable arguments and critique the reasoning of others.
4. Model with mathematics.
5. Use appropriate tools strategically.
6. Attend to precision.
7. Look for and make use of structure.
8. Look for and express regularity in repeated reasoning.

## Next Generation Science Standards (NGSS)

### Performance Expectation shape

`<grade-or-band>-<DCI-code>-<number>` — e.g., `HS-LS1-2`, `MS-PS2-1`, `5-PS1-3`.

Grades/bands: `K`, `1`, `2`, `3`, `4`, `5`, `MS` (middle school), `HS` (high school).
DCI domains: `LS` (Life Science), `PS` (Physical Science), `ESS` (Earth & Space Science), `ETS` (Engineering, Technology & Applications).

### Science & Engineering Practices (SEPs) — preferred criterion tags for lab reports / inquiry rubrics

1. Asking questions / defining problems
2. Developing and using models
3. Planning and carrying out investigations
4. Analyzing and interpreting data
5. Using mathematics and computational thinking
6. Constructing explanations / designing solutions
7. Engaging in argument from evidence
8. Obtaining, evaluating, and communicating information

### Crosscutting Concepts (CCCs)

1. Patterns
2. Cause and effect
3. Scale, proportion, quantity
4. Systems and system models
5. Energy and matter
6. Structure and function
7. Stability and change

## C3 Framework (Social Studies)

Four-dimension structure:

- `D1` Developing Questions and Planning Inquiries
- `D2` Applying Disciplinary Concepts and Tools
- `D3` Evaluating Sources and Using Evidence
- `D4` Communicating Conclusions and Taking Informed Action

Indicator shape: `D<n>.<discipline-code>.<grade-band>` — e.g., `D2.Civ.1.9-12`, `D3.His.14.9-12`.

Discipline codes: `Civ` (Civics), `Eco` (Economics), `Geo` (Geography), `His` (History).

## IB (International Baccalaureate)

IB assessment criteria are subject-specific (e.g., MYP Language & Literature has criteria A-D: Analyzing · Organizing · Producing text · Using language). When a prompt mentions IB, ask for the subject and year; don't guess. DP courses use numeric criteria with subject-specific rubrics.

## State standards

When a user references a state standard (e.g., "TEKS," "BEST Standards," "NY Next Generation"), treat the code as opaque and tag criteria with the verbatim code the user supplied. Do not attempt to decode state codes unless the user provides the mapping.

Common state frameworks:

- **Texas TEKS** — `§110.5.b.7.A` style
- **Florida B.E.S.T.** — `ELA.5.R.1.1` style
- **NY Next Generation** — `5R1`, `5W2` style
- **Virginia SOL** — `5.4` style
- **California CCSS (adopted)** — same as national CCSS

## Tagging syntax in rubrics

Append the tag in italics after the criterion name, separated by an em-dash:

- `Thesis & Argument — *CCSS.ELA-Literacy.W.9-10.1*`
- `Data Analysis — *NGSS SEP 4*`
- `Historical Sourcing — *C3 D3.His.14.9-12*`
- `Mathematical Reasoning — *CCSS.Math.Practice.MP3*`

If multiple standards apply, comma-separate:

- `Claim & Argument — *CCSS.ELA-Literacy.W.9-10.1, Bloom's 5*`

If no standard applies, still tag with the taxonomy (Bloom's / DOK / SOLO) unless `alignment=none`.

## When to refuse to fabricate

If the user names a standard code you don't recognize and haven't been given context for, DO NOT invent one. Instead, tag the criterion with the taxonomy (Bloom's / DOK) and note: "Verify the specific standard code with your district — I don't have that framework in reference."
