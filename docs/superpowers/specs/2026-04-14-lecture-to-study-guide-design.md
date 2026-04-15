# lecture-to-study-guide — Design Spec

**Date:** 2026-04-14
**Author:** Pierson + Claude
**Status:** Draft pending user review
**Parent spec:** [2026-04-14-marketplace-design.md](./2026-04-14-marketplace-design.md)

## 1. Purpose

Turn raw class materials — lecture notes, slide decks, recorded-class transcripts — into compact, study-optimized guides. Serves two primary users:

- **Students** cramming for an exam who have a messy pile of notes, a YouTube transcript, or a PDF slide export and need a structured review document.
- **Teachers** who want to hand students a polished study guide after delivering a lecture, without spending an evening reformatting their own notes.

The skill's job is to do the pedagogical restructuring that a good tutor would do: find the structure, surface the key terms, generate practice questions calibrated to the material, and produce a one-pager cheat sheet. It is explicitly not a summarizer — summarization is one output among many.

## 2. Triggers

SKILL.md description must fire on all of these phrasings (student- and teacher-voiced):

1. "turn my notes into a study guide"
2. "summarize this lecture for the test"
3. "make a study guide from these slides"
4. "I have a transcript from class, help me review"
5. "convert this PDF of my bio lecture into a study guide"
6. "my professor posted the slides — can you make something I can study from?"
7. "here's a YouTube lecture transcript, extract the key points"
8. "build a review sheet from these three lectures"
9. "make me practice questions from this chapter"
10. "I need a cheat sheet for tomorrow's exam from these notes"
11. "create a study guide with diagrams from my econ notes"
12. "help me review — I'll paste my lecture notes"

Description should lead with the student-voice phrasings (higher frequency, higher intent) and include at least two teacher-voice phrasings.

## 3. Inputs

Accepted input forms:

- **Pasted text** — lecture notes, outlines, rough typed notes (messy OK).
- **PDF upload** — lecture slide decks (slide-per-page), scanned handwritten notes (OCR-dependent), textbook chapter PDFs. Leverage Claude's native PDF handling first; fall back to bundled `pdf_extract.py` only if native handling loses structure (e.g. slide decks where layout matters).
- **Transcript** — YouTube auto-captions (VTT/SRT/plaintext), Otter/Zoom/Teams transcripts, recorded-class transcripts with or without speaker labels and timestamps.
- **Multi-file input** — series of lectures (e.g. "Weeks 1–4 of Organic Chemistry"). Skill concatenates with clear lecture-boundary markers and produces either a unified guide or a per-lecture guide set (user choice).
- **Mixed input** — e.g. slide PDF + transcript of the same lecture. Skill cross-references slides as skeleton and transcript as prose elaboration.

Metadata the skill should elicit (politely, once, if not provided):

- Course subject + grade/level (for calibration — see §8).
- Exam format if known (MCQ-heavy vs essay vs problem-set) — biases the practice-question mix.
- Target study-guide length (default: proportional to input).

## 4. Outputs

Primary output: a single **markdown study guide** with the following sections, in order:

1. **Outline / Table of Contents** — hierarchical, links to section anchors.
2. **Key Terms + Definitions** — glossary-style table, one row per term, with the source location (slide #, timestamp, or note heading) where it appeared.
3. **Concept Summaries** — one subsection per major topic, 2–5 short paragraphs each, structured around the source's own headings/slide groupings.
4. **Diagrams** — Mermaid diagrams (flowcharts, sequence diagrams, mind maps) where the content warrants them. Delegates to patterns from the `concept-map` skill; does not re-derive.
5. **Worked Examples** — for quantitative/procedural content (math, coding, lab procedure), fully-solved examples with annotated steps.
6. **Practice Questions** — 10–20 questions, mix of recall (definitions, identification), comprehension (explain, compare), and application (solve, predict, apply). Answer key at the end of the section, hidden behind a `<details>` tag.
7. **Cheat-Sheet One-Pager** — distilled review sheet, ~1 printed page: most-testable facts, key formulas, decision trees, top 5 terms. Intended to be printable standalone.

### Optional / delegated outputs

- **PDF export** — renders markdown guide via `shared/scripts/pdf_render.py`. Opt-in via user request or flag.
- **Anki flashcard CSV** — calls out to patterns from the `flashcards` skill (front/back + cloze rows derived from Key Terms and Practice Questions). Whether this is an inline delegation or an invitation to "run the flashcards skill next" is an **open question** — see §11.
- **Per-lecture split guides** — for multi-file input, one guide per lecture in addition to (or instead of) the unified guide.

Output file naming convention: `study-guide-<topic-slug>-<YYYY-MM-DD>.md` in the user's current working directory by default.

## 5. Workflow

1. **Ingest** — detect input type (pasted text / PDF / transcript / multi-file). Normalize to plaintext-with-structure-markers.
2. **Detect structure** — find natural segmentation signals:
   - Markdown or outline headings in pasted notes.
   - Slide boundaries in PDF slide decks (typically `Slide N` or page breaks).
   - Timestamps and speaker turns in transcripts.
   - Paragraph breaks + heading-like lines in prose notes.
3. **Extract concepts + terms** — pull defined terms (look for "X is defined as…", "The term Y refers to…", boldface, terms followed by a definition in parentheses, slide-title-as-term patterns). Build a term→definition→source-location map.
4. **Group topics** — cluster extracted concepts into 3–8 topic groups. Prefer source-provided groupings (slide sections, chapter headings) over model-imposed ones.
5. **Generate practice questions** — mix by target exam format (default: 40% recall, 35% comprehension, 25% application). Source each question from a specific section/term so questions trace to the material.
6. **Format** — assemble the markdown guide per §4. Validate structure (all sections present, TOC links resolve, Mermaid diagrams syntactically valid).
7. **(Optional) Post-process** — PDF render, flashcard CSV, etc. based on user request.

## 6. Bundled scripts

Location: `skills/lecture-to-study-guide/scripts/`

- **`pdf_extract.py`** (optional) — pdfplumber-based text + layout extractor for slide-deck PDFs where Claude's native PDF handling loses the slide-boundary structure. Outputs plaintext with `--- slide N ---` separators and preserves bullet hierarchy. **Decision pending (see §11):** first implementation should try Claude-native PDF and only bundle this script if evals show native handling is insufficient for slide decks.
- **`transcript_clean.py`** — normalizes VTT/SRT/Otter/Zoom transcripts:
  - Strips timing noise ("Speaker 1 00:04:23.112"), keeps clean speaker labels if present.
  - Merges fragmented auto-caption lines into full sentences.
  - Optionally preserves timestamps at paragraph boundaries for cross-reference.
- **Shared scripts reused:** `shared/scripts/pdf_render.py` for markdown→PDF export. No new PDF rendering logic.

No LaTeX compilation, no .apkg generation bundled here — those delegate to `latex-paper` and `flashcards` respectively.

## 7. References

Loaded on demand from `skills/lecture-to-study-guide/references/`:

- **`study-techniques.md`** — Cornell-notes layout, SQ3R (Survey, Question, Read, Recite, Review), Feynman-technique patterns. Used to inform the Cheat-Sheet One-Pager layout and the structure of Concept Summaries.
- **`term-extraction.md`** — heuristics for identifying defined terms: typographic signals (bold, italics, "quotes"), structural signals (slide titles, definition blocks), linguistic signals ("X is a Y that…", "Y, also known as…"). Includes a decision table for when a noun phrase is term-worthy vs incidental.
- **`question-mix.md`** — taxonomy of question types for study guides:
  - Recall: "Define X," "List the three stages of Y."
  - Comprehension: "Explain why Z happens," "Compare A and B."
  - Application: "Given [scenario], predict…," "Solve…"
  - Default mix ratios by exam-format input.
- **`input-types.md`** — how to handle each input shape:
  - Slide-heavy decks → treat slide titles as topic seeds, bullets as concept atoms, minimal prose to fill.
  - Prose-heavy notes → extract structure from headings, group paragraphs into concepts.
  - Transcripts → segment by topic shifts (keyword change, long pauses, "okay so next let's talk about…"), not by timestamp alone.
  - Mixed slide+transcript → slides provide skeleton, transcript provides explanatory prose.

## 8. Grade/level calibration

| Level | Calibration |
|---|---|
| **6–8** | Heavy scaffolding. Define every term in plain language. Include pictures/diagrams liberally (Mermaid flowcharts, labeled drawings described in markdown). Short sentences. Recall-heavy practice questions (60%+). Cheat sheet uses large type and spatial layout. |
| **9–12** | Moderate scaffolding. Define technical terms, assume general vocabulary. Mix of diagrams and prose. 40/40/20 recall/comprehension/application mix. Cheat sheet is denser but still visual. |
| **College (default)** | Assumes college-level vocabulary and prior course context. Terse concept summaries. Diagrams where genuinely useful, not decorative. 30/40/30 mix, including multi-step application questions. Cheat sheet is information-dense. |
| **Graduate** | Terse. Assumes domain vocabulary. Summaries at the level of "reminder of what this concept is" rather than explanation. Practice questions skew application/synthesis. Cheat sheet is formula/theorem-dense; almost no definitional content. |

Level is elicited once and applied throughout. Default to `college` if not specified and if the source material's vocabulary suggests it.

## 9. Evals

Location: `skills/lecture-to-study-guide/evals/evals.json`

Five test prompts, each with 3–5 objective assertions:

1. **Mitosis mock lecture (pasted prose, 9–12 grade).** Input: ~1500-word typed lecture on the phases of mitosis.
   - Assert: all 7 output sections present.
   - Assert: Key Terms count ≥ 8 (prophase, metaphase, anaphase, telophase, cytokinesis, chromatid, centromere, spindle minimum).
   - Assert: Practice Questions count ≥ 10.
   - Assert: at least one Mermaid diagram.
   - Assert: Cheat sheet section is ≤ 500 words.

2. **Econ slide-deck PDF (college).** Input: 25-slide PDF on supply-and-demand equilibrium.
   - Assert: TOC headings align to at least 80% of slide section headings.
   - Assert: Key Terms count ≥ 10.
   - Assert: at least one worked example with numeric solution.
   - Assert: Practice Questions include ≥ 2 application-type questions.

3. **YouTube transcript (college, no speaker labels).** Input: plaintext transcript of a 45-min CS lecture on dynamic programming.
   - Assert: all 7 sections present.
   - Assert: at least 2 worked examples.
   - Assert: Practice Questions count ≥ 12.
   - Assert: no timestamp noise in prose sections.

4. **Multi-lecture series (college, 3 lectures).** Input: 3 markdown files, weeks 1–3 of an intro psych course.
   - Assert: unified guide contains all 3 lectures' topics in TOC.
   - Assert: Key Terms de-duplicated across lectures.
   - Assert: Practice Questions drawn from all 3 lectures (≥ 3 from each).

5. **Math-heavy notes (grad level).** Input: pasted notes on linear algebra, eigenvalues/eigenvectors.
   - Assert: worked examples include step-by-step derivation.
   - Assert: LaTeX math syntax used for equations (not prose).
   - Assert: Cheat sheet includes ≥ 3 formulas.
   - Assert: question mix skews application (≥ 40%).

All assertions are auto-checkable via regex/count/JSON-schema validation against the generated markdown.

## 10. Edge cases

- **Transcript with no speaker labels** — treat as monologue; do not invent speakers. If dialogic content is detected (Q&A section), infer turns from punctuation/capitalization cues but flag uncertainty.
- **Slides-only input (no surrounding context)** — slide bullets alone are often too terse. Skill should explicitly elaborate each bullet into a concept summary, clearly flagging any elaboration as "Claude's expansion" if it goes beyond what the slide literally says.
- **Lecture spans multiple distinct topics** — detect topic boundaries and either (a) produce one guide with clear per-topic sections, or (b) offer to split into multiple guides. Default: single guide, multi-topic structure.
- **Math/science heavy content** — preserve equations in LaTeX (`$...$` / `$$...$$`). Worked examples must show intermediate steps, not just answers. Diagrams lean on Mermaid for flowcharts and conceptual relationships; complex geometry/waveforms get ASCII sketches or descriptions rather than Mermaid abuse.
- **Unstructured / very messy notes** — when no headings/structure detectable, impose structure by topic-clustering, and tell the user the structure was inferred so they can correct it.
- **Very short input (< 500 words)** — produce a proportionally shorter guide; don't pad with filler. Reduce practice question count to 5–8 if material doesn't support more.
- **Very long input (> 20k words / full textbook chapter)** — chunk by section, produce per-section summaries, then synthesize the top-level Outline and Cheat Sheet. Warn user and offer split option.
- **Non-English lecture content** — respect source language for terms; generate prose/questions in source language unless user requests translation. (V2: explicit translation flag.)
- **Handwritten scanned notes with poor OCR** — flag OCR uncertainty; ask user to verify key terms before finalizing.

## 11. Open questions

1. **Sub-skill delegation vs inline output.** When the user wants flashcards or a concept map alongside their study guide, should this skill:
   - (a) Auto-invoke the `flashcards` / `concept-map` skills and bundle their outputs, or
   - (b) Produce inline equivalents (CSV block, Mermaid block) within this skill's markdown, or
   - (c) End with a suggestion: "Run the `flashcards` skill next on this guide"?
   Current lean: (b) inline Mermaid (cheap, already in the output anyway) + (c) suggest running flashcards as a follow-up (avoids duplicating Anki-export logic). Decide during implementation.

2. **Claude-native PDF vs bundled `pdf_extract.py`.** Test Claude's native PDF handling on a slide-deck PDF during evals. If it preserves slide boundaries and bullet hierarchy cleanly, skip the pdfplumber script. If not, bundle it.

3. **Default cheat-sheet style.** Dense single-column vs two-column vs spatially-organized (mind-map-like)? Probably defaults to dense single-column for college/grad and spatial for 6–8, but worth testing with real users.

4. **Practice-question answer visibility.** `<details>` collapsible in markdown is nice on GitHub but doesn't render in all viewers. Alternative: answers at end of document with anchor links. Pick one convention.

5. **Should the skill offer a "quiz mode" output** (questions only, no answers visible) as a separate deliverable, or punt entirely to `quiz-generator`? Leaning punt — this skill is about study guides, not quizzes.
