# Taxonomies Reference

The three cognitive taxonomies this skill can align to, with verb banks and selection heuristics.

## Bloom's Taxonomy (Revised, Anderson & Krathwohl, 2001) — DEFAULT

Six cognitive levels, from concrete to abstract. Most common in lesson planning and higher ed.

| Level | Label       | Description                                         | Verb bank (use in criterion names & descriptors)                                               |
|------:|-------------|-----------------------------------------------------|------------------------------------------------------------------------------------------------|
| 1     | Remember    | Retrieve relevant knowledge from memory             | define, list, recall, identify, name, recognize, label, state, describe, match                 |
| 2     | Understand  | Construct meaning from instructional messages       | explain, summarize, paraphrase, classify, compare, interpret, infer, exemplify, illustrate     |
| 3     | Apply       | Use a procedure in a given situation                | execute, implement, use, solve, demonstrate, calculate, show, operate                          |
| 4     | Analyze     | Break material into parts; detect relationships     | differentiate, organize, attribute, deconstruct, outline, integrate, compare, contrast         |
| 5     | Evaluate    | Make judgments based on criteria and standards      | critique, judge, justify, defend, argue, appraise, assess, recommend, prioritize               |
| 6     | Create      | Put elements together to form a coherent whole      | design, construct, produce, plan, generate, compose, author, invent, devise, synthesize        |

**How to tag criteria:** `*<Verb> — Bloom's <level-number>*`. Example: `*Analyze — Bloom's 4*`.

## Webb's Depth of Knowledge (DOK) — default for math/science assessment

Four cognitive-demand levels. Widely used in US K-12 state assessment and standards documents.

| DOK | Label                 | Description                                                       | Verb / task bank                                                                 |
|----:|-----------------------|-------------------------------------------------------------------|----------------------------------------------------------------------------------|
| 1   | Recall & Reproduction | Recall a fact, term, or simple procedure                          | recall, identify, compute, define, list, measure                                 |
| 2   | Skills & Concepts     | Use information or conceptual knowledge; two or more steps        | summarize, estimate, classify, organize, compare, interpret a graph              |
| 3   | Strategic Thinking    | Requires reasoning, planning, evidence; more than one correct path | justify, cite evidence, formulate, hypothesize, critique, investigate            |
| 4   | Extended Thinking     | Requires extended investigation, synthesis across sources, time   | design and conduct an experiment, develop a model, author an extended argument   |

**How to tag:** `*DOK <n>: <label>*`. Example: `*DOK 3: Strategic Thinking*`.

**Selection heuristic:** Prefer DOK when the prompt mentions state testing, performance tasks, or cognitive rigor. Most math & science prompts fit DOK more naturally than Bloom's.

## SOLO Taxonomy (Biggs & Collis, 1982)

Five structural complexity levels. Useful for narrative / extended-writing rubrics; maps cleanly onto holistic scoring.

| Level | Label              | Description                                                           |
|------:|--------------------|-----------------------------------------------------------------------|
| 1     | Prestructural      | Misses the point; unrelated information                               |
| 2     | Unistructural      | One relevant aspect addressed                                         |
| 3     | Multistructural    | Several relevant aspects, but treated independently                   |
| 4     | Relational         | Aspects integrated into a coherent structure                          |
| 5     | Extended Abstract  | Generalized beyond the given context; hypothesizes, theorizes         |

**How to tag:** `*SOLO <n>: <label>*`.

**Selection heuristic:** Prefer SOLO for holistic ELA or humanities rubrics where the quality question is "how integrated / how generalized is the student's thinking?"

## Which taxonomy should I pick?

```
Did the user specify one?
├── Yes → Use it.
└── No → Does the prompt mention state testing, assessment rigor, or performance task?
         ├── Yes → DOK
         └── No → Is subject math, science, or CS?
                  ├── Yes → DOK (preferred); Bloom's acceptable
                  └── No → Is it a holistic essay / extended-writing rubric?
                           ├── Yes → SOLO
                           └── No → Bloom's (default)
```

When uncertain, Bloom's is the safe default — it's the most widely recognized across audiences.

## Verb-to-level quick lookup

If the assignment prompt uses these verbs, here is the natural Bloom's level:

- "list, identify, define, label" → Bloom's 1 (Remember)
- "explain, summarize, classify, compare, interpret" → Bloom's 2 (Understand)
- "solve, apply, calculate, use, demonstrate" → Bloom's 3 (Apply)
- "analyze, differentiate, contrast, break down" → Bloom's 4 (Analyze)
- "evaluate, critique, justify, defend, argue" → Bloom's 5 (Evaluate)
- "design, create, compose, produce, author" → Bloom's 6 (Create)

Use the **highest** Bloom's level the prompt demands as the anchor for the rubric's most cognitively-rigorous criterion.
