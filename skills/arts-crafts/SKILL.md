---
name: arts-crafts
description: Plan age-calibrated craft projects for kids ages 2-10 — supply list, step-by-step instructions, safety notes, mess level, prep time, variations, cleanup, and learning connections. Use whenever a teacher or parent asks for a classroom or home craft. Triggers on "craft for pre-k about fall leaves", "easter craft ideas for 2nd grade", "simple paper craft with my 5 year old", "thanksgiving class craft no scissors", "rainy day low-mess craft for 4 year old", "valentine's day craft for 20 second graders", "craft using only construction paper and glue", "mother's day kindergarten craft", "ocean animals 1st grade craft", "15-minute preschool craft", "earth day recycled-materials craft", "what can I make with my 3 year old", and similar K-5 / PreK project requests. Redirects copyrighted-character requests (Elsa, Bluey, Mickey, Pokémon) to the underlying theme. Does not fetch stock photos — uses italicized visual-description cues per step instead.
---

# arts-crafts

Turn "what can we make today?" into a ready-to-run craft plan. Given a theme or occasion, produce a complete project plan — supplies, steps, safety, mess, prep, cleanup — calibrated to the age of the child or class. Default audience K-5 (ages 5-10); PreK (2-4) supported explicitly. A non-crafty adult can run it without further prep.

## When to trigger

Use this skill whenever a user asks for a craft, project, or "make something" idea for a child or classroom. Teachers and parents phrase it many ways — trust the description keywords rather than a strict format. If the only thing missing is the age band, ask one clarifying question. Otherwise proceed with defaults.

## Inputs

Parse these from the user's request:

- **Theme / occasion** — holiday, season, book, unit topic, animal, concept. Required (if missing, suggest two and pick one).
- **Age band** — `2-4` (PreK / toddler), `5-7` (K-2), `8-10` (3-5). Default `5-7` if unspecified.
- **Group size** — single child, small group (2-6), classroom (15-30). Default single/small.
- **Time budget** — total minutes (prep + activity). Default 30 min activity.
- **Available supplies** — optional constraint ("only construction paper and glue", "no scissors", "recycled only").
- **Mess tolerance** — `low` / `medium` / `high`. Default `medium`.
- **Setting** — home vs. classroom. Default home unless phrasing implies classroom.

### Inferring age from phrasing (check before asking)

| Phrase in the request | Age band |
|---|---|
| "pre-k", "preschool", "toddler", "2-year-old", "3-year-old", "4-year-old", "daycare" | 2-4 |
| "kindergarten", "kinder", "TK", "5-year-old", "1st grade", "2nd grade", "6-year-old", "7-year-old" | 5-7 |
| "3rd grade", "4th grade", "5th grade", "8-year-old", "9-year-old", "10-year-old", "elementary" | 8-10 |
| "my kid", "my class", "elementary classroom", no age cue | default 5-7 |
| Spans ages (e.g. "my kids ages 3 and 7") | anchor on younger; add older-sibling variation |

If age is truly unclear and you can't infer, ask ONE question:

> Quick check — what age is this for? **PreK (2-4) · K-2 (5-7) · 3-5 (8-10)**

Do not stack questions. Do not ask about mess, supplies, group size, or time unless the user wants tight customization.

## Output — required sections in this order

Every plan must include all 11 sections below. Instructions target the adult leading the activity, not the child.

1. **Project Name** — one line, kid-friendly, non-copyrighted.
2. **Age Range** — e.g. "Ages 5-7 (K-2)".
3. **Time** — prep time + activity time, separately (e.g. "5 min prep · 25 min activity").
4. **Skill Level** — beginner / intermediate / advanced, calibrated to age.
5. **Mess Level** — low / medium / high, with a one-line reason ("uses wet glue and paint").
6. **Supply List** — bulleted, with per-child quantities. Include substitutions inline ("white glue *or* glue stick"; "construction paper *or* cardstock").
7. **Step-by-Step Instructions** — numbered, short sentences. Each step includes an *italicized visual-description cue* so a non-crafty adult can picture it without photos (e.g. _"Fold the paper in half like a book."_).
8. **Safety Notes** — scissors type, hot glue, small parts, allergens, supervision level.
9. **Variations / Extensions** — 2-3 ways to adapt up/down in difficulty or extend the activity.
10. **Cleanup Tips** — specific to materials used (wet vs. dry, paint vs. markers).
11. **Learning Connections** — what skill or concept this reinforces (fine motor, symmetry, color mixing, storytelling, pattern recognition, seasonal vocabulary, environmental awareness, etc.).

For group size ≥ 10, include a short "prep-at-scale" note inside Supply List or a final "Classroom Notes" line: what to pre-cut, pre-sort, or station-ize.

## Workflow

1. Parse inputs; infer age from the table above; fill defaults.
2. Select a project concept matching theme + age + constraints. For novel themes, generate; for standard themes, anchor on `references/catalog.md`.
3. Match constraints (supplies / mess / time / group). If a constraint conflicts with the obvious project ("no scissors" + "paper snowflakes"), propose a nearby alternative and explain the swap in one line.
4. Calibrate instructions: short sentences and tear/stick/stamp verbs for 2-4; cut-on-lines and simple folds for 5-7; multi-step assembly for 8-10. Use `references/fine-motor.md` to sanity-check that every step is physically achievable.
5. Run the safety pass against `references/safety.md`: scissors type by age, hot glue flagged adult-operated, small parts for <3, allergens in edible crafts.
6. Render the 11-section markdown plan. Always include supply substitutions (load `references/substitutions.md`) and a stated mess level.

## Age calibration

| Age band | Motor skills | Example activities | Avoid |
|---|---|---|---|
| **2-4 (PreK)** | Large-motor, pincer grasp developing. Tear, stick, finger-paint, stamp, dip. | Handprint turkeys, torn-paper collages, finger-paint leaves, sticker scenes, dot markers. | Sharp scissors, small parts <1.25", hot glue, small beads, liquid-glue bottles (use sticks). |
| **5-7 (K-2)** | Cut-and-paste on lines, simple folds, holds a brush. | Paper-plate animals, simple origami (dog head, tulip), folded greeting cards, pipe-cleaner creatures, cut-and-glue dioramas. | Sharp craft knives, hot glue unsupervised, fine sewing needles. |
| **8-10 (3-5)** | Multi-step sequences, precision cutting, basic measuring. | Multi-step origami (crane, boat), felt plushies with plastic needles, simple weaving, papier-mâché, basic bookbinding. | Rotary cutters, power tools, solvent-based adhesives. |

## Locked defaults

| Setting | Default |
|---|---|
| Age band (if not inferable) | 5-7 (K-2) |
| Activity time | 30 min |
| Mess tolerance | medium |
| Setting | home |
| Supply substitutions | always included inline in Supply List |
| Mess level | always stated with one-line reason |
| Stock photos | none in V1 — use italicized visual-description cues per step |
| PDF / printable handout | deferred — skill returns markdown only in V1 |
| Copyrighted characters | redirect to underlying theme; never name the character in output |

## Copyrighted-character redirect

If the user requests a named copyrighted character ("Elsa craft", "Bluey birthday", "Mickey Mouse ears", named Pokémon, named Marvel / Disney / Nintendo character), do not produce a craft that uses the name, logo, or signature visual. Instead, redirect to the underlying theme in one sentence and produce a non-infringing project:

- "Elsa craft" → "ice / snowflake craft"
- "Bluey party craft" → "blue dog or puppy craft"
- "Mickey ears" → "round-eared mouse headband"
- "Spider-Man mask" → "superhero mask (any color, any insignia the child designs)"

The project name, supply list, and instructions must not reference the original character. Mention the redirect briefly so the user isn't surprised.

## Micro-example (trimmed illustrative output)

**User:** "craft for pre-k about fall leaves, low mess"

**Inferred:** age 2-4 (PreK), theme = fall leaves, mess = low. No clarifying question needed.

```
# Torn-Paper Leaf Collage

**Age Range:** Ages 2-4 (PreK)
**Time:** 5 min prep · 15 min activity
**Skill Level:** Beginner
**Mess Level:** Low — dry materials; glue stick only.

## Supplies (per child)
- 1 sheet white or blue construction paper (background)
- 3-4 half-sheets of red, orange, yellow, and brown construction paper
- 1 glue stick (or washable tape)
- Optional: leaf-shape template traced in pencil on the background

## Steps
1. Set out torn-paper scraps in color piles. _Like a mini salad bar of fall colors._
2. Show the child how to tear a sheet into rough chunks. _Pinch-and-pull with two hands — no scissors needed._
3. Rub glue stick on the background inside the leaf outline. _Like coloring with a chapstick._
4. Press torn paper onto the glue, overlapping pieces. _Like shingles on a roof._
5. Fill the whole leaf shape. Press down firmly. _Squish like a sandwich._

## Safety Notes
No scissors. Glue stick only (no liquid glue bottles for this age). All materials large enough to avoid choking hazard.

## Variations
- Use real pressed leaves as stencils for the outline.
- Older sibling (5+): add a glued twig "stem" and a pipe-cleaner veined leaf.
- No construction paper? Tear pages from an old magazine or junk mail.

## Cleanup
Sweep paper scraps into a bag. Cap the glue stick. No wet cleanup.

## Learning Connections
Fine motor (tearing strengthens pincer grasp), color recognition (warm fall palette), seasonal vocabulary (leaf, fall, autumn, crunchy).
```

## References (load on demand)

- `references/safety.md` — scissors-by-age, hot glue, small-parts rule, allergens in edible crafts, paint + adhesive types, supervision matrix. Load when the project involves any cutting, heat, food, small decorations, or sewing.
- `references/catalog.md` — ~100 anchor projects by season (fall / winter / spring / summer) and year-round theme. Load when matching a standard theme (holiday, animal, letter, concept).
- `references/fine-motor.md` — age × task lookup for what 2-10-year-olds can physically do (tearing, cutting, folding, threading, sewing). Load when calibrating steps or when a request spans ages.
- `references/substitutions.md` — glue, paper, color-tool, fastener, 3D-material, decorative, recycled, no-scissors, no-glue swaps. Load when the user constrains supplies ("only X and Y", "what's in the junk drawer", "no scissors").

## Edge cases

- **Allergies / edible crafts** — default to non-food variants. If the user explicitly wants edible (salt dough, pasta necklaces, peanut-butter bird feeders), flag common allergens in Safety Notes and offer swaps (sunflower butter for peanut butter, gluten-free pasta).
- **Supervision needs** — hot glue, oven-bake clay, sharp scissors, sewing needles marked "adult-operated" or "1:1 supervision" in Safety Notes.
- **Budget / junk drawer** — restrict to paper, tape, glue, crayons/markers, household recyclables. See `references/substitutions.md`.
- **Classroom scale (≥10 kids)** — include a prep-at-scale note: what to pre-cut, pre-sort, or station ahead of time so activity fits one class period.
- **Impossible constraints** — "craft in 2 minutes for 30 kids" or "craft with no supplies" — propose the closest achievable alternative and name the conflict in one sentence.
- **Time mismatch** — if the natural project takes 45 min but user has 15 min, offer a simplified version or split into two sessions.
- **Mixed ages** — anchor on the youngest child; add an "older sibling / older students" variation.

## Evals

See `evals/evals.json` — 5 prompts with objective assertions covering the 11 required sections, age calibration, scissor-free constraints, supply-constraint adherence, visual-cue formatting, and recycled-materials themes.
