# Mermaid cheatsheet

Use Mermaid when you want the syntax to render in GitHub, Notion, Obsidian, Claude Code, and Mermaid Live without installing anything.

## Directions

```
graph TD    // top-down (default for trees & concept maps)
graph BT    // bottom-up (prerequisite trees)
graph LR    // left-to-right (timelines, flows)
graph RL    // right-to-left (rare)
flowchart LR  // same as graph LR, slightly richer features
```

## Nodes and shapes

```
A[Rectangle]
B(Rounded)
C([Stadium])
D[[Subroutine]]
E[(Database)]
F((Circle))
G{Diamond / decision}
H>Asymmetric]
I{{Hexagon}}
```

Node IDs must be unique, alphanumeric, no spaces. Labels go in the brackets.

## Edges

```
A --> B                 // solid arrow
A --- B                 // solid line, no arrow
A -.-> B                // dotted arrow
A ==> B                 // thick arrow
A -->|"causes"| B       // labeled arrow (quote labels with spaces/punctuation)
A & B --> C             // multiple sources
A --> B & C             // multiple targets
```

Always quote edge labels that contain spaces, commas, or parentheses.

## Subgraphs (clusters)

```
graph TD
  subgraph Inputs
    L[Light]
    W[Water]
    C[CO₂]
  end
  subgraph Outputs
    G[Glucose]
    O[Oxygen]
  end
  Inputs --> P[Photosynthesis] --> Outputs
```

## Mindmap

```
mindmap
  root((French Revolution))
    Causes
      Financial crisis
      Enlightenment ideas
      Estate inequality
    Events
      Bastille 1789
      Reign of Terror
    Outcomes
      End of monarchy
      Napoleonic rise
```

Node shape on root: `((round))`, `[square]`, `)cloud(`, `))bang((`.

## Timeline

```
timeline
  title Civil Rights Movement
  1954 : Brown v. Board of Education
  1955 : Montgomery Bus Boycott
  1963 : March on Washington
  1964 : Civil Rights Act
  1965 : Voting Rights Act
```

Sections: add `section SectionName` to group events.

## Styling (optional)

```
classDef root fill:#f9f,stroke:#333,stroke-width:2px
class P root
```

## Common pitfalls

- Edge labels with `(`, `)`, `,` MUST be quoted: `-->|"causes, ultimately"|`.
- Node IDs cannot start with a digit; use `N1984` not `1984`.
- `mindmap` uses indentation (2-space), not arrows.
- `timeline` uses `:` between year and label, no arrows.
- Subscripts (CO₂) are Unicode — most renderers handle them, but if `mmdc` chokes, use `CO2`.
