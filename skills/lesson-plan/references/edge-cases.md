# Edge Cases

Handle these special inputs explicitly. Triggers, decisions, and output changes are listed.

## Sub-plan / emergency

- **Triggers (case-insensitive):** "sub plan," "substitute," "out sick," "emergency," "last minute coverage," "need someone to cover."
- **Action:** switch to `references/templates/sub-plan.md`.
- **Constraints:** fully self-contained (no prior context), low-tech / printable, behavior-management section required, materials list = printable paper + pencils / pens only.
- **YAML footer:** set `sub_plan: true`, `low_tech: true`, `behavior_notes: true`.

## Multi-day unit

- **Triggers:** "unit," "multi-day," "N-day," "week-long," "across multiple days," "<number> days x <minutes> min."
- **Action:** switch to `references/templates/multi-day-unit.md`.
- **Constraints:** one Unit Overview + one Day N sub-section per day. Each day has distinct objective. Summative assessment at the end. Coherent arc (hook/context → exploration → deepening → synthesis → assessment).
- **YAML footer:** include `num_days`, `duration_minutes_per_session`, `daily_breakdown`.

## Mini-lesson (< 20 minutes)

- **Triggers:** duration explicitly under 20 min, "mini-lesson," "quick lesson," "15 minutes on X."
- **Action:** default template with trimmed sections.
- **Keep:** Header, Objectives (1 only), Hook, Direct Instruction, Quick CFU, Closure, YAML footer.
- **Drop or combine:** Guided Practice + Independent Practice combined into one "Quick Practice" section. Differentiation compressed to one-line-each.
- **Homework:** always "None."

## Block schedule / long class (≥ 90 min)

- **Triggers:** duration ≥ 90 min, "block schedule," "2-hour class."
- **Action:** default template + movement break at midpoint + second guided→independent cycle.
- **Insert after first Independent Practice:** a `### Movement Break (5 min)` sub-section.
- **Add second cycle:** repeat Guided Practice + Independent Practice with a new application or extension problem.

## Cross-subject / interdisciplinary

- **Triggers:** "ELA + history," "interdisciplinary," "STEAM," "cross-curricular."
- **Action:** cite standards from BOTH frameworks in Standards Alignment. Keep one unified set of objectives, tag each with the domain in parentheses. Example: "SWBAT analyze how geographic features shaped the settlement of the Americas (Social Studies + ELA RI.4.5)."

## Cross-grade / multi-age (homeschool or one-room)

- **Triggers:** "my 2nd grader and my 5th grader," "multi-age," "one-room schoolhouse," "homeschool with siblings."
- **Action:** generate base plan at the younger grade. Add a "Cross-age extension" bullet in the Gifted subsection for the older sibling(s) — same topic, higher cognitive tier.
- **Example:** Water cycle lesson for 2nd grader + 5th grader. Base = 2nd grade lesson. Extension = 5th grader creates a labeled diagram + explains how local weather illustrates one of the cycle stages.

## Religious / politically sensitive topics

- **Triggers:** evolution vs. creationism, political figures, historical atrocities, sex education, drugs/alcohol, religion, gender/sexuality.
- **Action:**
  1. Present age-appropriate, balanced framing.
  2. Stick to evidence and standards-aligned content.
  3. Surface the sensitivity in **Teacher Notes** with language like: *"This topic may be sensitive in some communities. Review your district's curriculum guidelines and consider sending parents an advance notice."*
- **Do not:** self-censor to the point of abandoning content. Do not provide one-sided political framings. Do not use source materials that assume a specific religious or political position.

## Subjects with weak standards coverage (Art, Music, PE, SEL, electives)

- **Triggers:** subject = Art, Music, PE, SEL, Drama, Electives, Maker.
- **Action:** standards framework optional.
  - Art → National Core Arts Standards (NCAS).
  - Music → NCAS (music subset).
  - PE → SHAPE America's National Standards & Grade-Level Outcomes.
  - SEL → CASEL 5 Core Competencies.
  - Other electives → cite "general best practice" if no standard exists.
- **Standards Alignment section:** cite what applies; if nothing, write "No standards framework applies — aligned to general best practice" and proceed.

## Standards that the user names loosely

- **Example:** user says "third grade writing standards."
- **Action:** infer the specific code (CCSS ELA Writing → `W.3.*`). In the Standards Alignment section, cite the inferred code and add: *"(Inferred from user request. Confirm with your district.)"*

## Non-English-primary classrooms

- **Triggers:** "ELL-majority class," "Spanish-dominant students," "dual-language immersion."
- **Action:** produce the plan in English (V1 default). Emphasize ELL scaffolds heavily in the Differentiation section. Offer to translate key vocabulary (accept the offer if the user asks).
- **Localization to UK / AU / international English + metric units** — deferred to V2.

## Very short or very long durations that don't match common schedules

- **< 10 min:** decline politely and ask user to confirm — likely a typo. "10 minutes is very short for a full lesson. Did you mean 30 or 40? Or is this a mini-lesson within a longer class?"
- **> 180 min single session:** confirm — "3 hours in one block? That's a studio / seminar / lab format. Should I plan it with 2-3 movement breaks and multiple cycles?"

## User requests standards the skill doesn't have first-class support for

- **Example:** "OECD standards," "Russian federal education standard."
- **Action:** acknowledge the framework, describe the topic + grade + objective descriptively, add a Teacher Notes bullet: *"Specific standard codes not bundled in this skill. Verify with [SEA / ministry URL]."*

## Ambiguous grade / mixed-grade requests

- **"High school"** (no specific grade) → default to 10th grade.
- **"Elementary"** → default to 3rd grade.
- **"Middle school"** → default to 7th grade.
- **Note the default choice** in Teacher Notes: *"Defaulted to Grade X — adjust as needed."*
