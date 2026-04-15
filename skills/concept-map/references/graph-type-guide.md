# Graph-type decision guide

Pick one. If the user's phrasing or source shape doesn't match cleanly, fall through to the next row.

## Decision tree

1. **Events ordered in time?** → `timeline`
   - Cues: "history of", "leading up to", "chronology", "in what order", date ranges.
   - Format: Mermaid `timeline` directive, or `graph LR` with date-prefixed nodes.

2. **Strict parent → child hierarchy, every node has exactly one parent?** → `tree`
   - Cues: "parts of", "anatomy of", "taxonomy of", "classification of", "types of".
   - Format: Mermaid `graph TD` or DOT `digraph { rankdir=TB }`.

3. **DAG with dependencies, arrows mean "requires"?** → prerequisite tree
   - Cues: "prerequisite tree", "what do I need before", "dependency graph".
   - Format: `graph BT` (leaves are foundational topics) or DOT with `rankdir=BT`.

4. **Ordered process with steps and sometimes branches?** → `flow`
   - Cues: "process of", "steps in", "how does ___ work", "scientific method", "algorithm".
   - Format: Mermaid `flowchart LR` with decision diamonds for branches.

5. **Networked relationships with labeled edges, cross-links across branches?** → Novak `concept-map`
   - Cues: "concept map", "how these ideas relate", "causes of", "cause and effect".
   - Format: Mermaid `graph TD` with `|label|` on every edge. See `novak-concept-maps.md`.

6. **Radial brainstorm from one central idea, edges unlabeled?** → `mindmap`
   - Cues: "mind map of", "brainstorm", "everything about", "map my notes".
   - Format: Mermaid `mindmap` directive, or Markmap from Markdown headings.

7. **Source is already an outline (markdown headings, bullet notes)?** → Markmap
   - Cues: "markmap", "outline of my notes", "turn this outline into a mind map".
   - Format: Markmap-flavored Markdown with frontmatter.

## When in doubt

- Small map, one root, no cross-branch links → `tree` or `mindmap`.
- Rich cross-linking + labeled edges → `concept-map`.
- Exam-study synthesis of a whole chapter → `concept-map` with cluster subgraphs.
- Kid asking "what is ___" → simple radial `mindmap`.

## Format-type pairing

| Graph type | Best format | Why |
|---|---|---|
| timeline | Mermaid `timeline` | Built-in directive, clean rendering |
| tree | Mermaid `graph TD` | Universal, GitHub-native |
| prerequisite tree | DOT | Graphviz layouts DAGs better than Mermaid |
| flow | Mermaid `flowchart LR` | Decision diamonds + labels |
| concept-map | Mermaid `graph TD` or DOT | Mermaid for ≤ 20 nodes; DOT for denser maps |
| mindmap | Mermaid `mindmap` or Markmap | Markmap if outline exists, Mermaid otherwise |
