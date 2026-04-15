# Study Techniques Reference

Apply these patterns when structuring concept summaries and the cheat-sheet one-pager.

## Cornell Notes layout (applied to cheat sheet)

The Cornell method splits a page into three zones: a narrow left column (cue/keyword, ~30%), a wider right column (notes, ~60%), and a bottom summary bar (~10%).

For **cheat sheets**:
- Left column: keywords, terms, formula names.
- Right column: one-line definition or the formula itself.
- Bottom: a 2-3 sentence synthesis that ties the page together.

Represent in markdown with a two-column table plus a trailing blockquote:

```markdown
| Cue | Note |
|---|---|
| Eigenvalue | Scalar λ such that Av = λv for some nonzero v |
| Characteristic polynomial | det(A − λI) = 0 |

> **Synthesis:** Eigenvalues are the roots of the characteristic polynomial; their eigenvectors span invariant subspaces and diagonalize A when linearly independent.
```

## SQ3R (Survey, Question, Read, Recite, Review)

SQ3R guides the **concept-summary structure**. For each major topic group, structure the summary so a reader naturally executes SQ3R:

1. **Survey** — the subsection's H3 heading and a one-sentence "what this section is about."
2. **Question** — an italicized question at the top of the summary that the reader should be able to answer after reading.
3. **Read** — 2-4 paragraphs that answer the question. No jargon without definition.
4. **Recite** — a bold one-line "in your own words" restatement at the end.
5. **Review** — cross-link to the relevant Practice Questions (`[See PQ 3, 7, 12]`).

## Feynman technique (applied to definitions and worked examples)

Feynman: explain a concept as if teaching a novice; any place you stumble is a knowledge gap.

Apply to:
- **Key Terms definitions** — prefer plain-language definitions over textbook verbatim. For grade 6-8, the definition must use no word more advanced than the term itself. For college/grad, precision beats simplicity.
- **Worked examples** — narrate *why* each step happens, not just *what* was done. Every step gets an inline comment.

Example worked-example format:

```markdown
**Problem:** Factor x² − 5x + 6.

1. Identify the form ax² + bx + c with a=1, b=−5, c=6.
   *(Monic quadratic, so we can factor by finding two numbers that multiply to c and add to b.)*
2. Find two numbers whose product is 6 and sum is −5: −2 and −3.
   *(Both negative because product is positive and sum is negative.)*
3. Write as (x − 2)(x − 3).
   *(Verify by FOIL: x² − 3x − 2x + 6 = x² − 5x + 6. ✓)*
```

## When to use which

| Output section | Technique |
|---|---|
| Cheat Sheet | Cornell (two-column + synthesis) |
| Concept Summaries | SQ3R (Question → Read → Recite) |
| Key Terms | Feynman (plain-language definitions) |
| Worked Examples | Feynman (step-narration) |
