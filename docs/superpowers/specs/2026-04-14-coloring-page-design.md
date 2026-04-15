# coloring-page — Design Spec

**Date:** 2026-04-14
**Author:** Pierson + Claude
**Status:** Draft pending user review
**Parent:** `2026-04-14-marketplace-design.md`

## 1. Purpose

Generate printable, black-and-white SVG coloring pages calibrated to a child's age. Built for elementary teachers assembling theme packs (e.g. "dinosaur week," "letter of the week") and for parents who need a quiet-time printable in under a minute. Output is a classroom-ready PDF — no coloring app, no digital fill, just paper and crayons.

## 2. Triggers

Skill description should fire on both teacher and parent phrasings:

- "coloring page for dinosaurs"
- "easter coloring sheets for my kindergarten class"
- "simple coloring page for my 3-year-old"
- "alphabet coloring pack for kindergarten"
- "ocean animals coloring book, ages 5-7"
- "printable coloring sheet with my kid's name on it"
- "make 10 farm-animal coloring pages"
- "number coloring pages 1-10 for preschool"
- "thanksgiving coloring sheet"
- "space coloring pages, intricate, for 9-year-olds"
- "I need a quick coloring printout for my toddler"
- "transportation-themed coloring pack, letter size"

## 3. Inputs

- **Theme / topic** (required) — free-form string. Examples: "dinosaurs," "sea creatures," "letter A," "winter holidays," "trucks."
- **Age band** (required, default 5-7) — one of `2-4`, `5-7`, `8-10`. Drives complexity calibration (see §8).
- **Count** (optional, default 1) — number of pages. Count > 1 produces a multi-page pack (single PDF, one page each).
- **Text overlay** (optional) — letters, numbers, or a short name (<12 chars) rendered as outline text on the page. Useful for "alphabet pack" or personalized pages ("For Emma").
- **Page size** (optional, default `Letter`) — `Letter` (8.5×11 in) or `A4`.
- **Orientation** (optional, default `portrait`) — `portrait` or `landscape`.
- **Title** (optional) — printed at top of page. Defaults to the theme, title-cased.

## 4. Outputs

Three artifacts per generation, written to the working directory:

- `{slug}.svg` — editable, scalable source vector. Single-page pack only (multi-page packs emit one SVG per page).
- `{slug}.png` — rasterized preview at 300dpi for quick visual check.
- `{slug}.pdf` — printable PDF rendered via `shared/scripts/pdf_render.py`. Multi-page packs produce a single PDF with N pages.

**Filename convention:** `coloring-{theme-slug}-{age-band}[-{index}].{ext}`
Examples:
- `coloring-dinosaurs-5-7.pdf`
- `coloring-alphabet-2-4-03.svg` (page 3 of an alphabet pack)
- `coloring-emma-ocean-5-7.pdf` (name overlay "Emma," theme "ocean")

## 5. Workflow

1. **Parse inputs** — extract theme, age band, count, overlay, page size.
2. **Resolve line art** — look up matching asset(s) in the bundled SVG library (§6). Fall back to parametric composition (simple shape primitives arranged by theme rules) if no asset matches.
3. **Scale complexity to age** — strip detail layers for 2-4, keep base strokes for 5-7, add detail layers for 8-10 (see §8).
4. **Compose the page** — arrange line art on a page-sized SVG canvas: optional title at top, optional text overlay, art centered with safe margins (0.5 in all sides).
5. **Render SVG → PNG** — for preview.
6. **Compose PDF** — pass SVG(s) to `shared/scripts/pdf_render.py` which embeds them at correct page size. Multi-page packs: pass the list, get one PDF.
7. **Report back** — list the three output paths and a one-line description.

## 6. Bundled scripts

Lives at `skills/coloring-page/scripts/`:

- `compose_coloring_page.py` — main entry point. Takes theme/age/count/overlay/size, resolves assets, composes SVG(s), invokes `shared/scripts/pdf_render.py` for the final PDF. Exposes a clean CLI so the skill prompt calls it deterministically.
- `svg_library.py` — index/loader for the bundled asset library (see §6.5). Maps theme keywords → asset files with tags (age-appropriate, complexity level).

Shared dependencies:
- `shared/scripts/pdf_render.py` — SVG/HTML → PDF.
- `shared/templates/coloring-page.html` — HTML shell wrapping the SVG for the PDF renderer (handles page size, margins, title band, footer).

## 6.5 Source of line art — critical open question

Three candidate strategies; recommendation is **(A) bundled library** for V1.

**(A) Bundled public-domain SVG library** *(recommended V1)*
`skills/coloring-page/assets/svg/` ships with a curated set organized by theme:
- `animals/` (farm, ocean, jungle, pets, dinosaurs, insects)
- `vehicles/` (cars, trucks, planes, boats, trains)
- `letters/` (A-Z, decorative outline style)
- `numbers/` (0-9)
- `seasonal/` (halloween, thanksgiving, winter-holidays, easter, spring)
- `characters-generic/` (robots, astronauts, princesses, pirates, unicorns — *never* copyrighted IP)
- `shapes/` (primitive building blocks for parametric composition)

Each asset has a companion `meta.json`: `{ tags, min_age, max_age, complexity: low|medium|high }`. Pros: deterministic, clean vectors, no copyright risk, no model drift. Cons: coverage is finite — unusual themes require fallback.

**(B) Claude generates SVG on the fly**
Pros: infinite themes. Cons: high risk of broken/non-printable vectors, jittery strokes, filled regions instead of line art, inconsistent line weight. Would require a strict validator (SVG has only `stroke` paths, no `fill` except `none`/`white`, stroke-width within bounds) and a retry loop. Not recommended as the *primary* source but acceptable as a last-resort fallback with validation.

**(C) Fetch from a public source** (e.g. Openclipart, Wikimedia Commons)
Adds network dependency and licensing/attribution complexity. Defer to V2.

**V1 decision (to confirm with user):** ship (A) as primary, with (B) gated behind a `--allow-generated` flag and an SVG-sanity validator.

## 7. References

Loaded on demand from `skills/coloring-page/references/`:

- `age-calibration.md` — line thickness, closed-shape requirements, shape-count targets per age band. Toddler rule: lines ≥ 3pt, all regions fully enclosed (no "open" areas where crayon bleeds off the shape), no feature smaller than ~0.75 in.
- `safe-content.md` — age-appropriate theme guidelines. Explicit ban on copyrighted characters (Disney, Pokémon, Marvel, Nintendo, etc.) — always redirect to generic equivalents ("generic princess," "friendly dragon," "space explorer"). Ban on weapons, violence, scary imagery for ages 2-7; muted allowance for 8-10 (e.g. "knight with sword" OK, realistic firearms never).
- `theme-catalog.md` — full enumeration of themes the bundled library covers, with synonyms ("ocean" = "sea" = "underwater"). Helps the model map user language to asset tags.
- `svg-style-guide.md` — the visual style bundled assets must conform to (stroke-only, 2-4pt line weight, no gradients, no text inside art, safe margins).

## 8. Age calibration

| Age band | Shapes/page | Line weight | Detail | Text overlay |
|----------|-------------|-------------|--------|--------------|
| **2-4** (toddler/PreK) | 3-6 big bold closed shapes | 3-4pt | None. Large, simple, friendly. Every region fully enclosed. | Single letter or number at most. |
| **5-7** (K-2) | 10-20 shapes, medium detail | 2-3pt | Some facial features, basic patterns (stripes, spots). | Short word OK (name, "APRIL"). |
| **8-10** (3-5) | 20+ shapes, intricate allowed | 1.5-2.5pt | Fine detail, scenes, mandala-style backgrounds, multiple subjects. | Full title + short phrase OK. |

Rule: when in doubt, err simpler. An over-simple page is usable; an over-complex one frustrates the child.

## 9. Evals

`skills/coloring-page/evals/evals.json` — 5 prompts, objective assertions:

1. **"Coloring page for dinosaurs, age 5-7"**
   - PDF file exists at expected path.
   - PDF has exactly 1 page.
   - SVG contains no `fill` attributes other than `none` or `white`.
   - Filename slug contains `dinosaur`.

2. **"Simple coloring page for my 3-year-old, theme: farm animals"**
   - Age band resolved to `2-4`.
   - SVG shape count ≤ 6 (matches toddler calibration).
   - All stroke widths ≥ 3pt.

3. **"Alphabet coloring pack for kindergarten, letters A through E"**
   - PDF has 5 pages.
   - Each page's SVG contains the correct letter as a text overlay.
   - Filename slug contains `alphabet`.

4. **"Intricate space coloring page for a 9-year-old with 'For Leo' on it"**
   - Age band resolved to `8-10`.
   - SVG contains text overlay with exact string "For Leo".
   - SVG shape/path count ≥ 20.

5. **"Easter coloring sheets, 3 pages, letter size"**
   - PDF has 3 pages.
   - Page size in PDF metadata is US Letter (8.5×11 in).
   - Theme `easter` detectable in filename.

## 10. Edge cases

- **Copyrighted characters** — user asks for "Elsa," "Mickey Mouse," "Pikachu," etc. Refuse the specific character, offer a generic substitute ("friendly snow princess," "cartoon mouse," "electric mouse creature"). Document the substitution in the reply.
- **Inappropriate themes for age band** — user asks for "gun coloring page for my 4-year-old." Refuse for elementary ages; offer alternative. For 8-10, evaluate against §7 `safe-content.md` rules.
- **Unknown theme** — theme has no matching assets in the bundled library. Ask user whether to (a) use a nearest-neighbor theme ("I have 'jungle animals' — use that?"), or (b) enable generated-SVG fallback with validation (`--allow-generated`). Never silently produce a blank page.
- **Non-English text overlay** — supported for Latin-script languages via the same text-outline path. Accented characters (á, ñ, ü) must render correctly — include coverage in the bundled font.
- **RTL text overlay** (Arabic, Hebrew) — requires right-aligned text placement and a font with RTL script support. V1: supported for short overlays (name/word) only; flag as limited in docs. Full RTL layout deferred to V2.
- **Very long name overlay** — truncate to 12 characters with a warning. Long strings break page composition.
- **Landscape orientation on tiny themes** — scale art to fit without stretching; letterbox with blank margin rather than distort.

## 11. Open questions

- **Line-art source strategy** — confirm (A) bundled library as V1 primary. If (B) generated SVG is allowed as fallback, what validator do we ship? Proposed rules: SVG must contain only `<path>` / `<circle>` / `<rect>` / `<polygon>` elements; `fill` must be `none` or `white`; stroke width within [1.5, 4] pt; no `<image>` embeds; total path count within age-band bounds. Retry up to 2× on validation failure.
- **Asset library seed size** — how many SVGs for V1? Proposal: 50-80 across the 6 theme buckets in §6.5. Enough to cover common classroom themes without ballooning repo size.
- **Contribution path** — if `coloring-page` graduates to its own repo (flagged in master spec), do we accept community-submitted SVGs? Would need a style-guide check + license audit on intake.
- **Font choice for text overlay** — need a font with (a) outline-friendly rendering, (b) Latin + extended Latin coverage, (c) permissive license for bundling. Candidates: Fredoka (SIL OFL), Comic Neue (OFL), Poppins (OFL). Pick one, bundle it.
- **Coloring book mode** — should count ≥ 10 also generate a simple cover page? Low priority; defer unless user asks.
