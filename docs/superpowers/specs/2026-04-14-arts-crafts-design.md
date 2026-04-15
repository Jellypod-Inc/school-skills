# arts-crafts — Skill Design Spec

**Date:** 2026-04-14
**Author:** Pierson + Claude
**Status:** Draft pending user review
**Parent spec:** [2026-04-14-marketplace-design.md](./2026-04-14-marketplace-design.md)

## 1. Purpose

Help elementary teachers and parents plan craft activities without hunting Pinterest. Given a theme or occasion, `arts-crafts` produces a complete craft project plan — supply list, step-by-step instructions, safety notes, mess level, prep time, and cleanup — calibrated to the age of the child or class. Default audience is K-5 (ages 5-10); PreK (2-4) supported explicitly.

The skill replaces the "what can we make today with what we have?" question with a ready-to-run plan a non-crafty adult can execute.

## 2. Triggers

Description should fire on phrasings from both teachers and parents:

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

## 3. Inputs

- **Theme / occasion** — free-text (holiday, season, book, unit topic, animal, concept).
- **Age band** — `2-4` (PreK / toddler), `5-7` (K-2), `8-10` (3-5). Defaults to `5-7` if unspecified.
- **Group size** — single child, small group (2-6), classroom (15-30). Affects supply quantities and prep instructions.
- **Time budget** — total available time in minutes (prep + activity). Default 30 min activity.
- **Available supplies** — optional constraint list. E.g. `"only construction paper and glue"` or `"no scissors"` or `"recycled materials only"`.
- **Mess tolerance** — `low` / `medium` / `high`. Drives material choices (markers vs. paint, dry vs. wet glue, glitter yes/no).
- **Seasonal / calendar context** — if user mentions a holiday or month, skill auto-tags seasonal and may suggest timely themes.
- **Setting** — home vs. classroom. Affects prep-at-scale guidance and cleanup expectations.

## 4. Outputs

**Primary:** markdown project plan with these sections (all required unless noted):

1. **Project Name** — one line, kid-friendly.
2. **Age Range** — e.g. "Ages 5-7 (K-2)".
3. **Time** — prep time + activity time separately.
4. **Skill Level** — beginner / intermediate / advanced (calibrated to age band).
5. **Mess Level** — low / medium / high, with one-line reason.
6. **Supply List** — bulleted, with quantities per child. Includes common substitutions ("white glue or glue stick"; "construction paper or cardstock").
7. **Step-by-Step Instructions** — numbered, short sentences. Each step includes a **visual-description cue** in italics (e.g. _"Fold the paper in half like a book"_) so non-crafty adults can picture it without photos.
8. **Safety Notes** — scissors, hot glue, small parts, food allergens, supervision required.
9. **Variations / Extensions** — 2-3 ways to adapt up/down in difficulty or extend the activity.
10. **Cleanup Tips** — specific to the materials used.
11. **Learning Connections** — what skill or concept this reinforces (fine motor, symmetry, color mixing, storytelling, pattern recognition, seasonal vocabulary, etc.).

**Optional secondary output:** printable PDF of the project plan (via `shared/scripts/pdf_render.py`) for classroom posting or parent handouts.

## 5. Workflow

1. **Parse inputs** — extract theme, age, constraints, mess tolerance, time budget.
2. **Select project concept** — draw from an internal reference catalog of tested classroom-friendly projects (by season / theme / age) plus LLM generation for novel themes. Catalog entries act as anchors and constrain hallucinated or unsafe projects.
3. **Match constraints** — filter by supplies available, mess tolerance, time budget, group size. If constraints conflict (e.g. "no scissors" + "paper snowflakes"), propose an alternative that meets the constraints.
4. **Write instructions at age-appropriate reading level** — short sentences for younger ages, more detail and multi-step for 8-10. Instructions target the adult leading the activity, not the child.
5. **Safety check** — cross-reference the safety catalog in `references/safety.md`. Flag or modify any step that conflicts with age-appropriate safety guidance (sharp scissors below age 5, hot glue unsupervised, small parts for under 4, food allergens).
6. **Render output** — markdown plan; PDF on request.

## 6. Bundled scripts

None skill-specific. Uses `shared/scripts/pdf_render.py` for printable output when requested.

Stock photography is **not** bundled in V1 (see open questions).

## 7. References (loaded on demand)

- `references/safety.md` — safety catalog. Scissors minimum age by type (safety scissors age 3+, sharp scissors age 8+), hot glue always adult-operated, small parts (<1.25" diameter) unsafe under age 3, common food allergens in edible crafts (peanut, tree nut, wheat, dairy, egg), paint types (washable vs. acrylic), choking-hazard material list.
- `references/catalog.md` — project catalog by season (fall, winter, spring, summer) and theme (holidays, animals, nature, friendship, numbers, letters). Each entry: name, age band, supplies, mess level, learning connection. ~80-120 anchor projects at launch.
- `references/fine-motor.md` — age-to-fine-motor-skill mapping. What a 3-year-old can physically do (tear, stick, finger-paint, large brush strokes) vs. a 7-year-old (cut on a line, fold a square, thread a large needle) vs. a 10-year-old (multi-step assembly, origami, basic sewing, small details).
- `references/substitutions.md` — common supply substitution guide. Glue stick ↔ white glue ↔ tape. Construction paper ↔ cardstock ↔ paper bag. Markers ↔ crayons ↔ colored pencils. Pipe cleaners ↔ yarn ↔ string.

## 8. Age calibration

| Age band | Motor skills | Example activities | Avoid |
|---|---|---|---|
| **2-4 (PreK / toddler)** | Large-motor, pincer grasp developing. Tear, stick, finger-paint, stamp, dip. | Handprint turkeys, torn-paper collages, finger-paint leaves, sticker scenes. | Scissors (except blunt safety scissors with close supervision), small parts, hot glue, small beads. |
| **5-7 (K-2)** | Cut-and-paste on lines, simple folds, hold a brush. | Paper-plate animals, simple origami (dog head, tulip), folded greeting cards, pipe-cleaner creatures, cut-and-glue dioramas. | Sharp craft knives, hot glue unsupervised, fine sewing needles. |
| **8-10 (3-5)** | Multi-step sequences, precision cutting, basic measuring. | Multi-step origami (crane, boat), basic sewing (felt plushies with plastic needles), weaving, papier-mâché, simple bookbinding. | Rotary cutters, power tools, solvent-based adhesives. |

## 9. Evals

5 test prompts in `evals/evals.json`, each with 3-5 objective assertions.

1. **"craft for pre-k about fall leaves"** — output includes all 11 required sections; age range includes 2-4; supply list non-empty; no scissors listed for unsupervised use; safety notes present.
2. **"thanksgiving class craft for 2nd grade, no scissors"** — instructions contain zero references to cutting with scissors; group-size guidance for 20+ students; mess level stated; prep time stated.
3. **"craft using only construction paper and glue"** — supply list contains only construction paper, glue, and pencil (or noted substitutions); instructions achievable with constraint; cleanup tips appropriate to dry materials.
4. **"simple paper craft I can do with my 5 year old"** — age range 5-7; instruction count ≤ 8 steps; reading level appropriate; includes visual-description cues in italics.
5. **"earth day classroom craft, recycled materials, 3rd grade"** — supply list features recycled/upcycled items; learning connection references environmental concept; age range includes 8-10; variations section present.

Additional assertions applied across all: safety notes section is non-empty; all 11 required sections present; no copyrighted character names in project titles.

## 10. Edge cases

- **Allergies** — edible crafts (salt dough, peanut-butter bird feeders, pasta necklaces) flag common allergens. Default to non-food variants. If user explicitly asks for edible, include allergen warning and suggest swaps (sunflower butter for peanut butter, gluten-free pasta).
- **Supervision needs** — hot glue, oven-bake clay, sharp scissors, and sewing needles are flagged as "adult-operated" or "requires 1:1 supervision" in safety notes.
- **Budget constraints** — if user specifies "no budget for supplies" or "what's in the junk drawer," restrict to paper, tape, glue, crayons/markers, household recyclables.
- **Multi-student classroom** — for group size ≥ 10, output includes a "prep-at-scale" note: what to pre-cut, pre-sort, or station-ize ahead of time so activity runs in one class period.
- **Impossible constraints** — "craft with no supplies" or "craft in 2 minutes for 30 kids" → skill proposes the closest achievable alternative and explains the constraint conflict.
- **Time mismatch** — if requested project normally takes 45 min but user gave 15 min, skill offers a simplified version or splits into two sessions.

## 11. Open questions

- **Stock photography** — should the skill fetch stock images of finished crafts (via `shared/scripts/image_fetch.py`) or leave photos to the teacher? V1 leaning toward **no photos**, rely on text-based visual-description cues in each step. Stock photos of finished projects are often misleading (source materials differ) and teacher photos of their own class output are more useful.
- **Copyrighted characters** — requests like "Elsa craft" or "Bluey birthday craft" should be handled how? V1 proposal: politely redirect to the underlying theme ("ice / snowflake craft," "blue dog craft") and avoid generating instructions that infringe. Document this behavior in the skill description so it's not surprising.
- **Age overlap** — when a request spans ages (e.g. "craft for my kids ages 3 and 7"), do we output two variants of the same project or one project that works for both? V1 proposal: one project anchored on the younger child with a "for older siblings" variation.
- **Seasonal auto-tagging** — should the skill look up today's date (given in context) and proactively suggest seasonal themes when unspecified, or stay neutral? V1 proposal: neutral by default, but mention current season as a suggestion.
