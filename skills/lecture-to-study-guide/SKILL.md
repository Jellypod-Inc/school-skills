---
name: lecture-to-study-guide
description: Turns raw class material — pasted notes, slide-deck PDFs, or class transcripts — into a 7-section study guide (outline, key terms, concept summaries, Mermaid diagrams, worked examples, 10-20 practice questions, one-page cheat sheet). USE THIS SKILL when a student says "turn my notes into a study guide," "summarize this lecture for the test," "make a study guide from these slides," "I have a transcript from class, help me review," "convert this PDF of my bio lecture into a study guide," "here's a YouTube lecture transcript, extract the key points," "make me practice questions from this chapter," "I need a cheat sheet for tomorrow's exam from these notes," "help me review — I'll paste my lecture notes," OR when a teacher says "make a study guide for my students from this lecture," "build a review handout from my slide deck," "give my class a review sheet from these notes." Accepts pasted text, PDF uploads (Claude-native PDF handling), VTT/SRT/plaintext transcripts, and multi-lecture series. Calibrates depth to grade 6-8, 9-12, college (default), or graduate. Output: markdown study guide; optional PDF.
license: MIT
---

# lecture-to-study-guide

Produce a pedagogically structured study guide from lecture material — not a summary, a study-optimized document.

## When to use this skill

Trigger on any phrase pairing lecture material + a study/review/exam goal. Concrete cues:

**Student voice (lead — higher frequency):**
- "turn my notes into a study guide"
- "summarize this lecture for the test"
- "make a study guide from these slides"
- "I have a transcript from class, help me review"
- "convert this PDF of my [subject] lecture into a study guide"
- "here's a YouTube lecture transcript, extract the key points"
- "make me practice questions from this chapter"
- "I need a cheat sheet for tomorrow's exam from these notes"
- "help me review — I'll paste my lecture notes"

**Teacher voice:**
- "make a study guide for my students from this lecture"
- "build a review handout from my slide deck"
- "give my class a review sheet from these notes"

## Inputs

Required:
- **Source material** — pasted text, PDF, or transcript. May be messy.

Optional (infer if absent — see table below):
- **Subject + level** — for calibration (6-8 / 9-12 / college / graduate).
- **Source type** — pasted prose notes / slide deck / transcript / multi-lecture / mixed.
- **Exam format** — MCQ / essay / problem-set — biases question mix.
- **Target length** — default: proportional to input.

## Inferring level and source-type from phrasing (before asking)

Attempt inference first. Ask ONLY if both level AND source-type are unclear.

| Cue in user's phrasing | Likely level |
|---|---|
| "my 7th grader," "middle school," emoji, simple vocab | 6-8 |
| "AP ___," "honors," "SAT prep," "high school" | 9-12 |
| "my professor," "syllabus," "midterm," "lecture hall," "TA," intro-course names ("intro micro," "bio 101") | college (default) |
| "my PI," "qualifying exam," "seminar," "dissertation," advanced domain vocabulary | graduate |
| No markers, just raw notes | infer from vocabulary density; default college |

| Cue in user's phrasing | Likely source-type |
|---|---|
| "my notes," "typed up," "outline" | pasted prose notes |
| ".pdf," "slides," "deck," "slideshow," "lecture slides" | slide-deck PDF |
| "transcript," "YouTube," "recording," "VTT," "SRT," "captions," "Otter," "Zoom transcript" | transcript |
| Multiple files listed, "weeks 1-3," "chapters 4-6," "my last three lectures" | multi-lecture series |
| Both a slide deck AND a transcript mentioned | mixed slide + transcript |

If confidence is still low on BOTH dimensions, ask ONE question in this exact shape:

> Quick check so I can calibrate this — (a) what's the level (e.g. **7th · 11th · college · grad**), and (b) is this pasted notes, a slide deck, or a transcript?

Do not stack questions. Do not ask about exam format, length, framework, etc.

## Workflow

1. **Ingest.** Detect input type. Normalize PDFs and transcripts to plaintext-with-structure-markers (slide boundaries, speaker turns, heading lines).
2. **Detect structure.** Find natural segmentation: markdown/outline headings, slide boundaries, topic shifts in transcripts, paragraph breaks. See `references/input-types.md`.
3. **Extract terms.** Use heuristics in `references/term-extraction.md` — typographic (bold/italic/"quotes"), structural (slide titles, definition blocks), linguistic ("X is defined as…", "Y, also known as…"). Build a term → definition → source-location map.
4. **Group topics.** Cluster concepts into 3-8 topic groups. Prefer source-provided groupings (slide sections, chapter headings) over model-imposed ones.
5. **Generate practice questions.** Mix by level and exam format. Default by level: see table. See `references/question-mix.md` for templates.
6. **Assemble** the 7-section markdown guide per `references/output-format.md`. Validate: all sections present, TOC anchors resolve, Mermaid blocks syntactically valid.
7. **Offer follow-ups** — optional PDF export and the closing suggestion: "Run the `flashcards` skill on this guide next for Anki-ready decks." Do NOT auto-invoke sibling skills.

## Output

Single markdown file `study-guide-<topic-slug>-<YYYY-MM-DD>.md` with these sections, in order:

1. **Outline / Table of Contents** — hierarchical, anchor links.
2. **Key Terms + Definitions** — glossary table, columns: Term | Definition | Source (slide #, timestamp, or heading).
3. **Concept Summaries** — one subsection per topic group, 2-5 short paragraphs each (SQ3R framing).
4. **Diagrams** — Mermaid blocks where content warrants. Inline; do NOT call a separate concept-map skill in V1.
5. **Worked Examples** — step-by-step solutions for quantitative/procedural content. Use LaTeX math (`$...$`, `$$...$$`).
6. **Practice Questions** — 10-20 questions, mixed types. Answers in `<details>` blocks per question (default) or a trailing answer-key section (for printable/PDF output).
7. **Cheat-Sheet One-Pager** — ~1 printed page. Most-testable facts, formulas, top 5 terms. Cornell-style (cue / note + synthesis).

## Grade/level calibration

| Level | Scaffolding | Question mix (recall/comprehension/application) | Cheat-sheet style |
|---|---|---|---|
| 6-8 | Heavy. Plain-language definitions for every term. Short sentences. Diagrams liberally. | 60 / 30 / 10 | Large type, spatial layout |
| 9-12 | Moderate. Define technical terms, assume general vocabulary. | 40 / 40 / 20 | Dense but still visual |
| College (default) | Terse. Assumes college vocabulary. | 30 / 40 / 30 | Information-dense single column |
| Graduate | Terse. Reminder-level summaries. Assumes domain vocabulary. | 20 / 30 / 50 | Formula/theorem-dense |

Exam-format adjustments (stack onto grade default): MCQ-heavy → +10% recall, −10% application. Essay → +15% comprehension, −15% recall. Problem-set → +20% application, −10% recall, −10% comprehension.

## Input handling

PDF and transcript ingestion is currently handled by Claude directly; dedicated parsers (`pdf_extract.py` for slide-boundary-sensitive decks, `transcript_clean.py` for VTT/SRT normalization) are planned. For V1, rely on Claude-native PDF and do the transcript cleanup in-prompt (strip timing noise, merge fragmented caption lines, preserve speaker labels if present). See `references/input-types.md` for per-input-shape workflow.

## References (loaded on demand)

- `references/study-techniques.md` — Cornell, SQ3R, Feynman patterns; informs cheat-sheet layout and concept-summary structure.
- `references/term-extraction.md` — term-identification heuristics + decision table.
- `references/question-mix.md` — question-type taxonomy, grade-calibrated ratios, templates.
- `references/input-types.md` — per-input-shape workflow (slide-heavy vs prose-heavy vs transcript vs mixed); slide-vs-prose heuristics.
- `references/output-format.md` — exact markdown skeleton + conventions.

Load a reference only when its topic is active. Do not preload all references at the start.

## Locked defaults

| Setting | Default |
|---|---|
| Level | College (unless inferred otherwise) |
| Source-type | Infer from phrasing + content |
| Question mix | Per grade-calibration table |
| Answer-key style | `<details>` blocks per question (switch to trailing answer key on PDF/printable request) |
| Diagrams | Inline Mermaid |
| Flashcards / concept-map | **NOT auto-invoked in V1.** Suggest running the `flashcards` skill as a follow-up. |
| Output | Markdown file in user's cwd |
| PDF export | On request only, via `shared/scripts/pdf_render.py` |

## Micro-example

**User:** "Turn these into a study guide — 10th grade bio, cell division. [pastes ~1500 words on mitosis]"

**Inferred:** level 9-12 (explicit "10th grade"), source-type pasted prose notes. No clarifying question needed.

**Skill responds** with a file starting:

```markdown
# Study Guide: Mitosis & Cell Division

_Generated 2026-04-14 from pasted lecture notes. Level: 9-12._

## 1. Outline
- [2. Key Terms](#2-key-terms)
- [3. Concept Summaries](#3-concept-summaries)
  - [3.1 Phases of Mitosis](#31-phases-of-mitosis)
  - [3.2 Cytokinesis](#32-cytokinesis)
...

## 2. Key Terms

| Term | Definition | Source |
|---|---|---|
| Prophase | First phase of mitosis; chromatin condenses into visible chromosomes and the nuclear envelope breaks down. | Heading: Phases |
| Metaphase | Chromosomes align along the cell's equator, attached to spindle fibers at the centromere. | Heading: Phases |

...

## 6. Practice Questions

1. During which phase of mitosis do chromosomes align at the cell's equator? *(Term: metaphase)*

   <details><summary>Answer</summary>
   Metaphase.
   </details>

2. Explain why the spindle apparatus is essential for mitosis. If it failed to form, what would happen? *(Concept: spindle)*

   <details><summary>Answer</summary>
   The spindle pulls sister chromatids apart during anaphase. Without it, chromosomes cannot separate evenly, producing daughter cells with the wrong chromosome count (aneuploidy).
   </details>
```

Full 7-section guide follows; cheat sheet is ≤ 700 words for grade 9-12. Closing suggestion: *"Run the `flashcards` skill on this file to generate Anki-ready cards from the Key Terms and Practice Questions."*

## Edge cases

- **Very short input (<500 words):** produce a proportionally shorter guide; reduce practice-question count to 5-8. Do not pad.
- **Very long input (>20k words):** warn the user, offer to split. Otherwise chunk by section and synthesize a top-level Outline + Cheat Sheet.
- **Slides with no surrounding prose:** elaborate bullets into concept summaries; mark model-added content with `(expansion)` so the student sees what came from the slide vs. what was filled in.
- **Transcript with no speaker labels:** treat as monologue. Do not invent speakers.
- **Scanned/OCR'd notes:** flag uncertainty. Ask the user to verify Key Terms before finalizing.
- **Non-English content:** respect source language; generate guide in source language unless translation is requested.
- **Math/science heavy:** preserve equations in LaTeX. Worked examples show intermediate steps. Prefer Mermaid for conceptual flow; fall back to prose description for geometry/waveforms.
- **Multi-lecture series:** ask once whether to produce a unified guide or a per-lecture set (default: unified with per-lecture H3 subsections). De-duplicate Key Terms across lectures.

## V1 non-goals (V2+)

- Auto-invocation of `flashcards` or `concept-map` skills. V1 embeds inline Mermaid; flashcards are suggested as a follow-up, not generated inline.
- Bundled `pdf_extract.py` / `transcript_clean.py` parsers. Claude-native handling for now.
- Explicit translation flag.
- "Quiz mode" output (questions-only); punt to `quiz-generator`.

## Quality bar

Every generated guide must satisfy:

- All 7 numbered sections present and non-empty.
- Key Terms table ≥ 5 rows (target: 8-20 for a 45-min lecture).
- Practice Questions meet the minimums in `references/question-mix.md` (5-8 for <500 words, 10-15 for 500-5000, 15-20 for >5000 or multi-lecture).
- At least one Mermaid diagram (unless content is fundamentally non-diagrammable — in which case include a one-line justification).
- TOC anchor links resolve.
- LaTeX for math (never unicode substitution for operators).
- Cheat sheet ≤ 500 words (college/grad) or ≤ 700 words (6-8/9-12).
- Grade-band calibration applied to vocabulary, scaffolding, and question mix.

## What NOT to do

- Do not auto-invoke sibling skills (`flashcards`, `concept-map`, `quiz-generator`). Suggest, don't invoke.
- Do not fabricate content not supported by the source. Mark any model elaboration beyond the literal source with `(expansion)`.
- Do not over-summarize. This is a study guide, not a recap — keep Key Terms, Worked Examples, and Practice Questions substantive even if summaries are terse.
- Do not skip Worked Examples for quantitative material, even if the source only shows final answers — derive the steps.
