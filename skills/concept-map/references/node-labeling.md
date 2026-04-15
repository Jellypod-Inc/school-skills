# Node-labeling best practices

Legibility beats completeness. A map with 10 tight labels teaches better than one with 30 verbose labels.

## Core rules

1. **Nodes are nouns, edges are verbs/prepositions.** If a label wants to be a sentence, split it into two nodes and an edge.
   - Bad: `"Plants make glucose from CO₂"` (one node)
   - Good: `Plants -->|"make"| Glucose`, `Plants -->|"use"| CO₂`.
2. **≤ 3 words per label** whenever possible. Trim articles (`"the"`, `"a"`), possessives, and filler.
   - `"The process of photosynthesis"` → `"Photosynthesis"`.
3. **Capitalize consistently.** Title Case for proper nouns and named entities; sentence case for common nouns. Pick one style for the whole map.
4. **No redundancy.** If the parent is "Types of vertebrates", children shouldn't repeat "vertebrate" — just `Mammals`, `Birds`, `Reptiles`.
5. **Prefer the domain term over a paraphrase** once the reader's grade level can handle it. `Mitochondrion` at grade 8+; `"cell powerhouse"` at K-5.

## Grade-calibrated vocabulary

| Level | Target vocabulary | Label length |
|---|---|---|
| K-2 | Everyday words, no jargon. "Plant food" not "glucose". | 1-2 words |
| 3-5 | Core domain terms with parenthetical plain-language gloss if new. | 1-3 words |
| 6-8 | Domain terms without gloss; verbs on edges. | 2-3 words |
| 9-12 | Technical precision expected. | 2-3 words |
| College+ | Precise terminology; Greek/Latin roots OK. | 1-4 words |

## Edge labels

- Use active verbs: `"causes"`, `"produces"`, `"requires"`, `"contains"`.
- Prepositions for location/time: `"in"`, `"before"`, `"during"`.
- Avoid: `"relates to"`, `"has"`, `"and"`, `"with"`.
- Keep edge labels ≤ 3 words. If they need more, the edge is really two edges.

## Label shape conventions

| Shape | Use for |
|---|---|
| Rectangle | Default concept |
| Rounded rectangle | Process / action noun |
| Ellipse / stadium | Outcome / result |
| Diamond | Decision point (flows only) |
| Circle | Root / focus |
| Cylinder / database | Data source or repository |

Pick ONE shape vocabulary per map and stick with it.

## Anti-patterns

- **Sentence nodes.** Split into proposition-sized chunks.
- **Unlabeled edges on concept maps** for grades 6+. Always add a verb.
- **Abbreviations the reader doesn't know.** Spell it out the first time or skip.
- **Redundant parents.** If every child starts with "type of X", rename the parent.
- **Directionless edges on causal graphs.** Use `-->`, not `---`.

## Self-check before emitting

Trace three random paths through the map. If any path does not read as a meaningful short sentence, fix the labels.
