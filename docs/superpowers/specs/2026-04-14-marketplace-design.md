# School Skills Marketplace — Master Design

**Date:** 2026-04-14
**Author:** Pierson + Claude
**Status:** Draft pending user review

## Purpose

Build a high-quality Claude Code plugin that bundles 13 skills purpose-built for educators and students across K-12, college, and graduate levels. Distribute primarily through the Claude Code plugin marketplace (non-techie friendly: one-click install), with `npx` as a secondary channel.

## Audience

Hybrid — both teachers and students. Elementary teachers included (crafts, arts, circle-time). Skills organized by **technique/subject**, not by audience, because the techniques generalize across who uses them.

## Non-goals

- A web UI. Skills run inside Claude Code / Claude Desktop.
- Subject-specific pedagogy skills beyond what's in V1 (e.g. "physics-solver," "chemistry-balancer"). Defer to V2 once we see adoption.
- LMS integrations (Google Classroom, Canvas). V2+.
- Authentication, payments, user accounts. None needed — skills run locally in the user's Claude Code session.

## Distribution

### Primary: Claude Code plugin marketplace

One mega-plugin named `school-skills` that contains all 13 skills.

Install flow:
```
/plugin marketplace add jellypod/school-skills
/plugin install school-skills
```

**Why one plugin vs. 13:** Non-techie users install once and get the full toolkit. Simpler mental model, easier to update, avoids dependency graphs across skills that share `shared/scripts/*`.

### Secondary: npx

```
npx school-skills install            # installs all skills to ~/.claude/skills/
npx school-skills install flashcards # single skill
```

Ships via `bin/install.js` which copies skill directories into the user's Claude skills directory.

## Repo structure

```
school-skills/
├── .claude-plugin/
│   ├── plugin.json                       # single plugin manifest
│   └── marketplace.json                  # marketplace manifest (self-hosted)
├── README.md                             # install instructions, skill catalog
├── package.json                          # npx secondary distribution
├── bin/install.js                        # `npx school-skills install ...`
├── shared/
│   ├── scripts/
│   │   ├── pdf_render.py                # HTML/markdown → PDF (worksheets, coloring pages)
│   │   ├── latex_compile.py             # LaTeX → PDF via tectonic or pdflatex
│   │   ├── anki_export.py               # .apkg generator for flashcards
│   │   └── image_fetch.py               # stock images for worksheets/coloring
│   └── templates/
│       ├── worksheet.html
│       ├── coloring-page.html
│       ├── paper.tex                    # LaTeX article template
│       └── problem-set.tex
├── skills/
│   ├── flashcards/
│   │   ├── SKILL.md
│   │   ├── scripts/                     # skill-specific scripts (symlinks or copies of shared/)
│   │   ├── references/                  # per-skill docs loaded on demand
│   │   └── evals/evals.json
│   ├── quiz-generator/
│   ├── worksheet/
│   ├── lesson-plan/
│   ├── rubric/
│   ├── socratic-tutor/
│   ├── latex-paper/
│   ├── lecture-to-study-guide/
│   ├── concept-map/
│   ├── language-drill/
│   ├── coloring-page/
│   ├── arts-crafts/
│   └── circle-time/
└── docs/superpowers/specs/               # this directory
    ├── 2026-04-14-marketplace-design.md  # this doc
    ├── 2026-04-14-flashcards-design.md
    ├── 2026-04-14-quiz-generator-design.md
    └── ... (one per skill)
```

## Quality bar — every skill must satisfy

1. **Pushy descriptions.** Trigger on phrasings from both teachers ("make me 20 worksheet problems on long division") and students ("help me study for my spanish test"). Descriptions are ~60-80 words, list concrete trigger phrases.

2. **Progressive disclosure.** `SKILL.md` under 300 lines. Details (grade-level calibration tables, output format specs, edge cases) live in `references/*.md` loaded on demand.

3. **Bundled scripts for deterministic output.** Anything with a fixed output format (PDF rendering, LaTeX compilation, .apkg generation, SVG→PNG coloring pages) is a script in `scripts/`, not a prompt that reinvents the wheel. The skill instructs the model to call the script.

4. **Evals.** Each skill ships ≥5 test prompts in `evals/evals.json`. Objective assertions where possible (file exists, N questions generated, valid LaTeX compiles, Anki file parseable).

5. **Input flexibility.** Accept: a topic string, pasted notes, a URL, a photo of textbook/handout, a PDF upload. SKILL.md documents which inputs are supported per skill.

6. **Output formats documented.** Every SKILL.md includes an "Output" section listing exact formats (e.g. flashcards: CSV, .apkg, Quizlet TSV, markdown table).

7. **Grade-level awareness.** Every skill accepts a grade level (K-2, 3-5, 6-8, 9-12, college, grad) or subject-specific level (language: A1-C2). Calibrates vocabulary, difficulty, and examples.

8. **Safety.** Age-appropriate content filter for elementary skills (coloring-page, arts-crafts, circle-time). No PII in flashcards/quizzes unless user explicitly provides it.

## V1 skill catalog

### Cross-subject techniques (9)

1. **flashcards** — Generate flashcard decks from notes, textbook chapters, or topic. Outputs: CSV, Anki `.apkg`, Quizlet TSV, markdown. Supports cloze and front/back in V1; image-occlusion deferred unless trivial.

2. **quiz-generator** — Multiple choice, short answer, true/false, cloze, matching, essay. Outputs: markdown with answer key, Google Forms–importable CSV, printable PDF.

3. **worksheet** — Printable PDF worksheets with answer key. Math, reading comprehension, fill-in-the-blank, mixed formats. Uses `shared/scripts/pdf_render.py`.

4. **lesson-plan** — Standards-aligned lesson plans (Common Core, NGSS, state standards, IB). Takes topic + grade + duration. Outputs: markdown with objectives, materials, procedure, assessment, differentiation.

5. **rubric** — Build rubrics from assignment prompts. Holistic or analytic, 3-6 criteria, 3-5 performance levels, aligned to Bloom's or DOK. Outputs: markdown table, CSV, printable PDF.

6. **socratic-tutor** — Tutoring mode that never gives direct answers. Takes student question + subject, asks guiding questions, calibrates to apparent understanding level. No bundled scripts — prompt-heavy.

7. **latex-paper** — Generate LaTeX papers, problem sets, lab reports. Templates for IEEE/ACM/APA/MLA and K-12 math problem sets. Uses `shared/scripts/latex_compile.py`.

8. **lecture-to-study-guide** — Convert lecture notes, transcripts, or slide decks into a study guide with outline, key terms, diagrams, practice questions. Input: pasted text, PDF, transcript.

9. **concept-map** — Produce mind maps / concept maps in Mermaid, Graphviz DOT, or Markmap format. Takes topic or source text, outputs graph + rendered PNG/SVG.

### Subject/age-specific (4)

10. **language-drill** — Vocabulary drilling, verb conjugation, dialogue practice. Languages: Spanish, French, German, Italian, Portuguese, Mandarin, Japanese, Korean, Arabic, Russian, ESL. Calibrated to CEFR (A1-C2). Outputs: flashcards (via flashcards), drill sets, conversation practice scripts.

11. **coloring-page** — SVG coloring pages by theme/age. Ages 2-10. Uses `shared/scripts/pdf_render.py` to produce printable PDF. Black-and-white line art only; simple shapes for younger ages.

12. **arts-crafts** — Craft project plans: supply list, step-by-step instructions, photos (optional stock), safety notes, mess level, prep time, skill level. Age-appropriate (K-5 default).

13. **circle-time** — Morning meeting / circle-time plans for PreK-2: greeting, song, story, movement activity, closing. Includes song lyrics (public domain or original), story suggestions, transition tips.

## Build plan

1. **Master spec (this doc)** — ✅ done, committed.
2. **Per-skill specs** — 13 short specs (~1 page each) written in parallel via subagents. Saved to `docs/superpowers/specs/2026-04-14-<skill>-design.md`.
3. **Per-skill implementation plans** — invoke `/writing-plans` per skill (parallelizable via subagents or ralph-loop).
4. **Implementation** — build skills in parallel via subagent-driven-development. Order of priority: flashcards → quiz-generator → worksheet → remainder.
5. **Evals** — each skill runs evals before being marked complete.
6. **Marketplace manifest** — write `plugin.json` + `marketplace.json`, test install flow.
7. **npx installer** — `bin/install.js`, test `npx school-skills install`.
8. **README** — non-techie install guide with screenshots.

## Repo strategy — monorepo now, graduation path later

V1 lives in **one repo** (`school-skills`) as one mega-plugin. Simpler for non-techie distribution and cross-skill shared scripts.

Longer term, individual skills may graduate to their own open-source repos when they're substantial enough to be products on their own — typically when they have:

- A non-trivial script/library worth versioning independently (e.g. an SVG coloring-page library, a LaTeX template collection, an Anki deck builder CLI).
- A user community that could contribute upstream (content packs, language packs, template packs).
- A clear product identity beyond "Claude skill" (CLI, web UI, API).

**Graduation mechanism:** extract the skill into `github.com/jellypod/<skill-name>`, publish as its own npm package or Python package, and keep a thin wrapper skill in `school-skills` that depends on it. The mega-plugin still installs the skill; the heavy logic lives upstream.

Likely V2 graduation candidates (flagged but NOT decided now):
- `flashcards` (Anki export library → standalone CLI)
- `latex-paper` (template collection → standalone repo)
- `coloring-page` (SVG library → community-contributed pack)

Most skills (socratic-tutor, rubric, lesson-plan, circle-time, etc.) are prompt-heavy and stay in the mega-plugin indefinitely.

**Goal:** build open-source AI tooling for education. The mega-plugin is the distribution surface; some underlying libraries may become their own OSS projects over time.

## Locked defaults (resolved 2026-04-14)

The following defaults are locked across per-skill specs:

| Area | Default |
|------|---------|
| LaTeX compiler | tectonic (self-contained), pdflatex fallback |
| Rubric framework | Bloom's taxonomy (DOK available via flag) |
| PDF render engine | Playwright-based `shared/scripts/pdf_render.py` |
| Coloring-page line art | Bundled public-domain SVG library (generated SVG deferred) |
| Language-drill V1 languages | Spanish, French, German, Italian, Portuguese, Mandarin, Japanese, Korean, Arabic, Russian, ESL (11 total) |
| Lesson-plan pedagogy | Gradual Release (I do / we do / you do) + UDL differentiation |
| Cross-skill delegation | None in V1 — skills embed sub-outputs inline (no auto-invoke of flashcards/concept-map from other skills) |
| Socratic session ceiling | No hard cap; skill offers exit after ~10 turns |
| Circle-time song lyrics | Original lyrics set to public-domain tunes (no copyrighted lyrics) |

## Open questions (deferred to per-skill specs)

- Exact model prompts for each skill (handled in skill draft).
- Which rubric framework is default (Common Core, DOK, Bloom's, IB)?
- Language list for `language-drill` — which languages in V1 vs V2?
- Stock image source for `arts-crafts` and `worksheet` — bundled SVGs vs runtime fetch?
- LaTeX compiler — tectonic (self-contained) vs pdflatex (requires TeX Live).

These get resolved in individual skill specs.

## Success criteria for V1

- All 13 skills ship with SKILL.md + evals passing.
- One-command install works: `/plugin install school-skills` from marketplace.
- Non-techie can follow README and install without terminal knowledge.
- `school-skills` appears in `/plugin` list with all 13 skill descriptions.
- Test user (a teacher who is not a developer) can generate a flashcard deck, a quiz, and a worksheet within 10 minutes of installing.
