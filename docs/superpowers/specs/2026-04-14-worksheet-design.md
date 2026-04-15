# Worksheet Skill — Design Spec

**Date:** 2026-04-14
**Skill:** `worksheet`
**Status:** Draft pending user review
**Parent:** `docs/superpowers/specs/2026-04-14-marketplace-design.md`

## 1. Purpose

Generate printable PDF worksheets for classroom, homeschool, and tutoring use — every worksheet ships as a student copy plus a teacher answer key. Covers math drill, reading comprehension, fill-in-the-blank, word problems, and mixed-review formats across grades K-12. Optimized for "print and hand out" — deterministic PDF output via `shared/scripts/pdf_render.py`, calibrated to grade level, and brandable for teachers who want their name/class on the page. Fills the daily "I need 20 problems for tomorrow morning" slot that teachers and homeschool parents spend the most time on.

## 2. Triggers

Example phrases the skill must recognize (mix of teacher, parent, homeschool, tutor):

1. "Make me 20 long-division problems for 4th grade."
2. "I need a reading comprehension worksheet on the water cycle for 3rd grade."
3. "Build a fill-in-the-blank vocab worksheet for my Spanish 2 class — 15 items."
4. "Mixed-review math worksheet: fractions, decimals, percentages, 6th grade, one page."
5. "Homeschool mom here — can you make a handwriting worksheet for my kindergartener?"
6. "Print a word-problems page for 2nd-grade addition, 10 problems with picture hints."
7. "Generate a two-page practice set on the Pythagorean theorem with an answer key."
8. "ESL adult learner at A2 — reading comprehension about ordering at a restaurant."
9. "Can I get a coloring-math hybrid for 1st grade: color by sum?"
10. "Make a weekly spelling worksheet with my class name 'Room 12' in the header."
11. "Tutor needs an algebra warm-up: 8 one-step equations, 9th grade."
12. "Worksheet for my dyslexic student: bigger font, fewer problems, same topic as the class."

## 3. Inputs

Required:
- **Topic or skill**: free-text (e.g., "long division", "main-idea reading comp", "subject-verb agreement", "-ar verb conjugation").
- **Grade or level**: K, 1-12, college, or CEFR (A1-C2) for language worksheets.
- **Number of problems**: integer; skill suggests a default per grade if omitted (see §8).

Optional:
- **Style**: `mixed-review` | `focused-drill` | `word-problems` | `fill-in-blank` | `reading-comp` | `handwriting` | `coloring-math-hybrid`.
- **Branding**: teacher name, class name, school name, date line, student name line, optional logo path.
- **Layout**: `one-column` | `two-column`, page size `Letter` (default US) or `A4`.
- **Font size**: `auto` (default, grade-calibrated) | `small` | `medium` | `large` | `huge`.
- **Include visuals**: boolean — number-line art, picture hints, diagrams (for K-3 and word problems).
- **Language**: English default; Spanish, French, bilingual side-by-side also supported.
- **Accommodations**: `fewer-per-page`, `extra-spacing`, `dyslexia-friendly-font` (OpenDyslexic), `bilingual`.
- **Source material**: pasted reading passage, uploaded PDF, URL, or photo (for reading comp or when teacher wants to align to a specific text).

## 4. Outputs

Primary:
- **Student PDF** — printable, page size Letter (default) or A4, with header (title, name line, date line, optional branding) and numbered problem list. Saved to working dir as `<topic>-<grade>-student.pdf`.
- **Teacher answer-key PDF** — same layout but with answers filled in, plus a final "teaching notes" page summarizing common mistakes and talking points. Saved as `<topic>-<grade>-answer-key.pdf`.

Optional (on request):
- **Google Docs–compatible HTML** (`.html` file styled to paste cleanly into Docs for teachers who prefer to edit).
- **Markdown source** for transparency / remixing.
- **Combined PDF** (student + key stapled into one file).

Layout:
- **One-column** — default for word problems, reading comprehension, handwriting.
- **Two-column** — default for math drill, vocab, fill-in-the-blank. Dense, fits 20-30 items per page.
- **Header block** — title, class/teacher name (if provided), name/date lines, directions line.
- **Footer block** — page number, skill name, "Generated with school-skills" (toggleable).
- **Answer-key layout** — mirrors student layout; answers in red/bold inline or right-aligned.

## 5. Workflow

1. **Parse request** — extract topic, grade, count, style, layout, branding, accommodations. Infer missing fields from context or prompt user for just the blockers.
2. **Load reference** — pull the appropriate template guide from `references/` (e.g., `math-drill.md`, `reading-comp.md`) based on style.
3. **Generate problems** — produce N problems + answers as structured data (JSON array: `{ prompt, answer, hint?, visual? }`). For math, optionally call a deterministic generator script (see §6). For reading comp, generate/select passage first, then questions.
4. **Calibrate** — verify problem count, difficulty, and vocabulary match grade level (see §8). Retry if miscalibrated.
5. **Fill HTML template** — render problems into `shared/templates/worksheet.html` (or skill-specific variant) with branding, layout, and font size. Produce two HTML files: student and answer key.
6. **Render PDF** — call `shared/scripts/pdf_render.py <html> <output.pdf> --page-size Letter` for each.
7. **Verify** — check file exists, page count is reasonable, problem count matches request (parse PDF text or count from source JSON).
8. **Report** — print file paths, problem count, page count, and a preview snippet to the user.

## 6. Bundled Scripts

### Shared
- **`shared/scripts/pdf_render.py`** — HTML → PDF via headless Chromium (Playwright) or WeasyPrint fallback. Flags: `--page-size {Letter,A4}`, `--margin`, `--landscape`, `--output`. Used unchanged by this skill.
- **`shared/templates/worksheet.html`** — base Jinja template with slots for header, problem list, footer, and CSS variables for font size, column count, spacing. Skill-specific templates extend this.

### Skill-specific (`skills/worksheet/scripts/`)
- **`generators/math.py`** — deterministic problem generators for arithmetic, long division, fractions, decimals, percentages, one-step and two-step equations, Pythagorean, area/perimeter. Each function takes `grade`, `count`, `seed` and returns `[{prompt, answer}]`. Used for focused-drill math to guarantee valid, solvable problems.
- **`generators/language.py`** — conjugation tables, vocab-list sampling, fill-in-blank scaffolding for Spanish/French/German/ESL.
- **`generators/reading.py`** — passage selector (grade-leveled Lexile bands) + question-type templates (main idea, inference, vocabulary-in-context, detail).
- **`templates/`** — HTML partials:
  - `math-drill.html` (two-column, compact)
  - `word-problems.html` (one-column, spacious, visual slots)
  - `reading-comp.html` (passage box + numbered questions)
  - `handwriting.html` (dotted-line primary-rule paper)
  - `coloring-math.html` (grid with color key, simple sums per cell)
- **`build_answer_key.py`** — takes the student problems JSON + template and renders the paired answer-key PDF with a "teaching notes" appendix.

## 7. References

Loaded on demand via progressive disclosure (`skills/worksheet/references/*.md`):

- **`layouts.md`** — when to pick one-column vs two-column, header spacing, print-safety margins, duplex printing considerations.
- **`math-drill.md`** — arithmetic through algebra II: how many problems per page by grade, common pitfalls, mixed-review recipes.
- **`word-problems.md`** — structure (setup → question), picture-hint guidance for K-3, real-world contexts by grade.
- **`reading-comp.md`** — Lexile bands by grade, passage length, question-type distribution (main idea, inference, detail, vocab).
- **`handwriting.md`** — letter-formation order, primary-rule vs single-rule paper, tracing vs independent, D'Nealian vs Zaner-Bloser.
- **`coloring-math-hybrid.md`** — color-by-sum, color-by-number, color-by-shape grids for K-2.
- **`language-worksheets.md`** — ESL/foreign-language drill patterns: conjugation tables, sentence-transformation, cloze, matching.
- **`accommodations.md`** — dyslexia-friendly formatting, ELL scaffolds, IEP-style reduced-load worksheets, enlarged print.
- **`branding.md`** — header recipes, logo placement, classroom-style decorative borders (optional, off by default).

## 8. Grade/Level Calibration

| Grade | Default count | Font size | Problems/page | Visual aids | Style defaults |
|-------|---------------|-----------|----------------|-------------|----------------|
| K | 6-8 | Huge (24-28pt) | 4-6 | Heavy (pictures, dotted lines) | Handwriting, coloring-math, count-and-circle |
| 1-2 | 10-12 | Large (18-22pt) | 8-12 | Frequent (picture hints, number lines) | Focused drill + picture word problems |
| 3-5 | 15-20 | Medium (14-16pt) | 15-25 | Moderate (diagrams for geometry, fractions) | Mixed review, word problems, reading comp |
| 6-8 | 20-25 | Medium (12-14pt) | 20-30 | As needed | Mixed review, multi-step word problems |
| 9-12 | 15-25 | Standard (11-12pt) | 20-40 | Minimal (graphs, diagrams) | Focused drill, proof/show-work |
| College | 10-20 | Standard (11pt) | As needed | Minimal | Problem sets (often better served by `latex-paper`) |
| CEFR A1 | 8-10 | Large (16pt) | 8-12 | Heavy (images, cognates) | Vocab + simple fill-in-blank |
| CEFR A2-B1 | 10-15 | Medium (12-14pt) | 12-20 | Moderate | Cloze, dialogue completion, short reading |
| CEFR B2-C2 | 10-15 | Standard (11-12pt) | 15-20 | Minimal | Authentic-text reading comp, transformation |

Problem complexity rules:
- K-2 math: single-digit, no regrouping below 1st grade.
- 3-5 math: multi-digit arithmetic, basic fractions, whole-number word problems.
- 6-8 math: pre-algebra, ratios, one/two-step equations, integers.
- 9-12 math: algebra I/II, geometry proofs, trig basics.
- Reading vocabulary must match grade-level word lists (Dolch, Fry, Lexile targets); skill warns and recalibrates if a generated passage exceeds target band.

## 9. Evals (`skills/worksheet/evals/evals.json`)

Each eval runs the skill with a prompt and checks assertions against the output files + structured generation log.

1. **"Generate 20 long-division problems for 4th grade."**
   - PDF file `*-student.pdf` exists.
   - Answer-key PDF exists and has page count ≥ student PDF.
   - Student PDF contains exactly 20 numbered problems (parse text).
   - All divisors are ≤ 2 digits, dividends are 3-4 digits (4th-grade calibration).
   - Answer-key numeric answers match student problems when recomputed.

2. **"ESL reading comprehension for an A2 adult learner — topic: ordering at a restaurant."**
   - Student PDF exists; contains a passage followed by ≥5 numbered questions.
   - Passage word count between 80 and 160 (A2 band).
   - At least one vocabulary-in-context question and one detail question.
   - Answer-key contains answers for every question.
   - No words above B1 complexity flagged by vocabulary checker.

3. **"Two-column mixed-review math worksheet for 6th grade, 24 problems: fractions, decimals, percents."**
   - Student PDF is one page, two-column layout.
   - Problem count = 24.
   - Contains ≥6 fraction, ≥6 decimal, ≥6 percent problems (keyword/parse check).
   - Answer-key page count = 1.

4. **"Kindergarten handwriting worksheet: lowercase 'a' with tracing and name header."**
   - PDF exists, single page.
   - Primary-rule lines visible (HTML/CSS class check).
   - Font size in student PDF ≥ 24pt equivalent.
   - Name/date header block present.
   - Answer-key output is suppressed or marked N/A (handwriting has no key).

5. **"Pythagorean theorem practice for 9th grade, 10 problems, teacher name 'Ms. Rivera, Room 14', Letter size."**
   - Student PDF exists; header contains "Ms. Rivera" and "Room 14".
   - Problem count = 10; each has a right-triangle diagram slot or side-length labels.
   - Answer-key answers are numeric and match `a² + b² = c²` recomputation within 0.01.
   - Page size is US Letter (8.5 × 11 in).

Minimum 3/5 assertions per eval must pass to mark eval green; all 5 evals must be green for skill to ship.

## 10. Edge Cases

- **Very young learners (PreK-K)**: need image-heavy worksheets. If `grade=K` and style is drill or word problem, default to `include_visuals=true` and use `coloring-math-hybrid` or picture-count templates. Flag if request asks for 30 problems at K — propose 6-8 instead.
- **Bilingual worksheets**: side-by-side two-column (L1 left / L2 right). Trigger on "bilingual", "Spanish and English", "dual language". Requires both languages in prompt; if one is ambiguous, ask.
- **Accommodations (IEP/504, dyslexia, vision)**: accept `--accommodations` hints. Auto-apply fewer problems per page, larger font, OpenDyslexic font, extra spacing, off-white background (paper tint via CSS). Never reduce *content rigor* — only formatting.
- **Reading passages from copyrighted sources**: if user pastes a copyrighted passage, use it as-is for the teacher's own classroom. If user asks the skill to invent a passage "from" a copyrighted book, generate an original passage in the style of the topic instead and note the substitution.
- **Math with non-integer answers**: round to grade-appropriate precision (K-5 integers; 6-8 up to 2 decimals; 9-12 exact form like `√2` or `3π`).
- **Long worksheets (>2 pages)**: automatically paginate and repeat the header on each page. Warn user if >4 pages — likely over-ordered.
- **Print-safety**: all templates enforce ≥0.5" margins, avoid full-bleed color, and use black-and-white-safe color choices for the color-math hybrid.
- **Empty or underspecified topic**: ask one clarifying question, not a wall of questions. Prefer "What grade?" over a form.
- **Unsupported requests** (video worksheets, interactive digital worksheets): decline and suggest `quiz-generator` for digital or clarify that V1 is print-only.

## 11. Open Questions

1. **PDF rendering engine**: Playwright (better CSS fidelity, heavier dep) vs WeasyPrint (lighter, limited modern CSS). Decision lives in `shared/scripts/pdf_render.py` — defer to that script's spec. Worksheet needs custom fonts and good typography, so leaning Playwright.
2. **Bundled fonts**: do we ship OpenDyslexic + a primary-rule handwriting font + a math-symbol font with the plugin (license size) or fetch at runtime?
3. **Stock imagery for K-3 word problems and coloring-math**: bundle a small SVG library vs call `shared/scripts/image_fetch.py` at runtime? Leaning bundled SVG for determinism and offline use.
4. **Math problem-generator breadth**: V1 generators cover arithmetic → algebra I. Do we include geometry proofs and trig in V1, or defer to V2?
5. **Answer-key format**: inline (answers printed on the student page, cut-off line) vs separate PDF (default). Should we offer both?
6. **Google Docs HTML export**: is this worth shipping in V1, or wait for teacher demand signal?
7. **Curriculum alignment**: should worksheets optionally tag to Common Core / state standards codes (e.g., "4.NBT.B.6" in the footer)? Low effort if `lesson-plan` already owns the standards reference data.
8. **Repeatability/seeding**: expose `--seed` so a teacher can regenerate the same worksheet next year? Low cost, high teacher delight.
9. **Batch mode**: "make me 5 different versions for 5 table groups" — is this a flag on this skill or a separate workflow?
10. **Branding images (school logos)**: accept local file path only (V1) or also URL fetch?
