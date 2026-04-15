---
name: circle-time
description: Plan circle time, morning meeting, or opening routine for PreK-2 classrooms. Use this whenever a teacher asks for a preschool, kindergarten, 1st grade, or 2nd grade morning meeting, greeting, song, calendar/weather, theme discussion, movement activity, story time, SEL check-in, or closing ritual. Triggers on "plan circle time for monday", "morning meeting for kindergarten about feelings", "preschool circle time songs", "what should we do for circle time about fall", "calendar and weather for 1st grade morning meeting", "PreK morning meeting plan for the letter B", "give me a 15 minute circle time about apples", "2nd grade morning meeting SEL check-in", "circle time plan rainy day indoor", "kindergarten greeting song and story", "morning meeting routine for first week of school", "transition songs for preschool circle time", "PreK circle time about community helpers", and similar PreK-2 morning-meeting requests. Produces a full, ready-to-run plan with original lyrics set to public-domain tunes, picture-book suggestions, age-calibrated discussion, and transition cues.
---

# circle-time

Plan ready-to-run PreK-2 morning meetings sized to a requested duration and calibrated to age. Every plan is printable and teacher-runnable without additional prep.

## When to trigger

Use this skill whenever a user asks for a circle-time plan, morning meeting, opening routine, calendar/weather segment, greeting or closing song, or transition/SEL activity for PreK through 2nd grade. Teachers may phrase the request many ways — trust the description keywords, not a strict format. If the only thing missing is the age band, ask one clarifying question. Otherwise proceed with defaults.

## Inputs

Parse these from the user's request:

- **Age band** — PreK (3-4), K (5-6), 1st (6-7), 2nd (7-8). Required.
- **Theme** — weather, feelings, letter/number of the day, seasonal, SEL topic, community helpers, nature, book-of-the-week. If absent, suggest two and pick one.
- **Duration** — 10, 15, or 20 minutes. Default 15.
- **Group size** — small (≤8), medium (9-15), large (16+). Default medium.
- **Accommodations** — sensory, bilingual/ELL, mobility, nonverbal/AAC.
- **Calendar/weather included?** — default yes for K-2, no for PreK.
- **Date / day-of-week** — optional.

### Age inference (check before asking)

| Phrase | Band |
|---|---|
| "preschool," "PreK," "3-year-olds," "daycare" | PreK |
| "kindergarten," "kinder," "5-year-olds," "TK" | K |
| "1st grade," "first graders" | 1st |
| "2nd grade," "second graders" | 2nd |
| "morning meeting" alone, no age | ask once |

If age is missing and you can't infer, ask ONE question:

> Quick check — which age band? **PreK · K · 1st · 2nd**

Accept freeform ("PreK circle time about apples, 15 min, small group, sensory-sensitive child") or structured prompts.

## Workflow

1. Parse inputs; fill defaults.
2. Compute per-segment time budget from the age calibration table below.
3. Load `references/tunes.md` and compose original lyrics to a public-domain tune that matches the theme, age, and meter.
4. Load `references/books.md` and pick one primary and one alternative picture book matching theme + age (title + author).
5. Load `references/finger-plays.md` for movement; pick one that fits group size; always include a seated alternative.
6. Load `references/sel-frameworks.md` and choose the check-in protocol (thumbs, colors, feelings wheel, one-word share) appropriate to age.
7. Load `references/transitions.md` for one-line transition cues between every adjacent segment.
8. If any accommodation is flagged, load `references/accommodations.md` and apply substitutions inline (not as footnotes).
9. Assemble the markdown plan in the 8-section output order below.

## Output — required sections in this order

Every plan must include every section below (calendar is included only when requested). Place a one-line transition cue between every adjacent pair of segments.

1. **Header** — theme, age band, duration, date (if supplied), total estimated time, and a materials list.
2. **Greeting (2-3 min)** — named greeting ritual (handshake, wave, name song, ball pass) with teacher script.
3. **Song (2-3 min)** — full original lyrics (≥2 verses or 4 lines), tune attribution in the form "to the tune of [public-domain tune]," and hand motions if applicable.
4. **Calendar / Weather / Attendance (2-3 min)** — only if the user requested it or the age band defaults to yes. Include day-of-week chant, weather observation prompt, and attendance cue.
5. **Theme Discussion (3-5 min)** — 3-5 open-ended questions + 2-3 vocabulary anchor words + an optional visual-aid suggestion.
6. **Movement or Finger-Play (2-3 min)** — named activity with step cues AND a seated alternative listed inline.
7. **Story Time (3-5 min)** — primary book (title + author) + one alternative (title + author) + 2-3 pre-reading prompts + 2-3 post-reading prompts.
8. **SEL Check-in (1-2 min)** — feelings protocol (thumbs / colors / feelings wheel / one-word share) with teacher script.
9. **Closing Ritual (1-2 min)** — transition-out song or chant + preview of the next activity.

Between every adjacent segment, insert a one-line teacher transition cue (e.g. "Criss-cross applesauce, hands in your lap — it's song time!").

Total per-segment times must sum within ±2 minutes of the requested total duration.

## Age calibration

| Band | Max segment | Language | Movement | Calendar math |
|------|-------------|----------|----------|---------------|
| PreK | 5 min  | 5-7 word sentences, concrete nouns | Lots, frequent standing | No |
| K    | 10 min | Short sentences, 1-2 new vocab words | Moderate, ≥1 standing activity | Yesterday/today/tomorrow |
| 1    | 10 min | Full sentences, 2-3 vocab words | Moderate | + days-remaining, number-of-day, patterns |
| 2    | 12 min | Longer discussion, early writing prompts in closing | Any | + date-math, early place-value |

Discussion questions escalate from concrete ("What did you eat for breakfast?") at PreK to reflective ("When is a time you felt proud?") at 2nd.

## Locked defaults

- **Songs:** Original lyrics set to public-domain tunes (Twinkle, Mary Had a Little Lamb, Wheels on the Bus, Frère Jacques, Row Row Row Your Boat, etc.). Write fresh words each time that fit the theme and meter.
- **Books:** Title + author suggestions. Always include one alternative in case a title is out of print.
- **Holidays:** Default to nature/seasonal framing (harvest, lights, spring). Offer tradition-specific versions on request.
- **Inclusive language:** "grown-up at home" / "family" / "the people who love you." Diverse authors and family structures in book picks by default.
- **SEL default:** Responsive Classroom four-component structure (greeting, sharing, group activity, morning message). Conscious Discipline phrasing available on request.

## Micro-example (what a generated plan looks like — trimmed)

**User:** "15-min circle time for K on feelings, medium group"

**Inferred:** K, theme=feelings, 15 min, medium. No clarifying question needed.

```
# Circle Time — Kindergarten · Feelings · 15 min

**Materials:** feelings-faces cards, classroom carpet spots.

## 1. Greeting (2 min)
Name song to the tune of "Row Row Row Your Boat":
  Hello, hello, hello friends, glad to see you here…
  [4 lines, continues with each child's name in turn]

→ "Criss-cross applesauce, hands in our laps — song time!"

## 2. Song (3 min)
"My Feelings Face" — to the tune of "If You're Happy and You're Knowing It"
  When I'm happy and I know it, show your smile (big grin!)
  When I'm grumpy and I know it, show your frown …
  [2 more verses: sad, excited]

## 3. Theme Discussion (4 min)
Show feelings-faces cards. Ask:
  - Have you ever felt the way this face looks?
  - What makes you feel happy? Sad? Excited?
…
(Calendar/Weather, Movement, Story, SEL Check-in, Closing follow.)
```

Every adjacent segment has a one-line transition cue.

## References (load on demand)

- `references/tunes.md` — public-domain tune catalog with meter, syllable patterns, age fit, and composition rules for writing ORIGINAL lyrics.
- `references/books.md` — picture-book catalog by theme — title + author + one-line summary + age band only.
- `references/finger-plays.md` — age-appropriate finger-plays and movement rhymes with seated alternatives.
- `references/transitions.md` — transition chants, call-and-response cues, visual-cue strategies, teacher scripts.
- `references/sel-frameworks.md` — Responsive Classroom (default) + Conscious Discipline (alt) briefs, feelings check-in protocols.
- `references/accommodations.md` — bilingual, sensory, mobility, AAC, religious-neutral, inclusive-family substitutions.

## Edge cases

- **Mixed-age request:** calibrate to the younger band; add "stretch prompts" for older children.
- **Large group (16+):** prefer whole-group call-and-response over individual shares; pace for transitions.
- **First week of school:** emphasize name-learning greetings, low-demand SEL, predictable structure.
- **Rainy / indoor-only:** favor finger-plays and seated movement; no "go outside" activities.
- **Sensory-sensitive:** pick visual transition cues over auditory; swap loud activities for breathing or quiet finger-play.
- **Bilingual:** offer key vocabulary and greetings in English + L2 (default Spanish, or user-specified).
- **Nonverbal / AAC:** offer point-to-picture paths, thumb scales, and 5-second pauses after each prompt.
