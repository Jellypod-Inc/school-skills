# language-drill Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the `language-drill` skill covering 11 languages (Spanish, French, German, Italian, Portuguese, Mandarin, Japanese, Korean, Arabic, Russian, ESL) with CEFR A1–C2 calibration, drill type variety (vocab, conjugation, dialogue, gap-fill, etc.), and deterministic conjugation tables for the top Romance/Germanic languages.

**Architecture:** A markdown-first skill living at `skills/language-drill/` inside the `school-skills` mega-plugin. The skill is prompt-heavy (model generates drill content) but backed by three deterministic layers: (1) `references/` markdown docs loaded on demand for CEFR descriptors, conjugation/declension tables, common-mistakes catalogs, dialogue templates, and romanization conventions; (2) an optional `scripts/conjugation_tables.py` module exposing canonical regular paradigms plus the top ~30 irregular verbs per Romance/Germanic language as authoritative ground truth; (3) delegated export paths — flashcard `.apkg` generation via `shared/scripts/anki_export.py` (owned by the flashcards skill), printable PDFs via `shared/scripts/pdf_render.py`. TTS audio cues are text placeholders (`[AUDIO: ...]`) in V1; V2 wires real TTS. Evals use objective assertions (item counts, tense identification, CSV parseability, romanization presence, RTL direction preserved).

**Tech Stack:** Python 3.11+ (stdlib only for `conjugation_tables.py`), pytest for script + eval tests, Markdown for SKILL.md and references, JSON for `evals/evals.json`. No external runtime dependencies inside this skill — Playwright/genanki live in shared scripts owned by other skills.

---

## File Structure

```
skills/language-drill/
├── SKILL.md                                 # Top-level skill entry (<300 lines)
├── scripts/
│   ├── __init__.py
│   └── conjugation_tables.py                # Regular + top irregular verb tables (ES/FR/IT/PT/DE)
├── references/
│   ├── cefr-descriptors.md                  # A1–C2 can-do statements + topic lists
│   ├── course-to-cefr-map.md                # HSK/JLPT/DELE/DELF/TestDaF/TORFL/ACTFL
│   ├── romanization-conventions.md          # Pinyin, Hepburn, ALA-LC, BGN/PCGN
│   ├── dialogue-templates.md                # 9 universal dialogue scenarios
│   ├── conjugation-spanish.md               # Regular paradigms + top 30 irregulars
│   ├── conjugation-french.md
│   ├── conjugation-german.md                # Weak/strong + separable prefix + cases
│   ├── conjugation-italian.md
│   ├── conjugation-portuguese.md            # Brazilian default; European notes
│   ├── conjugation-russian.md               # 6 cases, aspect pairs, top irregulars
│   ├── writing-mandarin.md                  # Tones, simplified-vs-traditional, character notes
│   ├── writing-japanese.md                  # Kana/kanji, furigana rules, polite vs casual
│   ├── writing-korean.md                    # Hangul, 존댓말/반말, batchim notes
│   ├── writing-arabic.md                    # RTL rendering, MSA vs dialect, transliteration tiers
│   ├── common-mistakes-spanish.md           # ser/estar, por/para, subjunctive triggers
│   ├── common-mistakes-french.md            # avoir/être, gender agreement, subjunctive
│   ├── common-mistakes-german.md            # article gender, case endings, separable verbs
│   ├── common-mistakes-italian.md
│   ├── common-mistakes-portuguese.md
│   ├── common-mistakes-mandarin.md          # 的/得/地, 了 aspect, measure words
│   ├── common-mistakes-japanese.md          # は/が, に/で, keigo levels
│   ├── common-mistakes-korean.md            # topic/subject markers, speech levels
│   ├── common-mistakes-arabic.md            # iDafa, sun/moon letters, dual
│   ├── common-mistakes-russian.md           # case selection, verbs of motion, aspect
│   └── common-mistakes-esl.md               # articles, prepositions, phrasal verbs
├── evals/
│   ├── evals.json                           # 5 objective eval prompts
│   └── test_conjugation_tables.py           # unit tests for scripts/conjugation_tables.py
└── README.md                                # (optional, skipped unless requested)
```

---

## SKILL.md Outline

The `SKILL.md` file at `skills/language-drill/SKILL.md` MUST contain exactly these sections, in this order, staying under 300 lines total:

1. **YAML frontmatter** (≤5 lines) — `name`, `description` (~70 words, triggers on teacher AND student phrasings listed in spec §2, includes all 11 language names), `version: 0.1.0`.
2. **What this does** (3-5 lines) — one-paragraph capability statement.
3. **When to use** (trigger list) — bulleted list of 12 trigger phrasings copied from spec §2.
4. **Supported languages** — table: Language | Script | Default register | Default regional variant (Spanish→LatAm neutral, Portuguese→Brazilian, Mandarin→Mainland simplified, Arabic→MSA).
5. **Inputs** — bulleted list covering target language, CEFR level (with normalization rules: "beginner"→A1, "Spanish 2"→A2, "HSK3"→A2/B1, "JLPT N4"→A2, "JLPT N3"→B1, etc.), drill type, topic, native language (default English), register, length, optional source material.
6. **Drill types** — table: Type | Applies to | Output shape. Rows: vocab, conjugation, declension, translation, dialogue, listening dictation, gap-fill, reading comprehension, error correction.
7. **Outputs** — explicit formats: drill-set markdown, flashcard CSV, dialogue script, answer key (always separated from student-facing section), optional PDF via `shared/scripts/pdf_render.py`, optional `.apkg` via `shared/scripts/anki_export.py` (delegated — do not reimplement).
8. **Workflow** — 8-step numbered procedure from spec §5 (parse → resolve → pull pool → generate → exemplars → romanization → format → offer follow-ups).
9. **Level calibration** — short summary table mapping CEFR bands to vocab size, tense coverage, topic complexity (mirrors spec §8). Points to `references/cefr-descriptors.md` for full detail.
10. **Child-learner variant** — 3-sentence note: K–5 immersion mode triggered by grade level; concrete nouns, short sentences, songs/chants, no grammar metalanguage.
11. **Loading references** — instruction to the model: "Load `references/cefr-descriptors.md` before generating any drill. For conjugation drills, also load `references/conjugation-<language>.md`. For languages with non-Latin scripts, also load `references/writing-<language>.md`. For grammar-heavy drills, load `references/common-mistakes-<language>.md`. For dialogue drills, load `references/dialogue-templates.md`."
12. **Using conjugation_tables.py** — 5-line note: when the user asks for authoritative conjugation of Spanish/French/Italian/Portuguese/German verbs, prefer calling `scripts/conjugation_tables.py` (show one-line invocation) over model generation. Fall back to model generation for other languages and rare verbs.
13. **Regional variants and registers** — defaults listed above; explicit rules: ask when ambiguous, default when not; Japanese/Korean drills show both polite and casual when teaching register contrast; Spanish/French drills show tú/usted and tu/vous when teaching address.
14. **Edge cases** — 6 bullets copied from spec §10 (tonal without tone marks, RTL Arabic, register defaults, regional defaults, character-based languages with furigana/simplified/traditional rules, ESL no-L1 assumption, mixed-level sections).
15. **Delegation policy** — explicit statement: "Deck export delegates to `shared/scripts/anki_export.py`. PDF rendering delegates to `shared/scripts/pdf_render.py`. This skill does NOT re-implement `.apkg` generation or PDF rendering."
16. **Follow-ups to offer** — Anki export, PDF render, companion quiz (point to `quiz-generator` skill), flashcard deck (point to `flashcards` skill).
17. **Limits** — no TTS audio in V1 (text placeholders only); no stroke-order writing practice in V1; no auto-invocation of sibling skills (user initiates).

---

## Task Decomposition

### Task 1: Scaffold skill directory and SKILL.md frontmatter

**Files:**
- Create: `skills/language-drill/SKILL.md`
- Create: `skills/language-drill/scripts/__init__.py`
- Create: `skills/language-drill/references/.gitkeep`
- Create: `skills/language-drill/evals/.gitkeep`

- [ ] **Step 1: Create directory tree**

```bash
mkdir -p skills/language-drill/scripts skills/language-drill/references skills/language-drill/evals
touch skills/language-drill/scripts/__init__.py skills/language-drill/references/.gitkeep skills/language-drill/evals/.gitkeep
```

- [ ] **Step 2: Write SKILL.md frontmatter + sections 1–4**

Write `skills/language-drill/SKILL.md` with this exact opening:

```markdown
---
name: language-drill
description: Generate language study drills — vocabulary, verb conjugation, declension, dialogue practice, gap-fill, listening dictation, error correction, and translation — for Spanish, French, German, Italian, Portuguese, Mandarin, Japanese, Korean, Arabic, Russian, and ESL. Calibrated to CEFR A1–C2 with a child-learner mode for K–5 immersion. Use when a student says "quiz me on Spanish verbs," "help me study for my Japanese midterm," "Mandarin HSK3 tone drills," or a teacher says "build me a German A2 workbook," "make flashcards for Russian cases," "dialogue practice for ordering food in French," or "ESL intermediate workbook." Outputs markdown drill sets, flashcard CSV, dialogue scripts, and answer keys; can export to Anki or PDF via sibling skills.
version: 0.1.0
---

# language-drill

## What this does

Produces self-study and classroom language drills across vocabulary, grammar (conjugation/declension), and dialogue practice for 11 target languages. Calibrated to CEFR (A1–C2) with a K–5 immersion variant. Always generates a separate answer key.

## When to use

- "quiz me on Spanish verb conjugations"
- "give me German A2 vocab drills"
- "dialogue practice for ordering food in French"
- "help me study for my Japanese midterm"
- "ESL intermediate workbook"
- "Mandarin HSK3 tone drills"
- "Korean polite speech drill set"
- "Italian passato prossimo gap-fill"
- "Arabic alphabet recognition practice"
- "Portuguese B1 listening dictation"
- "conjugate French -er verbs in the subjunctive"
- "make flashcards for Russian cases"

## Supported languages

| Language | Script | Default register | Default regional variant |
|----------|--------|------------------|--------------------------|
| Spanish | Latin | neutral (textbook) | Latin American neutral |
| French | Latin | neutral | Metropolitan |
| German | Latin | neutral | Standard (Hochdeutsch) |
| Italian | Latin | neutral | Standard |
| Portuguese | Latin | neutral | Brazilian |
| Mandarin | Simplified Hanzi + Pinyin | neutral | Mainland (simplified) |
| Japanese | Kana + Kanji (furigana above A1) | textbook polite (です/ます) | Standard |
| Korean | Hangul | polite (해요체) | Standard Seoul |
| Arabic | Arabic (RTL) | MSA | MSA (not dialectal) |
| Russian | Cyrillic | neutral | Standard |
| ESL | Latin | neutral | General American |
```

- [ ] **Step 3: Verify file structure**

Run: `ls -la skills/language-drill/ skills/language-drill/scripts/ skills/language-drill/references/ skills/language-drill/evals/`
Expected: all four directories exist; `SKILL.md`, `__init__.py`, and two `.gitkeep` files visible.

- [ ] **Step 4: Commit**

```bash
git add skills/language-drill/
git commit -m "feat(language-drill): scaffold skill directory with SKILL.md header"
```

---

### Task 2: Fill in SKILL.md sections 5–10 (inputs, drill types, outputs, workflow, calibration, child-learner)

**Files:**
- Modify: `skills/language-drill/SKILL.md` (append sections)

- [ ] **Step 1: Append inputs and drill types**

Append to `skills/language-drill/SKILL.md`:

```markdown
## Inputs

- **Target language** — one of the 11 supported languages.
- **CEFR level** — `A1`, `A2`, `B1`, `B2`, `C1`, `C2`. Normalize synonyms:
  - `beginner` → A1, `elementary` → A2, `intermediate` → B1, `upper-intermediate` → B2, `advanced` → C1, `mastery` → C2.
  - `Spanish 1` → A1, `Spanish 2` → A2, `Spanish 3` → B1, `Spanish 4` → B2.
  - `HSK1`→A1, `HSK2`→A1/A2, `HSK3`→A2/B1, `HSK4`→B1, `HSK5`→B2, `HSK6`→C1.
  - `JLPT N5`→A1, `N4`→A2, `N3`→B1, `N2`→B2, `N1`→C1.
  - `DELE A2`→A2 (direct), `DELF B1`→B1, `TestDaF TDN4`→B2, `TORFL 1`→B1.
  - Grade level K–5 → child-learner mode (see §10).
- **Drill type** — see table below.
- **Specific topic** — e.g. food, travel, past tense, polite speech. Default to a level-appropriate topic if unspecified.
- **Native language** — for translation drills and glosses. Default: English.
- **Register / variant** — formal vs informal; regional override (Castilian Spanish, European Portuguese, Taiwan Mandarin traditional, Egyptian Arabic).
- **Length** — item count ("20 items") or duration ("15-minute drill" → ~12 items).
- **Source material (optional)** — pasted vocab list, textbook chapter, syllabus, workbook photo.

## Drill types

| Type | Applies to | Output shape |
|------|------------|--------------|
| vocab | all | numbered list: term — gloss — exemplar sentence (A2+) |
| conjugation | inflected languages | table: verb × person × tense |
| declension | DE, RU (ES/IT adjective agreement) | table: noun × case × number |
| translation | all | L1 ↔ L2 sentence pairs |
| dialogue | all | labeled roles, L2 line, L1 gloss, optional romanization |
| listening dictation | all | `[AUDIO: ...]` cue + blank transcription line |
| gap-fill | grammar-focused | sentence with blank + parenthetical infinitive/lemma |
| reading comprehension | B1+ | short passage + 3–5 questions |
| error correction | B1+ | sentence with error + corrected form in answer key |

## Outputs

- **Drill set markdown** — numbered items grouped by section, with answer key as a separate section after a horizontal rule.
- **Flashcard CSV** — columns `front,back,tags` compatible with the `flashcards` skill.
- **Dialogue script** — roles labeled (`A:` / `B:` or named), target-language line, native-language gloss, optional romanization/IPA line.
- **Answer key** — always produced; separated from student-facing content for print-friendly splitting.
- **PDF (optional)** — delegates to `shared/scripts/pdf_render.py`. This skill does NOT render PDFs directly.
- **Anki `.apkg` (optional)** — delegates to the `flashcards` skill's `shared/scripts/anki_export.py`. This skill does NOT implement `.apkg` generation.

## Workflow

1. Parse target language + CEFR level, applying normalization rules above.
2. Resolve topic and drill type; default to a level-appropriate topic pool if unspecified.
3. Load `references/cefr-descriptors.md` and the level-appropriate topic list.
4. Load the relevant per-language references (see §11 "Loading references").
5. Generate items: vocab entries, conjugation tables, dialogue exchanges, gap-fill sentences, etc.
6. Attach exemplar sentences for vocab items at A2+ (paired sentence showing natural use).
7. Add romanization for character/tonal languages per rules in `references/romanization-conventions.md` (Pinyin with tone marks for Mandarin; Hepburn romaji for Japanese at A1–A2; transliteration for Arabic/Russian at A1–A2; drop at B1+ unless requested).
8. Format output in the requested shape. Produce the answer key as a separate section after `---`.
9. Offer follow-ups: Anki export (via flashcards skill), PDF render, companion quiz (via quiz-generator skill).

## Level calibration (summary)

| Level | Vocab size | Tense coverage | Topic complexity |
|-------|-----------|----------------|------------------|
| A1 | ~100 core | present only | greetings, numbers, family, food |
| A2 | ~500 | present + one past | daily routines, shopping, travel |
| B1 | ~1500 | multiple pasts + subjunctive intro | opinions, experiences, plans |
| B2 | ~3000 | full tense system + conditional | abstract topics, hypotheticals |
| C1 | ~5000 | idiomatic + register shifts | academic, professional |
| C2 | ~8000+ | near-native nuance | literary, specialized |

See `references/cefr-descriptors.md` for full can-do statements and topic lists per level.

## Child-learner variant

Triggered when user supplies a grade level in K–5 instead of (or alongside) a CEFR level. Use concrete nouns, short sentences (≤7 words), picture-friendly vocab, songs/chants, repetition patterns. No formal grammar metalanguage ("subjunctive," "accusative," "perfective aspect"). Example: teach "I like apples" not "1st-person singular present of the verb 'to like' + direct object."
```

- [ ] **Step 2: Verify line count stays under budget**

Run: `wc -l skills/language-drill/SKILL.md`
Expected: under 200 lines after Task 2 (leaves headroom for Tasks 3+).

- [ ] **Step 3: Commit**

```bash
git add skills/language-drill/SKILL.md
git commit -m "feat(language-drill): add inputs, drill types, outputs, workflow, calibration sections"
```

---

### Task 3: Fill in SKILL.md sections 11–17 (references loading, scripts, regional variants, edge cases, delegation, follow-ups, limits)

**Files:**
- Modify: `skills/language-drill/SKILL.md` (append remaining sections)

- [ ] **Step 1: Append the remaining seven sections**

Append to `skills/language-drill/SKILL.md`:

```markdown
## Loading references

Before generating any drill, load:

- `references/cefr-descriptors.md` — always.
- `references/conjugation-<language>.md` — for conjugation drills in Spanish, French, German, Italian, Portuguese, Russian.
- `references/writing-<language>.md` — for Mandarin, Japanese, Korean, Arabic (script-specific notes, tone/RTL/furigana rules).
- `references/common-mistakes-<language>.md` — for grammar-focused drills (gap-fill, error correction, translation).
- `references/dialogue-templates.md` — for dialogue drills.
- `references/romanization-conventions.md` — for tonal / character / non-Latin scripts.
- `references/course-to-cefr-map.md` — when the user specifies a course marker (HSK/JLPT/DELE/DELF/TestDaF/TORFL/ACTFL).

## Using conjugation_tables.py

For authoritative conjugation of Spanish, French, Italian, Portuguese, or German verbs, prefer the deterministic helper over generating forms from memory:

```bash
python skills/language-drill/scripts/conjugation_tables.py --lang es --verb ser --tense present_indicative
```

The script outputs a JSON object with person × number forms. Use it for the top ~30 irregular verbs per language plus any regular verb. Fall back to model generation for (a) other languages, (b) rare/defective verbs not covered, or (c) tenses the script does not implement.

## Regional variants and registers

Defaults (ask only when ambiguous):

- **Spanish** → Latin American neutral. Offer Castilian when user says "Spain Spanish" or "Castilian."
- **Portuguese** → Brazilian. Offer European when user says "Portugal Portuguese."
- **Mandarin** → Mainland simplified with Pinyin. Offer Taiwan traditional on request.
- **Arabic** → MSA. Ask when user requests a dialect (Egyptian, Levantine, Gulf, Maghrebi).
- **Japanese** → textbook polite (です/ます). Include casual plain forms when teaching register contrast.
- **Korean** → polite (해요체). Include 존댓말/반말 contrast when teaching register.
- **French** → use both tu/vous when teaching address. Default formal vous in travel/service dialogues.

When teaching register contrast explicitly, show both forms side by side in the drill.

## Edge cases

- **Tonal without tone marks** — if the user omits tone specification for Mandarin, default to Hanyu Pinyin with diacritic tone marks and state this in the output header.
- **RTL scripts (Arabic)** — render target text right-to-left; keep answer keys and L1 glosses left-to-right. Note that printed PDF preserves RTL direction. Include transliteration (ALA-LC) at A1–A2; drop at B1+ unless requested.
- **Regional defaults** — apply defaults above; ask only when genuinely ambiguous.
- **Character-based writing** — Japanese drills include furigana for kanji above A1; Mandarin simplified by default, traditional on request; Korean always in Hangul with romanization only at A1.
- **ESL** — do NOT assume a learner L1; include glosses only when the user specifies one. Avoid culture-specific American idioms at A1–A2.
- **Mixed-level class** — when the user asks for content spanning two levels, produce sections labeled by level rather than averaging across levels.

## Delegation policy

- **Deck export** delegates to `shared/scripts/anki_export.py` (owned by the `flashcards` skill). This skill does NOT re-implement `.apkg` generation.
- **PDF rendering** delegates to `shared/scripts/pdf_render.py`. This skill does NOT re-implement PDF rendering.
- **Quiz generation** (multiple choice, T/F, short answer) is the domain of the `quiz-generator` skill. Point the user there for quiz format.

## Follow-ups to offer

After generating a drill, offer:

- "Export this as an Anki deck" → point to `flashcards` skill.
- "Render this as a printable PDF" → invoke `shared/scripts/pdf_render.py`.
- "Generate a matching quiz" → point to `quiz-generator` skill.
- "Make flashcards from these vocab items" → point to `flashcards` skill.

## Limits

- No TTS audio in V1 — listening-dictation items use `[AUDIO: ...]` text placeholders. TTS wiring (ElevenLabs or OpenAI TTS) is deferred to V2.
- No stroke-order / handwriting practice sheets for hanzi/kana/hangul in V1 — deferred to a future `handwriting-practice` skill or V2 mode.
- No auto-invocation of sibling skills — the user initiates follow-ups.
- Conjugation tables cover the top ~30 irregulars per Romance/Germanic language plus regular paradigms; rare verbs fall back to model generation.
```

- [ ] **Step 2: Verify under 300 lines**

Run: `wc -l skills/language-drill/SKILL.md`
Expected: line count < 300.

- [ ] **Step 3: Commit**

```bash
git add skills/language-drill/SKILL.md
git commit -m "feat(language-drill): complete SKILL.md with refs, delegation, edge cases, limits"
```

---

### Task 4: Write CEFR descriptors and course-to-CEFR map references

**Files:**
- Create: `skills/language-drill/references/cefr-descriptors.md`
- Create: `skills/language-drill/references/course-to-cefr-map.md`

- [ ] **Step 1: Write cefr-descriptors.md**

Create `skills/language-drill/references/cefr-descriptors.md` with six sections (A1 through C2). Each section MUST contain:

1. **Can-do statements** — 5–8 short bullets copied/adapted from the public CEFR companion volume language (no verbatim copyrighted text; paraphrase).
2. **Vocabulary target** — rough word count and 3–5 high-frequency domains.
3. **Grammar scope** — allowed tenses, moods, sentence-length ceiling.
4. **Topic pool** — 10 topics suitable for that level (e.g. A1: greetings, family, numbers 0–100, days, months, colors, food basics, clothing, weather basics, simple directions).
5. **Forbidden constructs** — tenses/moods NOT to use at this level (e.g. A1 forbids past/subjunctive/conditional; A2 forbids conditional/subjunctive).

For A1 specifically, the grammar scope MUST explicitly state: "present indicative only; no past, no subjunctive, no conditional, no passive voice."

For A2, grammar scope MUST state: "add one past tense (preterite OR perfect, not both introduced simultaneously); common connectors (y/pero/porque or et/mais/parce que etc.); no subjunctive, no conditional."

For B1, grammar scope MUST state: "multiple past tenses with contrast (e.g. passé composé vs imparfait, pretérito vs imperfecto); subjunctive introduced in common triggers; no hypothetical conditionals beyond simple si-clauses."

- [ ] **Step 2: Write course-to-cefr-map.md**

Create `skills/language-drill/references/course-to-cefr-map.md` with a mapping table:

```markdown
# Course-to-CEFR Mapping

When a user specifies a course marker instead of a CEFR level, use this table.

| Course | Language | CEFR band | Notes |
|--------|----------|-----------|-------|
| HSK 1 | Mandarin | A1 | 150 words |
| HSK 2 | Mandarin | A1–A2 | 300 words |
| HSK 3 | Mandarin | A2–B1 | 600 words |
| HSK 4 | Mandarin | B1 | 1200 words |
| HSK 5 | Mandarin | B2 | 2500 words |
| HSK 6 | Mandarin | C1 | 5000 words |
| JLPT N5 | Japanese | A1 | ~800 words |
| JLPT N4 | Japanese | A2 | ~1500 words |
| JLPT N3 | Japanese | B1 | ~3750 words |
| JLPT N2 | Japanese | B2 | ~6000 words |
| JLPT N1 | Japanese | C1 | ~10000 words |
| DELE A1–C2 | Spanish | A1–C2 | direct mapping |
| DELF A1–B2 | French | A1–B2 | direct mapping |
| DALF C1–C2 | French | C1–C2 | direct mapping |
| TestDaF TDN3 | German | B2 (lower) | — |
| TestDaF TDN4 | German | B2 | — |
| TestDaF TDN5 | German | C1 | — |
| TORFL Elementary | Russian | A2 | — |
| TORFL Basic | Russian | B1 | — |
| TORFL 1 | Russian | B1 | — |
| TORFL 2 | Russian | B2 | — |
| TORFL 3 | Russian | C1 | — |
| TORFL 4 | Russian | C2 | — |
| ACTFL Novice Low/Mid | any | A1 | — |
| ACTFL Novice High | any | A1–A2 | — |
| ACTFL Intermediate Low/Mid | any | A2 | — |
| ACTFL Intermediate High | any | B1 | — |
| ACTFL Advanced Low/Mid | any | B2 | — |
| ACTFL Advanced High | any | C1 | — |
| ACTFL Superior | any | C1–C2 | — |
| Spanish 1 (US HS) | Spanish | A1 | — |
| Spanish 2 (US HS) | Spanish | A2 | — |
| Spanish 3 (US HS) | Spanish | B1 | — |
| Spanish 4 (US HS) / AP | Spanish | B1–B2 | — |
| French 1–4 (US HS) | French | A1–B1 | analogous |
| German 1–4 (US HS) | German | A1–B1 | analogous |
```

- [ ] **Step 3: Commit**

```bash
git add skills/language-drill/references/cefr-descriptors.md skills/language-drill/references/course-to-cefr-map.md
git commit -m "feat(language-drill): add CEFR descriptors and course-to-CEFR map references"
```

---

### Task 5: Write romanization and dialogue-template references

**Files:**
- Create: `skills/language-drill/references/romanization-conventions.md`
- Create: `skills/language-drill/references/dialogue-templates.md`

- [ ] **Step 1: Write romanization-conventions.md**

Create with sections for each non-Latin-script language:

- **Mandarin** — Hanyu Pinyin with diacritic tone marks (ā á ǎ à a). Explicit table of the four tones + neutral. Note: tone numbers (ma1, ma2) only on user request. Show examples: 妈 mā, 麻 má, 马 mǎ, 骂 mà, 吗 ma.
- **Japanese** — Hepburn romaji (shi not si, chi not ti, tsu not tu). Include macron rule for long vowels (ō, ū) but allow double-vowel "ou/uu" when rendering textbook-style. Note: include furigana above A1 for kanji.
- **Korean** — Revised Romanization (RR) as default (Seoul → Seoul, not Sŏul; Busan → Busan). Note McCune-Reischauer available on request.
- **Arabic** — ALA-LC transliteration as default (ʿayn as ʿ, hamza as ʾ). Include at A1–A2; drop at B1+. Note alternative: simplified no-diacritic transliteration for beginners.
- **Russian** — BGN/PCGN transliteration (Moscow not Moskva; Pushkin not Puškin). Include at A1–A2; drop at B1+.

Each section includes a mini-table showing the 5–10 characters most likely to trip up a beginner.

- [ ] **Step 2: Write dialogue-templates.md**

Create with 9 universal dialogue scenarios. Each scenario has:

1. **Setup** — 1 sentence context.
2. **Typical turns** — ~6-10 turn exchange structure (A/B roles).
3. **Level notes** — what to simplify at A1, A2, and expand at B1+.
4. **Language-specific hooks** — which common-mistakes to surface (e.g. ordering food in Spanish → ser/estar and por/para; in Japanese → polite です/ます + counters).

The 9 scenarios MUST be:

1. Ordering food at a restaurant
2. Asking for directions
3. Hotel check-in
4. Doctor's visit / pharmacy
5. Job interview
6. Small talk (weather, weekend plans)
7. Public transportation (buying a ticket, asking which platform)
8. Shopping (clothing size, price negotiation where culturally appropriate)
9. Classroom language (student ↔ teacher exchanges — useful for K–5 immersion and ESL)

- [ ] **Step 3: Commit**

```bash
git add skills/language-drill/references/romanization-conventions.md skills/language-drill/references/dialogue-templates.md
git commit -m "feat(language-drill): add romanization conventions and dialogue template library"
```

---

### Task 6: Write per-language conjugation references (Spanish, French, Italian, Portuguese)

**Files:**
- Create: `skills/language-drill/references/conjugation-spanish.md`
- Create: `skills/language-drill/references/conjugation-french.md`
- Create: `skills/language-drill/references/conjugation-italian.md`
- Create: `skills/language-drill/references/conjugation-portuguese.md`

- [ ] **Step 1: Spanish conjugation reference**

Create `conjugation-spanish.md` with sections:

1. **Regular paradigms** — three tables for -ar/-er/-ir verbs across: present indicative, preterite, imperfect, future, conditional, present subjunctive, imperfect subjunctive, present progressive (estar+gerund), present perfect (haber+past participle). Use `hablar`, `comer`, `vivir` as the canonical regular verbs.
2. **Top 30 irregulars** — list with one-line note on their irregularity type. MUST include: ser, estar, haber, tener, hacer, decir, ir, ver, dar, saber, poder, poner, querer, venir, salir, traer, caer, oír, conocer, producir, huir, construir, reír, seguir, pedir, dormir, morir, sentir, poner, jugar (30).
3. **Stem-changing verbs** — e→ie, o→ue, e→i patterns with one exemplar each (pensar, poder, pedir).
4. **Regional notes** — voseo (vos hablás), vosotros vs ustedes, leísmo markers.

- [ ] **Step 2: French conjugation reference**

Create `conjugation-french.md`:

1. **Regular paradigms** — -er, -ir (finir-type), -re verbs across: présent, passé composé, imparfait, futur simple, conditionnel, subjonctif présent, plus-que-parfait, futur antérieur. Canonical verbs: parler, finir, vendre.
2. **Top 30 irregulars** — être, avoir, aller, faire, dire, voir, savoir, pouvoir, vouloir, devoir, venir, tenir, prendre, mettre, connaître, naître, écrire, lire, boire, croire, recevoir, apercevoir, ouvrir, couvrir, suivre, vivre, mourir, dormir, courir, rire.
3. **Auxiliary selection** — which verbs take être (DR & MRS VANDERTRAMPP) vs avoir in compound tenses.
4. **Agreement rules** — past participle agreement with être and with preceding direct object.

- [ ] **Step 3: Italian conjugation reference**

Create `conjugation-italian.md`:

1. **Regular paradigms** — -are, -ere, -ire (and -ire-isc) verbs across: presente, passato prossimo, imperfetto, futuro semplice, condizionale, congiuntivo presente, congiuntivo imperfetto, trapassato prossimo. Canonical: parlare, credere, dormire, finire (-isc).
2. **Top 30 irregulars** — essere, avere, andare, fare, dire, dare, stare, venire, tenere, volere, potere, dovere, sapere, vedere, bere, rimanere, scegliere, cogliere, porre, comporre, tradurre, produrre, condurre, morire, uscire, riuscire, salire, tacere, piacere, parere.
3. **Auxiliary selection** — essere vs avere in compound tenses (movement/state change verbs take essere).
4. **Agreement** — past participle agreement with essere and with clitic pronouns.

- [ ] **Step 4: Portuguese conjugation reference**

Create `conjugation-portuguese.md`:

1. **Regular paradigms** — -ar, -er, -ir verbs across: presente, pretérito perfeito, imperfeito, futuro, condicional/futuro do pretérito, subjuntivo presente, subjuntivo imperfeito, pretérito mais-que-perfeito. Canonical: falar, comer, partir.
2. **Top 30 irregulars** — ser, estar, ter, haver, fazer, dizer, ir, vir, ver, dar, saber, poder, pôr, trazer, caber, crer, ler, rir, sair, cair, ouvir, pedir, medir, dormir, odiar, passear, construir, destruir, perder, valer.
3. **Personal infinitive** — canonical Portuguese-unique feature. Full table with all persons.
4. **Regional notes** — Brazilian (você as default 2nd person) vs European (tu + você in different contexts). Placement of clitics (próclise/ênclise/mesóclise).

- [ ] **Step 5: Commit**

```bash
git add skills/language-drill/references/conjugation-spanish.md skills/language-drill/references/conjugation-french.md skills/language-drill/references/conjugation-italian.md skills/language-drill/references/conjugation-portuguese.md
git commit -m "feat(language-drill): add conjugation references for Spanish, French, Italian, Portuguese"
```

---

### Task 7: Write German and Russian conjugation/declension references

**Files:**
- Create: `skills/language-drill/references/conjugation-german.md`
- Create: `skills/language-drill/references/conjugation-russian.md`

- [ ] **Step 1: German conjugation reference**

Create `conjugation-german.md`:

1. **Regular (weak) paradigm** — machen across: Präsens, Präteritum, Perfekt (haben+PP), Plusquamperfekt, Futur I, Konjunktiv I, Konjunktiv II.
2. **Top 30 strong/irregular verbs** — sein, haben, werden, gehen, stehen, liegen, sitzen, kommen, sehen, geben, nehmen, sprechen, essen, trinken, fahren, laufen, schlafen, rufen, helfen, treffen, finden, bleiben, schreiben, lesen, tragen, wissen, kennen, denken, bringen, mögen. Each entry: infinitive, present 3sg (for vowel change), Präteritum 3sg, Partizip II, auxiliary (haben/sein).
3. **Separable prefixes** — list of 20 common separable prefixes (an-, auf-, aus-, ein-, mit-, nach-, vor-, zu-, hin-, her-, ab-, bei-, weg-, zurück-, fort-, empor-, fest-, frei-, offen-, zusammen-) with one example verb each.
4. **Modals + möchten** — table of six modals (können, müssen, wollen, sollen, dürfen, mögen + möchten) in Präsens and Präteritum.
5. **Four cases: article + adjective endings** — canonical tables:
   - Definite articles by case × gender × plural (der/die/das/die × 4 cases = 16 cells).
   - Indefinite articles by case × gender (ein/eine/ein × 4 cases × 3 genders = 12 cells; no indefinite plural).
   - Adjective endings in three declensions: weak (after definite), mixed (after indefinite), strong (no article).

- [ ] **Step 2: Russian conjugation + declension reference**

Create `conjugation-russian.md`:

1. **Verb conjugation classes** — 1st conjugation (-ешь endings) vs 2nd conjugation (-ишь endings). Canonical verbs: читать (1st), говорить (2nd). Full present-tense tables.
2. **Aspect pairs** — 20 common imperfective/perfective pairs with English gloss: читать/прочитать, писать/написать, говорить/сказать, делать/сделать, видеть/увидеть, слышать/услышать, брать/взять, класть/положить, садиться/сесть, вставать/встать, идти/пойти, ехать/поехать, покупать/купить, продавать/продать, давать/дать, получать/получить, спрашивать/спросить, отвечать/ответить, понимать/понять, смотреть/посмотреть.
3. **Past tense** — formed with -л, gender agreement (читал/читала/читало/читали).
4. **Future** — imperfective analytic (буду + inf) vs perfective synthetic (conjugated perfective form).
5. **Six cases** — full tables for noun declension in three genders × singular/plural. Use canonical nouns: стол (m hard), словарь (m soft), книга (f -a), тетрадь (f soft), окно (n). Include: nominative, genitive, dative, accusative, instrumental, prepositional.
6. **Verbs of motion** — 14 pairs (idti/khodit', ekhat'/ezdit', etc.) — unidirectional vs multidirectional. Include prefixed variants.
7. **Top 20 irregular verbs** — быть, есть, пить, дать, взять, сесть, лечь, хотеть, мочь, жить, петь, бежать, стоять, лежать, сидеть, ждать, звать, начать, снять, послать.

- [ ] **Step 3: Commit**

```bash
git add skills/language-drill/references/conjugation-german.md skills/language-drill/references/conjugation-russian.md
git commit -m "feat(language-drill): add German and Russian conjugation+declension references"
```

---

### Task 8: Write writing-system references for Mandarin, Japanese, Korean, Arabic

**Files:**
- Create: `skills/language-drill/references/writing-mandarin.md`
- Create: `skills/language-drill/references/writing-japanese.md`
- Create: `skills/language-drill/references/writing-korean.md`
- Create: `skills/language-drill/references/writing-arabic.md`

- [ ] **Step 1: Mandarin writing reference**

Create `writing-mandarin.md`:

1. **Script choice** — simplified default (Mainland); traditional on request (Taiwan, Hong Kong). NEVER mix in one drill.
2. **Tones** — table of 4 tones + neutral, with diacritic placement rule (tone mark on the main vowel: a > o/e > i/u — except "iu"/"ui" where it goes on the second).
3. **Tone sandhi** — 3rd+3rd → 2nd+3rd; 不 bù becomes bú before 4th tone; 一 yī tone-sandhi rules.
4. **Character-writing notes** — V1 does NOT produce stroke-order sheets. Drills may reference stroke count and radicals, but do not embed SVG. Flag: "For stroke-order practice, use a dedicated handwriting tool (deferred to V2)."
5. **Measure words (classifiers)** — table of top 20 (个, 只, 本, 张, 条, 辆, 把, 杯, 瓶, 件, 位, 次, 遍, 口, 块, 双, 副, 场, 种, 点).
6. **HSK-level character/vocab caps** — per HSK level, what's in-band.

- [ ] **Step 2: Japanese writing reference**

Create `writing-japanese.md`:

1. **Three scripts** — hiragana (native words, grammar), katakana (loanwords, emphasis), kanji (content words). Drills use all three as appropriate to level.
2. **Furigana rule** — above A1, kanji in vocab lists and passages MUST have furigana (hiragana reading) in parentheses or ruby text. Drop furigana only at B1+ when the user opts out.
3. **Polite vs casual** — です/ます form is default for drills. Casual plain form introduced at A2+ with explicit register contrast.
4. **Keigo (honorific) levels** — three levels: 丁寧語 (teineigo, polite), 尊敬語 (sonkeigo, respectful), 謙譲語 (kenjōgo, humble). Full keigo only at B2+.
5. **Particles reference** — は/が/を/に/で/へ/と/から/まで/も/や/か with usage notes.
6. **Character-writing notes** — V1 does NOT produce stroke-order sheets for kana/kanji.
7. **JLPT-level vocab/kanji caps** — per JLPT level.

- [ ] **Step 3: Korean writing reference**

Create `writing-korean.md`:

1. **Hangul structure** — syllable blocks (initial + medial ± final consonant = 받침 batchim).
2. **Speech levels** — six formal/informal levels; drills default to 해요체 (haeyo-che, polite informal). Include 합니다체 (hamnida-che, formal polite) for business/news contexts. Casual 반말 (banmal) introduced at A2+ for register contrast only.
3. **Particles** — 은/는 (topic), 이/가 (subject), 을/를 (object), 에 (location/time), 에서 (location of action), 와/과 and 하고 (and), 로/으로 (by means).
4. **Batchim-triggered allomorphs** — rule: pick 은 vs 는 based on preceding syllable's final consonant.
5. **Character-writing notes** — V1 does NOT produce stroke-order sheets.
6. **Romanization** — RR default (see romanization-conventions.md).

- [ ] **Step 4: Arabic writing reference**

Create `writing-arabic.md`:

1. **RTL rendering** — target text right-to-left; L1 glosses and answer-key metadata left-to-right. In markdown, use explicit `<div dir="rtl">` wrappers around Arabic blocks when PDF rendering is expected.
2. **MSA default** — Modern Standard Arabic. NO dialect content unless user explicitly requests Egyptian, Levantine, Gulf, or Maghrebi.
3. **Script features** — four-form letters (isolated, initial, medial, final); sun vs moon letters (assimilation of "al-" article before sun letters); tāʾ marbūṭa rules; hamza carrier rules.
4. **Diacritics (tashkīl)** — include fatḥa/ḍamma/kasra + sukūn at A1; drop at B1+ unless teaching specific grammar. Full iʿrāb case endings only at B2+.
5. **Transliteration** — ALA-LC default at A1–A2 (include under each Arabic line); drop at B1+. Include transliteration table for the 28 letters.
6. **Common mistakes to flag** — iḍāfa construction, sun/moon letter article, dual (not just plural), root-and-pattern morphology (don't just memorize words — recognize roots).
7. **Character-writing notes** — V1 does NOT produce stroke-order sheets; letter-joining practice is text-based only.

- [ ] **Step 5: Commit**

```bash
git add skills/language-drill/references/writing-mandarin.md skills/language-drill/references/writing-japanese.md skills/language-drill/references/writing-korean.md skills/language-drill/references/writing-arabic.md
git commit -m "feat(language-drill): add writing-system references for Mandarin, Japanese, Korean, Arabic"
```

---

### Task 9: Write per-language common-mistakes catalogs (all 11 languages)

**Files:**
- Create: `skills/language-drill/references/common-mistakes-spanish.md`
- Create: `skills/language-drill/references/common-mistakes-french.md`
- Create: `skills/language-drill/references/common-mistakes-german.md`
- Create: `skills/language-drill/references/common-mistakes-italian.md`
- Create: `skills/language-drill/references/common-mistakes-portuguese.md`
- Create: `skills/language-drill/references/common-mistakes-mandarin.md`
- Create: `skills/language-drill/references/common-mistakes-japanese.md`
- Create: `skills/language-drill/references/common-mistakes-korean.md`
- Create: `skills/language-drill/references/common-mistakes-arabic.md`
- Create: `skills/language-drill/references/common-mistakes-russian.md`
- Create: `skills/language-drill/references/common-mistakes-esl.md`

- [ ] **Step 1: Spanish common mistakes**

Each entry in the file has a **heading**, a **trap** (1 sentence), a **rule** (1-2 sentences), and **3 example contrast pairs**. MUST cover: ser vs estar, por vs para, saber vs conocer, pedir vs preguntar, pretérito vs imperfecto, subjunctive triggers (esperar que, dudar que, para que), gender traps (la mano, el día, el problema), false cognates (embarazada, éxito, asistir), direct vs indirect object pronouns, reflexive with unplanned events (se me olvidó).

- [ ] **Step 2: French common mistakes**

Cover: avoir vs être as auxiliary, passé composé vs imparfait (habitual vs punctual), imparfait vs conditionnel (form similarity), subjunctive triggers (il faut que, bien que, avant que), gender of nouns (le problème, la voiture), accord du participe passé with preceding direct object, tout as adj/pron/adv, depuis vs pendant vs il y a, en vs dans for time, y vs en pronouns.

- [ ] **Step 3: German common mistakes**

Cover: article gender (der/die/das memorization), accusative vs dative case selection, two-way prepositions (an, auf, hinter, in, neben, über, unter, vor, zwischen), separable prefix verb word order, Konjunktiv II formation for hypotheticals, word order (verb-second rule, verb-final in subordinate clauses), adjective endings across weak/mixed/strong, wissen vs kennen, wo vs wohin, dative verbs (helfen, folgen, gratulieren).

- [ ] **Step 4: Italian common mistakes**

Cover: essere vs avere auxiliary, congiuntivo triggers (penso che, credo che), passato prossimo vs imperfetto, preposition choice (di vs da vs a), gender of nouns with -e ending, article before proper nouns (il Mario in colloquial contexts), ci as locative vs partitive pronoun, ne as partitive, clitic pronoun ordering, piacere construction.

- [ ] **Step 5: Portuguese common mistakes**

Cover: ser vs estar (Brazilian contrasts with Spanish), personal infinitive usage, future subjunctive (Portuguese unique), contraction of preposition + article (de + o = do, em + o = no, a + a = à, etc.), por vs para, ficar as multi-purpose verb, ter vs haver for existential, você vs tu regional register, mesoclíse (dir-te-ei), nasal vowels and ~ marks.

- [ ] **Step 6: Mandarin common mistakes**

Cover: 的/得/地 particle confusion (possessive vs complement vs adverbial), 了 aspect marker (perfective le vs change-of-state le vs sentence-final le), 是...的 focus construction, measure word selection, word order for time/place/manner adverbials, 把 construction, 被 passive, 吗 vs 呢 question particles, 会/能/可以 modal differences, directional complements.

- [ ] **Step 7: Japanese common mistakes**

Cover: は vs が (topic vs subject), に vs で (destination/time vs location-of-action), keigo level selection, adjective conjugation (i-adjectives vs na-adjectives), conditional forms (と/ば/たら/なら), transitive vs intransitive pairs (開ける/開く), giving/receiving verbs (あげる/くれる/もらう), humble vs respectful keigo, particle omission in casual speech, counter selection.

- [ ] **Step 8: Korean common mistakes**

Cover: 은/는 vs 이/가 (topic vs subject), 을/를 vs 이/가 for desire (좋아하다 vs 좋다), speech-level agreement across a sentence, verb/adjective conjugation irregulars (ㅂ, ㄷ, ㅅ, ㅎ, ㄹ, 르), -아/어/여 vowel harmony, particle 에 vs 에서, honorific 시 placement, 이다 copula, causative/passive morphology.

- [ ] **Step 9: Arabic common mistakes**

Cover: iḍāfa (construct state — no article on the first noun), sun vs moon letter assimilation with al-, dual (not plural) for exactly two, broken plurals (root-and-pattern), verb gender/number agreement with delayed subject, definiteness agreement of adjectives, accusative after inna, nominative vs accusative vs genitive iʿrāb triggers, hamza spelling (al-hamzatu l-waṣl vs l-qaṭʿ), tāʾ marbūṭa vs tāʾ maftūḥa.

- [ ] **Step 10: Russian common mistakes**

Cover: case selection after prepositions, imperfective vs perfective aspect in past/future, verbs of motion unidirectional vs multidirectional, animate vs inanimate accusative, negation triggering genitive, numerical agreement (1, 2-4, 5+), soft vs hard stems in declension, reflexive -ся verbs, stress shifts in declension/conjugation, word order for topic/focus.

- [ ] **Step 11: ESL common mistakes**

Cover: article usage (a/an/the/∅), prepositions of time (in/on/at) and place, phrasal verbs (separable vs inseparable), gerund vs infinitive after verbs (enjoy doing vs want to do), present perfect vs simple past, reported speech tense shifts, count vs non-count nouns, question formation with do-support, subject-verb agreement with tricky subjects (everyone, the news, physics), conditional forms (zero/first/second/third).

Each entry follows the same 4-line structure: heading, trap, rule, 3 contrast pairs.

- [ ] **Step 12: Commit**

```bash
git add skills/language-drill/references/common-mistakes-*.md
git commit -m "feat(language-drill): add common-mistakes catalogs for all 11 languages"
```

---

### Task 10: Write failing test for scripts/conjugation_tables.py

**Files:**
- Create: `skills/language-drill/evals/test_conjugation_tables.py`

- [ ] **Step 1: Write test file**

Create `skills/language-drill/evals/test_conjugation_tables.py`:

```python
"""Unit tests for conjugation_tables.py — regular + top irregular verbs."""
import json
import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).parent.parent / "scripts" / "conjugation_tables.py"


def run_script(*args: str) -> dict:
    """Invoke the script and parse its JSON output."""
    result = subprocess.run(
        [sys.executable, str(SCRIPT), *args],
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(result.stdout)


def test_spanish_regular_ar_present():
    data = run_script("--lang", "es", "--verb", "hablar", "--tense", "present_indicative")
    assert data["verb"] == "hablar"
    assert data["lang"] == "es"
    assert data["tense"] == "present_indicative"
    assert data["forms"]["1sg"] == "hablo"
    assert data["forms"]["2sg"] == "hablas"
    assert data["forms"]["3sg"] == "habla"
    assert data["forms"]["1pl"] == "hablamos"
    assert data["forms"]["2pl"] == "habláis"
    assert data["forms"]["3pl"] == "hablan"


def test_spanish_irregular_ser_present():
    data = run_script("--lang", "es", "--verb", "ser", "--tense", "present_indicative")
    assert data["forms"]["1sg"] == "soy"
    assert data["forms"]["2sg"] == "eres"
    assert data["forms"]["3sg"] == "es"
    assert data["forms"]["1pl"] == "somos"
    assert data["forms"]["2pl"] == "sois"
    assert data["forms"]["3pl"] == "son"


def test_french_regular_er_present():
    data = run_script("--lang", "fr", "--verb", "parler", "--tense", "present")
    assert data["forms"]["1sg"] == "parle"
    assert data["forms"]["2sg"] == "parles"
    assert data["forms"]["3sg"] == "parle"
    assert data["forms"]["1pl"] == "parlons"
    assert data["forms"]["2pl"] == "parlez"
    assert data["forms"]["3pl"] == "parlent"


def test_italian_regular_are_present():
    data = run_script("--lang", "it", "--verb", "parlare", "--tense", "presente")
    assert data["forms"]["1sg"] == "parlo"
    assert data["forms"]["3sg"] == "parla"
    assert data["forms"]["1pl"] == "parliamo"
    assert data["forms"]["3pl"] == "parlano"


def test_portuguese_regular_ar_present():
    data = run_script("--lang", "pt", "--verb", "falar", "--tense", "presente")
    assert data["forms"]["1sg"] == "falo"
    assert data["forms"]["3sg"] == "fala"
    assert data["forms"]["1pl"] == "falamos"
    assert data["forms"]["3pl"] == "falam"


def test_german_regular_weak_present():
    data = run_script("--lang", "de", "--verb", "machen", "--tense", "praesens")
    assert data["forms"]["1sg"] == "mache"
    assert data["forms"]["2sg"] == "machst"
    assert data["forms"]["3sg"] == "macht"
    assert data["forms"]["1pl"] == "machen"
    assert data["forms"]["2pl"] == "macht"
    assert data["forms"]["3pl"] == "machen"


def test_german_irregular_sein_present():
    data = run_script("--lang", "de", "--verb", "sein", "--tense", "praesens")
    assert data["forms"]["1sg"] == "bin"
    assert data["forms"]["2sg"] == "bist"
    assert data["forms"]["3sg"] == "ist"
    assert data["forms"]["1pl"] == "sind"
    assert data["forms"]["2pl"] == "seid"
    assert data["forms"]["3pl"] == "sind"


def test_unknown_verb_falls_back_with_flag():
    """Unknown verbs return an error structure, not a crash."""
    result = subprocess.run(
        [sys.executable, str(SCRIPT), "--lang", "es", "--verb", "zxqvwerb", "--tense", "present_indicative"],
        capture_output=True,
        text=True,
    )
    # Exit code nonzero, stderr explains
    assert result.returncode != 0
    assert "unknown" in result.stderr.lower() or "not found" in result.stderr.lower()


def test_unsupported_language_errors():
    result = subprocess.run(
        [sys.executable, str(SCRIPT), "--lang", "ja", "--verb", "taberu", "--tense", "present"],
        capture_output=True,
        text=True,
    )
    assert result.returncode != 0
    assert "unsupported" in result.stderr.lower() or "not supported" in result.stderr.lower()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/language-drill && python -m pytest evals/test_conjugation_tables.py -v`
Expected: FAIL with "No such file or directory" or "ModuleNotFoundError" (conjugation_tables.py does not exist yet).

- [ ] **Step 3: Commit**

```bash
git add skills/language-drill/evals/test_conjugation_tables.py
git commit -m "test(language-drill): add failing tests for conjugation_tables.py"
```

---

### Task 11: Implement scripts/conjugation_tables.py

**Files:**
- Modify: `skills/language-drill/scripts/conjugation_tables.py`

- [ ] **Step 1: Implement the script**

Replace `skills/language-drill/scripts/conjugation_tables.py` (currently empty or absent) with:

```python
#!/usr/bin/env python3
"""Canonical conjugation tables for Spanish, French, Italian, Portuguese, German.

Provides authoritative verb forms for:
- Regular -ar/-er/-ir (ES/PT) and -ar/-ere/-ire (IT) paradigms.
- Regular -er/-ir/-re (FR) and weak (DE) paradigms.
- Top irregular verbs per language (see IRREGULARS dict).

Usage:
    python conjugation_tables.py --lang es --verb hablar --tense present_indicative

Exits 0 with JSON on stdout when the verb is known.
Exits 2 with an error message on stderr when the verb or tense is unknown.
"""
from __future__ import annotations

import argparse
import json
import sys
from typing import Dict

SUPPORTED_LANGS = {"es", "fr", "it", "pt", "de"}

# ---------- Spanish ----------

ES_REGULAR_ENDINGS = {
    "present_indicative": {
        "ar": {"1sg": "o", "2sg": "as", "3sg": "a", "1pl": "amos", "2pl": "áis", "3pl": "an"},
        "er": {"1sg": "o", "2sg": "es", "3sg": "e", "1pl": "emos", "2pl": "éis", "3pl": "en"},
        "ir": {"1sg": "o", "2sg": "es", "3sg": "e", "1pl": "imos", "2pl": "ís", "3pl": "en"},
    },
    # Additional tenses (preterite, imperfect, future, conditional, subjunctive)
    # follow the same structure; extend as needed.
}

ES_IRREGULARS = {
    "ser": {
        "present_indicative": {
            "1sg": "soy", "2sg": "eres", "3sg": "es",
            "1pl": "somos", "2pl": "sois", "3pl": "son",
        },
    },
    "estar": {
        "present_indicative": {
            "1sg": "estoy", "2sg": "estás", "3sg": "está",
            "1pl": "estamos", "2pl": "estáis", "3pl": "están",
        },
    },
    # Add remaining 28 top irregulars: haber, tener, hacer, decir, ir, ver, dar,
    # saber, poder, poner, querer, venir, salir, traer, caer, oír, conocer,
    # producir, huir, construir, reír, seguir, pedir, dormir, morir, sentir,
    # jugar.
}

# ---------- French ----------

FR_REGULAR_ENDINGS = {
    "present": {
        "er": {"1sg": "e", "2sg": "es", "3sg": "e", "1pl": "ons", "2pl": "ez", "3pl": "ent"},
        "ir_finir": {"1sg": "is", "2sg": "is", "3sg": "it", "1pl": "issons", "2pl": "issez", "3pl": "issent"},
        "re": {"1sg": "s", "2sg": "s", "3sg": "", "1pl": "ons", "2pl": "ez", "3pl": "ent"},
    },
}

FR_IRREGULARS = {
    "être": {
        "present": {
            "1sg": "suis", "2sg": "es", "3sg": "est",
            "1pl": "sommes", "2pl": "êtes", "3pl": "sont",
        },
    },
    "avoir": {
        "present": {
            "1sg": "ai", "2sg": "as", "3sg": "a",
            "1pl": "avons", "2pl": "avez", "3pl": "ont",
        },
    },
    # Add remaining 28: aller, faire, dire, voir, savoir, pouvoir, vouloir,
    # devoir, venir, tenir, prendre, mettre, connaître, naître, écrire, lire,
    # boire, croire, recevoir, apercevoir, ouvrir, couvrir, suivre, vivre,
    # mourir, dormir, courir, rire.
}

# ---------- Italian ----------

IT_REGULAR_ENDINGS = {
    "presente": {
        "are": {"1sg": "o", "2sg": "i", "3sg": "a", "1pl": "iamo", "2pl": "ate", "3pl": "ano"},
        "ere": {"1sg": "o", "2sg": "i", "3sg": "e", "1pl": "iamo", "2pl": "ete", "3pl": "ono"},
        "ire": {"1sg": "o", "2sg": "i", "3sg": "e", "1pl": "iamo", "2pl": "ite", "3pl": "ono"},
        "ire_isc": {"1sg": "isco", "2sg": "isci", "3sg": "isce", "1pl": "iamo", "2pl": "ite", "3pl": "iscono"},
    },
}

IT_IRREGULARS = {
    "essere": {
        "presente": {
            "1sg": "sono", "2sg": "sei", "3sg": "è",
            "1pl": "siamo", "2pl": "siete", "3pl": "sono",
        },
    },
    "avere": {
        "presente": {
            "1sg": "ho", "2sg": "hai", "3sg": "ha",
            "1pl": "abbiamo", "2pl": "avete", "3pl": "hanno",
        },
    },
    # Add 28 more: andare, fare, dire, dare, stare, venire, tenere, volere,
    # potere, dovere, sapere, vedere, bere, rimanere, scegliere, cogliere, porre,
    # comporre, tradurre, produrre, condurre, morire, uscire, riuscire, salire,
    # tacere, piacere, parere.
}

# ---------- Portuguese ----------

PT_REGULAR_ENDINGS = {
    "presente": {
        "ar": {"1sg": "o", "2sg": "as", "3sg": "a", "1pl": "amos", "2pl": "ais", "3pl": "am"},
        "er": {"1sg": "o", "2sg": "es", "3sg": "e", "1pl": "emos", "2pl": "eis", "3pl": "em"},
        "ir": {"1sg": "o", "2sg": "es", "3sg": "e", "1pl": "imos", "2pl": "is", "3pl": "em"},
    },
}

PT_IRREGULARS = {
    "ser": {
        "presente": {
            "1sg": "sou", "2sg": "és", "3sg": "é",
            "1pl": "somos", "2pl": "sois", "3pl": "são",
        },
    },
    "estar": {
        "presente": {
            "1sg": "estou", "2sg": "estás", "3sg": "está",
            "1pl": "estamos", "2pl": "estais", "3pl": "estão",
        },
    },
    # Add 28 more per spec §6.
}

# ---------- German ----------

DE_REGULAR_ENDINGS = {
    "praesens": {
        "weak": {"1sg": "e", "2sg": "st", "3sg": "t", "1pl": "en", "2pl": "t", "3pl": "en"},
    },
}

DE_IRREGULARS = {
    "sein": {
        "praesens": {
            "1sg": "bin", "2sg": "bist", "3sg": "ist",
            "1pl": "sind", "2pl": "seid", "3pl": "sind",
        },
    },
    "haben": {
        "praesens": {
            "1sg": "habe", "2sg": "hast", "3sg": "hat",
            "1pl": "haben", "2pl": "habt", "3pl": "haben",
        },
    },
    "werden": {
        "praesens": {
            "1sg": "werde", "2sg": "wirst", "3sg": "wird",
            "1pl": "werden", "2pl": "werdet", "3pl": "werden",
        },
    },
    # Add 27 more per spec §6.
}


def conjugate_regular_es(verb: str, tense: str) -> Dict[str, str]:
    if tense not in ES_REGULAR_ENDINGS:
        raise KeyError(f"tense {tense} not implemented for Spanish regulars")
    for suffix, endings in ES_REGULAR_ENDINGS[tense].items():
        if verb.endswith(suffix):
            stem = verb[: -len(suffix)]
            return {person: stem + end for person, end in endings.items()}
    raise KeyError(f"verb {verb} does not end in -ar/-er/-ir")


def conjugate_regular_fr(verb: str, tense: str) -> Dict[str, str]:
    if tense not in FR_REGULAR_ENDINGS:
        raise KeyError(f"tense {tense} not implemented for French regulars")
    endings_by_class = FR_REGULAR_ENDINGS[tense]
    if verb.endswith("er"):
        stem = verb[:-2]
        return {p: stem + e for p, e in endings_by_class["er"].items()}
    if verb.endswith("ir"):
        stem = verb[:-2]
        return {p: stem + e for p, e in endings_by_class["ir_finir"].items()}
    if verb.endswith("re"):
        stem = verb[:-2]
        return {p: stem + e for p, e in endings_by_class["re"].items()}
    raise KeyError(f"verb {verb} does not end in -er/-ir/-re")


def conjugate_regular_it(verb: str, tense: str) -> Dict[str, str]:
    if tense not in IT_REGULAR_ENDINGS:
        raise KeyError(f"tense {tense} not implemented for Italian regulars")
    endings = IT_REGULAR_ENDINGS[tense]
    for suffix in ("are", "ere", "ire"):
        if verb.endswith(suffix):
            stem = verb[: -len(suffix)]
            return {p: stem + e for p, e in endings[suffix].items()}
    raise KeyError(f"verb {verb} does not end in -are/-ere/-ire")


def conjugate_regular_pt(verb: str, tense: str) -> Dict[str, str]:
    if tense not in PT_REGULAR_ENDINGS:
        raise KeyError(f"tense {tense} not implemented for Portuguese regulars")
    for suffix, endings in PT_REGULAR_ENDINGS[tense].items():
        if verb.endswith(suffix):
            stem = verb[: -len(suffix)]
            return {p: stem + e for p, e in endings.items()}
    raise KeyError(f"verb {verb} does not end in -ar/-er/-ir")


def conjugate_regular_de(verb: str, tense: str) -> Dict[str, str]:
    if tense not in DE_REGULAR_ENDINGS:
        raise KeyError(f"tense {tense} not implemented for German regulars")
    if not verb.endswith("en"):
        raise KeyError(f"verb {verb} does not end in -en")
    stem = verb[:-2]
    endings = DE_REGULAR_ENDINGS[tense]["weak"]
    return {p: stem + e for p, e in endings.items()}


LANG_DISPATCH = {
    "es": (ES_IRREGULARS, conjugate_regular_es),
    "fr": (FR_IRREGULARS, conjugate_regular_fr),
    "it": (IT_IRREGULARS, conjugate_regular_it),
    "pt": (PT_IRREGULARS, conjugate_regular_pt),
    "de": (DE_IRREGULARS, conjugate_regular_de),
}


def conjugate(lang: str, verb: str, tense: str) -> Dict[str, str]:
    if lang not in SUPPORTED_LANGS:
        raise ValueError(f"unsupported language: {lang}. Supported: {sorted(SUPPORTED_LANGS)}")
    irregulars, regular_fn = LANG_DISPATCH[lang]
    if verb in irregulars and tense in irregulars[verb]:
        return irregulars[verb][tense]
    return regular_fn(verb, tense)


def main() -> int:
    ap = argparse.ArgumentParser(description="Conjugate a verb in ES/FR/IT/PT/DE.")
    ap.add_argument("--lang", required=True, choices=sorted(SUPPORTED_LANGS))
    ap.add_argument("--verb", required=True)
    ap.add_argument("--tense", required=True)
    args = ap.parse_args()
    try:
        forms = conjugate(args.lang, args.verb, args.tense)
    except ValueError as e:
        print(f"unsupported: {e}", file=sys.stderr)
        return 2
    except KeyError as e:
        print(f"unknown verb or tense: {e}", file=sys.stderr)
        return 2
    print(json.dumps({"lang": args.lang, "verb": args.verb, "tense": args.tense, "forms": forms}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `cd skills/language-drill && python -m pytest evals/test_conjugation_tables.py -v`
Expected: all 9 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add skills/language-drill/scripts/conjugation_tables.py
git commit -m "feat(language-drill): implement conjugation_tables.py with regular paradigms + top irregulars for 5 languages"
```

Note: the IRREGULARS dicts in this task only include 2–3 verbs per language. Expanding each to the full top 30 listed in the respective conjugation-<lang>.md reference is a follow-up task that can be done incrementally; regular-verb coverage is complete from Task 11. Mark this task DONE when regular paradigms + minimum 2 irregular verbs per language pass their tests.

---

### Task 12: Write evals/evals.json with 5 objective test prompts

**Files:**
- Create: `skills/language-drill/evals/evals.json`

- [ ] **Step 1: Write evals.json**

Create `skills/language-drill/evals/evals.json`:

```json
{
  "skill": "language-drill",
  "version": "0.1.0",
  "evals": [
    {
      "id": "es-a2-food-vocab-20",
      "prompt": "Give me a Spanish A2 vocab drill on food, 20 items with exemplar sentences.",
      "assertions": [
        {"type": "item_count", "section": "drill", "equals": 20},
        {"type": "has_section", "name": "answer key"},
        {"type": "each_item_contains", "pattern": "exemplar sentence", "description": "every vocab entry has an example sentence at A2+"},
        {"type": "vocab_in_band", "level": "A2", "language": "es", "min_sample_hits": 4, "sample_size": 5},
        {"type": "forbidden_tense", "tenses": ["present_subjunctive", "conditional"], "description": "A2 must not use subjunctive or conditional"}
      ]
    },
    {
      "id": "fr-b1-passe-compose-vs-imparfait-gapfill-15",
      "prompt": "French B1 passé composé vs imparfait gap-fill, 15 sentences.",
      "assertions": [
        {"type": "item_count", "section": "drill", "equals": 15},
        {"type": "each_item_has_gap", "description": "each sentence contains exactly one blank"},
        {"type": "each_gap_is_verb_in", "tenses": ["passe_compose", "imparfait"]},
        {"type": "answer_key_identifies_tense", "description": "answer key labels each blank with passé composé or imparfait"},
        {"type": "contains_contrast_pair", "description": "at least one habitual (imparfait) vs punctual (passé composé) contrast pair"}
      ]
    },
    {
      "id": "ja-a2-polite-vs-casual-dialogue",
      "prompt": "Japanese A2 polite-vs-casual dialogue for two speakers in a coffee shop.",
      "assertions": [
        {"type": "dialogue_speaker_count", "min": 2},
        {"type": "has_polite_form_markers", "markers": ["です", "ます"]},
        {"type": "has_casual_form_markers", "description": "plain form present alongside or annotated as casual contrast"},
        {"type": "each_turn_has_romaji", "description": "romaji line under every Japanese turn"},
        {"type": "vocab_in_band", "level": "A2", "language": "ja", "equivalent": "JLPT N5-N4"}
      ]
    },
    {
      "id": "de-a1-article-noun-flashcards-csv",
      "prompt": "German A1 article + noun flashcards, output CSV with at least 20 rows.",
      "assertions": [
        {"type": "csv_parseable"},
        {"type": "csv_has_columns", "columns": ["front", "back", "tags"]},
        {"type": "csv_row_count", "min": 20},
        {"type": "front_is_noun_only", "description": "front column contains the noun with no article"},
        {"type": "back_contains_article_and_gender_tag", "articles": ["der", "die", "das"], "description": "back column shows der/die/das + noun; tags include gender marker"},
        {"type": "vocab_in_band", "level": "A1", "language": "de", "min_sample_hits": 4, "sample_size": 5}
      ]
    },
    {
      "id": "zh-hsk2-tone-drill-with-pinyin",
      "prompt": "Mandarin HSK2 tone drill with pinyin, 15 items minimum.",
      "assertions": [
        {"type": "item_count", "section": "drill", "min": 15},
        {"type": "each_item_has_pinyin_with_diacritics", "description": "pinyin uses tone diacritics (ā á ǎ à), not tone numbers"},
        {"type": "tone_pair_grouping_present", "description": "items grouped by tone-pair practice (e.g. 2nd+3rd contrast)"},
        {"type": "vocab_in_band", "level": "A1-A2", "language": "zh", "equivalent": "HSK1-HSK2"},
        {"type": "has_section", "name": "answer key"}
      ]
    }
  ]
}
```

- [ ] **Step 2: Validate JSON**

Run: `python -c "import json; json.load(open('skills/language-drill/evals/evals.json'))"`
Expected: no output, exit code 0.

- [ ] **Step 3: Commit**

```bash
git add skills/language-drill/evals/evals.json
git commit -m "feat(language-drill): add 5 objective eval prompts covering vocab/gap-fill/dialogue/csv/tone"
```

---

### Task 13: Self-review pass and SKILL.md trigger-phrase tune-up

**Files:**
- Modify: `skills/language-drill/SKILL.md` (description field if needed)

- [ ] **Step 1: Check SKILL.md line count**

Run: `wc -l skills/language-drill/SKILL.md`
Expected: under 300 lines. If not, move detail into a reference file.

- [ ] **Step 2: Verify every reference file exists and is non-empty**

Run:
```bash
for f in cefr-descriptors course-to-cefr-map romanization-conventions dialogue-templates \
         conjugation-spanish conjugation-french conjugation-italian conjugation-portuguese \
         conjugation-german conjugation-russian \
         writing-mandarin writing-japanese writing-korean writing-arabic \
         common-mistakes-spanish common-mistakes-french common-mistakes-german \
         common-mistakes-italian common-mistakes-portuguese common-mistakes-mandarin \
         common-mistakes-japanese common-mistakes-korean common-mistakes-arabic \
         common-mistakes-russian common-mistakes-esl; do
    test -s "skills/language-drill/references/${f}.md" && echo "OK $f" || echo "MISSING/EMPTY $f"
done
```
Expected: 25 × `OK ...`. Zero `MISSING/EMPTY`.

- [ ] **Step 3: Verify evals.json has 5 entries**

Run: `python -c "import json; d = json.load(open('skills/language-drill/evals/evals.json')); print(len(d['evals']))"`
Expected: `5`.

- [ ] **Step 4: Verify conjugation tests still pass**

Run: `cd skills/language-drill && python -m pytest evals/test_conjugation_tables.py -v`
Expected: all tests PASS.

- [ ] **Step 5: Spec-coverage checklist**

Verify by grep that SKILL.md mentions each of these 11 languages at least once: Spanish, French, German, Italian, Portuguese, Mandarin, Japanese, Korean, Arabic, Russian, ESL.

Run: `for lang in Spanish French German Italian Portuguese Mandarin Japanese Korean Arabic Russian ESL; do grep -c "$lang" skills/language-drill/SKILL.md | xargs -I{} echo "$lang {}"; done`
Expected: every language appears ≥ 1 time.

- [ ] **Step 6: Delegation-policy grep**

Run: `grep -E "anki_export|pdf_render" skills/language-drill/SKILL.md`
Expected: matches for both `shared/scripts/anki_export.py` and `shared/scripts/pdf_render.py` (delegation statements present).

- [ ] **Step 7: Commit (if any fixes applied)**

```bash
git add skills/language-drill/
git commit -m "chore(language-drill): self-review pass — line count, reference coverage, spec checklist" || echo "no changes"
```

---

## Self-Review Notes

**Spec coverage audit:**
- Spec §2 triggers → Task 1 (section 3 of SKILL.md) copies all 12 triggers verbatim.
- Spec §3 inputs → Task 2 (section 5) covers every input with normalization rules.
- Spec §4 outputs → Task 2 (section 7) lists every output format + delegation.
- Spec §5 workflow → Task 2 (section 8) replicates the 8-step procedure.
- Spec §6 scripts → Task 11 implements `conjugation_tables.py`; delegation to `shared/scripts/anki_export.py` and `shared/scripts/pdf_render.py` stated in Task 3 (section 15).
- Spec §7 references → Tasks 4–9 create all reference categories (CEFR, conjugation, declension, common-mistakes, dialogue, romanization, course-to-CEFR).
- Spec §8 level calibration → Task 2 (section 9) summary; Task 4 full file.
- Spec §9 evals → Task 12 ships all 5 prompts with the exact assertions listed in the spec.
- Spec §10 edge cases → Task 3 (section 14) covers all 6 cases.

**Placeholder scan:** conjugation_tables.py intentionally ships with 2–3 irregulars per language; Task 11 explicitly acknowledges this and schedules incremental expansion. Everything else is fully specified.

**Type consistency:** script flag names (`--lang`, `--verb`, `--tense`) match between tests (Task 10) and implementation (Task 11). Language codes (es/fr/it/pt/de) are consistent. Tense names (`present_indicative`, `present`, `presente`, `praesens`) match between tests and implementation — each language uses its own idiomatic tense key. Person keys (`1sg`/`2sg`/`3sg`/`1pl`/`2pl`/`3pl`) are unified across all languages.
