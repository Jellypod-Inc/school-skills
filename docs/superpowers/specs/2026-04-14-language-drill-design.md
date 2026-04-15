# language-drill — Skill Design Spec

**Date:** 2026-04-14
**Author:** Pierson + Claude
**Status:** Draft pending user review
**Parent:** [2026-04-14-marketplace-design.md](./2026-04-14-marketplace-design.md)

## 1. Purpose

Generate self-study or classroom language drills across vocabulary, grammar (conjugation/declension), and dialogue practice. Calibrated to CEFR levels (A1–C2) with a child-learner variant for grade-school immersion students. Covers the common "I need to study for my Spanish test tomorrow" case and the teacher "build me a German A2 workbook" case from one skill.

## 2. Triggers

Descriptions should fire on both teacher and student phrasings, including:

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

## 3. Inputs

- **Target language** — one of the V1 list (see §8).
- **CEFR level** — A1, A2, B1, B2, C1, C2; or self-described ("beginner", "intermediate", "advanced"); or course marker ("Spanish 2", "HSK3", "JLPT N4") mapped to CEFR.
- **Drill type** — vocab, conjugation, declension, translation, dialogue, listening dictation, gap-fill, reading comprehension, error-correction.
- **Specific topic** — food, travel, past tense, polite speech, family, weather, etc.
- **Native language** — for translation drills, glosses, and instructions (defaults to English).
- **Register / variant** — formal vs informal; regional (Castilian vs LatAm Spanish, European vs Brazilian Portuguese, Mainland vs Taiwan Mandarin, MSA vs Egyptian Arabic).
- **Length** — item count or duration ("20 items", "15-minute drill").
- **Source material (optional)** — pasted vocabulary list, textbook chapter, teacher syllabus, photo of a workbook page.

## 4. Outputs

- **Drill set markdown** — numbered items, clean formatting, grouped by section.
- **Flashcard CSV** — compatible with the `flashcards` skill (front, back, tags). Delegates `.apkg` generation to `shared/scripts/anki_export.py` via the flashcards skill.
- **Conversation practice script** — labeled roles (A/B or named speakers), target-language line, native-language gloss, and optional IPA/romanization line.
- **Audio-cue prompts** — bracketed cues like `[AUDIO: speaker says "¿Dónde está la biblioteca?" at natural pace]` as placeholders for future TTS integration.
- **Answer keys** — always generated; separated from the student-facing section for print-friendly use.
- **PDF (optional)** — via `shared/scripts/pdf_render.py` for printable worksheets.

## 5. Workflow

1. Parse target language + level (normalize synonyms: "beginner" → A1, "Spanish 2" → A2, etc.).
2. Resolve topic and drill type; default to a level-appropriate topic pool if unspecified.
3. Pull topic pool at the requested level from `references/` (see §7).
4. Generate items: vocab entries, conjugation tables, dialogue exchanges, or gap-fill sentences.
5. Attach exemplar sentences for vocab items at A2+ (paired sentence showing natural use).
6. Add IPA or romanization for character/tonal languages (pinyin + tone marks, romaji + kana, transliteration for Arabic/Russian when level is A1–A2).
7. Format output in the requested shape (markdown, CSV, dialogue script). Produce the answer key separately.
8. Offer follow-ups: export to Anki via flashcards, render PDF, generate a companion quiz via quiz-generator.

## 6. Bundled scripts

`skills/language-drill/scripts/` holds the small deterministic helpers:

- `conjugation_tables.py` (optional) — canonical verb tables for top languages (Spanish, French, Italian, Portuguese, German) covering regular patterns plus the top ~30 irregulars per language. Used when the model requests authoritative forms rather than generating them.

Deck exports delegate to `shared/scripts/anki_export.py` using the `flashcards` skill's existing patterns — `language-drill` does not re-implement `.apkg` generation. PDF rendering uses `shared/scripts/pdf_render.py`.

## 7. References

`skills/language-drill/references/` (loaded on demand to keep SKILL.md short):

- **CEFR descriptors** — "can-do" statements per level, with level-appropriate topic lists.
- **Conjugation tables** — per-language regular paradigms and the top irregular verbs.
- **Declension tables** — German cases, Russian cases, Latin-style paradigms where relevant.
- **Common-mistakes catalog** — per-language (e.g. `ser` vs `estar`, `por` vs `para`, German article gender, Japanese は vs が, Mandarin 的/得/地).
- **Dialogue template library** — ordering food, asking directions, hotel check-in, doctor's visit, job interview, small talk, transportation, shopping, classroom language.
- **Romanization conventions** — Hanyu Pinyin with tone marks, Hepburn romaji, standard transliteration tables for Arabic (ALA-LC) and Russian (BGN/PCGN).
- **Course-to-CEFR map** — HSK, JLPT, DELE, DELF, TestDaF, TORFL, ACTFL to CEFR.

## 8. Level calibration

Each CEFR band sets hard targets the generator must respect:

- **A1** — ~100-word core vocabulary, present tense only, simple affirmative/negative sentences, high-frequency topics (greetings, numbers, family, food).
- **A2** — past tense (one form), common connectors, everyday topics, ~500-word vocabulary.
- **B1** — multiple past tenses, subjunctive introduction, opinion expressions, ~1500-word vocabulary.
- **B2** — full tense system, conditional, hypotheticals, abstract topics, ~3000-word vocabulary.
- **C1** — idiomatic usage, register shifts, academic/professional topics.
- **C2** — near-native nuance, literary and specialized vocabulary.

**Child-language-learner variant** — for grade-school immersion students: concrete nouns, short sentences, picture-friendly vocabulary, songs/chants, no formal grammar metalanguage. Triggered by grade level input (K–5) instead of CEFR.

## 9. Evals

Five test prompts in `skills/language-drill/evals/evals.json`, each with 3–5 objective assertions:

1. **"Spanish A2 vocab drill on food, 20 items"** — (a) exactly 20 items; (b) includes an exemplar sentence per item at A2+; (c) answer key present; (d) vocabulary within A2 frequency band (spot-check 5 items against reference list); (e) no present subjunctive or conditional forms.
2. **"French B1 passé composé vs imparfait gap-fill, 15 sentences"** — (a) 15 gap-fill items; (b) each gap is a verb in passé composé or imparfait; (c) answer key identifies the tense and form; (d) distractors include both tenses; (e) contains at least one classic contrast pair (habitual vs punctual).
3. **"Japanese A2 polite-vs-casual dialogue"** — (a) dialogue with ≥2 speakers and labeled roles; (b) parallel polite (です/ます) and casual (plain form) versions or annotations; (c) romaji line per turn; (d) answer key or translation gloss; (e) vocabulary stays within JLPT N5–N4 band.
4. **"German A1 article + noun flashcards, CSV"** — (a) valid CSV parseable by the flashcards skill; (b) front contains noun, back contains article + gender tag; (c) ≥20 rows; (d) all nouns within A1 frequency; (e) tags column populated (e.g. `a1,nouns,gender`).
5. **"Mandarin HSK2 tone drill with pinyin"** — (a) ≥15 items; (b) each item shows characters + pinyin with tone marks (not tone numbers unless requested); (c) tone-pair practice grouping present; (d) HSK2-appropriate characters; (e) answer key present.

## 10. Edge cases

- **Tonal languages without tone marks** — Mandarin/Vietnamese prompts that omit tone specification: default to Hanyu Pinyin with diacritic tone marks and state the choice in the output header.
- **Right-to-left scripts (Arabic)** — render target text RTL; keep answer keys and glosses LTR; note that printed PDF preserves RTL direction. At A1–A2, include transliteration; drop it at B1+.
- **Formal vs informal registers** — default to textbook-standard register; offer both when teaching register contrast (Japanese polite/casual, Korean 존댓말/반말, Spanish tú/usted, French tu/vous).
- **Regional variants** — ask or default: Spanish → LatAm neutral; Portuguese → Brazilian; Mandarin → Mainland simplified with Pinyin; Arabic → MSA (not a dialect) unless user specifies Egyptian/Levantine/Gulf.
- **Character-based writing** — Japanese drills include furigana for kanji above A1; Mandarin uses simplified by default, traditional on request.
- **ESL** — native language is not assumed; glosses only when the user specifies their L1. Avoid culture-specific American idioms at A1–A2.
- **Mixed-level class** — user asks for a drill spanning two levels; generate sections labeled by level rather than averaging.

## 11. Open questions

- **V1 language list** — catalog entry lists 11 languages (Spanish, French, German, Italian, Portuguese, Mandarin, Japanese, Korean, Arabic, Russian, ESL). Is this the right set? Candidates to consider swapping in: Hindi, Vietnamese, Turkish, Hebrew, Latin (for classical education), ASL (very different modality — likely defer). Candidates to drop for V1: Arabic or Russian if reference-data curation cost is too high.
- **TTS integration for audio drills** — defer. V1 ships text `[AUDIO: ...]` cue placeholders; V2 wires to ElevenLabs or OpenAI TTS for listening-dictation and pronunciation drills.
- **Writing-practice mode for character-based languages** — defer. Stroke-order practice sheets for Chinese hanzi, Japanese kana/kanji, and Korean hangul would need an SVG/font pipeline; likely graduates to a separate `handwriting-practice` skill or a V2 mode inside `language-drill`.
- **Child-learner variant scope** — should K–5 immersion content graduate to its own skill (`immersion-classroom`) or stay as a mode here?
- **Conjugation tables authoritativeness** — how far do bundled `conjugation_tables.py` tables go vs trusting the model? Likely cover top 30 irregulars per language as ground truth and let the model handle regular patterns.
