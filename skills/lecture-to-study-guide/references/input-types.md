# Input-Type Handling

Per-input-shape workflow. Detect input type first, then branch.

> **V1 note:** PDF and transcript ingestion are handled by Claude directly. Dedicated parsers (`pdf_extract.py`, `transcript_clean.py`) are planned for V2 — follow the in-prompt cleanup steps in this file for now.

## Detection rules

| Signal | Type |
|---|---|
| PDF with consistent page-per-slide layout (≤ 200 words/page, bulleted) | **Slide-deck PDF** |
| PDF with multi-paragraph prose pages (≥ 400 words/page) | **Prose PDF** (textbook chapter / handout) |
| Text ends in `.vtt`, `.srt`, or contains `HH:MM:SS` timestamps | **Transcript** |
| Pasted text with markdown headings (`#`, `##`) | **Structured prose notes** |
| Pasted text, no headings, paragraph-heavy | **Unstructured prose notes** |
| Multiple files provided | **Multi-lecture series** |
| One PDF + one transcript of same lecture | **Mixed slide+transcript** |

## Slide-heavy PDFs

**Heuristic: IS a slide deck if** all three hold:
1. Average words per page ≤ 200.
2. ≥ 60% of pages contain 3+ bullet-like lines (short lines starting with `•`, `-`, `*`, `>`, or a digit+`.`).
3. Page has a single title-like line at top (≤ 10 words, often bold/large).

**Workflow for slide decks:**
1. Rely on Claude-native PDF handling. Verify by spot-checking: does each page produce a clean title + bullet list?
2. If boundaries are lost (all bullets merged into one paragraph per page, or titles missing), note the degradation and proceed with best-effort reconstruction.
3. Treat each slide title as a topic seed.
4. Treat bullets as concept atoms. Elaborate each bullet into 1-2 sentences of prose in the Concept Summaries section. **Mark elaborations** with `(expansion)` at the end of any sentence that goes beyond what the slide literally says.
5. Slide titles become Key Terms candidates IF they name a concept (noun phrase) rather than an action ("Today's Agenda," "Next Week").

## Prose-heavy PDFs (textbook chapters)

**Workflow:**
1. Rely entirely on Claude-native PDF handling.
2. Extract structure from existing headings.
3. Group paragraphs into concept clusters by heading.

## Transcripts

**Inline cleanup steps** (perform during ingestion):

1. **Strip timing noise.** Remove VTT/SRT timestamp ranges (`00:00:01.000 --> 00:00:03.500`), sequence numbers, `WEBVTT` headers, Otter-style `Speaker N 00:04:23` labels (drop the timestamp; keep the speaker label if it's a named person).
2. **Merge fragmented caption lines.** Auto-captions often break mid-sentence. Merge consecutive short lines into sentences, using sentence-end punctuation as the break signal.
3. **Preserve speaker labels** when present (named speakers, not generic `Speaker 1`).

After cleanup:

1. Segment by **topic shifts**, not by timestamp. Topic-shift signals:
   - Keyword-set changes (new vocabulary cluster).
   - Long pauses (`[pause]`, `...`) or speaker transitions.
   - Verbal cues: "okay so next," "let's move on to," "another thing is."
2. Treat segments as topic groups.
3. When quoting the transcript for Concept Summaries, clean up filler ("um," "uh," "like," "you know"), but preserve technical phrasing.
4. Key Terms: extract via linguistic signals (see `term-extraction.md`) — typographic signals don't exist in transcripts.
5. Preserve paragraph-level coarse timestamps (every ~2 minutes) in the Source column of the Key Terms table if the user wants cross-reference.

## Structured prose notes

- Use heading hierarchy directly as the topic group structure.
- Extract terms from typographic signals (bold, italic, code backticks).
- Shortest workflow; usually the cleanest input.

## Unstructured prose notes

- **Impose structure by topic-clustering.** Group paragraphs by keyword similarity.
- **Tell the user** that structure was inferred and invite correction: *"I inferred these 4 topic groups. Let me know if you'd prefer a different split."*
- Reduce scaffolding in output; these notes are often already terse.

## Multi-lecture series

1. Ask once: "Unified guide, per-lecture set, or both?" Default: unified with per-lecture H3 sections inside each of the 7 output sections.
2. Concatenate with `--- Lecture N: <title> ---` markers before processing.
3. De-duplicate Key Terms (see `term-extraction.md` §De-duplication).
4. Practice Questions: ≥ 3 per lecture.

## Mixed slide+transcript

The common case: user has slides AND a recording transcript of the same lecture.

1. Parse slides first → get skeleton (titles, bullets).
2. Align transcript segments to slides using:
   - Explicit slide-number mentions in transcript ("on slide 4…").
   - Keyword overlap between slide bullets and transcript segment.
   - Default time-based alignment (assume equal time per slide) as last resort.
3. For each slide, use slide title + bullets as the skeleton, and transcript segment as the prose source for the Concept Summary.
4. Source column in Key Terms: `Slide N (transcript HH:MM)`.
