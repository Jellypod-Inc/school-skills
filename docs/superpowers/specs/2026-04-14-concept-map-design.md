# concept-map Skill — Design Spec

**Date:** 2026-04-14
**Author:** Pierson + Claude
**Status:** Draft pending user review
**Parent spec:** [2026-04-14-marketplace-design.md](./2026-04-14-marketplace-design.md)

## 1. Purpose

Visualize relationships between concepts so learners can see structure at a glance. The skill produces mind maps, concept maps, prerequisite graphs, cause-effect diagrams, taxonomies, process flows, and timelines from either a topic string or source material. Students use it to synthesize a chapter before an exam; teachers use it to plan a unit, show dependencies ("you need to understand fractions before ratios"), or hand out a one-page visual summary. Output is both raw graph syntax (portable, editable) and a rendered image (printable, shareable).

## 2. Triggers

The skill description trains on phrasings from both teachers and students:

- "mind map of the french revolution"
- "concept map for photosynthesis"
- "show me how these ideas relate"
- "visualize this chapter as a graph"
- "make a diagram of the water cycle"
- "prerequisite tree for calculus"
- "cause and effect map of WWI"
- "map out the relationships in this reading"
- "draw a taxonomy of vertebrates"
- "flowchart the scientific method"
- "timeline of the civil rights movement"
- "markmap of my notes"

## 3. Inputs

Accepted input forms:

- **Topic string** — "the French Revolution", "photosynthesis", "derivatives".
- **Pasted source text** — chapter excerpt, lecture notes, article paragraphs.
- **URL** — skill fetches and summarizes an article.
- **PDF** — textbook chapter, paper; skill extracts text.

Optional parameters:

- **Graph type** — `tree` (hierarchical), `concept-map` (networked with labeled edges), `flow` (process), `timeline`, `mindmap` (radial). Default: inferred from content (see §7 decision guide).
- **Max nodes** — integer, default 20. Hard cap 50 to keep output legible.
- **Output format** — `mermaid` (default), `dot`, `markmap`, or `all`.
- **Grade/level** — K-2, 3-5, 6-8, 9-12, college, grad. Drives node count and label complexity (see §8).
- **Render** — boolean, default `true`. If tools are missing, falls back to syntax + instructions.

## 4. Outputs

Written to the working directory (or user-specified path):

- `concept-map.mmd` — Mermaid syntax.
- `concept-map.dot` — Graphviz DOT syntax.
- `concept-map.md` — Markdown with Markmap frontmatter.
- `concept-map.png` and/or `concept-map.svg` — rendered image via `scripts/render.py`.
- `concept-map.html` — interactive preview with zoom/pan (Mermaid Live embed for Mermaid; Markmap embed for Markmap). Single-file, opens in any browser.
- `concept-map.pdf` — optional printable variant via `shared/scripts/pdf_render.py`.

Default bundle: `.mmd` + `.png` + `.html`. Other formats produced on request.

## 5. Workflow

1. **Ingest** — load topic or source text; if URL or PDF, fetch/extract.
2. **Extract key concepts** — identify 10-30 candidate nodes (nouns, named entities, key terms). Respect `max-nodes`.
3. **Cluster** — group related concepts; identify root/central concept.
4. **Choose graph type** — if not user-specified, apply decision guide (§7).
5. **Draft relationships** — for concept maps, label every edge with a verb/preposition ("causes", "is-a", "requires", "leads to") per Novak convention.
6. **Emit syntax** — write the chosen format(s) to disk.
7. **Render** — invoke `scripts/render.py` to produce PNG/SVG. Emit HTML preview.
8. **Summarize** — return a short recap listing root concept, node count, edge count, and file paths.

## 6. Bundled scripts

- **`skills/concept-map/scripts/render.py`** — primary renderer. Detects available tools in this order: `mmdc` (mermaid-cli), `dot` (Graphviz), `markmap-cli`. Invokes the right one for the source file. If none installed, prints install commands for each platform (macOS: `brew install mermaid-cli graphviz`; npm: `npm i -g @mermaid-js/mermaid-cli markmap-cli`) and writes the syntax file alone so the user can render elsewhere. Supports PNG and SVG output; SVG is default for crisp scaling.
- **`shared/scripts/pdf_render.py`** — reused from the marketplace shared scripts. Wraps the rendered SVG in the `worksheet.html` template (title, date, name field) for a printable classroom handout.

No other scripts. Graph generation itself is prompt-driven — the model writes the syntax directly since it's text.

## 7. References (loaded on demand)

- **`references/graph-type-guide.md`** — decision tree: strict hierarchy with single parents → `tree`; networked with cross-links and labeled edges → `concept-map`; ordered steps → `flow`; events over time → `timeline`; brainstorm/radial from one root → `mindmap`.
- **`references/mermaid-cheatsheet.md`** — `graph TD`, `flowchart LR`, `mindmap`, `timeline`, node shapes, edge labels, subgraphs, styling.
- **`references/dot-cheatsheet.md`** — DOT syntax, `digraph`, `rankdir`, node/edge attributes, clusters, common layouts (dot, neato, fdp).
- **`references/markmap-syntax.md`** — Markdown headings → nodes; frontmatter options (colorFreezeLevel, maxWidth); embedding JS.
- **`references/novak-concept-maps.md`** — Novak & Cañas theory: propositions (concept-link-concept), hierarchical top-down layout, cross-links across branches, focus question.
- **`references/node-labeling.md`** — keep labels ≤ 3 words, use nouns for nodes / verbs for edges, avoid redundancy, match reading level.

Each reference is ≤ 150 lines and loaded only when the model needs it.

## 8. Grade/level calibration

| Level | Nodes | Structure | Edge labels | Visual |
|-------|-------|-----------|-------------|--------|
| K-2   | 3-5   | Simple radial mindmap | None (lines only) | Big nodes, icons suggested, Markmap |
| 3-5   | 6-10  | Hierarchical tree | Simple ("is a", "has") | Mermaid `graph TD` |
| 6-8   | 10-15 | Tree or concept map | Verbs ("causes", "requires") | Mermaid or DOT |
| 9-12  | 15-25 | Full concept map with cross-links | Full labeled propositions | Mermaid or DOT |
| College | 20-40 | Concept map, possibly multiple clusters | Rich labels | DOT preferred for layout control |
| Grad  | Up to 50 | Concept map with subgraphs / process flows | Precise terminology | DOT + custom styling |

Calibration also drives vocabulary: K-2 uses common words, grad uses domain-precise terms.

## 9. Evals

Five prompts in `skills/concept-map/evals/evals.json`. Each has 3-5 assertions.

1. **"Concept map for photosynthesis, 9th grade."**
   - `.mmd` file exists.
   - Mermaid syntax parses (via `mmdc --dry-run` or Mermaid parser).
   - ≥ 10 nodes and ≥ 10 edges.
   - `.png` file exists and is non-empty.
   - Root concept "photosynthesis" present in output.

2. **"Mind map of the French Revolution for 5th graders."**
   - Markmap `.md` exists with valid frontmatter.
   - 6-10 nodes (calibrated to 3-5 level).
   - Root is "French Revolution".

3. **"Prerequisite tree for calculus, college level."**
   - DOT file parses via `dot -Tsvg - < file.dot`.
   - `rankdir=TB` or equivalent hierarchy.
   - Contains edges from "algebra" and "trigonometry" toward "calculus".

4. **"Visualize this chapter" with pasted 500-word excerpt.**
   - Extracts ≥ 8 distinct concepts from source text.
   - No hallucinated concepts (each node label appears as substring or close paraphrase in source).
   - HTML preview renders without console errors.

5. **"Timeline of the civil rights movement."**
   - Uses Mermaid `timeline` directive (not `graph`).
   - ≥ 5 dated events in chronological order.
   - PNG renders successfully.

## 10. Edge cases

- **Topic too broad** ("history of the world"): skill proposes 3-5 narrower focus questions and asks the user to pick one before generating.
- **Renderer not installed**: `render.py` writes syntax files, then prints platform-specific install commands and a one-liner to render online (Mermaid Live URL with prefilled source). Skill does not fail hard.
- **Non-English labels**: preserve original language in node labels; ensure the renderer uses a font that supports the script (render.py sets `-f` to a CJK-capable font when non-ASCII detected).
- **Very deep hierarchies** (> 5 levels): collapse deepest level into "…" nodes and suggest splitting into multiple maps.
- **Conflicting relationships** (concept A both causes and results from B in source): emit both edges with distinct labels; don't silently pick one.
- **PDF OCR failure**: fall back to asking for pasted text or topic string.
- **Max nodes exceeded**: cluster lowest-importance concepts into parent groups to stay under cap; report what was collapsed.

## 11. Open questions

- **Default format** — proposed: Mermaid. Reasoning: renders in GitHub/Notion/Obsidian/Claude Code without installing anything, syntax is readable, and Mermaid Live gives a zero-install fallback. DOT produces better layouts for dense graphs but requires Graphviz. Markmap is best for outline-style mind maps but less universal. **Decision: Mermaid default, user can request others.**
- **Auto-render vs. syntax-only** — proposed: auto-render when tools are available, always emit syntax file regardless. Fall back gracefully with install hints. **Decision: auto-render on by default, `--no-render` flag to skip.**
- **HTML preview bundling** — embed Mermaid/Markmap JS from CDN (smaller file, needs internet) or inline (larger, works offline)? **Tentative: CDN by default; `--offline` flag inlines.**
- **Cross-links in concept maps** — Novak theory encourages cross-branch links, but they clutter small maps. Threshold for including them (e.g., only at 9-12+ grade)?
- **Interactive editing** — should HTML preview link out to Mermaid Live / Markmap editor for user tweaks? Probably yes; cheap to add.
