# arts-crafts Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `arts-crafts` skill that produces age-calibrated craft project plans (supply list, step-by-step instructions, safety notes, variations, cleanup) for elementary teachers and parents, with optional printable PDF output.

**Architecture:** Prompt-heavy Claude Code skill under `skills/arts-crafts/`. The SKILL.md encodes triggers, inputs, output schema, and the 11-section markdown template. Behavioral depth is pushed into four on-demand references: safety catalog, project catalog, fine-motor age mapping, and supply substitution guide. No skill-specific scripts; optional printable PDF uses `shared/scripts/pdf_render.py`. V1 explicitly declines stock-photo generation (text-based visual-description cues only) and refuses copyrighted characters by redirecting to the underlying theme.

**Tech Stack:** Markdown-only skill definition (SKILL.md + references/*.md), JSON evals schema shared across the school-skills plugin, Python (`shared/scripts/pdf_render.py` — already planned for the plugin) for the optional PDF path.

**Locked defaults from marketplace spec:**
- No stock-photo generation in V1. Leave photography to the teacher; rely on italicized visual-description cues per step.
- Refuse copyrighted characters. Redirect to the underlying theme (e.g. "Elsa craft" → "ice / snowflake craft") and document this in the skill description.
- Default audience: K-5 (ages 5-10), with PreK (2-4) explicitly supported.
- Default age band when unspecified: `5-7`.
- Default activity time when unspecified: 30 minutes.
- PDF rendering uses the plugin-level `shared/scripts/pdf_render.py` (Playwright-based). No skill-specific scripts.

---

## File Structure

```
skills/arts-crafts/
├── SKILL.md                        # Skill definition under 300 lines
├── references/
│   ├── safety.md                   # Scissors/hot-glue/small-parts/allergens catalog
│   ├── catalog.md                  # ~80-120 anchor projects by season + theme
│   ├── fine-motor.md               # Age → fine-motor-skill mapping
│   └── substitutions.md            # Common supply substitution guide
└── evals/
    └── evals.json                  # 5 test prompts with objective assertions
```

No `scripts/` directory — this skill is prompt-driven. The optional printable output invokes the plugin-level `shared/scripts/pdf_render.py` when requested.

## SKILL.md Outline

The SKILL.md must fit under 300 lines and follow the marketplace quality bar. Top-to-bottom section plan:

1. **YAML frontmatter** — `name: arts-crafts`, `description:` (60-80 words, pushy, lists concrete trigger phrases from teachers and parents).
2. **Purpose** — one paragraph mirroring the design spec §1: replaces "what can we make today" with a ready-to-run plan a non-crafty adult can execute.
3. **When to use this skill** — bulleted concrete trigger phrases (teacher + parent), mirroring design spec §2.
4. **Inputs** — bulleted list with defaults explicitly stated (age band default `5-7`, time default 30 min, mess default `medium`, setting default `home`). Each input documents how unspecified values are handled.
5. **Output — 11-section markdown template** — numbered template with one-line-per-section descriptions. Explicitly mark all 11 sections as required. Include the italicized visual-description cue convention for step instructions.
6. **Optional PDF output** — one paragraph: "If the user asks for a printable handout, call `shared/scripts/pdf_render.py` with the rendered markdown. Otherwise return the markdown inline."
7. **Workflow** — numbered 6-step workflow mirroring design spec §5 (parse → select concept → match constraints → write → safety check → render).
8. **Age calibration table** — the 3-row table from design spec §8 inline (2-4 / 5-7 / 8-10), each row listing motor skills, example activities, and what to avoid.
9. **Safety behaviors** — short inline rules (below) with a pointer to `references/safety.md` for the full catalog:
   - Never recommend sharp scissors for under-8 unsupervised.
   - Hot glue is always adult-operated; flag in Safety Notes.
   - Small parts <1.25" unsafe for under-3; flag or substitute.
   - Edible crafts must flag common allergens (peanut, tree nut, wheat, dairy, egg) and default to non-food variants.
10. **Copyrighted character policy** — explicit paragraph: when the user requests a copyrighted character (e.g. "Elsa," "Bluey," "Bluey birthday," "Mickey Mouse," named Pokémon, named Marvel/Disney characters, etc.), the skill must politely redirect to the underlying theme and produce a non-infringing project. Include one worked example ("Elsa craft" → "ice / snowflake craft"). Do not generate images or names that could infringe.
11. **Stock photography policy (V1)** — one paragraph: the skill does not generate or fetch stock photos in V1. Instructions use italicized visual-description cues so a non-crafty adult can picture each step without images. Teachers add their own photos if desired.
12. **Input flexibility** — accepted inputs: topic string, pasted unit description, URL (if browsing is available), photo of existing supplies, PDF of a curriculum unit.
13. **References** — bullet pointers to the four reference files with one-line summaries and load-on-demand guidance.
14. **Edge cases** — one short line each: allergies, supervision, budget, multi-student classroom prep-at-scale, impossible constraints, time mismatch. Each line ends with "See …" pointer into a reference when relevant.
15. **Evals** — one-line pointer to `evals/evals.json`.

Line budget target: 240-280 lines of Markdown. Keep each section tight; push depth into references.

## References (load on demand)

### `references/safety.md` — Safety catalog

Required content:

- **Scissors by type and minimum age.** Blunt safety scissors: age 3+ with close supervision. Standard kid scissors (rounded tip): age 5+. Sharp craft/adult scissors: age 8+ with supervision; age 10+ independently. Rotary cutters: adult only.
- **Hot glue.** Always adult-operated. Low-temp hot glue guns still cause burns — flag in Safety Notes any step using hot glue. Substitution: white glue or tacky glue for under-10.
- **Small parts.** Anything < 1.25" diameter (choking hazard per CPSC small-parts cylinder) is unsafe for under 3. Common offenders: beads, pom-poms < 1", googly eyes (any size), small buttons, dried pasta (depending on size), sequins, glitter.
- **Food allergens in edible crafts.** Flag all of: peanut, tree nut, wheat/gluten, dairy, egg, soy, sesame. Default to non-food variants. If user explicitly requests edible, require allergen warning line and offer swaps (sunflower butter for peanut butter; gluten-free pasta; dairy-free yogurt; aquafaba for egg).
- **Paint types.** Washable tempera: safe ages 3+. Acrylic: age 6+, non-washable, flag for staining. Oil paint / solvent-based: avoid for under-12.
- **Adhesive types.** Glue stick / white school glue: all ages. Tacky glue / craft glue: 5+. Super glue / epoxy / solvent-based: adult only.
- **Choking-hazard material quick list.** Small beads, small pom-poms, sequins, glitter (inhalation + eye), small buttons, small dried pasta, small googly eyes, toothpicks with sharp ends, small magnets (severe intestinal hazard if swallowed — never for under 8).
- **Sewing needles.** Plastic tapestry needles with large eye: 6+. Standard sewing needles: 8+ with supervision. Machine sewing: 10+ with supervision.
- **Oven-bake clay and baking.** Adult-operated oven. Cooling time flagged.
- **General supervision matrix.** Table: material × age × supervision level (independent / 1:1 / adult-operated).

Format: markdown with clear headings per category so Claude can load just the needed subsection.

### `references/catalog.md` — Project catalog by season + theme

Required content: ~80-120 anchor project entries, organized first by season then by theme, with a secondary index by theme for non-seasonal lookups.

**Sections:**
- **Fall** (apples, leaves, pumpkins, scarecrows, Halloween without copyrighted characters, Thanksgiving turkeys, harvest)
- **Winter** (snowflakes, snowmen, winter animals, Hanukkah, Christmas — generic/non-copyrighted, Kwanzaa, Lunar New Year, Valentine's Day, hibernation)
- **Spring** (flowers, rain, butterflies, birds/nests, St. Patrick's Day, Easter/spring eggs, Earth Day, Mother's Day, pond life)
- **Summer** (sun, ocean animals, beach, camping, Father's Day, Fourth of July, bugs, gardens)
- **Year-round themes** (alphabet/letters, numbers/counting, shapes, colors/color-mixing, family, friendship, feelings/emotions, community helpers, transportation, farm animals, zoo animals, pets, dinosaurs, space, weather, nutrition/food groups)

**Per entry schema** (must appear for every entry):
- Name (kid-friendly, non-copyrighted)
- Age band (`2-4`, `5-7`, `8-10`, or a range like `5-10`)
- Supplies (≤ 8 items typical)
- Prep time (minutes) and activity time (minutes)
- Mess level (low / medium / high)
- Skill level (beginner / intermediate / advanced)
- Learning connection (fine motor, symmetry, color mixing, storytelling, pattern recognition, seasonal vocabulary, counting, letter recognition, environmental awareness, cultural awareness, etc.)
- Safety flags (any that apply: scissors, hot glue, small parts, allergens, paint staining)
- One-line summary

Target: at minimum 20 entries in Fall, 20 in Winter, 20 in Spring, 20 in Summer, and 20 year-round (≥ 100 total). Aim for balanced age-band coverage within each season (~⅓ each age band).

### `references/fine-motor.md` — Age → fine-motor-skill mapping

Required content:

- **Developmental snapshot per age** for ages 2, 3, 4, 5, 6, 7, 8, 9, 10. Each includes: grasp type (palmar, pincer, tripod), cutting ability (none / tear only / snip / cut on straight line / cut on curve / cut shapes), folding ability (crumple / random fold / fold-in-half / fold-to-match-edges / multi-step origami), drawing/writing progression, bilateral coordination level.
- **Task → minimum age** reverse lookup table. Rows: tearing paper (2), sticking stickers (2), finger-painting (2), gluing with glue stick (3), snipping with blunt scissors (3), using a large brush (3), cutting on a straight line (5), folding in half (5), gluing with liquid glue bottle (5), threading a large bead on a pipe cleaner (4), threading a bead on string (6), cutting on a curve (6), cutting out shapes (7), simple origami (6-7), multi-step origami (8+), weaving (7-8), basic sewing with plastic needle (6), sewing with real needle (8), measuring with ruler (7), tying knots (6-7), using a compass (9), using a protractor (10).
- **Red flags to avoid** — matrix of age × task showing what is developmentally beyond typical ability (so the skill doesn't prescribe impossible steps).

Format: two primary tables plus short prose per age. ≤ 200 lines.

### `references/substitutions.md` — Supply substitution guide

Required content:

- **Adhesives:** glue stick ↔ white school glue ↔ washable tape ↔ double-sided tape ↔ tacky glue. Notes on which swap is safe per age.
- **Paper:** construction paper ↔ cardstock ↔ printer paper ↔ paper bag ↔ cereal-box cardboard ↔ newsprint.
- **Color/drawing tools:** markers ↔ crayons ↔ colored pencils ↔ oil pastels ↔ watercolors ↔ washable tempera.
- **Fasteners/connectors:** pipe cleaners ↔ yarn ↔ string ↔ twist ties ↔ rubber bands (age-gated).
- **3D materials:** pom-poms ↔ cotton balls ↔ crumpled tissue paper; popsicle sticks ↔ coffee stirrers ↔ rolled-paper tubes; paper plates ↔ round cardboard cut from a box.
- **Decorative:** glitter ↔ glitter glue ↔ sand ↔ colored salt; sequins ↔ foil shapes ↔ holepunch dots.
- **Natural/recycled alternatives:** empty toilet-paper rolls, egg cartons, cereal boxes, newspaper, junk-mail envelopes, bottle caps, scrap fabric, old magazines, brown paper bags, leaves/acorns/twigs.
- **No-scissors substitutes:** tearing, hole-punch, pre-cut shapes, washi-tape strips, sticker shapes, fold-and-rip.
- **No-glue substitutes:** double-sided tape, washi tape, staples (adult), stickers, velcro dots, brass fasteners.

Each substitution entry must note any age caveats (e.g. "rubber bands: 5+").

## Evals

`evals/evals.json` — 5 prompts with objective assertions. Schema follows the plugin-wide convention:

```json
{
  "skill": "arts-crafts",
  "evals": [
    {
      "id": "fall-leaves-prek",
      "prompt": "craft for pre-k about fall leaves",
      "assertions": [
        {"type": "contains_all_sections", "sections": ["Project Name","Age Range","Time","Skill Level","Mess Level","Supply List","Step-by-Step Instructions","Safety Notes","Variations / Extensions","Cleanup Tips","Learning Connections"]},
        {"type": "age_range_includes", "band": "2-4"},
        {"type": "supply_list_non_empty"},
        {"type": "no_unsupervised_scissors_for_age", "max_age": 4},
        {"type": "safety_notes_non_empty"}
      ]
    },
    {
      "id": "thanksgiving-no-scissors",
      "prompt": "thanksgiving class craft for 2nd grade, no scissors",
      "assertions": [
        {"type": "instructions_contain_none_of", "phrases": ["cut with scissors","use scissors","cut out with scissors"]},
        {"type": "group_size_guidance_for_minimum", "min_students": 20},
        {"type": "mess_level_stated"},
        {"type": "prep_time_stated"},
        {"type": "contains_all_sections"}
      ]
    },
    {
      "id": "construction-paper-and-glue-only",
      "prompt": "craft using only construction paper and glue",
      "assertions": [
        {"type": "supply_list_subset_of", "allowed": ["construction paper","glue","glue stick","pencil","white glue"]},
        {"type": "instructions_achievable_with_supplies"},
        {"type": "cleanup_tips_match_dry_materials"},
        {"type": "contains_all_sections"}
      ]
    },
    {
      "id": "simple-paper-craft-5yo",
      "prompt": "simple paper craft I can do with my 5 year old",
      "assertions": [
        {"type": "age_range_includes", "band": "5-7"},
        {"type": "instruction_count_at_most", "n": 8},
        {"type": "contains_italicized_visual_cues"},
        {"type": "reading_level_at_most_grade", "grade": 3},
        {"type": "contains_all_sections"}
      ]
    },
    {
      "id": "earth-day-recycled-3rd",
      "prompt": "earth day classroom craft, recycled materials, 3rd grade",
      "assertions": [
        {"type": "supply_list_contains_any_of", "items": ["cardboard","cereal box","toilet paper roll","newspaper","egg carton","bottle cap","paper bag","magazine"]},
        {"type": "learning_connection_mentions", "keywords": ["environment","recycle","Earth","sustainability","reuse"]},
        {"type": "age_range_includes", "band": "8-10"},
        {"type": "variations_section_non_empty"},
        {"type": "contains_all_sections"}
      ]
    }
  ],
  "global_assertions": [
    {"type": "safety_notes_non_empty"},
    {"type": "contains_all_sections"},
    {"type": "no_copyrighted_character_names"}
  ]
}
```

The assertion types above are declarative; per-plugin eval runner implementation is out of scope for this skill plan (handled at the plugin level).

---

## Tasks

### Task 1: Scaffold the skill directory and empty files

**Files:**
- Create: `skills/arts-crafts/SKILL.md` (empty placeholder header)
- Create: `skills/arts-crafts/references/safety.md` (empty)
- Create: `skills/arts-crafts/references/catalog.md` (empty)
- Create: `skills/arts-crafts/references/fine-motor.md` (empty)
- Create: `skills/arts-crafts/references/substitutions.md` (empty)
- Create: `skills/arts-crafts/evals/evals.json` (valid empty `{"skill":"arts-crafts","evals":[]}`)

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p skills/arts-crafts/references skills/arts-crafts/evals
```

- [ ] **Step 2: Create SKILL.md placeholder**

Write to `skills/arts-crafts/SKILL.md`:

```markdown
---
name: arts-crafts
description: (placeholder — filled in Task 2)
---

# arts-crafts

Placeholder. Filled in subsequent tasks.
```

- [ ] **Step 3: Create empty reference files**

Each of `safety.md`, `catalog.md`, `fine-motor.md`, `substitutions.md` gets:

```markdown
# <Title>

Placeholder. Filled in subsequent tasks.
```

- [ ] **Step 4: Create empty evals.json**

Write to `skills/arts-crafts/evals/evals.json`:

```json
{
  "skill": "arts-crafts",
  "evals": [],
  "global_assertions": []
}
```

- [ ] **Step 5: Verify JSON is valid**

Run: `python -c "import json; json.load(open('skills/arts-crafts/evals/evals.json'))"`
Expected: no output, exit 0.

- [ ] **Step 6: Commit**

```bash
git add skills/arts-crafts/
git commit -m "feat(arts-crafts): scaffold skill directory"
```

---

### Task 2: Write SKILL.md frontmatter + pushy description

**Files:**
- Modify: `skills/arts-crafts/SKILL.md`

- [ ] **Step 1: Replace the frontmatter block with the pushy description**

Overwrite the top of `SKILL.md` so it begins with:

```markdown
---
name: arts-crafts
description: Use for craft project planning for kids ages 2-10 — supply lists, step-by-step instructions, safety notes, mess level, prep time, and age-appropriate activities for classrooms and home. Triggers on "craft for pre-k about X", "easter craft ideas for 2nd grade", "simple paper craft with my 5 year old", "no-scissors thanksgiving classroom craft", "rainy day craft low mess", "valentine's day craft for 20 kids", "mother's day kindergarten craft", "earth day recycled-materials craft", "15-minute preschool craft", or "what can I make with my 3 year old". Redirects copyrighted-character requests (Elsa, Bluey, Mickey, etc.) to the underlying theme. Does not generate or fetch stock photos in V1.
---
```

- [ ] **Step 2: Verify frontmatter word count is 60-80 words**

Count the words between `description:` and the closing `---`. Target 60-80 words. Adjust if outside range.

- [ ] **Step 3: Commit**

```bash
git add skills/arts-crafts/SKILL.md
git commit -m "feat(arts-crafts): add pushy description triggers"
```

---

### Task 3: Write the Output template and Workflow sections of SKILL.md

**Files:**
- Modify: `skills/arts-crafts/SKILL.md`

- [ ] **Step 1: Append Purpose, When-to-use, Inputs sections**

Append below the frontmatter:

```markdown
# arts-crafts

## Purpose

Help elementary teachers and parents plan craft activities without hunting Pinterest. Given a theme or occasion, this skill produces a complete craft project plan — supply list, step-by-step instructions, safety notes, mess level, prep time, and cleanup — calibrated to the age of the child or class. Default audience: K-5 (ages 5-10); PreK (2-4) supported explicitly.

## When to use this skill

Use when the user asks for a craft project, activity plan, or what-to-make-with-the-kids recommendation. Trigger phrasings include:

- "craft for pre-k about fall leaves"
- "easter craft ideas for 2nd grade"
- "simple paper craft I can do with my 5 year old"
- "thanksgiving class craft ideas no scissors"
- "rainy day craft for a 4 year old, low mess"
- "valentine's day craft for 20 second graders"
- "craft using only construction paper and glue"
- "mother's day craft kindergarten"
- "craft to go with a unit on ocean animals, 1st grade"
- "quick 15-minute craft for preschool"
- "earth day classroom craft, recycled materials"
- "what can I make with my 3 year old this afternoon"

## Inputs

- **Theme / occasion** (free text; required). Holiday, season, book, unit topic, animal, concept.
- **Age band** — `2-4` (PreK), `5-7` (K-2), `8-10` (3-5). Default `5-7` if unspecified.
- **Group size** — single / small group (2-6) / classroom (15-30). Default single for home requests, classroom for school requests.
- **Time budget** — total minutes, prep + activity. Default 30-minute activity.
- **Available supplies** — optional constraint list (e.g. "construction paper and glue only", "no scissors", "recycled materials only").
- **Mess tolerance** — low / medium / high. Default medium.
- **Setting** — home or classroom. Default inferred from phrasing ("class" / "my kid").
- **Seasonal context** — if a holiday or month is mentioned, auto-tag seasonal; otherwise neutral.
```

- [ ] **Step 2: Append Output template section**

Append:

```markdown
## Output — required 11-section markdown template

Always produce these 11 sections, in this order:

1. **Project Name** — one line, kid-friendly, no copyrighted characters.
2. **Age Range** — e.g. "Ages 5-7 (K-2)".
3. **Time** — prep time and activity time separately (e.g. "Prep: 10 min · Activity: 25 min").
4. **Skill Level** — beginner / intermediate / advanced (calibrated to the age band).
5. **Mess Level** — low / medium / high, with one-line reason.
6. **Supply List** — bulleted, with quantities per child. Include common substitutions inline (e.g. "white glue *or* glue stick").
7. **Step-by-Step Instructions** — numbered, short sentences. Each step includes a **visual-description cue in italics** so a non-crafty adult can picture it (e.g. _"Fold the paper in half like a book."_). Instructions target the adult leading the activity, not the child.
8. **Safety Notes** — scissors, hot glue, small parts, food allergens, supervision required. Never empty; if truly minimal, state "Standard adult supervision; no sharp tools or allergens in this project."
9. **Variations / Extensions** — 2-3 ways to adapt up or down in difficulty or extend the activity.
10. **Cleanup Tips** — specific to the materials used.
11. **Learning Connections** — what this reinforces (fine motor, symmetry, color mixing, storytelling, pattern recognition, seasonal vocabulary, counting, environmental concept, etc.).

## Optional printable PDF

If the user asks for a printable handout or classroom poster, pass the rendered markdown to `shared/scripts/pdf_render.py` (plugin-level script) and return the PDF path. Otherwise return the markdown inline.
```

- [ ] **Step 3: Append Workflow section**

Append:

```markdown
## Workflow

1. **Parse inputs** — extract theme, age band, constraints, mess tolerance, time budget, setting.
2. **Select project concept** — prefer an entry from `references/catalog.md` that matches season/theme and age. Fall back to LLM generation for novel themes, constrained by the safety and fine-motor references.
3. **Match constraints** — filter by supplies available, mess tolerance, time budget, group size. If constraints conflict (e.g. "no scissors" + "paper snowflakes"), propose an alternative and explain the conflict.
4. **Write instructions at age-appropriate reading level** — short sentences for 2-4 and 5-7; more detail and multi-step for 8-10. Instructions target the adult.
5. **Safety check** — cross-reference `references/safety.md`. Flag or modify any step that conflicts with age-appropriate safety guidance (sharp scissors under 8, hot glue unsupervised, small parts under 3, food allergens).
6. **Render output** — produce the 11-section markdown. Generate a PDF via `shared/scripts/pdf_render.py` only if requested.
```

- [ ] **Step 4: Verify SKILL.md line count is on track (< 300)**

Run: `wc -l skills/arts-crafts/SKILL.md`
Expected: line count well under 300 with room for remaining sections.

- [ ] **Step 5: Commit**

```bash
git add skills/arts-crafts/SKILL.md
git commit -m "feat(arts-crafts): add purpose, inputs, output template, workflow"
```

---

### Task 4: Add age calibration table + safety behaviors + policy sections to SKILL.md

**Files:**
- Modify: `skills/arts-crafts/SKILL.md`

- [ ] **Step 1: Append Age calibration table**

Append:

```markdown
## Age calibration

| Age band | Motor skills | Example activities | Avoid |
|---|---|---|---|
| **2-4 (PreK)** | Large-motor; pincer grasp developing. Tear, stick, finger-paint, stamp, dip. | Handprint turkeys, torn-paper collages, finger-paint leaves, sticker scenes. | Scissors except blunt safety scissors with close supervision, small parts <1.25", hot glue, small beads. |
| **5-7 (K-2)** | Cut-and-paste on lines, simple folds, hold a brush. | Paper-plate animals, simple origami (dog head, tulip), folded greeting cards, pipe-cleaner creatures, cut-and-glue dioramas. | Sharp craft knives, hot glue unsupervised, fine sewing needles. |
| **8-10 (3-5)** | Multi-step sequences, precision cutting, basic measuring. | Multi-step origami (crane, boat), basic sewing (felt plushies with plastic needle), weaving, papier-mâché, simple bookbinding. | Rotary cutters, power tools, solvent-based adhesives. |

See `references/fine-motor.md` for finer-grained per-age task-to-age mapping.
```

- [ ] **Step 2: Append Safety behaviors section**

Append:

```markdown
## Safety behaviors (inline rules)

- **Scissors.** Never recommend sharp scissors for under-8 unsupervised. Blunt safety scissors for 3-4 require close supervision. See `references/safety.md` for the full scissors-by-type table.
- **Hot glue.** Always adult-operated. Flag in Safety Notes whenever hot glue appears. Offer a white-glue or tacky-glue substitute for under-10.
- **Small parts.** Any item <1.25" diameter is a choking hazard under age 3. Substitute larger parts (large pom-poms, large beads) or flag and require 1:1 supervision.
- **Edible crafts.** Flag all common allergens (peanut, tree nut, wheat, dairy, egg, soy, sesame). Default to non-food variants. If the user explicitly asks for edible, include an allergen warning line and offer swaps (sunflower butter, gluten-free pasta).
- **Paint and adhesives.** Washable tempera only for under-6; flag staining for acrylics. Super glue and solvent adhesives are adult-only.

Full catalog in `references/safety.md`.
```

- [ ] **Step 3: Append Copyrighted character policy**

Append:

```markdown
## Copyrighted character policy

If the user requests a project featuring a copyrighted character (e.g. "Elsa craft," "Bluey birthday craft," "Mickey Mouse ears," named Pokémon, named Marvel/Disney/Nintendo characters), politely redirect to the underlying theme and produce a non-infringing project. Do not use the character name in the project title, supply list, or instructions. Do not generate or describe character likenesses.

Examples:
- "Elsa craft" → "Ice and snowflake craft"
- "Bluey birthday craft" → "Blue-dog party craft" or "Cartoon-dog birthday craft"
- "Mickey Mouse ears" → "Round-ear headband craft"
- "Spider-Man mask" → "Superhero mask craft"

State the redirect briefly in the response (one sentence) before the project plan so the user isn't surprised.
```

- [ ] **Step 4: Append Stock-photography policy**

Append:

```markdown
## Stock-photography policy (V1)

This skill does not generate or fetch stock photos of finished projects in V1. Instructions use italicized visual-description cues per step so a non-crafty adult can picture each action. Teachers and parents can add their own photos of their own results if they choose. This avoids copyright issues and the common problem of stock photos showing materials different from the supply list.
```

- [ ] **Step 5: Append Input flexibility, References, Edge cases, Evals sections**

Append:

```markdown
## Input flexibility

Accepts: a topic string, pasted unit description, a URL (if browsing is available), a photo of existing supplies, or a PDF of a curriculum unit.

## References (loaded on demand)

- `references/safety.md` — full safety catalog (scissors by type, hot glue, small parts, allergens, paints, adhesives, needles, ovens, supervision matrix).
- `references/catalog.md` — ~100 anchor projects indexed by season and theme.
- `references/fine-motor.md` — per-age motor-skill snapshots and task-to-age reverse lookup.
- `references/substitutions.md` — supply substitution guide (adhesives, paper, color tools, fasteners, 3D materials, decoratives, natural/recycled, no-scissors, no-glue).

## Edge cases

- **Allergies.** Edible crafts flag peanut, tree nut, wheat, dairy, egg, soy, sesame. Default to non-food. See `references/safety.md`.
- **Supervision needs.** Hot glue, oven-bake clay, sharp scissors, sewing needles → flagged "adult-operated" or "requires 1:1 supervision".
- **Budget constraints.** "No budget" or "junk drawer only" → restrict to paper, tape, glue, crayons/markers, household recyclables. See `references/substitutions.md`.
- **Multi-student classroom (≥ 10).** Output includes a "prep-at-scale" note: what to pre-cut, pre-sort, or station-ize.
- **Impossible constraints.** "Craft with no supplies" or "2 minutes for 30 kids" → propose closest achievable alternative and explain the conflict.
- **Time mismatch.** If requested project normally takes 45 min but user gave 15 min → offer simplified version or split into two sessions.

## Evals

See `evals/evals.json` for 5 test prompts with objective assertions.
```

- [ ] **Step 6: Verify SKILL.md is under 300 lines**

Run: `wc -l skills/arts-crafts/SKILL.md`
Expected: < 300.

- [ ] **Step 7: Commit**

```bash
git add skills/arts-crafts/SKILL.md
git commit -m "feat(arts-crafts): add calibration, safety, policy, references sections"
```

---

### Task 5: Write `references/safety.md`

**Files:**
- Modify: `skills/arts-crafts/references/safety.md`

- [ ] **Step 1: Write the scissors section**

Overwrite `safety.md` starting with:

```markdown
# Safety catalog — arts-crafts

## Scissors by type and minimum age

| Scissor type | Minimum age | Supervision |
|---|---|---|
| Blunt safety scissors (no point, rounded blades) | 3 | Close 1:1 supervision |
| Kid scissors (rounded tip, mostly-blunt blade) | 5 | General supervision |
| Standard kid scissors (pointed tip) | 7 | General supervision |
| Adult / sharp craft scissors | 8 | Supervised |
| Adult scissors, independent | 10 | Independent OK |
| Rotary cutters, fabric shears | Adult only | — |

Never list "cut with sharp scissors" as a step for under-8. For 2-4, avoid scissors unless the project is explicitly a "snipping practice" activity with blunt safety scissors and close supervision.
```

- [ ] **Step 2: Append hot-glue, small-parts, allergens sections**

Append:

```markdown
## Hot glue

- Always adult-operated, all ages. Low-temp glue guns still cause burns.
- Whenever hot glue appears in a step, add to Safety Notes: "Hot glue is adult-operated. Keep children at least an arm's length from the glue gun tip."
- Under-10 substitute: white school glue, tacky glue, or double-sided tape.

## Small parts (choking hazard)

- CPSC small-parts cylinder is 1.25" diameter × 2.25" deep; any item that fits inside is a choking hazard under age 3.
- Common offenders: small beads, pom-poms under 1", googly eyes (any size), small buttons, small dried pasta, sequins, glitter (inhalation and eye hazard), small magnets (severe intestinal hazard if two or more are swallowed — avoid under age 8 regardless).
- Under-3 substitutes: large beads (jumbo pony beads, 1.5"+), large pom-poms (2"+), cut-out paper eyes with marker pupils, no glitter.

## Food allergens in edible crafts

Flag all of: peanut, tree nut, wheat / gluten, dairy, egg, soy, sesame.

- Default to non-food variants (e.g. pasta necklace → paper-bead necklace; peanut-butter bird feeder → lard-free suet cake on cardboard; salt-dough → air-dry clay).
- If the user explicitly asks for edible, include a Safety Notes line: "Allergen check: this project contains <list>. Confirm no allergies before serving or crafting."
- Offer swaps: sunflower butter for peanut butter, gluten-free pasta, dairy-free yogurt, aquafaba for egg.
```

- [ ] **Step 3: Append paints, adhesives, needles, ovens, supervision matrix**

Append:

```markdown
## Paint types

| Paint | Minimum age | Notes |
|---|---|---|
| Washable tempera | 3 | Safest; washes from skin and most clothes |
| Washable watercolors | 3 | Safe; minimal mess |
| Finger paint (washable) | 2 | Supervise mouthing |
| Acrylic | 6 | Non-washable; stains clothes; flag |
| Oil / solvent-based | 12+ | Avoid in classrooms |

## Adhesives

| Adhesive | Minimum age | Notes |
|---|---|---|
| Glue stick | 3 | All-purpose safe |
| White school glue | 3 | Washable |
| Tacky / craft glue | 5 | Stronger; harder to wash |
| Hot glue | Adult only | See Hot glue section |
| Super glue, epoxy | Adult only | Skin/eye hazard |
| Double-sided tape | 4 | Great no-glue substitute |
| Washi / masking tape | 3 | Easy to tear |

## Sewing needles

| Needle type | Minimum age | Supervision |
|---|---|---|
| Plastic tapestry needle (large eye) | 6 | General |
| Standard sewing needle | 8 | 1:1 |
| Machine sewing | 10 | 1:1 adult |

## Oven / baking

Adult-operated oven always. Include cooling time in Step-by-Step Instructions.

## Supervision matrix

| Material / activity | 2-4 | 5-7 | 8-10 |
|---|---|---|---|
| Blunt safety scissors | 1:1 supervision | General | Independent |
| Standard kid scissors | Not allowed | General | Independent |
| Sharp / adult scissors | Not allowed | Not allowed | Supervised |
| Hot glue | Adult-only | Adult-only | Adult-only |
| Oven / baking | Adult-only | Adult-only | Adult-only |
| Small parts (<1.25") | Avoid | OK | OK |
| Acrylic paint | Avoid | Supervised | General |
| Sewing with real needle | Not allowed | Not allowed | 1:1 |
```

- [ ] **Step 4: Commit**

```bash
git add skills/arts-crafts/references/safety.md
git commit -m "feat(arts-crafts): safety catalog reference"
```

---

### Task 6: Write `references/fine-motor.md`

**Files:**
- Modify: `skills/arts-crafts/references/fine-motor.md`

- [ ] **Step 1: Write per-age developmental snapshots**

Overwrite `fine-motor.md` with:

```markdown
# Fine-motor and developmental calibration — arts-crafts

Each snapshot describes typical (not exceptional) abilities. Err on the younger side when the user's exact age is ambiguous.

## Age 2

- Grasp: palmar transitioning to radial.
- Cutting: not yet — tearing only.
- Folding: crumple; no directed folds.
- Drawing: scribble, vertical strokes.
- Bilateral coordination: holds paper with one hand while scribbling with the other, inconsistently.
- Can: tear paper, stick stickers, finger-paint, stamp, dip.

## Age 3

- Grasp: pincer emerging.
- Cutting: snipping with blunt safety scissors (one-cut snips), close supervision.
- Folding: random fold; no alignment.
- Drawing: circles, crosses, horizontal + vertical lines.
- Bilateral coordination: stabilizes paper while drawing.
- Can: glue stick, snipping, large brush, stringing jumbo beads on pipe cleaner.

## Age 4

- Grasp: tripod emerging.
- Cutting: cut along a thick straight line with blunt scissors.
- Folding: approximate fold-in-half.
- Drawing: squares, recognizable figures (tadpole people).
- Can: thread a large bead on a pipe cleaner, use a hole punch, trace basic shapes.

## Age 5

- Grasp: mature tripod.
- Cutting: cut along a straight line on paper; cut out simple shapes with effort.
- Folding: fold in half to match edges with a reminder.
- Drawing: triangles, letters.
- Can: use a liquid-glue bottle with a dot-the-dots cue, fold a simple origami dog head with guidance.

## Age 6

- Cutting: cut on a curve; cut out circles and wavy lines.
- Folding: fold-to-match-edges reliably; follow a 3-step origami sequence.
- Can: basic sewing with a plastic tapestry needle, string beads on yarn with a taped tip, tie a simple knot.

## Age 7

- Cutting: cut out complex shapes; cut along a spiral.
- Folding: 4-5 step origami with modeling.
- Can: weaving over-under on a paper loom, measure with a ruler (inches or cm), simple bookbinding (folded signature with staples).

## Age 8

- Cutting: precision cutting; trim to a 1-mm line.
- Folding: multi-step origami (crane, boat) with a reference image.
- Can: sewing with a real needle under 1:1 supervision, simple embroidery, papier-mâché layering.

## Age 9

- Can: use a compass, mark measurements from a ruler, follow a 10-step craft tutorial independently.

## Age 10

- Can: use a protractor, follow independent sewing projects (felt plushies), basic bookbinding with coptic or saddle stitch, simple woodworking with adult-prepared pieces.

## Task → minimum typical age (reverse lookup)

| Task | Min age |
|---|---|
| Tear paper | 2 |
| Stick stickers | 2 |
| Finger-paint | 2 |
| Stamp / dip | 2 |
| Glue stick | 3 |
| Snip with blunt scissors | 3 |
| Large brush | 3 |
| Thread jumbo bead on pipe cleaner | 3 |
| Cut on a thick straight line | 4 |
| Hole punch | 4 |
| Liquid-glue bottle | 5 |
| Fold in half | 5 |
| Cut out simple shapes | 5 |
| String beads on yarn (taped tip) | 6 |
| Tie simple knot | 6 |
| Cut on a curve | 6 |
| 3-step origami | 6 |
| Plastic-needle sewing | 6 |
| Weaving (paper loom) | 7 |
| Measure with ruler | 7 |
| Cut out complex shapes | 7 |
| Multi-step origami | 8 |
| Real-needle sewing (1:1) | 8 |
| Papier-mâché | 8 |
| Use compass | 9 |
| Use protractor | 10 |
| Independent sewing project | 10 |

## Red flags — do not prescribe these for typical kids

| Task | Not before |
|---|---|
| Any scissors under supervision | 3 |
| Sharp (adult) scissors | 8 |
| Hot glue (child-operated) | Never |
| Real sewing needle | 8 |
| Craft knife / X-Acto | 12+ |
| Rotary cutter | Adult |
| Glitter under 3 | Avoid |
| Small magnets | 8 |
```

- [ ] **Step 2: Commit**

```bash
git add skills/arts-crafts/references/fine-motor.md
git commit -m "feat(arts-crafts): fine-motor age-mapping reference"
```

---

### Task 7: Write `references/substitutions.md`

**Files:**
- Modify: `skills/arts-crafts/references/substitutions.md`

- [ ] **Step 1: Write all substitution categories**

Overwrite `substitutions.md` with:

```markdown
# Supply substitution guide — arts-crafts

When a user has a constraint ("only X and Y", "no scissors", "no glue", "recycled only"), substitute using this guide. Each entry notes age caveats.

## Adhesives (pick whichever is on-hand)

- Glue stick ↔ white school glue (bottle) ↔ tacky glue ↔ double-sided tape ↔ washi / masking tape ↔ staples (adult).
- **Age caveats:** Liquid glue bottle 5+ (dot-the-dot cue for younger). Tacky glue 5+. Hot glue adult-only. Super glue / epoxy adult-only.

## Paper

- Construction paper ↔ cardstock ↔ printer paper ↔ paper-bag paper ↔ cereal-box cardboard ↔ newsprint ↔ coffee filters (for watercolor-absorbent art) ↔ magazine pages.
- **Age caveats:** none; all ages.

## Color / drawing tools

- Markers (washable) ↔ crayons ↔ colored pencils ↔ oil pastels (6+, messy) ↔ washable watercolors ↔ washable tempera.
- **Age caveats:** oil pastels 6+; acrylics 6+ (non-washable).

## Fasteners and connectors

- Pipe cleaners ↔ yarn ↔ string ↔ twist ties ↔ brass fasteners (brads) ↔ rubber bands ↔ staples (adult).
- **Age caveats:** rubber bands 5+. Brass fasteners 5+ (pointy legs).

## 3D and texture materials

- Pom-poms ↔ cotton balls ↔ crumpled tissue paper ↔ crumpled foil.
- Popsicle sticks ↔ coffee stirrers ↔ paper straws ↔ rolled-paper tubes (from printer paper).
- Paper plates ↔ round cardboard cut from a box ↔ pie tins (for non-craft base).
- **Age caveats:** small pom-poms (<1") under 3; substitute jumbo pom-poms.

## Decorative items

- Glitter ↔ glitter glue ↔ colored sand ↔ salt dyed with food coloring ↔ crushed-chalk rubbed on glue.
- Sequins ↔ foil shapes punched from foil ↔ hole-punched colored-paper dots ↔ sticker circles.
- **Age caveats:** loose glitter 4+; glitter glue 3+. Sequins 3+ with supervision.

## Natural / recycled alternatives

Use when user asks for "recycled" or "junk drawer":
- Empty toilet-paper rolls, paper-towel rolls.
- Egg cartons (cardboard or foam — foam not food-safe for edible reuse).
- Cereal boxes, cracker boxes, shoeboxes.
- Newspaper, junk-mail envelopes, old magazines.
- Bottle caps (supervise under 3), jar lids.
- Scrap fabric, old socks, t-shirt scraps.
- Brown paper bags.
- Nature finds: leaves, acorns, small twigs, smooth pebbles (supervise under 3), pinecones, seashells.

## No-scissors substitutes

- Tearing (all ages).
- Hole-punch (4+).
- Pre-cut shapes (adult prep).
- Washi-tape strips (3+).
- Sticker shapes (2+).
- Fold-and-rip (5+) — fold paper, rip along the crease.
- Blunt children's paper cutter with guide bar (adult-prep only).

## No-glue substitutes

- Double-sided tape (4+).
- Washi / masking tape (3+).
- Staples (adult).
- Stickers (2+).
- Velcro dots (4+).
- Brass fasteners (5+).
- Interlocking tab-and-slot cuts (adult pre-cuts the tabs; 5+ assembles).
```

- [ ] **Step 2: Commit**

```bash
git add skills/arts-crafts/references/substitutions.md
git commit -m "feat(arts-crafts): supply-substitution reference"
```

---

### Task 8: Write `references/catalog.md` — Fall + Winter sections

**Files:**
- Modify: `skills/arts-crafts/references/catalog.md`

Target: ≥ 20 entries for Fall, ≥ 20 for Winter, with balanced age-band coverage within each.

- [ ] **Step 1: Write catalog header and schema**

Overwrite `catalog.md` starting with:

```markdown
# Project catalog — arts-crafts

Anchor projects used by the skill to ground responses. Novel themes fall back to LLM generation constrained by this catalog, `references/safety.md`, and `references/fine-motor.md`.

## Entry schema

Each entry includes: **Name** · **Age band** · **Supplies** · **Prep / Activity time** · **Mess** · **Skill** · **Learning connection** · **Safety flags** · **Summary**.

Age bands: `2-4`, `5-7`, `8-10`, or a range like `5-10`.
```

- [ ] **Step 2: Write Fall section (≥ 20 entries)**

Append a `## Fall` heading. Under it, add ≥ 20 entries in the schema format, balanced across age bands. Themes to cover: apples, leaves, pumpkins, scarecrows, Halloween (generic — spiders, ghosts, bats, jack-o-lanterns, witches, monsters; no copyrighted characters), Thanksgiving turkeys, harvest, acorns, squirrels, corn.

Example entry format (write out all 20+ in this form):

```markdown
### Handprint Turkey

- Age band: 2-4
- Supplies: brown construction paper, washable tempera paint (brown, red, orange, yellow), paper plate, glue stick, googly eyes (jumbo 1.5"+), black marker
- Prep: 5 min · Activity: 20 min
- Mess: medium (paint)
- Skill: beginner
- Learning: color recognition, fine motor (finger paint), gratitude vocabulary
- Safety flags: paint (washable tempera), no scissors
- Summary: Paint the child's palm brown for the body and each fingertip a different feather color; press onto paper. Add a beak and googly eye when dry.
```

Repeat for at least 19 more Fall projects, distributing across 2-4 (≥ 6), 5-7 (≥ 8), 8-10 (≥ 6). Suggested additional names: "Torn-paper Leaf Collage" (2-4), "Coffee-Filter Fall Leaves" (5-7), "Paper-Plate Pumpkin" (5-7), "Pinecone Owl" (5-7), "Apple-Print Tree" (2-4), "Scarecrow Paper Puppet" (5-7), "Paper-Bag Scarecrow" (5-7), "Woven Paper Pumpkin" (8-10), "Falling-Leaves Mobile" (8-10), "Folded-Paper Acorns" (8-10), "Tissue-Paper Sunflower" (5-7), "Egg-Carton Spider" (5-7), "Paper-Plate Jack-o-Lantern" (5-7), "Black-Cat Silhouette Collage" (8-10), "3D Paper Bat" (8-10), "Corn-Kernel Mosaic" (8-10; allergen-flag for corn allergy; or use colored-paper squares), "Pumpkin Seed Painting" (5-7), "Handprint Tree with Torn-Paper Leaves" (2-4), "Paper-Strip Woven Placemat" (7-10), "Q-tip Pointillism Pumpkin" (5-7).

- [ ] **Step 3: Write Winter section (≥ 20 entries)**

Append `## Winter` heading. Themes: snowflakes, snowmen, winter animals (polar bear, penguin, arctic fox, owl), Hanukkah (menorah, dreidel, Star of David — generic), Christmas (generic: trees, ornaments, gingerbread shapes, stockings; no Santa-trademark issues, no Rudolph, no copyrighted characters), Kwanzaa (kinara, unity cup), Lunar New Year (lanterns, dragons, zodiac animals), Valentine's Day (hearts, friendship cards), hibernation, winter night sky.

≥ 20 entries, balanced across age bands. Example names: "Cotton-Ball Snowman" (2-4), "Coffee-Filter Snowflake" (5-7), "Torn-Paper Polar Bear" (2-4), "Paper-Plate Penguin" (5-7), "Handprint Menorah" (5-7), "Paper Dreidel" (7-10), "Tissue-Paper Lantern" (5-7), "Folded-Paper Heart" (5-7), "Heart Weaving" (7-10), "Friendship Bracelet (Braided Yarn)" (7-10), "Paper-Snowflake Mobile" (7-10), "Cardboard Gingerbread-Shape Ornament (non-edible)" (5-7), "Q-tip Snowflake" (5-7), "Winter Animal Silhouette Collage" (8-10), "Paper-Cup Snowman" (2-4), "Tissue-Paper Winter Tree" (5-7), "Sock Snowman (no sewing)" (7-10), "Origami Valentine Fox" (8-10), "Stained-Glass Heart (tissue paper + contact paper)" (5-7), "Constellation Punched-Card" (7-10), "Kinara Handprint" (5-7), "Lunar New Year Red Envelope Decoration" (5-7).

- [ ] **Step 4: Commit**

```bash
git add skills/arts-crafts/references/catalog.md
git commit -m "feat(arts-crafts): catalog fall + winter projects"
```

---

### Task 9: Write `references/catalog.md` — Spring + Summer + Year-round

**Files:**
- Modify: `skills/arts-crafts/references/catalog.md`

- [ ] **Step 1: Append Spring section (≥ 20 entries)**

Append `## Spring`. Themes: flowers, rain, butterflies, birds/nests, St. Patrick's Day (shamrocks, rainbows, pots of gold; no leprechaun copyright issue but keep generic), Easter (eggs, bunnies — generic), spring eggs (secular), Earth Day, Mother's Day, pond life (frogs, tadpoles, ducks), caterpillars.

Sample entries (write full schema for ≥ 20): "Coffee-Filter Butterfly" (5-7), "Handprint Flower Bouquet for Mom" (2-4), "Paper-Plate Rainbow" (5-7), "Egg-Carton Caterpillar" (5-7), "Torn-Paper Spring Tree" (2-4), "Folded-Paper Bunny" (7-10), "Marbled-Paper Easter Egg (shaving-cream method)" (5-7), "Paper-Cup Bird Nest with Pom-Pom Eggs" (5-7), "Recycled-Newspaper Flower" (8-10), "Rain-Cloud Mobile" (5-7), "Q-tip Cherry Blossom" (5-7), "Pressed-Flower Bookmark" (7-10), "Paper Shamrock Chain" (5-7), "Earth Day Globe from Paper Plate" (5-7), "Seed-Paper Bookmark" (8-10; allergen-safe flower seeds), "Mother's Day Coupon Book" (7-10), "Paper-Plate Duck" (5-7), "Butterfly Symmetry Painting" (5-7; fold-paint-unfold), "Tadpole-to-Frog Life-Cycle Wheel" (8-10), "Upcycled-Magazine Flower Vase" (8-10), "Tissue-Paper Spring Wreath" (5-7).

- [ ] **Step 2: Append Summer section (≥ 20 entries)**

Append `## Summer`. Themes: sun, ocean animals (fish, octopus, turtle, jellyfish, whale, shark — no copyrighted characters), beach, camping, Father's Day, Fourth of July (stars, stripes, fireworks), bugs (ladybugs, bees, dragonflies, ants), gardens, ice-cream shapes, watermelon.

Sample entries: "Paper-Plate Jellyfish" (5-7), "Handprint Octopus" (2-4), "Torn-Paper Fish Collage" (2-4), "Coffee-Filter Sun" (5-7), "Paper-Bag Turtle Puppet" (5-7), "Folded-Paper Whale" (7-10), "Firework Tube Stamping (paper-towel-roll end cut into fringe)" (5-7), "Red-White-Blue Paper Star" (5-7), "Father's Day Tie Card" (5-7), "Paper-Plate Ladybug" (2-4), "Egg-Carton Bumblebee" (5-7), "Pipe-Cleaner Dragonfly" (7-10), "Q-tip Sunflower Field" (5-7), "Watermelon Paper Fan" (7-10), "Seashell-Print Cardstock (imaginary shells drawn with white crayon + watercolor wash)" (5-7), "Ocean-in-a-Bottle (calm-down jar)" (7-10; adult-seals cap), "Tissue-Paper Stained-Glass Fish" (5-7), "3D Paper Lighthouse" (8-10), "Constellation Campfire Scene" (8-10), "Painted-Rock Bugs" (5-7; flag rocks as supervise under 3), "Garden Seed Packet with Homemade Cover" (7-10).

- [ ] **Step 3: Append Year-round themes (≥ 20 entries)**

Append `## Year-round themes`. Themes: alphabet/letters, numbers/counting, shapes, colors/color-mixing, family, friendship, feelings/emotions, community helpers, transportation, farm animals, zoo animals, pets, dinosaurs, space, weather, nutrition / food groups.

Sample entries (write ≥ 20 in full schema form): "Alphabet Letter Collage (bring-from-home)" (5-7), "Shape-Hunt Collage" (5-7), "Color-Wheel Paper Plate" (5-7), "Primary-Color-Mixing Finger Painting" (2-4), "Family Paper-Doll Chain" (5-7), "Friendship Heart Chain" (5-7), "Emotion-Face Paper Plates" (5-7), "Community-Helper Paper-Bag Puppet" (5-7), "Paper-Roll Cars" (5-7), "Barnyard Paper-Plate Animals" (5-7), "Zoo-Animal Mask" (5-7), "Pet Self-Portrait" (5-7), "Paper-Plate Dinosaur" (5-7), "Cardboard-Tube Rocket" (7-10), "Handprint Weather Chart" (5-7), "My-Plate Food-Group Collage (cut from magazines)" (7-10), "Name-Sign with Pattern Border" (5-7), "Counting Caterpillar" (2-4), "Shape Robot" (5-7), "Story-Stone Characters" (7-10; supervise rocks under 3).

- [ ] **Step 4: Verify total entry count ≥ 100**

Run: `grep -c '^### ' skills/arts-crafts/references/catalog.md`
Expected: ≥ 100.

- [ ] **Step 5: Commit**

```bash
git add skills/arts-crafts/references/catalog.md
git commit -m "feat(arts-crafts): catalog spring, summer, year-round projects"
```

---

### Task 10: Write `evals/evals.json`

**Files:**
- Modify: `skills/arts-crafts/evals/evals.json`

- [ ] **Step 1: Overwrite with 5 prompts + assertions**

Overwrite `evals/evals.json` with:

```json
{
  "skill": "arts-crafts",
  "evals": [
    {
      "id": "fall-leaves-prek",
      "prompt": "craft for pre-k about fall leaves",
      "assertions": [
        {"type": "contains_all_sections", "sections": ["Project Name","Age Range","Time","Skill Level","Mess Level","Supply List","Step-by-Step Instructions","Safety Notes","Variations / Extensions","Cleanup Tips","Learning Connections"]},
        {"type": "age_range_includes", "band": "2-4"},
        {"type": "supply_list_non_empty"},
        {"type": "no_unsupervised_scissors_for_age", "max_age": 4},
        {"type": "safety_notes_non_empty"}
      ]
    },
    {
      "id": "thanksgiving-no-scissors",
      "prompt": "thanksgiving class craft for 2nd grade, no scissors",
      "assertions": [
        {"type": "instructions_contain_none_of", "phrases": ["cut with scissors","use scissors","cut out with scissors","scissor"]},
        {"type": "group_size_guidance_for_minimum", "min_students": 20},
        {"type": "mess_level_stated"},
        {"type": "prep_time_stated"},
        {"type": "contains_all_sections"}
      ]
    },
    {
      "id": "construction-paper-and-glue-only",
      "prompt": "craft using only construction paper and glue",
      "assertions": [
        {"type": "supply_list_subset_of", "allowed": ["construction paper","glue","glue stick","pencil","white glue","marker","crayon"]},
        {"type": "instructions_achievable_with_supplies"},
        {"type": "cleanup_tips_match_dry_materials"},
        {"type": "contains_all_sections"}
      ]
    },
    {
      "id": "simple-paper-craft-5yo",
      "prompt": "simple paper craft I can do with my 5 year old",
      "assertions": [
        {"type": "age_range_includes", "band": "5-7"},
        {"type": "instruction_count_at_most", "n": 8},
        {"type": "contains_italicized_visual_cues"},
        {"type": "reading_level_at_most_grade", "grade": 3},
        {"type": "contains_all_sections"}
      ]
    },
    {
      "id": "earth-day-recycled-3rd",
      "prompt": "earth day classroom craft, recycled materials, 3rd grade",
      "assertions": [
        {"type": "supply_list_contains_any_of", "items": ["cardboard","cereal box","toilet paper roll","newspaper","egg carton","bottle cap","paper bag","magazine"]},
        {"type": "learning_connection_mentions", "keywords": ["environment","recycle","Earth","sustainability","reuse"]},
        {"type": "age_range_includes", "band": "8-10"},
        {"type": "variations_section_non_empty"},
        {"type": "contains_all_sections"}
      ]
    }
  ],
  "global_assertions": [
    {"type": "safety_notes_non_empty"},
    {"type": "contains_all_sections"},
    {"type": "no_copyrighted_character_names"}
  ]
}
```

- [ ] **Step 2: Validate JSON**

Run: `python -c "import json; d=json.load(open('skills/arts-crafts/evals/evals.json')); assert len(d['evals'])==5; print('ok')"`
Expected output: `ok`.

- [ ] **Step 3: Commit**

```bash
git add skills/arts-crafts/evals/evals.json
git commit -m "feat(arts-crafts): 5 evals with objective assertions"
```

---

### Task 11: Self-review pass — verify all 11 required output sections are testable

**Files:**
- Modify: `skills/arts-crafts/SKILL.md` (only if gaps found)
- Modify: `skills/arts-crafts/evals/evals.json` (only if gaps found)

- [ ] **Step 1: Grep SKILL.md for each of the 11 sections**

Run:
```bash
for s in "Project Name" "Age Range" "Time" "Skill Level" "Mess Level" "Supply List" "Step-by-Step Instructions" "Safety Notes" "Variations / Extensions" "Cleanup Tips" "Learning Connections"; do
  grep -c -- "$s" skills/arts-crafts/SKILL.md | sed "s|^|$s: |"
done
```
Expected: each count ≥ 1.

- [ ] **Step 2: Grep evals.json for `contains_all_sections` coverage**

Run: `grep -c "contains_all_sections" skills/arts-crafts/evals/evals.json`
Expected: ≥ 5 (one per eval) plus global.

- [ ] **Step 3: Verify copyrighted-character policy is present in SKILL.md**

Run: `grep -n "Copyrighted character policy" skills/arts-crafts/SKILL.md`
Expected: one line match.

- [ ] **Step 4: Verify stock-photography V1 policy is present**

Run: `grep -n "Stock-photography policy" skills/arts-crafts/SKILL.md`
Expected: one line match.

- [ ] **Step 5: If any check fails, patch and re-verify before committing**

- [ ] **Step 6: Commit (if any changes made; otherwise skip)**

```bash
git add skills/arts-crafts/SKILL.md skills/arts-crafts/evals/evals.json
git commit -m "fix(arts-crafts): self-review patches"
```

---

### Task 12: Dry-run the skill against the 5 eval prompts (manual smoke test)

**Files:**
- None modified; this task produces a checklist of observations only.

- [ ] **Step 1: For each of the 5 eval prompts, manually generate the output**

Paste each eval prompt into a Claude session with the skill installed (or via the plugin's local eval runner when available). Capture the 11-section markdown response.

- [ ] **Step 2: Verify each assertion by eye**

For each eval, confirm every listed assertion passes. Note any failures.

- [ ] **Step 3: If any eval fails, patch SKILL.md or references and re-run just that eval**

Likely patch sites:
- Missing section → tighten the Output template wording in SKILL.md.
- Wrong age handling → add an age-band inference example in Workflow.
- Scissor leakage in no-scissor prompt → add an explicit "if constraint says no scissors, never list scissors" bullet in Safety behaviors.
- Missing visual cues → reinforce the italicized-cue requirement in the Output template.

- [ ] **Step 4: Commit any patches**

```bash
git add skills/arts-crafts/
git commit -m "fix(arts-crafts): patches from dry-run evals"
```

---

## Self-Review Checklist (run once after writing all tasks)

1. **Spec coverage.**
   - Purpose (§1) → Task 3 Step 1. ✓
   - Triggers (§2) → Task 2 (description) + Task 3 Step 1 (When-to-use). ✓
   - Inputs (§3) → Task 3 Step 1. ✓
   - Outputs (§4, 11 sections) → Task 3 Step 2. ✓
   - Optional PDF → Task 3 Step 2. ✓
   - Workflow (§5) → Task 3 Step 3. ✓
   - Bundled scripts none (§6) → covered by omission in file structure. ✓
   - References (§7) → Tasks 5, 6, 7, 8, 9. ✓
   - Age calibration (§8) → Task 4 Step 1. ✓
   - Evals (§9) → Task 10. ✓
   - Edge cases (§10) → Task 4 Step 5. ✓
   - Copyrighted-character policy (open question, locked: refuse) → Task 4 Step 3. ✓
   - Stock-photo V1 policy (open question, locked: none) → Task 4 Step 4. ✓

2. **Placeholder scan.** No "TBD / implement later / similar to Task N" anywhere. Catalog entries specify a concrete schema and named example projects; the engineer fills in the other entries following the given schema and sample names. Safety, fine-motor, substitutions references contain complete content inline.

3. **Type consistency.** Section names used consistently ("Project Name", "Age Range", "Time", "Skill Level", "Mess Level", "Supply List", "Step-by-Step Instructions", "Safety Notes", "Variations / Extensions", "Cleanup Tips", "Learning Connections") across SKILL.md, evals.json, and self-review grep. Age bands `2-4`, `5-7`, `8-10` consistent across SKILL.md, catalog, fine-motor, safety.

4. **No `/scripts`.** Confirmed in file structure and Task 1; optional PDF routes to `shared/scripts/pdf_render.py` only.
