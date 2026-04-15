# circle-time — Design Spec

**Date:** 2026-04-14
**Author:** Pierson + Claude
**Status:** Draft pending user review
**Parent:** [2026-04-14-marketplace-design.md](./2026-04-14-marketplace-design.md)

## 1. Purpose

Plan circle-time / morning meeting for PreK-2 teachers. Produces a ready-to-use daily routine with greeting, song, calendar/weather (optional), theme discussion, movement activity, story time, SEL check-in, and closing ritual — sized to the requested duration and calibrated to the age band. Every plan is printable and teacher-runnable without additional prep.

## 2. Triggers

SKILL.md description should trigger on phrasings like:

- "plan circle time for monday"
- "morning meeting for kindergarten about feelings"
- "preschool circle time songs"
- "what should we do for circle time about fall"
- "calendar and weather for 1st grade morning meeting"
- "PreK morning meeting plan for the letter B"
- "give me a 15 minute circle time about apples"
- "2nd grade morning meeting SEL check-in"
- "circle time plan rainy day indoor"
- "kindergarten greeting song and story"
- "morning meeting routine for first week of school"
- "transition songs for preschool circle time"

## 3. Inputs

- **Age band** — PreK (3-4), K (5-6), 1st grade (6-7), 2nd grade (7-8). Required.
- **Theme** — weather, feelings, letter of the week, number of the day, seasonal/holiday, SEL topic (kindness, sharing, belonging), community helpers, nature, book of the week. Optional; skill suggests if absent.
- **Duration** — 10, 15, or 20 minutes. Default 15.
- **Group size** — small (≤8), medium (9-15), large (16+). Affects activity choice (finger-play vs whole-group movement).
- **Special needs accommodations** — sensory sensitivities, ELL/bilingual, wheelchair/mobility, nonverbal communicators, religious-neutral required.
- **Include calendar/weather?** — yes/no (default yes for K-2, no for PreK).
- **Day-of-week / date** — optional, used for calendar segment.

Inputs accepted as a freeform sentence ("PreK circle time about apples, 15 min, small group, one child with sensory sensitivities") or structured prompt.

## 4. Outputs

Single markdown document with:

1. **Header** — theme, age band, duration, date (if supplied), total estimated time.
2. **Greeting (2-3 min)** — named greeting ritual (e.g. handshake, wave, name song) with script.
3. **Song (2-3 min)** — full lyrics (public-domain or original), tune suggestion (e.g. "to the tune of Twinkle Twinkle"), hand motions if applicable.
4. **Calendar / Weather / Attendance (2-3 min)** — only if included. Includes day-of-week chant, weather observation prompt, attendance cue.
5. **Theme Discussion (3-5 min)** — 3-5 open-ended discussion questions calibrated to age, vocabulary anchor words, optional visual-aid suggestion.
6. **Movement Activity or Finger-Play (2-3 min)** — named activity with step-by-step cues. Seated alternative always included.
7. **Story Time (3-5 min)** — primary book suggestion (title + author), one alternative, 2-3 pre-reading prompts, 2-3 post-reading prompts.
8. **SEL Check-in (1-2 min)** — feelings-check protocol (thumbs scale, color scale, or feelings-wheel point) with teacher script.
9. **Closing Ritual (1-2 min)** — transition-out song or chant, preview of next activity.
10. **Transition cues** — one-line teacher script between every segment (e.g. "Criss-cross applesauce, hands in your lap — it's song time!").
11. **Materials list** — everything needed, top of document.
12. **Printable "teacher cheat-sheet"** — optional single-page PDF via `shared/scripts/pdf_render.py`, timings and cues only.

## 5. Workflow

1. Parse inputs; fill defaults where absent.
2. Compute segment time budget from total duration and age band (see §8).
3. Select theme-appropriate greeting and song from bundled catalog; if nothing fits, write an original set of lyrics to a well-known public-domain tune.
4. Pick story from bundled recommended-books catalog filtered by theme and age; always provide one alternative.
5. Choose movement activity matched to group size and accommodation flags; include seated alternative.
6. Generate 3-5 theme discussion questions and SEL check-in language calibrated to age band.
7. Assemble markdown plan with transition cues stitched between segments.
8. If user requests printable, render cheat-sheet PDF.

## 6. Bundled scripts

None skill-specific. Uses `shared/scripts/pdf_render.py` for the optional teacher cheat-sheet. All content generation is prompt-driven against bundled reference catalogs.

## 7. References (loaded on demand)

- `references/songs.md` — curated public-domain song lyrics catalog grouped by function: greeting songs, weather songs, months/days-of-week, counting, cleanup/transition. Each entry tagged with tune + age.
- `references/books.md` — recommended picture-book catalog by theme (feelings, friendship, seasons, letters, numbers, community, diversity). Title + author + one-line summary + age band. No full text.
- `references/finger-plays.md` — age-appropriate finger-plays and movement rhymes with motion notes.
- `references/transitions.md` — transition strategies and teacher-script examples (chants, call-and-response, visual cues, timers).
- `references/sel-frameworks.md` — brief overview of Responsive Classroom and Conscious Discipline approaches; check-in protocols (feelings wheel, thumbs, colors).
- `references/accommodations.md` — quiet-alternative activities, bilingual cueing, seated movement, religious-neutral substitutions.

## 8. Age calibration

| Band | Max segment | Language | Movement | Calendar math |
|------|-------------|----------|----------|---------------|
| PreK | 5 min      | 5-7 word sentences, concrete nouns | Lots, frequent standing | No |
| K    | 10 min     | Short sentences, 1-2 new vocab words | Moderate, at least one standing activity | Basic (yesterday/today/tomorrow) |
| 1    | 10 min     | Full sentences, 2-3 vocab words | Moderate | Adds days-remaining, number-of-day, basic pattern |
| 2    | 12 min     | Longer discussions, early writing prompts in closing | Any | Adds date-math, early place-value |

Discussion questions escalate from concrete ("What did you eat for breakfast?") at PreK to reflective ("When is a time you felt proud?") at 2nd.

## 9. Evals

`evals/evals.json` ships 5 test prompts:

1. "PreK circle time about apples, 15 minutes"
2. "Kindergarten morning meeting about feelings, 20 min, include calendar"
3. "1st grade circle time for letter B, 10 minutes"
4. "2nd grade morning meeting SEL check-in about kindness, 15 minutes"
5. "PreK circle time, rainy indoor day, small group, one child with sensory sensitivities"

Assertions per eval:
- All 8 required sections present (greeting, song, [calendar], discussion, movement, story, SEL, closing).
- Sum of per-segment times is within ±2 min of requested duration.
- Song section contains full lyrics (≥2 lines) with a tune suggestion.
- Book suggestion includes title AND author; alternative also listed.
- Vocabulary and sentence length match age band (checked via simple readability heuristic or LLM judge).
- Accommodations mentioned when flagged in the prompt.
- Transition cues appear between every segment.

## 10. Edge cases

- **Non-English / bilingual classroom** — offer bilingual greeting (English + Spanish default, or user-specified L2); include key vocabulary in both languages.
- **Sensory sensitivities** — swap loud/physical movement for quiet finger-play or breathing activity; flag transitions as visual-cue-based rather than auditory.
- **Inclusive content** — discussion prompts avoid "mom and dad" framing; use "grown-up at home" or "family." Book suggestions include diverse authors and family structures.
- **Religious-neutral holidays** — for seasonal themes, default to nature/seasonal framing (harvest, lights, new year) rather than religious. Offer religious versions only if user explicitly requests.
- **Mixed-age group** — if two age bands requested, calibrate to the younger and note stretch prompts for older children.
- **First week of school** — emphasize name-learning greetings and low-demand SEL.
- **Large group (16+)** — prefer whole-group call-and-response over individual shares; note pacing risk.

## 11. Open questions

- **Song sourcing.** Public-domain-only catalog risks feeling stale; original lyrics to public-domain tunes are safer and unlimited. **Recommendation:** prefer original lyrics set to well-known public-domain tunes ("Twinkle Twinkle," "Mary Had a Little Lamb," "Frère Jacques," "The Wheels on the Bus"). Bundle a small curated public-domain-only backup set.
- **Book recommendations going stale / out-of-print.** Picture-book catalog will drift. **Recommendation:** keep list short (~40 titles) across evergreen categories, prefer award-winners (Caldecott, Coretta Scott King) with long print runs, and always provide an alternative so a single out-of-print title doesn't block the plan. Consider a `books.md` contribution workflow for teachers post-V1.
- **Responsive Classroom vs Conscious Discipline default.** Both are non-proprietary frameworks. **Tentative:** default to Responsive Classroom's four-component structure (greeting, sharing, group activity, morning message) since it maps cleanly to our output sections; note Conscious Discipline as alt for SEL check-in phrasing.
