# Term Extraction Heuristics

Use these rules to decide whether a noun phrase in the source belongs in the Key Terms table.

## Signals that a noun phrase IS a term

### Typographic
- Bold (`**X**` or `<b>X</b>`) or italic (`*X*`) in prose notes.
- "Quoted" with definition appositive: *The "basal metabolic rate" is the…*
- ALL CAPS or Title Case in slide bullets (but not whole titles).
- Set off by colon with a following definition clause.

### Structural
- Slide titles or section headings that name a concept (not a question or action).
- Definition blocks: `Term: definition`, `Term — definition`, or a glossary-style list.
- First occurrence of a term that later appears frequently (≥ 3 occurrences).

### Linguistic
- `X is defined as Y`
- `X refers to Y`
- `X, also known as Y,`
- `By X we mean Y`
- `Y, called X,`
- `The term X describes Y`
- Acronyms on first use: `Spaced Repetition System (SRS)`

## Signals that it is NOT a term

- Narrative nouns: "the students," "the lecture," "last week."
- Transitional phrases: "the main point," "the key idea."
- Pronouns and deictics.
- Terms defined but never referenced again outside the definition sentence (usually incidental examples).
- Proper nouns that are not domain concepts (a person named to attribute a quote, a city for an example).

## Decision table

| Signal strength | Referenced again? | Include? |
|---|---|---|
| Strong (defined explicitly + typographic) | Yes or No | **Yes** |
| Strong definition, not referenced again | No | Yes — core vocabulary |
| Typographic only, not defined | Yes (≥ 2x) | Yes — infer a definition from context |
| Typographic only, one-shot | No | No |
| No signal, high frequency (≥ 3x) | Yes | Maybe — include if semantically central |
| No signal, low frequency | No | No |

## Output row format

Every term row in the Key Terms table must include:

- **Term** — the canonical form (expand acronyms: `Spaced Repetition System (SRS)`).
- **Definition** — one sentence, Feynman-style (see `study-techniques.md`). If the source defined it, paraphrase rather than quote verbatim.
- **Source** — where it appeared: `Slide 4`, `03:12`, `Heading: Cell Cycle`, or `Lecture 2, Slide 7` for multi-lecture guides.

## De-duplication (multi-lecture)

When multiple lectures in a series define the same term:
- Keep the first-appearance definition.
- Merge Source cells: `Lecture 1, Slide 3; Lecture 2, Slide 11`.
- If definitions differ meaningfully, retain both in the same row separated by "—also—".

## Minimum and maximum

- Minimum: 5 terms (for inputs < 500 words).
- Target: 8-20 terms for a typical 45-min lecture.
- Maximum: 40 terms. Above this, split into primary-terms and secondary-terms tables.
