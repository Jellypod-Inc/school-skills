# Markmap syntax cheatsheet

Markmap turns Markdown into an interactive radial mind map. Best for outline-shaped sources (lecture notes, chapter summaries, study guides).

## Minimal file

```markdown
---
title: French Revolution
markmap:
  colorFreezeLevel: 2
  maxWidth: 300
  initialExpandLevel: 3
---

# French Revolution

## Causes
- Financial crisis
- Enlightenment ideas
- Estate inequality

## Events
- Storming of the Bastille (1789)
- Reign of Terror (1793-94)
- Rise of Napoleon

## Outcomes
- End of absolute monarchy
- Declaration of the Rights of Man
- Napoleonic Code
```

## How the hierarchy works

- `#` is the root (single root recommended).
- `##`, `###`, … are child levels.
- `-` or `*` bullets become leaf nodes under their parent heading.
- Code blocks, tables, LaTeX, images — all render inside nodes.

## Frontmatter options

| Option | Effect |
|---|---|
| `colorFreezeLevel` | Freeze branch color at this depth. `2` = color by first-level child. |
| `maxWidth` | Max node width in px. `300` keeps labels tight. |
| `initialExpandLevel` | Auto-expand through this depth. `-1` = all expanded. |
| `duration` | Transition duration in ms when collapsing/expanding. |
| `embedAssets` | `true` to inline JS (works offline); `false` uses CDN. |
| `spacingVertical` / `spacingHorizontal` | Layout spacing in px. |

## Rich content in nodes

```markdown
## Photosynthesis
- Equation: `6 CO₂ + 6 H₂O → C₆H₁₂O₆ + 6 O₂`
- [Wikipedia link](https://en.wikipedia.org/wiki/Photosynthesis)
- ![leaf](./leaf.png)
```

Markmap renders code spans, links, and images inline.

## Rendering

```bash
markmap-cli notes.md -o notes.html --no-open
```

Produces an interactive, zoomable, collapsible HTML file. `scripts/render.py` handles this.

## When to pick Markmap over Mermaid `mindmap`

- Source is already an outline (notes, chapter headings) → Markmap wins (zero translation).
- Audience wants interactive zoom / collapse in the browser → Markmap.
- Output lives inside GitHub README or Notion → Mermaid `mindmap` (Markmap needs HTML).
- Static PNG/SVG for handouts → Mermaid.

## Common pitfalls

- Multiple `#` roots = multiple disconnected maps. Use one `#` per file.
- Frontmatter YAML must be between two `---` lines at the very top.
- Very long bullet text wraps awkwardly — set `maxWidth: 250` or shorter labels.
- Images need to resolve relative to the rendered HTML, not the source `.md`.
