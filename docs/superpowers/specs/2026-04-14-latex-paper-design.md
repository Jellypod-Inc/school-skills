# latex-paper — Skill Design

**Date:** 2026-04-14
**Author:** Pierson + Claude
**Status:** Draft pending user review
**Parent spec:** `2026-04-14-marketplace-design.md`

## 1. Purpose

Scaffold a LaTeX document — paper, problem set, lab report, or take-home exam — and compile it to PDF using the correct template for the target venue. The skill owns the full loop: pick a template, generate the outline, fill sections, optionally build a BibTeX file, compile, read the log on failure, fix, and recompile. Output is a ready-to-submit `.tex` + `.pdf` pair (plus assets and optional `.bib`) that the user can edit further or hand in as-is.

## 2. Triggers

Target phrasings from grad students, professors, science students, and K-12 teachers. Example phrases:

1. "Write a LaTeX paper on transformer attention mechanisms."
2. "Generate a problem set with 10 calculus problems for my Calc I class."
3. "Draft an IEEE conference paper outline on edge caching."
4. "Make a lab report template for my chem 101 titration experiment."
5. "Create a take-home midterm for linear algebra, 6 problems, 90 minutes."
6. "Build an APA-style research paper on social media and adolescent mental health."
7. "Give me a beamer slide deck for my thesis defense."
8. "Compile this .tex file to PDF."
9. "Turn these notes into an ACM SIG paper draft."
10. "Generate a 20-problem algebra worksheet with answer key for 8th graders in LaTeX."
11. "Write a thesis chapter skeleton with citations from my .bib file."
12. "MLA-format English paper on Hamlet, 5 pages, with works-cited."

## 3. Inputs

- **Document type** (required): `paper` | `problem-set` | `lab-report` | `take-home-exam` | `slides` | `thesis-chapter`.
- **Target venue / style**: IEEE (IEEEtran), ACM (acmart), APA (apa7), MLA (mla package), generic `article` + `amsmath`, K-12 math problem-set template, Beamer themes.
- **Topic / outline**: short topic string OR a structured outline (section headings + bullets) OR pasted notes / draft text.
- **Required sections** (optional override): e.g. "Abstract, Intro, Related Work, Method, Experiments, Conclusion."
- **Citation list** (optional): raw BibTeX, list of DOIs/URLs, or author-year strings. Skill generates a `.bib` if needed.
- **Figures** (optional): image paths or descriptions; skill places `\includegraphics` stubs and writes alt captions.
- **Math content**: LaTeX source blocks OR natural-language problem descriptions that the skill typesets.
- **Grade / level**: K-2, 3-5, 6-8, 9-12, college, grad (affects template choice and calibration).
- **Length target** (optional): page count, word count, or problem count.

## 4. Outputs

- `paper.tex` (or `problem-set.tex`, `lab-report.tex`, etc.) — fully compilable source.
- `paper.pdf` — compiled via `shared/scripts/latex_compile.py`.
- `references.bib` — if citations were supplied or generated.
- `figures/` — subdirectory with any included assets.
- `answer-key.pdf` — for problem sets and take-home exams, separate PDF.
- Compile log on failure, with the skill's interpretation and fix applied.

All outputs land in a single timestamped folder so the user can `cd` in and re-run themselves.

## 5. Workflow

1. **Clarify inputs** — document type, venue, grade/level, and any missing required fields (topic, section list, problem count).
2. **Pick template** — map venue → template file (see section 7). Copy from `shared/templates/` into output folder.
3. **Generate outline** — produce section list appropriate to doc type + venue. Confirm with user if ambiguous.
4. **Fill sections** — write each section, respecting venue conventions (IEEE two-column, APA running head, MLA no title page, etc.).
5. **Citations** — if references supplied, build `.bib` and insert `\cite{}` calls; otherwise skip.
6. **Figures** — emit `\includegraphics` stubs with captions; leave TODO markers if images not yet provided.
7. **Compile** — call `shared/scripts/latex_compile.py <file.tex>`. Capture exit code + log.
8. **On error** — parse log, identify missing package / undefined control sequence / unbalanced brace / bibliography issue. Fix the `.tex`. Recompile. Retry up to 3 times; escalate to user with a diagnostic on final failure.
9. **Problem sets / exams** — compile twice, once with and once without `\answerkey` toggle, producing two PDFs.
10. **Report** — summarize to user: files produced, page count, any TODOs left in the source.

## 6. Bundled scripts

- **`shared/scripts/latex_compile.py`** — runs compilation. Tries `tectonic` first (self-contained, downloads packages on demand). Falls back to `pdflatex` + `bibtex` + `pdflatex` x2 if tectonic is missing. Returns structured `{status, pdf_path, log, errors[]}`.
- **`shared/templates/paper.tex`** — generic article skeleton with `amsmath`, `hyperref`, `graphicx`.
- **`shared/templates/problem-set.tex`** — numbered problem environment, answer-key toggle, large-font option for K-12.
- **Skill-specific**: no additional scripts in V1. Problem generation stays in the prompt (the model is good at math problem authoring; no script needed). Revisit in V2 if we see flaky math generation.

## 7. References (loaded on demand)

- **`references/template-map.md`** — venue → template file mapping:
  - IEEE → `IEEEtran` document class.
  - ACM → `acmart` (sigconf, manuscript, etc.).
  - APA → `apa7`.
  - MLA → `article` + `mla` package or custom MLA style.
  - Generic → `article` + `amsmath` + `hyperref`.
  - K-12 math problem set → in-house `problem-set.tex`.
  - Slides → `beamer` with `metropolis` or `Madrid` theme.
- **`references/math-typesetting.md`** — cheat sheet for common math constructs: aligned equations, cases, matrices, derivatives, integrals, proof environments.
- **`references/common-pitfalls.md`** — unescaped `%`/`_`/`&`/`#`, missing `\usepackage`, file-not-found, undefined citation, underfull hbox, encoding issues (UTF-8 vs T1), `\\` vs `\newline`.
- **`references/bibtex-patterns.md`** — `@article`, `@inproceedings`, `@book`, `@misc`, `@techreport`; how to handle URLs, DOIs, arXiv IDs; `biblatex` vs classic `bibtex`.
- **`references/graphics.md`** — `\includegraphics` sizing, `figure` environments, sub-figures, captions, vector vs raster, when to use TikZ.
- **`references/venue-conventions.md`** — IEEE two-column + author block, ACM concept codes + CCS, APA running head + keywords, MLA no title page + header with surname + page.

## 8. Grade / level calibration

- **K-2 / 3-5** — problem sets only: 18-24pt font, one problem per quarter page, simple numbering (1, 2, 3), answer key on separate page, no LaTeX math complexity beyond `\frac{}{}` and basic arithmetic.
- **6-8** — standard 12pt font, introduce algebraic notation, 10-20 problems per sheet, answer key separate.
- **9-12** — 11pt, full algebra / geometry / pre-calc notation, optional hints box, worked-solutions PDF option.
- **College (lab reports, term papers)** — `article` or APA/MLA as specified, ~5-15 pages, figures + references expected.
- **Grad (papers, thesis snippets)** — venue-exact formatting (IEEE/ACM), author block, bibliography, figure/table numbering, optional appendix.
- **Thesis chapter** — scaffolded chapter file that can be `\input{}` into a master thesis; follows university-common conventions (memoir or report class).

## 9. Evals

Five test prompts in `evals/evals.json`; each with 3-5 objective assertions.

1. **IEEE paper outline** — "Generate an IEEE conference paper on transformer attention with 4 sections."
   - `.tex` compiles exit 0.
   - `.pdf` exists and is non-empty.
   - `\documentclass{IEEEtran}` present.
   - Contains `\section{Introduction}`, `\section{Related Work}`, `\section{Method}`, `\section{Conclusion}` (or equivalents).

2. **K-12 problem set** — "10-question algebra problem set for 8th grade."
   - `.tex` compiles exit 0.
   - `.pdf` exists.
   - Problem count = 10 (regex `\\problem` or numbered list length).
   - Answer-key PDF exists as separate file.
   - Font size >= 12pt in preamble.

3. **APA research paper** — "APA paper on social media and adolescent mental health, 5 pages, with 5 citations."
   - Compiles exit 0.
   - Uses `apa7` class.
   - `.bib` present with ≥5 entries.
   - `\cite` count ≥5.

4. **Chem lab report** — "Lab report template for titration experiment."
   - Compiles exit 0.
   - Sections: Abstract, Introduction, Materials, Procedure, Results, Discussion, References.
   - Has at least one `figure` environment stub.

5. **Beamer defense deck** — "Thesis defense slide deck, 12 slides, on graph neural networks."
   - Compiles exit 0.
   - `\documentclass{beamer}` present.
   - Frame count = 12 (regex `\\begin{frame}` == 12).

## 10. Edge cases

- **Compile errors** — parse log, match known patterns (missing package, undefined citation, runaway argument), fix in source, recompile. Retry ≤3 then escalate with log excerpt.
- **Missing LaTeX packages** — tectonic downloads on demand; pdflatex fails. If pdflatex route, suggest `tlmgr install <pkg>` in the error message.
- **tectonic unavailable** — `latex_compile.py` detects absence and falls back to `pdflatex`. If neither present, emit clear install instructions (`brew install tectonic` on macOS, apt/yum equivalents on Linux) and still produce the `.tex` source.
- **Non-English text** — use `\usepackage[utf8]{inputenc}` and `\usepackage[T1]{fontenc}`. For CJK / Arabic / Cyrillic, switch to XeLaTeX / LuaLaTeX and `fontspec`.
- **Inline vs display math** — `$...$` for inline, `\[...\]` or `equation` for display. Never `$$...$$` (deprecated in LaTeX2e).
- **Author blocks** — IEEE uses `\author{\IEEEauthorblockN{...}}`, ACM uses `\author{}` + `\affiliation{}`, APA uses `\author` + `\affiliation`. Get right per template.
- **Long author lists** — `et al.` handling differs per style; follow venue bib style.
- **Problem-set answer key** — must be a separate PDF, not the last page, so teachers can hand out without redacting.
- **Figures not provided** — insert placeholder `example-image-a` (standard LaTeX demo image) so doc still compiles; mark as TODO.
- **Huge documents** — thesis-length compiles can take minutes; stream progress, don't block silently.

## 11. Open questions

1. **Compiler default**: tectonic (self-contained, embeds fonts, ~100MB binary, easy install) vs pdflatex (relies on user's TeX Live install, ~4GB, but already present on many academic machines). **Proposed default**: tectonic with pdflatex fallback. Confirm with user before V1 ship.
2. **Template storage**: keep templates in `shared/templates/` (monorepo-friendly) or inline in `references/*.md` (more discoverable to model)? Leaning `shared/templates/`.
3. **BibTeX vs biblatex**: biblatex is more powerful but requires biber. IEEE/ACM still expect classic bibtex. Propose: match venue convention automatically.
4. **Problem-set authoring**: keep in prompt (current plan) or add `problem_set_generator.py` helper that enforces structure (problem number, points, space-for-work, answer-key toggle)? Defer to implementation; add script only if prompt output is inconsistent across evals.
5. **Thesis templates**: do we ship any university-specific thesis classes (MIT, Stanford, etc.) or stay generic? Propose generic-only in V1, community-contributed packs in V2.
6. **OS coverage**: tectonic works on macOS/Linux/Windows; `latex_compile.py` should be cross-platform. Confirm Windows path handling in tests.
