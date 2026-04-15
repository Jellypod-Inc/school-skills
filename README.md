# School Skills for Claude Code

Classroom-ready skills for education — lesson plans, Socratic tutoring, circle time, rubrics, arts & crafts, study guides, and concept maps — all inside Claude Code.

> **Alpha preview.** Seven skills ship today; six more are on the way.

<!-- Screenshot: hero image showing Claude running a lesson-plan skill in a classroom context -->

---

## What is this?

**Claude Code** is a free AI assistant from Anthropic that runs on your computer. You talk to it in plain English and it can read, write, and create things for you — lesson plans, worksheets, handouts, you name it.

**Skills** are little packets of expertise you can add to Claude Code. Instead of starting from scratch every time, you install a skill once and then Claude knows how to, say, build a standards-aligned lesson plan the way a master teacher would.

**School Skills** is a bundle of classroom-focused skills for education — useful to teachers, students, tutors, homeschool parents, and anyone helping someone learn.

You do not need to know how to code to use this. If you can paste a command into a window, you are set.

---

## Install

There are two ways to install School Skills. Most people should use the first one.

### 1. Install as a Claude Code plugin (recommended)

Inside Claude Code, type these two commands. You can literally copy-paste them.

```
/plugin marketplace add Jellypod-Inc/school-skills
/plugin install school-skills@jellypod
```

<!-- Screenshot: /plugin marketplace add running in Claude Code -->

**What is `/plugin`?** It is a built-in Claude Code command for adding and managing add-ons. You type a forward slash (`/`), then the command name. Claude Code shows you a menu as you type.

That is it. All shipping skills are now available. When you ask Claude something like "help me plan a 5th grade fractions lesson," it will automatically pull up the `lesson-plan` skill.

**To update later:**

```
/plugin marketplace update jellypod
```

**To remove:**

```
/plugin uninstall school-skills@jellypod
```

### 2. Install via `npx` (alternative)

If you already have Node.js installed and you would rather copy the skill files directly into your Claude Code skills folder, run:

```bash
npx school-skills install
```

This copies every bundled skill into `~/.claude/skills/`. Claude Code picks them up automatically on the next session.

Other options:

```bash
npx school-skills install lesson-plan   # install just one skill
npx school-skills install --force       # overwrite without prompting
npx school-skills list                  # see what is bundled
npx school-skills --help                # see all options
```

<!-- Screenshot: terminal output of npx school-skills install -->

---

## Skill catalog

### Shipping today

| Skill | What it does |
| --- | --- |
| `lesson-plan` ✅ | Builds a standards-aligned lesson plan with objectives, activities, and assessments. Tailors to grade level, subject, and time available. |
| `socratic-tutor` ✅ | Guides a student through a problem with questions instead of answers. Great for math, science, and reading comprehension. |
| `circle-time` ✅ | Runs a morning meeting or classroom circle with prompts, SEL check-ins, and transition suggestions. |
| `rubric` ✅ | Turns an assignment prompt into a grading rubric — markdown + CSV, aligned to Bloom's. |
| `arts-crafts` ✅ | Plans age-appropriate craft projects with supplies, steps, mess level, and substitutions. |
| `lecture-to-study-guide` ✅ | Converts lecture notes, transcripts, or slides into an outline + key terms + practice questions. |
| `concept-map` ✅ | Produces mind maps and concept maps in Mermaid, Graphviz, or Markmap format — with optional rendering. |

### Coming soon

| Skill | What it will do |
| --- | --- |
| `flashcards` | Generate flashcard decks (CSV, Anki `.apkg`, Quizlet TSV) from notes or topic. |
| `quiz-generator` | Multiple choice, short answer, cloze, matching — with answer key and optional printable PDF. |
| `worksheet` | Turn a topic or standard into a printable PDF worksheet with answer key. |
| `latex-paper` | Scaffold a LaTeX paper, problem set, or lab report — IEEE/ACM/APA/MLA/math templates. |
| `language-drill` | CEFR-calibrated vocab / conjugation / dialogue drills across 11 languages. |
| `coloring-page` | Printable SVG/PDF coloring pages by theme and age. |

(Legend: ✅ shipping, blank = in development.)

---

## What do I do once it is installed?

Just talk to Claude Code naturally. For example:

- "Plan a 50-minute 8th grade lesson on the water cycle, hands-on if possible."
- "Help me tutor a student through this algebra problem without giving away the answer."
- "Give me five circle time prompts for the first week of school."

Claude will recognize when a skill fits and use it automatically.

---

## Requirements

- **Claude Code** installed. See <https://claude.com/claude-code> for install instructions.
- For the `npx` path: **Node.js 18 or newer**.
- No other software required for the seven shipping skills.

---

## Feedback and issues

This is an early alpha. If something is broken, confusing, or you wish a particular skill existed, please open an issue:

<https://github.com/Jellypod-Inc/school-skills/issues>

Teacher feedback is the whole point.

---

## License

MIT. See [LICENSE](./LICENSE).
