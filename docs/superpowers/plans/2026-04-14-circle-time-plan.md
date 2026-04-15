# circle-time Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `circle-time` skill that generates ready-to-use PreK-2 morning-meeting plans (greeting, song, story, movement, SEL check-in, closing) with age-calibrated output, an optional printable teacher cheat-sheet PDF, and bundled reference catalogs for songs, books, finger-plays, transitions, SEL frameworks, and accommodations.

**Architecture:** Prompt-driven skill (no skill-specific scripts) that composes output from bundled reference files loaded on demand. Songs are ORIGINAL lyrics composed to public-domain tunes (Twinkle, Mary Had a Little Lamb, Wheels on the Bus, Frère Jacques, etc.) — we never ship copyrighted lyrics. Picture books are referenced by title + author only (no full text). Cheat-sheet PDF uses the shared `shared/scripts/pdf_render.py` Playwright renderer. Evals validate structure, timing budget, song format, book metadata, and accommodation coverage.

**Tech Stack:** Markdown (`SKILL.md`, references), JSON (`evals/evals.json`), Python (shared `pdf_render.py` only — not skill-owned), HTML templates (for cheat-sheet printable). No skill-specific code to write; all content logic is prompt-driven.

---

## File Structure

All paths relative to repo root `/Users/piersonmarks/src/tries/2026-04-14-school-skills/`.

**Created by this plan (all inside `skills/circle-time/`):**
- `skills/circle-time/SKILL.md` — main skill definition, trigger description, workflow, output contract, references index
- `skills/circle-time/references/tunes.md` — public-domain tune catalog with meter, syllable pattern, age fit, sample lyric slots; used to compose ORIGINAL lyrics
- `skills/circle-time/references/books.md` — picture-book catalog by theme, title + author + one-line summary + age band only (no full text)
- `skills/circle-time/references/finger-plays.md` — finger-plays and movement rhymes with motion notes, seated alternatives
- `skills/circle-time/references/transitions.md` — transition chants, call-and-response cues, visual-cue strategies, teacher scripts
- `skills/circle-time/references/sel-frameworks.md` — Responsive Classroom (default) + Conscious Discipline (alt) briefs; feelings-check protocols (thumbs, colors, feelings wheel)
- `skills/circle-time/references/accommodations.md` — bilingual cueing, sensory-friendly swaps, mobility/seated alternatives, nonverbal communicators, religious-neutral substitutions, inclusive-family language
- `skills/circle-time/references/cheatsheet_template.html` — Playwright-friendly HTML template used by `shared/scripts/pdf_render.py` to produce the one-page teacher cheat-sheet
- `skills/circle-time/evals/evals.json` — 5 eval prompts with structural assertions

**Reused (no edits):**
- `shared/scripts/pdf_render.py` — renders the cheat-sheet HTML to PDF. Skill instructs the model to call it; this plan does NOT modify it.

Each reference file has ONE clear responsibility. `SKILL.md` stays under 300 lines and delegates details to references via progressive disclosure.

---

## Task 1: Scaffold skill directory

**Files:**
- Create (empty stubs for now): `skills/circle-time/SKILL.md`, `skills/circle-time/references/tunes.md`, `skills/circle-time/references/books.md`, `skills/circle-time/references/finger-plays.md`, `skills/circle-time/references/transitions.md`, `skills/circle-time/references/sel-frameworks.md`, `skills/circle-time/references/accommodations.md`, `skills/circle-time/references/cheatsheet_template.html`, `skills/circle-time/evals/evals.json`

- [ ] **Step 1: Verify repo layout**

Run: `ls /Users/piersonmarks/src/tries/2026-04-14-school-skills/skills/ 2>/dev/null; ls /Users/piersonmarks/src/tries/2026-04-14-school-skills/shared/scripts/ 2>/dev/null`
Expected: `skills/` may or may not exist yet; `shared/scripts/` may not exist yet (pre-existing scaffolding not required for this skill's tasks — the cheat-sheet script is referenced but not built here).

- [ ] **Step 2: Create directory tree**

```bash
mkdir -p /Users/piersonmarks/src/tries/2026-04-14-school-skills/skills/circle-time/references
mkdir -p /Users/piersonmarks/src/tries/2026-04-14-school-skills/skills/circle-time/evals
```

- [ ] **Step 3: Create placeholder files**

Create each file listed above with a one-line comment header so downstream tasks can edit them. Use the Write tool. Example content for `tunes.md`:

```markdown
# Public-Domain Tune Catalog

_Stub. Populated in Task 3._
```

Repeat for every file listed under "Files." For `evals/evals.json` write `{"evals": []}`.

- [ ] **Step 4: Verify structure**

Run: `ls -R /Users/piersonmarks/src/tries/2026-04-14-school-skills/skills/circle-time/`
Expected: Shows `SKILL.md`, `references/` (7 files), `evals/evals.json`.

- [ ] **Step 5: Commit**

```bash
cd /Users/piersonmarks/src/tries/2026-04-14-school-skills
git add skills/circle-time
git commit -m "scaffold: circle-time skill directory"
```

---

## Task 2: Write SKILL.md — trigger description, workflow, output contract

**Files:**
- Modify: `skills/circle-time/SKILL.md`

- [ ] **Step 1: Write SKILL.md full content**

Use the Write tool to replace the file contents with the following. Keep under 300 lines; push detail to references.

```markdown
---
name: circle-time
description: Plan circle time, morning meeting, or opening routine for PreK-2 classrooms. Triggers on "plan circle time for monday", "morning meeting for kindergarten about feelings", "preschool circle time songs", "what should we do for circle time about fall", "calendar and weather for 1st grade morning meeting", "PreK morning meeting plan for the letter B", "give me a 15 minute circle time about apples", "2nd grade morning meeting SEL check-in", "circle time plan rainy day indoor", "kindergarten greeting song and story", "morning meeting routine for first week of school", and "transition songs for preschool circle time". Produces greeting, song (ORIGINAL lyrics set to public-domain tunes), optional calendar/weather, theme discussion, movement or finger-play, story time (book title + author suggestions only), SEL check-in, closing ritual, and transition cues — age-calibrated PreK through 2nd grade.
---

# circle-time

Plan ready-to-run PreK-2 morning meetings sized to a requested duration and calibrated to age.

## When to trigger

Use this skill whenever a user asks for a circle-time plan, morning meeting, opening routine, calendar/weather segment, greeting or closing song, or transition/SEL activity for PreK through 2nd grade. Teachers may phrase the request many ways — trust the description keywords, not a strict format.

## Inputs

Parse these from the user's request (ask a single clarifying question only if the age band is missing):

- **Age band** — PreK (3-4), K (5-6), 1st (6-7), 2nd (7-8). Required.
- **Theme** — weather, feelings, letter/number of the day, seasonal, SEL topic, community helpers, nature, book-of-the-week. If absent, suggest two and pick one.
- **Duration** — 10, 15, or 20 minutes. Default 15.
- **Group size** — small (≤8), medium (9-15), large (16+). Default medium.
- **Accommodations** — sensory, bilingual/ELL, mobility, nonverbal, religious-neutral.
- **Calendar/weather included?** — default yes for K-2, no for PreK.
- **Date / day-of-week** — optional.

Accept freeform ("PreK circle time about apples, 15 min, small group, sensory-sensitive child") or structured prompts.

## Workflow

1. Parse inputs; fill defaults.
2. Compute per-segment time budget from age table in §"Timing" below.
3. Load `references/tunes.md` and compose ORIGINAL lyrics to a public-domain tune that matches the theme, age, and meter. Never reproduce copyrighted lyrics.
4. Load `references/books.md` and pick one primary and one alternative picture book that match theme + age. Output title + author only. Never reproduce book text.
5. Load `references/finger-plays.md` for movement; pick one that fits group size; always include a seated alternative.
6. Load `references/sel-frameworks.md` and choose the matching check-in protocol (thumbs, colors, feelings wheel).
7. Load `references/transitions.md` for one-line transition cues between every segment.
8. If any accommodation is flagged, load `references/accommodations.md` and apply substitutions.
9. Assemble the markdown plan in the output order below.
10. If the user asks for a printable, render the cheat-sheet PDF by calling `shared/scripts/pdf_render.py` with `references/cheatsheet_template.html` plus the plan data.

## Output — required sections in this order

1. **Header** — theme, age band, duration, date (if supplied), total estimated time, materials list.
2. **Greeting (2-3 min)** — named ritual + teacher script.
3. **Song (2-3 min)** — full ORIGINAL lyrics (≥2 verses or 4 lines), tune attribution ("to the tune of Twinkle Twinkle Little Star"), hand motions if applicable.
4. **Calendar / Weather / Attendance (2-3 min)** — only if included.
5. **Theme Discussion (3-5 min)** — 3-5 open-ended questions + vocabulary anchors.
6. **Movement or Finger-Play (2-3 min)** — named activity with step cues AND seated alternative.
7. **Story Time (3-5 min)** — primary book (title + author) + one alternative + 2-3 pre-reading prompts + 2-3 post-reading prompts. No book text.
8. **SEL Check-in (1-2 min)** — feelings protocol + teacher script.
9. **Closing Ritual (1-2 min)** — transition-out song/chant + preview of next activity.
10. **Transition cues** — one-line teacher script inserted between every adjacent segment.
11. **Printable cheat-sheet (optional)** — generated on request.

## Timing (age calibration)

| Band | Max segment | Language | Movement | Calendar math |
|------|-------------|----------|----------|---------------|
| PreK | 5 min  | 5-7 word sentences, concrete nouns | Lots, frequent standing | No |
| K    | 10 min | Short sentences, 1-2 new vocab words | Moderate, ≥1 standing activity | Yesterday/today/tomorrow |
| 1    | 10 min | Full sentences, 2-3 vocab words | Moderate | + days-remaining, number-of-day, patterns |
| 2    | 12 min | Longer discussion, early writing prompts in closing | Any | + date-math, early place-value |

Sum of per-segment times must land within ±2 minutes of the requested total.

## Locked defaults

- **Songs:** ORIGINAL lyrics set to public-domain tunes only. Never ship or reproduce copyrighted lyrics (no "Baby Shark," no "Let It Go," no modern children's-music catalog).
- **Books:** Title + author only. No full text excerpts. Always include one alternative in case a title is out of print.
- **Religious neutrality:** Default to nature/seasonal framing for holidays (harvest, lights, new year). Offer religious versions only if explicitly requested.
- **Inclusive language:** "grown-up at home" / "family," not "mom and dad." Diverse authors and family structures in book picks.
- **SEL default:** Responsive Classroom four-component structure. Conscious Discipline phrasing available on request.

## References (load on demand)

- `references/tunes.md` — public-domain tunes + meter/syllable patterns for composing original lyrics
- `references/books.md` — picture-book catalog (title + author + age + theme tags)
- `references/finger-plays.md` — age-appropriate finger-plays and movement rhymes with seated alternatives
- `references/transitions.md` — transition chants, call-and-response, visual cues
- `references/sel-frameworks.md` — Responsive Classroom + Conscious Discipline briefs, check-in protocols
- `references/accommodations.md` — bilingual, sensory, mobility, nonverbal, religious-neutral substitutions

## Printable cheat-sheet

On request ("make it printable", "give me a PDF", "one-page cheat sheet"), render the teacher cheat-sheet via:

```
python shared/scripts/pdf_render.py \
  --template skills/circle-time/references/cheatsheet_template.html \
  --data <path-to-plan-json> \
  --out circle-time-<date>.pdf
```

The cheat-sheet shows timings + segment headers + teacher cues only. Full lyrics, full discussion questions, and pre/post-reading prompts stay in the markdown plan.

## Edge cases

- **Mixed-age request:** calibrate to the younger band; add "stretch prompts" for the older children.
- **Large group (16+):** prefer whole-group call-and-response over individual shares.
- **First week of school:** emphasize name-learning greetings and low-demand SEL.
- **Rainy/indoor-only:** favor finger-plays and seated movement; no "go outside" activities.
- **Sensory-sensitive:** pick visual transition cues over auditory; swap loud activities for breathing or quiet finger-play.
- **Bilingual:** offer key vocabulary and greetings in English + L2 (default Spanish, or user-specified).

## Safety

Age-appropriate content only. No frightening themes in PreK-K. No death, violence, or adult topics in story picks. Religious content only on explicit request.
```

- [ ] **Step 2: Sanity-check length**

Run: `wc -l /Users/piersonmarks/src/tries/2026-04-14-school-skills/skills/circle-time/SKILL.md`
Expected: Under 300 lines.

- [ ] **Step 3: Verify description length + trigger phrases**

Read the frontmatter `description:` field. Count words (~80-110 expected). Confirm ≥6 concrete trigger phrases are embedded.

- [ ] **Step 4: Commit**

```bash
cd /Users/piersonmarks/src/tries/2026-04-14-school-skills
git add skills/circle-time/SKILL.md
git commit -m "feat(circle-time): SKILL.md with triggers, workflow, and output contract"
```

---

## Task 3: Write references/tunes.md (public-domain tune catalog)

**Files:**
- Modify: `skills/circle-time/references/tunes.md`

- [ ] **Step 1: Write full catalog**

Use the Write tool with this content:

```markdown
# Public-Domain Tune Catalog

Use these tunes as the melody for ORIGINAL lyrics. Never include the traditional lyrics of any song with living authorship or known copyright. Every tune below is confirmed public domain (pre-1900 composition or traditional folk melody).

## How to use

1. Pick a tune whose meter matches the theme vocabulary you want.
2. Compose fresh lyrics that fit the meter + syllable count per line.
3. Attribute the melody in the plan as: _"to the tune of <Tune Name>"_.
4. Never output the original traditional lyrics alongside your composition (e.g. do not print "Twinkle, twinkle, little star, how I wonder what you are" — write new words instead).

## Catalog

### Twinkle, Twinkle, Little Star
- **Melody status:** Public domain (French folk tune "Ah! vous dirai-je, maman," 1761).
- **Meter:** 7-7-7-7-7-7 syllables across 6 short lines (AABB CC).
- **Age fit:** PreK-2.
- **Theme fit:** Anything concrete and observable — stars, weather, numbers, letters, animals.
- **Example slot (write your own to match):** "[Concept], [concept], [descriptor] / [Action line, 7 syllables] / ..."

### Mary Had a Little Lamb
- **Melody status:** Public domain (Lowell Mason, 1830; lyrics by Sarah Josepha Hale are also public domain but compose fresh lyrics anyway for variety).
- **Meter:** 7-6-7-6 (four-line verse).
- **Age fit:** PreK-1.
- **Theme fit:** A character + an action (helpers, animals, weekday routines).

### The Wheels on the Bus
- **Melody status:** Public domain (traditional, pre-1939 attribution to Verna Hills is disputed; the melody "Here We Go Round the Mulberry Bush" predates it and is fully public domain). Use the Mulberry Bush melody to be safe and call it "to the tune of The Wheels on the Bus / Mulberry Bush."
- **Meter:** 8-7-8-7 with repeating refrain.
- **Age fit:** PreK-K.
- **Theme fit:** Repetitive action verbs ("The [thing] on the [place] goes [verb] [verb] [verb]").

### Frère Jacques (Are You Sleeping?)
- **Melody status:** Public domain (French nursery, 18th century).
- **Meter:** 4-4-4-4-6-6-4-4 (round-friendly).
- **Age fit:** K-2.
- **Theme fit:** Call-and-response, bilingual options (French, Spanish version "Martinillo" also public domain).

### If You're Happy and You Know It
- **Melody status:** Public domain (Russian folk melody, pre-1900). Modern English lyrics are traditional but also generally treated as public domain; still, write fresh verses for your plan.
- **Meter:** 8-8-8-8 with clap/stomp refrain.
- **Age fit:** PreK-1.
- **Theme fit:** Feelings, body awareness, SEL.

### Row, Row, Row Your Boat
- **Melody status:** Public domain (Eliphalet Oram Lyte, 1852).
- **Meter:** 5-5-9-6-6-6-4 (round-capable).
- **Age fit:** K-2.
- **Theme fit:** Movement, water/weather, imagination.

### London Bridge Is Falling Down
- **Melody status:** Public domain (traditional, 17th century).
- **Meter:** 7-6-7-6 with refrain.
- **Age fit:** PreK-1.
- **Theme fit:** Community, building, repetition.

### The Farmer in the Dell
- **Melody status:** Public domain (German folk, 1826).
- **Meter:** 8-8-8-8 with "hi-ho-the-derry-o" refrain.
- **Age fit:** PreK-K.
- **Theme fit:** Community helpers, sequencing, naming.

### She'll Be Coming 'Round the Mountain
- **Melody status:** Public domain (American spiritual "When the Chariot Comes," pre-1899).
- **Meter:** 13-7-13-5 (long line, short line).
- **Age fit:** K-2.
- **Theme fit:** Anticipation, weekdays, sequencing.

### Old MacDonald Had a Farm
- **Melody status:** Public domain (traditional, pre-1917).
- **Meter:** 8-8-4-4-4-4 with "E-I-E-I-O" refrain.
- **Age fit:** PreK-1.
- **Theme fit:** Animal sounds, sequencing, naming.

### Hickory Dickory Dock
- **Melody status:** Public domain (traditional English, 1744).
- **Meter:** 8-6-6-8 (nursery rhyme).
- **Age fit:** PreK-K.
- **Theme fit:** Time, numbers, animals.

### Skip to My Lou
- **Melody status:** Public domain (American folk, 1840s).
- **Meter:** 7-7-7-7 with refrain.
- **Age fit:** K-2.
- **Theme fit:** Movement, partner activities, dance.

## Forbidden (copyrighted — DO NOT USE)

Never write lyrics to or reference these tunes by name:
- Anything by the Wiggles, Raffi, Laurie Berkner, Kidz Bop, Disney, Sesame Workshop, The Learning Station, Super Simple Songs (post-1997 originals), Baby Shark (Pinkfong), Pete the Cat songs, Daniel Tiger theme, any Hap Palmer or Ella Jenkins composition where copyright is still held.

If unsure whether a tune is public domain, pick one from the catalog above.
```

- [ ] **Step 2: Commit**

```bash
cd /Users/piersonmarks/src/tries/2026-04-14-school-skills
git add skills/circle-time/references/tunes.md
git commit -m "feat(circle-time): public-domain tune catalog with meter + age + theme tags"
```

---

## Task 4: Write references/books.md (picture-book catalog)

**Files:**
- Modify: `skills/circle-time/references/books.md`

- [ ] **Step 1: Write catalog**

Use the Write tool. ~40 titles across evergreen themes. Title + author + one-line theme-oriented summary + age band only. No book text.

```markdown
# Picture-Book Catalog

_Title + author + one-line summary + age band. No excerpts, no full text. Always suggest one primary + one alternative in case a title is unavailable or out of print._

## Feelings / SEL

- **The Color Monster** by Anna Llenas — a monster sorts tangled feelings by color. PreK-K.
- **In My Heart: A Book of Feelings** by Jo Witek — naming and noticing emotions. PreK-1.
- **The Rabbit Listened** by Cori Doerrfeld — how to be with someone who is sad. PreK-2.
- **When Sophie Gets Angry — Really, Really Angry** by Molly Bang — anger regulation. K-2.
- **A Little Spot of Feelings** by Diane Alber — visualizing and labeling emotions. PreK-1.
- **Ruby Finds a Worry** by Tom Percival — naming anxiety and asking for help. K-2.

## Friendship / Kindness / Belonging

- **Last Stop on Market Street** by Matt de la Peña — community and gratitude. K-2. (Newbery, Caldecott Honor.)
- **Each Kindness** by Jacqueline Woodson — small acts of kindness matter. 1-2.
- **The Invisible Boy** by Trudy Ludwig — inclusion of a quiet classmate. K-2.
- **Strictly No Elephants** by Lisa Mantchev — making room for everyone. PreK-1.
- **Be Kind** by Pat Zietlow Miller — what kindness looks like day to day. PreK-1.
- **Chrysanthemum** by Kevin Henkes — names matter; being teased. K-2.

## Identity / Family / Diversity

- **The Family Book** by Todd Parr — every family is different. PreK-K.
- **Hair Love** by Matthew A. Cherry — a dad styles his daughter's hair. PreK-1.
- **Fry Bread** by Kevin Noble Maillard — Native American family traditions. K-2.
- **Julián Is a Mermaid** by Jessica Love — self-expression + unconditional family love. PreK-2.
- **Last Stop on Market Street** by Matt de la Peña — (already listed above; also fits here).
- **All Are Welcome** by Alexandra Penfold — classroom belonging. PreK-1.

## Seasons / Weather / Nature

- **The Snowy Day** by Ezra Jack Keats — a child's winter exploration. PreK-1. (Caldecott.)
- **Leaves** by David Ezra Stein — a young bear experiences fall for the first time. PreK-K.
- **Rain** by Linda Ashman — getting ready on a rainy day. PreK-1.
- **We Are Water Protectors** by Carole Lindstrom — honoring water and nature. 1-2. (Caldecott.)
- **Fletcher and the Falling Leaves** by Julia Rawlinson — saying goodbye to fall. PreK-1.
- **Up in the Garden and Down in the Dirt** by Kate Messner — garden ecology. K-2.

## Letters / Numbers / Early Literacy

- **Chicka Chicka Boom Boom** by Bill Martin Jr. and John Archambault — alphabet romp. PreK-K.
- **LMNO Peas** by Keith Baker — alphabet careers. PreK-K.
- **How Do Dinosaurs Count to Ten?** by Jane Yolen — counting with humor. PreK-K.
- **One Is a Snail, Ten Is a Crab** by April Pulley Sayre — counting by feet. K-1.
- **Tanka Tanka Skunk!** by Steve Webb — syllable rhythm and sound play. PreK-K.
- **Press Here** by Hervé Tullet — interactive counting and colors. PreK-K.

## Community / Helpers

- **Last Stop on Market Street** by Matt de la Peña — (also above).
- **Whose Hands Are These?** by Miranda Paul — community jobs. PreK-1.
- **Maybe Something Beautiful** by F. Isabel Campoy and Theresa Howell — one community changes a neighborhood. K-2.
- **The Day You Begin** by Jacqueline Woodson — being new and being welcomed. K-2.

## Food / Harvest / Apples

- **Apple Farmer Annie** by Monica Wellington — apple harvest. PreK-K.
- **How to Make an Apple Pie and See the World** by Marjorie Priceman — apples around the world. K-2.
- **Thanks for the Feedback, I Think** by Julia Cook — lightly; also see Fry Bread above for harvest framing.

## Bedtime / Quiet Transitions

- **Goodnight Moon** by Margaret Wise Brown — classic wind-down. PreK.
- **Time for Bed** by Mem Fox — animal parents saying goodnight. PreK.
- **Dream Animals** by Emily Winfield Martin — visualizing rest. PreK-K.

## First Week / New School

- **The Kissing Hand** by Audrey Penn — separation comfort. PreK-K.
- **Wemberly Worried** by Kevin Henkes — first-day nerves. PreK-K.
- **School's First Day of School** by Adam Rex — from the school's perspective. K-1.
- **The Name Jar** by Yangsook Choi — a child's name is special. K-2.

## Notes for picking

- If a user requests a religious theme, redirect to nature/seasonal books above unless they explicitly ask for religious picks.
- If a primary title is not available (out of print, not in classroom library), the alternative should be from a different author and equally evergreen.
- Prefer Caldecott / Coretta Scott King / Pura Belpré honorees when possible — they stay in print longer.
```

- [ ] **Step 2: Commit**

```bash
cd /Users/piersonmarks/src/tries/2026-04-14-school-skills
git add skills/circle-time/references/books.md
git commit -m "feat(circle-time): picture-book catalog by theme (title + author only)"
```

---

## Task 5: Write references/finger-plays.md

**Files:**
- Modify: `skills/circle-time/references/finger-plays.md`

- [ ] **Step 1: Write content**

```markdown
# Finger-Plays and Movement Rhymes

Age-appropriate finger-plays and seated movement rhymes. Every entry ships with a seated alternative so children who use wheelchairs or who have low-tone days can fully participate. All rhymes below are either public-domain traditional or original to this skill.

## Five Little Ducks (traditional, public domain)
- **Age:** PreK-K.
- **Motions:** Hold up 5 fingers. Wiggle one down per verse. Quack voices for "quack, quack, quack."
- **Seated alternative:** All motions work seated. Use shoulders for "over the hills and far away" lift instead of standing.
- **Group size:** Any.

## Open Shut Them (traditional, public domain)
- **Age:** PreK.
- **Motions:** Open hands, close hands, clap, walk fingers up to chin, "but do not let them in."
- **Seated alternative:** Native to seated play.
- **Group size:** Any.

## Itsy Bitsy Spider (traditional, public domain)
- **Age:** PreK-K.
- **Motions:** Fingertip-to-fingertip spider climb, rain wiggle, sun arms.
- **Seated alternative:** All motions are hand-only already.
- **Group size:** Any.

## Five Little Monkeys Jumping on the Bed (traditional, public domain)
- **Age:** PreK-1.
- **Motions:** Count down from 5 on fingers; bounce gently.
- **Seated alternative:** Bounce in chair instead of standing.
- **Group size:** Any; loud for large groups — consider "whisper monkeys" variation.

## Head, Shoulders, Knees, and Toes (traditional, public domain)
- **Age:** PreK-1.
- **Motions:** Touch body parts in order, speeding up each round.
- **Seated alternative:** Works seated.
- **Group size:** Any.

## Tony Chestnut (original variant; use generic name)
- **Age:** K-2.
- **Motions:** Toe-knee-chest-nut (four body points to the beat).
- **Seated alternative:** Native.
- **Group size:** Any.

## Pop Goes the Weasel (traditional, public domain melody)
- **Age:** PreK-1.
- **Motions:** Gentle bounce; "pop" = small jump up from seated or standing.
- **Seated alternative:** Chair-pop (hands up on "pop").
- **Group size:** Any.

## Two Little Blackbirds (traditional, public domain)
- **Age:** PreK-K.
- **Motions:** Index fingers on each hand as birds; "fly away Jack, fly away Jill" with hands behind back.
- **Seated alternative:** Native.
- **Group size:** Any.

## Where Is Thumbkin? (traditional, public domain; to the tune of Frère Jacques)
- **Age:** PreK-K.
- **Motions:** Hide hands behind back, pop out each finger in turn.
- **Seated alternative:** Native.
- **Group size:** Any.

## Standing movement activities (for non-accommodated groups)

### Follow the Leader
- **Age:** PreK-2. Leader does an action (hop, tiptoe, stretch). Group copies.
- **Seated alternative:** Arms-only Follow the Leader.
- **Group size:** Any; for 16+, split into two circles.

### Freeze Dance
- **Age:** PreK-2. Music plays, children move; music stops, they freeze.
- **Seated alternative:** "Freeze hands" — hand-dance only.
- **Group size:** Any.

### Bean Bag Balance
- **Age:** K-2. Walk a short line with a beanbag on head.
- **Seated alternative:** Balance beanbag on knee while counting to 20.
- **Group size:** Small to medium. For large groups, rotate in pairs.

## Selection rules

- **PreK:** prefer finger-plays over whole-body movement when group is large or indoors.
- **Sensory-sensitive:** prefer slow, low-volume finger-plays (Itsy Bitsy, Where Is Thumbkin); avoid Five Little Monkeys (loud).
- **Mobility accommodations:** always include the seated alternative inline in the plan.
- **Mixed-age:** pick an activity from the younger band's list.
```

- [ ] **Step 2: Commit**

```bash
cd /Users/piersonmarks/src/tries/2026-04-14-school-skills
git add skills/circle-time/references/finger-plays.md
git commit -m "feat(circle-time): finger-plays + movement rhymes with seated alternatives"
```

---

## Task 6: Write references/transitions.md

**Files:**
- Modify: `skills/circle-time/references/transitions.md`

- [ ] **Step 1: Write content**

```markdown
# Transition Strategies

One-line cues between every segment of circle time. Transitions are where circle time falls apart — plan them.

## Call-and-response chants

- **Teacher:** "Hocus pocus" → **Students:** "Everybody focus."
- **Teacher:** "One two three, eyes on me" → **Students:** "One two, eyes on you."
- **Teacher:** "Mac and cheese" → **Students:** "Everybody freeze."
- **Teacher:** "Ready set" → **Students:** "You bet!"
- **Teacher:** "Class class" → **Students:** "Yes yes" (match the teacher's intonation).

## Sung transitions (to public-domain tunes, compose original lyrics)

- **Tune of "Frère Jacques":** "Time for [song / story / sharing], time for [segment], come and sit, come and sit, criss-cross applesauce, criss-cross applesauce, [segment] time, [segment] time."
- **Tune of "Twinkle Twinkle":** "[Segment] time is here today / Come together, quiet way / Hands in lap and eyes on me / Listening ears, as quiet as can be / [Segment] time is here today / Let's begin without delay."
- **Tune of "London Bridge":** "[Segment] is starting now, starting now, starting now / [Segment] is starting now, come and join us."

## Visual cues (for sensory-sensitive and nonverbal students)

- **Picture schedule card flip** — teacher flips to the next segment's card.
- **Transition light** — small LED or flashlight changes color between segments.
- **Hand-signal chain** — teacher raises one hand; students who see it raise theirs; builds silently.
- **Sand timer** — 30-second timer visible to the group during transition.

## Movement transitions

- **"Shake it out"** — 10 seconds of shaking hands, then freeze.
- **"Walking feet"** — transition from circle to line with "walking feet" cue.
- **"Make your body small"** — for moving from standing to seated.

## Timing guardrails

- Each transition should take **≤30 seconds**. If it takes longer, pick a shorter cue next time.
- Use the **same** greeting and closing transitions every day — predictability regulates the group.
- Vary mid-plan transitions only after the routine is set (usually 2 weeks in).

## Example stitched plan (for reference)

> "Great greeting, friends! **Criss-cross applesauce, hands in your lap — it's song time.** [song] Wow, you used such big voices. **Let's put our calendar eyes on — what day is today?** [calendar] **Now we're going to talk about [theme]. I'm going to ask a question and you'll have thinking time before we share.** [discussion] **Time to wiggle! Everybody stand up if you can, or scoot to the edge of your spot if you're staying seated.** [movement] **Walking feet, whisper voices, come get comfy on your story square.** [story] **Before we say goodbye, let's check in with our hearts. Thumbs up if you're feeling great, thumb sideways if you're so-so, thumb down if you're having a tough morning.** [SEL] **Last song of circle time, everybody!** [closing]"

## Do not

- Do not use "shhh" as a transition. It escalates.
- Do not tell students to "be quiet" without offering what TO do ("eyes on me," "hands in lap").
- Do not chain more than two transitions back-to-back — students need time in each segment.
```

- [ ] **Step 2: Commit**

```bash
cd /Users/piersonmarks/src/tries/2026-04-14-school-skills
git add skills/circle-time/references/transitions.md
git commit -m "feat(circle-time): transition chants + visual cues + stitched example"
```

---

## Task 7: Write references/sel-frameworks.md

**Files:**
- Modify: `skills/circle-time/references/sel-frameworks.md`

- [ ] **Step 1: Write content**

```markdown
# SEL Frameworks for Circle Time

## Default: Responsive Classroom (Morning Meeting)

Non-proprietary four-component structure that maps cleanly to our output sections. Developed by the Center for Responsive Schools.

1. **Greeting** — every child is greeted by name by at least one other person.
2. **Sharing** — 2-3 children share news; others respond with comments or questions.
3. **Group Activity** — a quick shared experience (song, chant, game).
4. **Morning Message** — a written note from the teacher that previews the day.

Use these as the backbone of every plan; our output sections map as: greeting → greeting, sharing → theme discussion, group activity → song/movement, morning message → closing + preview.

## Alternative: Conscious Discipline

Developed by Becky Bailey. Emphasizes co-regulation and brain-smart connection routines. Useful language to borrow for SEL check-in phrasing:

- **"I wish you well"** closing ritual — each child names another child and wishes them well.
- **"Safekeepers"** framing — the teacher and students are safekeepers of the classroom.
- **S.T.A.R.** breathing (Smile, Take a deep breath, And Relax) — a calming cue.
- **"You are in charge of your [body / words / thoughts]"** — self-regulation language.

Offer Conscious Discipline phrasing when the user asks for SEL-forward or regulation-forward plans.

## SEL Check-in Protocols

### Thumbs scale (PreK-K)
- Thumbs up = I'm feeling great.
- Thumbs sideways = I'm so-so.
- Thumbs down = I'm having a tough morning.
- Teacher script: "Show me your thumb. I'll look around so everyone feels seen. You don't have to say why."

### Color scale (K-2)
- Green = calm and ready.
- Yellow = a little worried or wiggly.
- Red = big feelings.
- Blue = sad or low-energy.
- Teacher script: "Point to the color that matches your feelings. No color is bad. All feelings are welcome."

### Feelings wheel point (1-2)
- Teacher displays a simple 8-emotion wheel (happy, sad, angry, scared, excited, tired, calm, confused).
- Students point silently or name one feeling aloud.
- Teacher script: "Find the face that's closest to yours this morning. You can share, or you can keep it inside — both are okay."

### One-word share (2nd, advanced groups)
- Each child says one feeling word in a go-around.
- Teacher models first: "I'm feeling [word] because [reason]."
- Children can pass.

## Framework-neutral principles

Regardless of framework:
- **Predictability** matters more than novelty.
- **Name feelings without fixing them.** Don't rush past "I'm sad" to "but let's cheer up!"
- **Pass is always an option.** Never force a share.
- **Keep it short.** 1-2 minutes maximum for SEL in circle time; longer conversations happen in small groups later.

## When to swap frameworks

- Use Responsive Classroom by default.
- Use Conscious Discipline phrasing when the user mentions "regulation," "co-regulation," "trauma-informed," "calming corner," or "safekeepers."
- Use either when the user mentions "SEL," "feelings," "check-in," "community building," or "morning meeting."
```

- [ ] **Step 2: Commit**

```bash
cd /Users/piersonmarks/src/tries/2026-04-14-school-skills
git add skills/circle-time/references/sel-frameworks.md
git commit -m "feat(circle-time): SEL framework briefs (Responsive Classroom default + Conscious Discipline)"
```

---

## Task 8: Write references/accommodations.md

**Files:**
- Modify: `skills/circle-time/references/accommodations.md`

- [ ] **Step 1: Write content**

```markdown
# Accommodations

When a user flags any of these needs, apply the relevant substitutions IN the plan (not as footnotes).

## Bilingual / ELL

- **Default L2:** Spanish. Change if the user specifies another language.
- **Greeting:** offer in English AND L2. Example — "Good morning, friends! / ¡Buenos días, amigos!"
- **Vocabulary anchors:** print 2-3 key theme words in both languages in the header.
- **Songs:** if the tune has a well-known public-domain L2 version (e.g. Frère Jacques / Martinillo), compose matching lyrics in both languages.
- **Visual supports:** add picture cues for every anchor word.
- **Discussion questions:** keep sentence length to the L2 band even for English-dominant peers so ELL students can follow.

## Sensory sensitivities

- **Swap loud movement** (Five Little Monkeys, Freeze Dance) for quiet finger-plays (Itsy Bitsy, Where Is Thumbkin, Open Shut Them).
- **Transitions:** use visual cues (picture card flip, transition light, sand timer) instead of claps or chants.
- **Song volume:** note "soft voices" in the teacher cue line for the song segment.
- **Offer a "quiet spot"** outside the circle for the first few minutes if needed.
- **Predictable sequence:** never skip or reorder segments on a sensory-sensitive day; the structure itself is the accommodation.

## Mobility / wheelchair / low-tone days

- **Every movement activity ships with a seated alternative** inline — always list it, not as an afterthought.
- **Circle shape:** prefer a U-shape or oval so a wheelchair user can sit in the arc, not awkwardly at the edge of a tight circle.
- **Hand motions:** use upper-body motions; avoid "jump" or "stomp" as the only version.
- **Partner work:** let students pick partners or sit next to a peer buddy.

## Nonverbal communicators / AAC users

- **Check-ins:** offer point-to-picture or AAC device paths, not just spoken answers.
- **Thumb scale** works well — no speech required.
- **Greeting:** wave, sign, or button-press greetings count.
- **Sharing:** offer "show, don't tell" — hold up an object, point to a picture, or press a pre-recorded message.
- **Pacing:** leave a 5-second pause after each prompt before moving on.

## Religious-neutral

- **Default to nature / seasonal framing** for holidays: harvest (not Thanksgiving specifically), lights / long nights (not Christmas / Hanukkah / Diwali specifically), new year, spring / new beginnings.
- **Never assume family religious practice** in discussion questions. Use "What does your family do in the fall?" not "What does your family do for Thanksgiving?"
- **Book picks:** use the non-religious alternatives in `books.md`.
- **Religious content** is offered only when the user explicitly requests (e.g. "we're a church preschool, can you include a Bible verse?"). Even then, default to widely loved inclusive themes (kindness, gratitude, friendship) rather than doctrine.

## Inclusive family language

- Say **"grown-up at home"** or **"family"** — not "mom and dad" or "parents."
- Say **"the people who love you"** — not "your mom."
- Book picks prefer diverse authors and diverse family structures by default.
- Never ask students to bring in a "family photo with mom and dad" — ask for "a photo of someone who loves you."
- **First-week exception:** if asking about family roles for a community-helpers theme, frame as "grown-ups at home and jobs they do."

## Mixed accommodations

Children often need more than one. Layer substitutions — e.g., bilingual + sensory = Spanish-English quiet finger-play with visual transition cues.

When layering, **always calibrate to the most-limiting need first** (sensory > mobility > language > neutrality), then add the others. Never drop a required accommodation to make a "cuter" plan.
```

- [ ] **Step 2: Commit**

```bash
cd /Users/piersonmarks/src/tries/2026-04-14-school-skills
git add skills/circle-time/references/accommodations.md
git commit -m "feat(circle-time): accommodations — bilingual, sensory, mobility, AAC, religious-neutral, inclusive family"
```

---

## Task 9: Write references/cheatsheet_template.html

**Files:**
- Modify: `skills/circle-time/references/cheatsheet_template.html`

- [ ] **Step 1: Write template**

This is the HTML the shared `pdf_render.py` Playwright-based renderer consumes. It must accept a small JSON data object with plan fields. Shape: `{ "theme": "...", "age": "...", "duration": "...", "date": "...", "segments": [{ "name": "Greeting", "minutes": 2, "cue": "..." }, ...], "materials": ["..."] }`. The template uses Jinja-style `{{ ... }}` placeholders; the shared script is assumed to support a simple template engine. If it does not, the script invocation can receive a pre-rendered HTML string — document that fallback in SKILL.md if needed.

Use the Write tool with:

```html
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Circle Time Cheat Sheet</title>
<style>
  @page { size: Letter; margin: 0.5in; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #222; }
  header { border-bottom: 2px solid #222; padding-bottom: 8px; margin-bottom: 12px; }
  h1 { font-size: 22pt; margin: 0; }
  .meta { font-size: 10pt; color: #555; }
  .materials { font-size: 10pt; background: #f4f4f4; padding: 6px 10px; border-left: 3px solid #222; margin: 10px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #ccc; vertical-align: top; font-size: 11pt; }
  th { background: #eee; }
  .min { width: 60px; font-weight: bold; text-align: right; }
  .name { width: 140px; font-weight: bold; }
  .cue { color: #333; font-style: italic; }
  footer { margin-top: 14px; font-size: 9pt; color: #777; }
</style>
</head>
<body>
<header>
  <h1>Circle Time — {{ theme }}</h1>
  <div class="meta">Age: {{ age }} &middot; Duration: {{ duration }} min &middot; {{ date }}</div>
</header>

<div class="materials"><strong>Materials:</strong> {{ materials | join(", ") }}</div>

<table>
  <thead><tr><th class="min">Min</th><th class="name">Segment</th><th>Teacher Cue</th></tr></thead>
  <tbody>
  {% for s in segments %}
    <tr><td class="min">{{ s.minutes }}</td><td class="name">{{ s.name }}</td><td class="cue">{{ s.cue }}</td></tr>
  {% endfor %}
  </tbody>
</table>

<footer>Keep plan markdown nearby for full lyrics, discussion questions, and book prompts. Cheat-sheet shows cues + timing only.</footer>
</body>
</html>
```

- [ ] **Step 2: Note the script contract in SKILL.md (if not already)**

Re-read the "Printable cheat-sheet" section of `SKILL.md`. Confirm the documented invocation matches this template's data shape. Edit SKILL.md only if there's a mismatch. (In Task 2's SKILL.md, the invocation is already documented.)

- [ ] **Step 3: Commit**

```bash
cd /Users/piersonmarks/src/tries/2026-04-14-school-skills
git add skills/circle-time/references/cheatsheet_template.html
git commit -m "feat(circle-time): printable cheat-sheet HTML template"
```

---

## Task 10: Write evals/evals.json (5 prompts with assertions)

**Files:**
- Modify: `skills/circle-time/evals/evals.json`

- [ ] **Step 1: Write full evals file**

```json
{
  "skill": "circle-time",
  "description": "Five end-to-end prompts covering age bands, themes, durations, and accommodations.",
  "evals": [
    {
      "id": "prek-apples-15",
      "prompt": "PreK circle time about apples, 15 minutes",
      "assertions": [
        { "type": "section_present", "sections": ["greeting", "song", "discussion", "movement", "story", "sel", "closing"] },
        { "type": "duration_within", "target_minutes": 15, "tolerance_minutes": 2 },
        { "type": "song_has_tune_attribution", "match": "to the tune of" },
        { "type": "song_has_original_lyrics_minimum_lines", "min_lines": 4 },
        { "type": "book_has_title_and_author", "alternative_required": true },
        { "type": "age_language_heuristic", "max_words_per_sentence": 9 },
        { "type": "transition_cue_between_every_segment" },
        { "type": "no_copyrighted_song_names", "blocklist": ["Baby Shark", "Let It Go", "Daniel Tiger", "Wiggles", "Raffi"] }
      ]
    },
    {
      "id": "k-feelings-20-calendar",
      "prompt": "Kindergarten morning meeting about feelings, 20 min, include calendar",
      "assertions": [
        { "type": "section_present", "sections": ["greeting", "song", "calendar", "discussion", "movement", "story", "sel", "closing"] },
        { "type": "duration_within", "target_minutes": 20, "tolerance_minutes": 2 },
        { "type": "sel_checkin_protocol_named", "protocols": ["thumbs", "colors", "feelings wheel"] },
        { "type": "book_has_title_and_author", "alternative_required": true },
        { "type": "song_has_tune_attribution", "match": "to the tune of" },
        { "type": "calendar_segment_has_day_of_week_and_weather" }
      ]
    },
    {
      "id": "first-grade-letter-b-10",
      "prompt": "1st grade circle time for letter B, 10 minutes",
      "assertions": [
        { "type": "section_present", "sections": ["greeting", "song", "discussion", "movement", "story", "sel", "closing"] },
        { "type": "duration_within", "target_minutes": 10, "tolerance_minutes": 2 },
        { "type": "theme_vocabulary_present", "letter": "B", "min_b_words": 3 },
        { "type": "song_has_original_lyrics_minimum_lines", "min_lines": 4 },
        { "type": "book_has_title_and_author", "alternative_required": true }
      ]
    },
    {
      "id": "2nd-grade-kindness-sel-15",
      "prompt": "2nd grade morning meeting SEL check-in about kindness, 15 minutes",
      "assertions": [
        { "type": "section_present", "sections": ["greeting", "song", "discussion", "movement", "story", "sel", "closing"] },
        { "type": "duration_within", "target_minutes": 15, "tolerance_minutes": 2 },
        { "type": "sel_checkin_protocol_named", "protocols": ["thumbs", "colors", "feelings wheel", "one-word share"] },
        { "type": "discussion_has_reflective_question", "keywords": ["proud", "felt", "remember", "time when"] },
        { "type": "book_has_title_and_author", "alternative_required": true }
      ]
    },
    {
      "id": "prek-rainy-sensory",
      "prompt": "PreK circle time, rainy indoor day, small group, one child with sensory sensitivities",
      "assertions": [
        { "type": "section_present", "sections": ["greeting", "song", "discussion", "movement", "story", "sel", "closing"] },
        { "type": "duration_within", "target_minutes": 15, "tolerance_minutes": 2 },
        { "type": "accommodation_mentioned", "keywords": ["sensory", "quiet", "visual cue", "soft", "seated"] },
        { "type": "no_outdoor_activities" },
        { "type": "movement_is_finger_play_or_seated" },
        { "type": "transition_cue_style", "prefers": "visual" }
      ]
    }
  ]
}
```

- [ ] **Step 2: Validate JSON**

Run: `python3 -c "import json; json.load(open('/Users/piersonmarks/src/tries/2026-04-14-school-skills/skills/circle-time/evals/evals.json'))"`
Expected: exits 0 with no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/piersonmarks/src/tries/2026-04-14-school-skills
git add skills/circle-time/evals/evals.json
git commit -m "feat(circle-time): evals — 5 prompts with structural + content assertions"
```

---

## Task 11: Manual smoke test — Run the skill end-to-end on one eval prompt

**Files:**
- No writes. Pure verification.

- [ ] **Step 1: Load skill in a Claude Code session**

Open a new Claude Code session in the repo root. Confirm `/plugin list` or the skill-resolver recognizes `circle-time` (mechanism depends on how skills are loaded locally during development — usually symlinked or copied into `~/.claude/skills/`).

If the skill isn't yet installed locally, copy it:

```bash
mkdir -p ~/.claude/skills/circle-time
cp -r /Users/piersonmarks/src/tries/2026-04-14-school-skills/skills/circle-time/* ~/.claude/skills/circle-time/
```

- [ ] **Step 2: Issue the first eval prompt**

Prompt Claude: "PreK circle time about apples, 15 minutes"

- [ ] **Step 3: Manually verify the assertions for `prek-apples-15`**

Read the generated output and confirm:
1. All 7 required sections present (greeting, song, discussion, movement, story, SEL, closing).
2. Times add up within 13-17 minutes.
3. Song has a "to the tune of ..." line.
4. Song has ≥4 lines of ORIGINAL lyrics — the lyrics should NOT be the traditional lyrics of the named tune.
5. Book section has title + author + one alternative.
6. Sentences are short (PreK-appropriate).
7. Transition cues appear between every segment.
8. No copyrighted song titles in output.

- [ ] **Step 4: Repeat for eval #5 (sensory accommodations)**

Prompt: "PreK circle time, rainy indoor day, small group, one child with sensory sensitivities"

Verify sensory accommodations are applied (quiet activities, visual cues, no outdoor, finger-play or seated movement).

- [ ] **Step 5: File any bugs found back into SKILL.md or references**

If assertions fail, edit the offending file to fix the prompt/reference. Re-run the prompt. Commit fixes with `fix(circle-time): <what>`.

- [ ] **Step 6: Final commit (if any changes)**

```bash
cd /Users/piersonmarks/src/tries/2026-04-14-school-skills
git add skills/circle-time
git commit -m "fix(circle-time): smoke-test corrections" || echo "no changes to commit"
```

---

## Self-Review Checklist (completed during plan drafting)

**Spec coverage:**
- Triggers → Task 2 `description:` field (12+ phrases embedded). ✓
- Inputs → Task 2 SKILL.md inputs section. ✓
- Outputs (11 items) → Task 2 Output section + Task 9 cheat-sheet template. ✓
- Workflow → Task 2 Workflow section. ✓
- References (6 of them) → Tasks 3-8. ✓
- Age calibration table → Task 2 Timing section. ✓
- Evals (5 prompts w/ assertions) → Task 10. ✓
- Edge cases → Task 2 Edge cases section + Task 8 accommodations. ✓
- Locked default (original lyrics to PD tunes; title + author only for books) → Task 2 + Task 3 + Task 4. ✓
- Shared `pdf_render.py` usage only → Tasks 2 + 9. No new skill-specific scripts created. ✓

**Placeholder scan:** No "TODO," "TBD," or "fill in details" remain. Every step has concrete file content or a concrete command.

**Type / naming consistency:** Reference filenames are consistent across SKILL.md references index (Task 2) and the individual reference tasks (3-8). Cheat-sheet data shape (theme/age/duration/date/segments/materials) is consistent between Task 2 invocation doc and Task 9 template.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-14-circle-time-plan.md`. Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks.
2. **Inline Execution** — execute tasks in this session using executing-plans with checkpoints.

Which approach?
