# School Skills Marketplace Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the non-skill infrastructure for the School Skills Marketplace: the Claude Code plugin manifest, marketplace catalog, npx installer, shared Python scripts (PDF/LaTeX/Anki), shared templates, Python deps file, and README — enough scaffolding that users can install via `/plugin marketplace add` or `npx school-skills install`.

**Architecture:** Single Claude Code plugin (`school-skills`) bundling all 13 skills under `skills/`. Self-hosted marketplace at `.claude-plugin/marketplace.json` pointing to itself via relative path. npm package with a `bin/install.js` that copies skill directories from the installed package into `~/.claude/skills/` for non-plugin installation. Shared Python scripts (Playwright PDF, tectonic LaTeX, genanki Anki) live in `shared/scripts/` and are referenced by each skill via `${CLAUDE_PLUGIN_ROOT}/shared/...` at runtime (Claude Code copies the whole plugin into its cache, preserving the structure). Templates live in `shared/templates/`.

**Tech Stack:**
- Claude Code plugin format (`.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`)
- Node.js for `bin/install.js` (plain Node, no deps — ships via npm)
- Python 3.10+ for shared scripts (Playwright, genanki, subprocess for tectonic/pdflatex)
- `requirements.txt` lists Python deps; Playwright needs `playwright install chromium` post-install

**Scope:** This plan covers everything EXCEPT the 13 skill directories themselves (`skills/flashcards/`, `skills/quiz-generator/`, etc.), which are implemented via the 13 per-skill plans. Where skills need to reference shared infrastructure, this plan establishes the contract those plans will consume.

---

## File Structure

Files this plan creates:

```
school-skills/
├── .claude-plugin/
│   ├── plugin.json                     # single-plugin manifest
│   └── marketplace.json                # self-hosted marketplace catalog
├── bin/
│   └── install.js                      # `npx school-skills install [skill]`
├── shared/
│   ├── scripts/
│   │   ├── pdf_render.py               # Playwright HTML→PDF
│   │   ├── latex_compile.py            # tectonic-first, pdflatex fallback
│   │   └── anki_export.py              # genanki .apkg builder
│   └── templates/
│       ├── worksheet.html              # Base worksheet HTML template
│       ├── coloring-page.html          # Base coloring-page HTML template
│       ├── quiz.html                   # Base printable quiz HTML template
│       ├── rubric.html                 # Base rubric HTML template
│       ├── paper.tex                   # LaTeX article template (IEEE/APA neutral)
│       └── problem-set.tex             # LaTeX problem-set template
├── tests/
│   ├── test_pdf_render.py              # pytest for pdf_render.py
│   ├── test_latex_compile.py           # pytest for latex_compile.py
│   ├── test_anki_export.py             # pytest for anki_export.py
│   └── test_install_js.sh              # shell test harness for bin/install.js
├── package.json                        # npm metadata + bin entry
├── requirements.txt                    # Python deps for shared scripts
├── README.md                           # non-techie install guide + skill catalog
├── CHANGELOG.md                        # semver changelog (starts at 0.1.0)
├── LICENSE                             # MIT
└── .gitignore                          # node_modules, __pycache__, .venv, dist PDFs
```

Files explicitly NOT created by this plan (owned by per-skill plans):
- `skills/*/SKILL.md`, `skills/*/scripts/`, `skills/*/references/`, `skills/*/evals/evals.json`

**Note on `image_fetch.py`:** Per the task description ("OPTIONAL; if not needed by any skill in V1, drop it"), we audit the 13 per-skill specs in Task 1 and drop it if no skill requires runtime image fetching. Per the master spec locked defaults, coloring-page uses a "bundled public-domain SVG library" and arts-crafts images are flagged as an open question resolved per-skill. We default to **dropping** `image_fetch.py` from V1 unless the audit surfaces a hard dependency.

---

## Task 1: Verify current Claude Code plugin schema + audit skill deps

**CRITICAL:** Plugin/marketplace schemas change. Do this task first; do not assume the schema documented here is still current when you implement.

**Files:**
- Create: `docs/superpowers/plans/2026-04-14-infrastructure-plan-schema-notes.md` (scratch notes, gitignored)

- [ ] **Step 1: Fetch current plugin manifest schema**

Run (via WebFetch or curl):
```
https://code.claude.com/docs/en/plugins-reference
https://code.claude.com/docs/en/plugin-marketplaces
```
Note: `docs.claude.com/en/docs/claude-code/plugins-reference` 301-redirects to `code.claude.com/docs/en/plugins-reference` as of 2026-04-14.

Extract and write down in scratch notes:
- Required fields in `plugin.json` (currently: only `name` is required)
- Required fields in `marketplace.json` (currently: `name`, `owner`, `plugins`)
- Valid plugin `source` shapes (relative path, github, url, git-subdir, npm)
- Whether `skills:` default path `./skills/` is still auto-discovered (currently: yes)
- Reserved marketplace names (currently: `claude-code-marketplace`, `claude-plugins-official`, `anthropic-*`, etc. — confirm `school-skills` is NOT reserved)

- [ ] **Step 2: Audit per-skill specs for shared-script dependencies**

Read each file in `docs/superpowers/specs/2026-04-14-*-design.md` and tabulate in scratch notes:

| Skill | pdf_render | latex_compile | anki_export | image_fetch |
|-------|:----------:|:-------------:|:-----------:|:-----------:|
| worksheet | Y | | | ? |
| quiz-generator | Y | | | |
| rubric | Y | | | |
| coloring-page | Y | | | |
| circle-time | Y | | | |
| arts-crafts | Y | | | ? |
| language-drill | Y | | Y | |
| latex-paper | | Y | | |
| flashcards | | | Y | |
| concept-map | ? | | | |
| lesson-plan | ? | | | |
| lecture-to-study-guide | | | | |
| socratic-tutor | | | | |

Fill `?`s with Y/N based on actual spec text.

- [ ] **Step 3: Decide on image_fetch.py**

If the audit shows zero `Y` for `image_fetch`, drop it from this plan. If any skill depends on it, add a new Task 12 to build it (Playwright + stock image source like Pexels API, or a bundled SVG library).

**Default decision:** drop it. coloring-page uses bundled SVGs. arts-crafts treats images as optional references ("photos (optional stock)" in master spec).

- [ ] **Step 4: Commit audit notes**

```bash
git add docs/superpowers/plans/2026-04-14-infrastructure-plan-schema-notes.md
git commit -m "chore: verify plugin schema and audit shared-script deps"
```

**Acceptance:** Scratch notes exist documenting (a) current plugin.json required/optional fields, (b) current marketplace.json required/optional fields, (c) per-skill shared-script dep matrix, (d) explicit keep/drop decision for image_fetch.py.

---

## Task 2: Repo bootstrap — .gitignore, LICENSE, CHANGELOG

**Files:**
- Create: `.gitignore`
- Create: `LICENSE`
- Create: `CHANGELOG.md`

- [ ] **Step 1: Write .gitignore**

Create `.gitignore`:
```
# Node
node_modules/
npm-debug.log
.npm/

# Python
__pycache__/
*.py[cod]
*.egg-info/
.venv/
venv/
.pytest_cache/

# Build artifacts
dist/
build/
*.pdf
*.apkg
!shared/templates/**/*.pdf
!shared/templates/**/*.apkg

# OS
.DS_Store
Thumbs.db

# Editors
.vscode/
.idea/
*.swp

# Scratch plan notes
docs/superpowers/plans/*-schema-notes.md
```

- [ ] **Step 2: Write LICENSE (MIT)**

Create `LICENSE` with standard MIT text, copyright holder "Jellypod, Inc.", year 2026.

- [ ] **Step 3: Write CHANGELOG.md**

Create `CHANGELOG.md`:
```markdown
# Changelog

All notable changes to the School Skills Marketplace are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning: [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial plugin manifest (`.claude-plugin/plugin.json`)
- Self-hosted marketplace manifest (`.claude-plugin/marketplace.json`)
- `npx school-skills install` installer
- Shared Python scripts: `pdf_render.py`, `latex_compile.py`, `anki_export.py`
- Shared templates for worksheet, coloring-page, quiz, rubric, LaTeX paper, problem-set
- README with non-techie install guide

## [0.1.0] - 2026-04-14

Initial pre-release. 13 skills + infrastructure.
```

- [ ] **Step 4: Commit**

```bash
git add .gitignore LICENSE CHANGELOG.md
git commit -m "chore: bootstrap repo with gitignore, license, changelog"
```

**Acceptance:** `.gitignore` ignores Node + Python build junk. `LICENSE` is valid MIT. `CHANGELOG.md` follows Keep-a-Changelog format and starts at 0.1.0.

---

## Task 3: Write `.claude-plugin/plugin.json`

**Files:**
- Create: `.claude-plugin/plugin.json`

- [ ] **Step 1: Write failing test**

Create `tests/test_plugin_json.py`:
```python
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

def test_plugin_json_exists():
    assert (REPO_ROOT / ".claude-plugin" / "plugin.json").exists()

def test_plugin_json_is_valid_json():
    path = REPO_ROOT / ".claude-plugin" / "plugin.json"
    data = json.loads(path.read_text())
    assert isinstance(data, dict)

def test_plugin_json_has_required_fields():
    path = REPO_ROOT / ".claude-plugin" / "plugin.json"
    data = json.loads(path.read_text())
    assert data["name"] == "school-skills"
    assert "version" in data
    assert "description" in data

def test_plugin_json_version_is_semver():
    import re
    path = REPO_ROOT / ".claude-plugin" / "plugin.json"
    data = json.loads(path.read_text())
    assert re.match(r"^\d+\.\d+\.\d+(-[\w.]+)?$", data["version"])

def test_plugin_json_author_has_name():
    path = REPO_ROOT / ".claude-plugin" / "plugin.json"
    data = json.loads(path.read_text())
    assert data["author"]["name"]
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `pytest tests/test_plugin_json.py -v`
Expected: all 5 tests FAIL with FileNotFoundError.

- [ ] **Step 3: Create `.claude-plugin/plugin.json`**

```json
{
  "name": "school-skills",
  "version": "0.1.0",
  "description": "13 Claude Code skills purpose-built for teachers and students: flashcards, quizzes, worksheets, lesson plans, rubrics, Socratic tutoring, LaTeX papers, study guides, concept maps, language drills, coloring pages, arts & crafts, and circle-time plans.",
  "author": {
    "name": "Jellypod, Inc.",
    "email": "hello@jellypod.ai",
    "url": "https://jellypod.ai"
  },
  "homepage": "https://github.com/jellypod/school-skills",
  "repository": "https://github.com/jellypod/school-skills",
  "license": "MIT",
  "keywords": [
    "education",
    "teaching",
    "students",
    "k-12",
    "flashcards",
    "lesson-plan",
    "worksheet",
    "anki",
    "latex",
    "study-guide"
  ]
}
```

Notes on intentional omissions:
- No `skills:` field — we want Claude Code's default `skills/` directory auto-discovery.
- No `commands:` — we use skills, not flat commands.
- No `agents:`, `hooks:`, `mcpServers:`, `lspServers:`, `outputStyles:`, `monitors:` — not needed in V1.
- No `userConfig:` — skills are stateless and local; no API keys prompted.

- [ ] **Step 4: Run tests to confirm they pass**

Run: `pytest tests/test_plugin_json.py -v`
Expected: all 5 tests PASS.

- [ ] **Step 5: Validate with Claude Code CLI**

Run: `claude plugin validate .`
Expected output: no errors. If the CLI is not installed, skip and note in PR.

- [ ] **Step 6: Commit**

```bash
git add .claude-plugin/plugin.json tests/test_plugin_json.py
git commit -m "feat: add plugin manifest for school-skills"
```

**Acceptance:** `plugin.json` validates against Task-1-verified schema. All 5 tests pass. `claude plugin validate .` reports no errors (if CLI available).

---

## Task 4: Write `.claude-plugin/marketplace.json`

**Files:**
- Create: `.claude-plugin/marketplace.json`

- [ ] **Step 1: Write failing test**

Create `tests/test_marketplace_json.py`:
```python
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

def test_marketplace_json_exists():
    assert (REPO_ROOT / ".claude-plugin" / "marketplace.json").exists()

def test_marketplace_has_required_fields():
    data = json.loads((REPO_ROOT / ".claude-plugin" / "marketplace.json").read_text())
    assert data["name"] == "school-skills"
    assert data["owner"]["name"]
    assert isinstance(data["plugins"], list)
    assert len(data["plugins"]) >= 1

def test_marketplace_lists_educator_skills_plugin():
    data = json.loads((REPO_ROOT / ".claude-plugin" / "marketplace.json").read_text())
    names = [p["name"] for p in data["plugins"]]
    assert "school-skills" in names

def test_plugin_source_is_relative_path_to_self():
    data = json.loads((REPO_ROOT / ".claude-plugin" / "marketplace.json").read_text())
    entry = next(p for p in data["plugins"] if p["name"] == "school-skills")
    # Self-hosted: marketplace and plugin live in same repo; plugin root is repo root.
    assert entry["source"] == "./"

def test_marketplace_name_not_reserved():
    # Per plugin-marketplaces doc, these names are reserved.
    reserved = {
        "claude-code-marketplace", "claude-code-plugins", "claude-plugins-official",
        "anthropic-marketplace", "anthropic-plugins", "agent-skills",
        "knowledge-work-plugins", "life-sciences",
    }
    data = json.loads((REPO_ROOT / ".claude-plugin" / "marketplace.json").read_text())
    assert data["name"] not in reserved
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `pytest tests/test_marketplace_json.py -v`
Expected: all 5 tests FAIL.

- [ ] **Step 3: Create `.claude-plugin/marketplace.json`**

```json
{
  "name": "school-skills",
  "owner": {
    "name": "Jellypod, Inc.",
    "email": "hello@jellypod.ai"
  },
  "metadata": {
    "description": "Skills marketplace for educators and students — K-12 through graduate level.",
    "version": "0.1.0"
  },
  "plugins": [
    {
      "name": "school-skills",
      "source": "./",
      "description": "13 skills for teachers and students: flashcards, quizzes, worksheets, lesson plans, rubrics, tutoring, LaTeX papers, study guides, concept maps, language drills, coloring pages, crafts, and circle time.",
      "category": "education",
      "keywords": ["education", "teaching", "k-12", "college"],
      "license": "MIT",
      "homepage": "https://github.com/jellypod/school-skills"
    }
  ]
}
```

Rationale for `"source": "./"`: the marketplace catalog and the single plugin live in the same repo. The plugin root IS the repo root (where `.claude-plugin/plugin.json` lives). Relative paths resolve against the marketplace root (the directory containing `.claude-plugin/`), which is the repo root itself.

- [ ] **Step 4: Run tests to confirm they pass**

Run: `pytest tests/test_marketplace_json.py -v`
Expected: all 5 tests PASS.

- [ ] **Step 5: Validate via CLI**

Run: `claude plugin validate .`
Expected: no errors about the marketplace.

- [ ] **Step 6: Commit**

```bash
git add .claude-plugin/marketplace.json tests/test_marketplace_json.py
git commit -m "feat: add self-hosted marketplace manifest"
```

**Acceptance:** `marketplace.json` lists exactly one plugin (`school-skills`) with `source: "./"`. Name is not in reserved list. All 5 tests pass.

---

## Task 5: Write `package.json` and `bin/install.js` (scaffold only)

This task sets up the npm package metadata and a minimal bin script that exits 0 for `--help`. Task 6 fills in the real install logic.

**Files:**
- Create: `package.json`
- Create: `bin/install.js` (scaffold)

- [ ] **Step 1: Write failing integration test**

Create `tests/test_install_js.sh`:
```bash
#!/usr/bin/env bash
# Integration test harness for bin/install.js
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# Test 1: --help exits 0
node bin/install.js --help >/dev/null
echo "PASS: --help exits 0"

# Test 2: --version prints version matching package.json
VERSION=$(node -e "console.log(require('./package.json').version)")
OUTPUT=$(node bin/install.js --version)
if [[ "$OUTPUT" != *"$VERSION"* ]]; then
  echo "FAIL: --version output '$OUTPUT' missing '$VERSION'"
  exit 1
fi
echo "PASS: --version prints $VERSION"

# Test 3: bin is executable
if [[ ! -x bin/install.js ]]; then
  echo "FAIL: bin/install.js not executable"
  exit 1
fi
echo "PASS: bin/install.js is executable"

echo "All scaffold tests passed."
```

Make it executable: `chmod +x tests/test_install_js.sh`.

- [ ] **Step 2: Run to confirm failure**

Run: `bash tests/test_install_js.sh`
Expected: FAIL with "Cannot find module" or file-not-found.

- [ ] **Step 3: Create `package.json`**

```json
{
  "name": "school-skills",
  "version": "0.1.0",
  "description": "13 Claude Code skills for teachers and students. Installable via Claude Code plugin marketplace or npx.",
  "keywords": [
    "education",
    "teaching",
    "claude",
    "claude-code",
    "skills",
    "flashcards",
    "lesson-plan",
    "worksheet"
  ],
  "homepage": "https://github.com/jellypod/school-skills",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/jellypod/school-skills.git"
  },
  "bugs": {
    "url": "https://github.com/jellypod/school-skills/issues"
  },
  "license": "MIT",
  "author": "Jellypod, Inc. <hello@jellypod.ai>",
  "bin": {
    "school-skills": "bin/install.js"
  },
  "files": [
    ".claude-plugin/",
    "bin/",
    "shared/",
    "skills/",
    "README.md",
    "LICENSE",
    "CHANGELOG.md",
    "requirements.txt"
  ],
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "test": "bash tests/test_install_js.sh && pytest tests/"
  }
}
```

Notes:
- `files:` explicitly includes skill dirs, shared scripts, templates, manifests. Excludes `tests/`, `docs/`, scratch files.
- `bin.school-skills` → makes `npx school-skills <command>` work.
- `engines.node >=18`: needed for built-in `fs.cpSync` (Node 16.7+) and modern ESM/CJS interop.

- [ ] **Step 4: Create `bin/install.js` scaffold**

```javascript
#!/usr/bin/env node
// school-skills CLI
// Usage:
//   npx school-skills install           # install all skills
//   npx school-skills install <skill>   # install one skill
//   npx school-skills list              # list available skills
//   npx school-skills --help
//   npx school-skills --version

"use strict";

const pkg = require("../package.json");

function printHelp() {
  console.log(`
school-skills v${pkg.version}

Usage:
  npx school-skills install           Install all 13 skills to ~/.claude/skills/
  npx school-skills install <skill>   Install one skill (e.g. flashcards)
  npx school-skills list              List available skills
  npx school-skills --help            Show this help
  npx school-skills --version         Show version

Preferred installation is via Claude Code plugin marketplace:
  /plugin marketplace add jellypod/school-skills
  /plugin install school-skills@school-skills
`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }
  if (args.includes("--version") || args.includes("-v")) {
    console.log(pkg.version);
    process.exit(0);
  }
  // Real commands wired up in Task 6.
  console.error(`Unknown command: ${args.join(" ")}`);
  console.error(`Run 'npx school-skills --help' for usage.`);
  process.exit(1);
}

main();
```

- [ ] **Step 5: Make bin executable**

```bash
chmod +x bin/install.js
```

- [ ] **Step 6: Run test harness to confirm pass**

Run: `bash tests/test_install_js.sh`
Expected: all 3 PASS lines printed.

- [ ] **Step 7: Commit**

```bash
git add package.json bin/install.js tests/test_install_js.sh
git commit -m "feat: scaffold npm package and install CLI"
```

**Acceptance:** `package.json` has correct `bin` and `files` entries. `node bin/install.js --help` exits 0. `node bin/install.js --version` prints `0.1.0`. `bin/install.js` is executable.

---

## Task 6: Implement `bin/install.js` real commands (list + install)

Fills in the skill-copying logic.

**Files:**
- Modify: `bin/install.js`
- Modify: `tests/test_install_js.sh`

- [ ] **Step 1: Extend test harness**

Append to `tests/test_install_js.sh`:
```bash
# --- Real-command tests ---

# Set up an isolated fake home for install target
FAKE_HOME="$(mktemp -d)"
trap 'rm -rf "$FAKE_HOME"' EXIT
export HOME="$FAKE_HOME"

# Test 4: `list` prints skill names
LIST_OUTPUT=$(node bin/install.js list)
for skill in flashcards quiz-generator worksheet lesson-plan rubric socratic-tutor \
             latex-paper lecture-to-study-guide concept-map language-drill \
             coloring-page arts-crafts circle-time; do
  if [[ "$LIST_OUTPUT" != *"$skill"* ]]; then
    echo "FAIL: list missing $skill"
    exit 1
  fi
done
echo "PASS: list prints all 13 skills"

# Test 5: `install <skill>` copies ONE skill into $HOME/.claude/skills/
# (We seed a fake skill since real skills come from other plans.)
mkdir -p skills/flashcards
echo "# Flashcards stub" > skills/flashcards/SKILL.md

node bin/install.js install flashcards
if [[ ! -f "$HOME/.claude/skills/flashcards/SKILL.md" ]]; then
  echo "FAIL: single-skill install didn't copy SKILL.md"
  exit 1
fi
echo "PASS: single-skill install works"

# Test 6: `install` (no arg) copies all discovered skills
rm -rf "$HOME/.claude/skills"
mkdir -p skills/quiz-generator
echo "# Quiz stub" > skills/quiz-generator/SKILL.md

node bin/install.js install
if [[ ! -f "$HOME/.claude/skills/flashcards/SKILL.md" ]]; then
  echo "FAIL: install-all didn't copy flashcards"
  exit 1
fi
if [[ ! -f "$HOME/.claude/skills/quiz-generator/SKILL.md" ]]; then
  echo "FAIL: install-all didn't copy quiz-generator"
  exit 1
fi
echo "PASS: install-all works"

# Test 7: installing unknown skill exits 1
if node bin/install.js install doesnotexist 2>/dev/null; then
  echo "FAIL: unknown skill should exit nonzero"
  exit 1
fi
echo "PASS: unknown skill exits 1"

# Cleanup seeded stubs
rm -rf skills/flashcards skills/quiz-generator
[[ -z "$(ls -A skills 2>/dev/null || true)" ]] && rmdir skills || true

echo "All install tests passed."
```

- [ ] **Step 2: Run to confirm failure**

Run: `bash tests/test_install_js.sh`
Expected: Test 4 fails first ("Unknown command: list").

- [ ] **Step 3: Replace `bin/install.js`**

```javascript
#!/usr/bin/env node
// school-skills CLI
// Usage:
//   npx school-skills install           # install all skills
//   npx school-skills install <skill>   # install one skill
//   npx school-skills list              # list available skills
//   npx school-skills --help
//   npx school-skills --version

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const pkg = require("../package.json");

const PACKAGE_ROOT = path.resolve(__dirname, "..");
const SKILLS_SRC = path.join(PACKAGE_ROOT, "skills");
const SKILLS_DEST = path.join(os.homedir(), ".claude", "skills");

function printHelp() {
  console.log(`
school-skills v${pkg.version}

Usage:
  npx school-skills install           Install all 13 skills to ~/.claude/skills/
  npx school-skills install <skill>   Install one skill (e.g. flashcards)
  npx school-skills list              List available skills
  npx school-skills --help            Show this help
  npx school-skills --version         Show version

Preferred installation is via Claude Code plugin marketplace:
  /plugin marketplace add jellypod/school-skills
  /plugin install school-skills@school-skills
`);
}

function listAvailableSkills() {
  if (!fs.existsSync(SKILLS_SRC)) return [];
  return fs
    .readdirSync(SKILLS_SRC, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function cmdList() {
  const skills = listAvailableSkills();
  if (skills.length === 0) {
    console.log("No skills available.");
    return;
  }
  console.log("Available skills:");
  for (const s of skills) console.log(`  - ${s}`);
}

function installOne(skill) {
  const src = path.join(SKILLS_SRC, skill);
  const dest = path.join(SKILLS_DEST, skill);
  if (!fs.existsSync(src) || !fs.statSync(src).isDirectory()) {
    console.error(`Error: skill "${skill}" not found.`);
    console.error(`Run 'npx school-skills list' to see available skills.`);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  // fs.cpSync requires Node 16.7+. We declared engines.node >=18.
  fs.cpSync(src, dest, { recursive: true, force: true });
  console.log(`Installed: ${skill} -> ${dest}`);
}

function cmdInstall(target) {
  const available = listAvailableSkills();
  if (available.length === 0) {
    console.error("Error: no skills bundled in this package.");
    process.exit(1);
  }
  if (target) {
    installOne(target);
    return;
  }
  for (const s of available) installOne(s);
  console.log(`\nDone. Installed ${available.length} skill(s) to ${SKILLS_DEST}.`);
  console.log("Restart Claude Code to pick them up.");
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }
  if (args.includes("--version") || args.includes("-v")) {
    console.log(pkg.version);
    process.exit(0);
  }
  const [cmd, ...rest] = args;
  if (cmd === "list") return cmdList();
  if (cmd === "install") return cmdInstall(rest[0]);
  console.error(`Unknown command: ${cmd}`);
  console.error("Run 'npx school-skills --help' for usage.");
  process.exit(1);
}

main();
```

- [ ] **Step 4: Run full test harness**

Run: `bash tests/test_install_js.sh`
Expected: all PASS lines (tests 1-7).

- [ ] **Step 5: Commit**

```bash
git add bin/install.js tests/test_install_js.sh
git commit -m "feat: implement install and list commands for school-skills CLI"
```

**Acceptance:** `list` prints all skill directory names from `skills/`. `install <skill>` copies one skill into `~/.claude/skills/<skill>/`. `install` (no arg) copies all. Unknown skill exits 1. All 7 shell tests pass.

---

## Task 7: Write `requirements.txt`

**Files:**
- Create: `requirements.txt`

- [ ] **Step 1: Write failing test**

Add to `tests/test_requirements.py`:
```python
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

def test_requirements_txt_exists():
    assert (REPO_ROOT / "requirements.txt").exists()

def test_requirements_has_playwright():
    content = (REPO_ROOT / "requirements.txt").read_text()
    assert "playwright" in content.lower()

def test_requirements_has_genanki():
    content = (REPO_ROOT / "requirements.txt").read_text()
    assert "genanki" in content.lower()

def test_requirements_pins_major_versions():
    # Each dep line should have a version constraint (>=, ==, ~=).
    content = (REPO_ROOT / "requirements.txt").read_text()
    for line in content.strip().splitlines():
        line = line.split("#")[0].strip()
        if not line:
            continue
        assert any(op in line for op in [">=", "==", "~=", ">"]), f"no version pin: {line}"
```

- [ ] **Step 2: Run to confirm failure**

Run: `pytest tests/test_requirements.py -v`
Expected: all tests FAIL.

- [ ] **Step 3: Create `requirements.txt`**

```
# School Skills — shared Python deps
# Install: pip install -r requirements.txt && playwright install chromium

# PDF rendering (pdf_render.py)
playwright>=1.42.0

# Anki export (anki_export.py)
genanki>=0.13.1

# Testing (dev)
pytest>=8.0.0
```

Notes:
- `tectonic` (LaTeX) is NOT a pip dep — it's a Rust binary users install separately (brew/apt/download). `latex_compile.py` detects it at runtime and falls back to `pdflatex`.
- No image-fetch deps (we dropped `image_fetch.py` in Task 1 Step 3).

- [ ] **Step 4: Run to confirm pass**

Run: `pytest tests/test_requirements.py -v`
Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add requirements.txt tests/test_requirements.py
git commit -m "feat: add Python requirements for shared scripts"
```

**Acceptance:** `requirements.txt` lists playwright, genanki, pytest with version pins. Tests pass.

---

## Task 8: Implement `shared/scripts/pdf_render.py`

Playwright-based HTML→PDF.

**Files:**
- Create: `shared/scripts/pdf_render.py`
- Create: `tests/test_pdf_render.py`
- Create: `shared/scripts/__init__.py` (empty, so tests can import)

- [ ] **Step 1: Write failing test**

Create `tests/test_pdf_render.py`:
```python
import sys
from pathlib import Path
import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from shared.scripts.pdf_render import render_html_to_pdf, PdfOptions


def test_renders_simple_html_to_pdf(tmp_path):
    html = "<html><body><h1>Hello</h1></body></html>"
    out = tmp_path / "out.pdf"
    render_html_to_pdf(html, str(out))
    assert out.exists()
    assert out.stat().st_size > 100  # non-empty PDF
    assert out.read_bytes().startswith(b"%PDF-")


def test_applies_page_size_option(tmp_path):
    html = "<html><body>test</body></html>"
    out = tmp_path / "letter.pdf"
    render_html_to_pdf(html, str(out), PdfOptions(page_size="Letter"))
    assert out.exists()


def test_applies_margin_option(tmp_path):
    html = "<html><body>test</body></html>"
    out = tmp_path / "margin.pdf"
    render_html_to_pdf(html, str(out), PdfOptions(margin="1in"))
    assert out.exists()


def test_raises_on_empty_html(tmp_path):
    with pytest.raises(ValueError):
        render_html_to_pdf("", str(tmp_path / "x.pdf"))


def test_cli_interface(tmp_path):
    # `python pdf_render.py --html <path> --out <path>` should work.
    import subprocess
    html_path = tmp_path / "in.html"
    html_path.write_text("<h1>cli</h1>")
    out = tmp_path / "cli.pdf"
    result = subprocess.run(
        [sys.executable, "shared/scripts/pdf_render.py",
         "--html", str(html_path), "--out", str(out), "--page-size", "A4"],
        cwd=str(REPO_ROOT), capture_output=True, text=True,
    )
    assert result.returncode == 0, result.stderr
    assert out.exists()
```

- [ ] **Step 2: Run to confirm failure**

Run: `pytest tests/test_pdf_render.py -v`
Expected: ImportError on `shared.scripts.pdf_render`.

- [ ] **Step 3: Create `shared/scripts/__init__.py`**

```python
```
(empty file so pytest can import as a package)

Also create `shared/__init__.py` (empty).

- [ ] **Step 4: Implement `shared/scripts/pdf_render.py`**

```python
#!/usr/bin/env python3
"""HTML → PDF rendering via Playwright (headless Chromium).

Public API:
    render_html_to_pdf(html: str, output_path: str, options: PdfOptions | None = None) -> str

Options (`PdfOptions` dataclass):
    page_size   "Letter" | "A4" | "Legal" | "Tabloid" ... (Chromium format names)
    margin      CSS length like "0.5in", "1cm" (uniform on all sides)
    dpi         Print DPI; Playwright defaults to 96. Use 300 for high-res worksheets.
    landscape   bool, default False
    print_background  bool, default True (preserves CSS backgrounds/colors)

CLI:
    python pdf_render.py --html input.html --out output.pdf [--page-size Letter]
                          [--margin 0.5in] [--dpi 300] [--landscape]

Prerequisites:
    pip install playwright
    playwright install chromium
"""

from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass
from pathlib import Path


@dataclass
class PdfOptions:
    page_size: str = "Letter"
    margin: str = "0.5in"
    dpi: int = 96  # Chromium default; raise for print-quality worksheets.
    landscape: bool = False
    print_background: bool = True


def render_html_to_pdf(
    html: str,
    output_path: str,
    options: PdfOptions | None = None,
) -> str:
    """Render HTML string to PDF file. Returns absolute output path."""
    if not html or not html.strip():
        raise ValueError("html must be non-empty")
    opts = options or PdfOptions()

    # Import here so tests that don't exercise rendering can import the module.
    from playwright.sync_api import sync_playwright

    out = Path(output_path).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)

    margin = {
        "top": opts.margin, "right": opts.margin,
        "bottom": opts.margin, "left": opts.margin,
    }

    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            context = browser.new_context(device_scale_factor=opts.dpi / 96)
            page = context.new_page()
            page.set_content(html, wait_until="networkidle")
            page.pdf(
                path=str(out),
                format=opts.page_size,
                margin=margin,
                landscape=opts.landscape,
                print_background=opts.print_background,
            )
        finally:
            browser.close()
    return str(out)


def _cli() -> int:
    parser = argparse.ArgumentParser(description="HTML → PDF via Playwright.")
    parser.add_argument("--html", required=True, help="Path to HTML file.")
    parser.add_argument("--out", required=True, help="Output PDF path.")
    parser.add_argument("--page-size", default="Letter")
    parser.add_argument("--margin", default="0.5in")
    parser.add_argument("--dpi", type=int, default=96)
    parser.add_argument("--landscape", action="store_true")
    args = parser.parse_args()

    html = Path(args.html).read_text(encoding="utf-8")
    render_html_to_pdf(
        html, args.out,
        PdfOptions(
            page_size=args.page_size,
            margin=args.margin,
            dpi=args.dpi,
            landscape=args.landscape,
        ),
    )
    print(f"Wrote {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(_cli())
```

- [ ] **Step 5: Install Playwright and run tests**

```bash
python -m pip install -r requirements.txt
python -m playwright install chromium
pytest tests/test_pdf_render.py -v
```
Expected: all 5 tests PASS. (First chromium install may take a minute.)

- [ ] **Step 6: Commit**

```bash
git add shared/__init__.py shared/scripts/__init__.py shared/scripts/pdf_render.py tests/test_pdf_render.py
git commit -m "feat: add shared pdf_render.py using Playwright"
```

**Acceptance:** `render_html_to_pdf(html, path)` writes a valid PDF. Options `page_size`, `margin`, `dpi`, `landscape` all functional. CLI entrypoint works. All 5 tests pass.

---

## Task 9: Implement `shared/scripts/latex_compile.py`

**Files:**
- Create: `shared/scripts/latex_compile.py`
- Create: `tests/test_latex_compile.py`

- [ ] **Step 1: Write failing tests**

Create `tests/test_latex_compile.py`:
```python
import sys
import shutil
from pathlib import Path
import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from shared.scripts.latex_compile import compile_latex, detect_compiler


def _has_any_latex():
    return shutil.which("tectonic") or shutil.which("pdflatex")


def test_detect_compiler_returns_known_value():
    result = detect_compiler()
    assert result in ("tectonic", "pdflatex", None)


def test_prefers_tectonic_when_both_present(monkeypatch):
    monkeypatch.setattr(shutil, "which", lambda x: f"/usr/local/bin/{x}")
    assert detect_compiler() == "tectonic"


def test_falls_back_to_pdflatex_when_no_tectonic(monkeypatch):
    def which(x):
        return None if x == "tectonic" else "/usr/local/bin/pdflatex"
    monkeypatch.setattr(shutil, "which", which)
    assert detect_compiler() == "pdflatex"


def test_returns_none_when_nothing_installed(monkeypatch):
    monkeypatch.setattr(shutil, "which", lambda x: None)
    assert detect_compiler() is None


def test_compile_raises_when_no_compiler(monkeypatch, tmp_path):
    monkeypatch.setattr(shutil, "which", lambda x: None)
    src = tmp_path / "x.tex"
    src.write_text(r"\documentclass{article}\begin{document}hi\end{document}")
    with pytest.raises(RuntimeError, match="no LaTeX compiler"):
        compile_latex(str(src), str(tmp_path / "out.pdf"))


@pytest.mark.skipif(not _has_any_latex(), reason="no LaTeX installed")
def test_compiles_minimal_document(tmp_path):
    src = tmp_path / "doc.tex"
    src.write_text(r"""
    \documentclass{article}
    \begin{document}
    Hello, world.
    \end{document}
    """)
    out = tmp_path / "doc.pdf"
    compile_latex(str(src), str(out))
    assert out.exists()
    assert out.read_bytes().startswith(b"%PDF-")
```

- [ ] **Step 2: Run to confirm failure**

Run: `pytest tests/test_latex_compile.py -v`
Expected: ImportError.

- [ ] **Step 3: Implement `shared/scripts/latex_compile.py`**

```python
#!/usr/bin/env python3
"""LaTeX → PDF compilation. Prefers tectonic (self-contained); falls back to pdflatex.

Public API:
    detect_compiler() -> "tectonic" | "pdflatex" | None
    compile_latex(tex_path: str, output_path: str, *, passes: int = 2) -> str

CLI:
    python latex_compile.py --tex input.tex --out output.pdf

Notes:
- tectonic: single binary, fetches missing packages automatically. Preferred.
- pdflatex: traditional TeX Live. Needs 2 passes for references/TOC.
- Install tectonic: `brew install tectonic` / apt / cargo install tectonic.
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path


def detect_compiler() -> str | None:
    """Return 'tectonic', 'pdflatex', or None based on $PATH."""
    if shutil.which("tectonic"):
        return "tectonic"
    if shutil.which("pdflatex"):
        return "pdflatex"
    return None


def compile_latex(tex_path: str, output_path: str, *, passes: int = 2) -> str:
    """Compile tex_path to output_path. Returns absolute output path."""
    compiler = detect_compiler()
    if compiler is None:
        raise RuntimeError(
            "no LaTeX compiler found. Install tectonic (preferred: "
            "`brew install tectonic`) or pdflatex (TeX Live)."
        )
    tex = Path(tex_path).resolve()
    out = Path(output_path).resolve()
    if not tex.exists():
        raise FileNotFoundError(tex_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    work = tex.parent
    if compiler == "tectonic":
        # tectonic handles multiple passes and outputs beside the .tex file.
        cmd = [
            "tectonic", "--outdir", str(out.parent),
            "--keep-logs", "--chatter", "minimal", str(tex),
        ]
        result = subprocess.run(cmd, cwd=str(work), capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(
                f"tectonic failed:\nstdout:\n{result.stdout}\nstderr:\n{result.stderr}"
            )
        produced = out.parent / f"{tex.stem}.pdf"
    else:
        # pdflatex: run `passes` times for references/TOC stability.
        cmd = [
            "pdflatex", "-interaction=nonstopmode", "-halt-on-error",
            f"-output-directory={out.parent}", str(tex),
        ]
        for i in range(passes):
            result = subprocess.run(cmd, cwd=str(work), capture_output=True, text=True)
            if result.returncode != 0:
                raise RuntimeError(
                    f"pdflatex failed on pass {i + 1}:\n"
                    f"stdout:\n{result.stdout}\nstderr:\n{result.stderr}"
                )
        produced = out.parent / f"{tex.stem}.pdf"

    if produced != out:
        produced.rename(out)
    return str(out)


def _cli() -> int:
    parser = argparse.ArgumentParser(description="LaTeX → PDF.")
    parser.add_argument("--tex", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--passes", type=int, default=2,
                        help="pdflatex passes (ignored by tectonic). Default 2.")
    args = parser.parse_args()
    compile_latex(args.tex, args.out, passes=args.passes)
    print(f"Wrote {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(_cli())
```

- [ ] **Step 4: Run tests**

Run: `pytest tests/test_latex_compile.py -v`
Expected: 5 tests PASS (6th is skipped if no LaTeX installed; passes if either tectonic or pdflatex present).

- [ ] **Step 5: Commit**

```bash
git add shared/scripts/latex_compile.py tests/test_latex_compile.py
git commit -m "feat: add shared latex_compile.py with tectonic and pdflatex fallback"
```

**Acceptance:** `detect_compiler()` correctly picks tectonic > pdflatex > None. `compile_latex()` raises on missing compiler, produces PDF when one is installed. Tests pass (LaTeX compile test skipped gracefully in CI without LaTeX).

---

## Task 10: Implement `shared/scripts/anki_export.py`

**Files:**
- Create: `shared/scripts/anki_export.py`
- Create: `tests/test_anki_export.py`

- [ ] **Step 1: Write failing tests**

Create `tests/test_anki_export.py`:
```python
import sys
import zipfile
from pathlib import Path
import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from shared.scripts.anki_export import build_apkg, Card


def test_builds_apkg_from_basic_cards(tmp_path):
    cards = [
        Card(front="What is 2+2?", back="4"),
        Card(front="Capital of France?", back="Paris"),
    ]
    out = tmp_path / "deck.apkg"
    build_apkg(cards, "Basic Test Deck", str(out))
    assert out.exists()
    # .apkg is a zip containing collection.anki2 (sqlite) + media map.
    with zipfile.ZipFile(out) as z:
        names = z.namelist()
        assert any(n.startswith("collection.anki") for n in names), names
        assert "media" in names, names


def test_supports_cloze_cards(tmp_path):
    cards = [Card(text="The capital of {{c1::France}} is {{c2::Paris}}.", cloze=True)]
    out = tmp_path / "cloze.apkg"
    build_apkg(cards, "Cloze Test", str(out))
    assert out.exists()


def test_raises_on_empty_cards(tmp_path):
    with pytest.raises(ValueError):
        build_apkg([], "Empty", str(tmp_path / "x.apkg"))


def test_tags_are_applied(tmp_path):
    cards = [Card(front="F", back="B", tags=["chapter-1", "review"])]
    out = tmp_path / "tagged.apkg"
    build_apkg(cards, "Tagged", str(out))
    assert out.exists()


def test_cli_interface(tmp_path):
    import subprocess, json
    deck_json = tmp_path / "deck.json"
    deck_json.write_text(json.dumps({
        "name": "CLI Deck",
        "cards": [{"front": "A", "back": "B"}],
    }))
    out = tmp_path / "cli.apkg"
    result = subprocess.run(
        [sys.executable, "shared/scripts/anki_export.py",
         "--input", str(deck_json), "--out", str(out)],
        cwd=str(REPO_ROOT), capture_output=True, text=True,
    )
    assert result.returncode == 0, result.stderr
    assert out.exists()
```

- [ ] **Step 2: Run to confirm failure**

Run: `pytest tests/test_anki_export.py -v`
Expected: ImportError.

- [ ] **Step 3: Implement `shared/scripts/anki_export.py`**

```python
#!/usr/bin/env python3
"""Build Anki .apkg files from card data using genanki.

Public API:
    Card — dataclass (front/back OR text+cloze=True; optional tags)
    build_apkg(cards: list[Card], deck_name: str, output_path: str) -> str

CLI:
    python anki_export.py --input deck.json --out deck.apkg

    deck.json:
        { "name": "My Deck",
          "cards": [
            {"front": "...", "back": "..."},
            {"text": "...{{c1::...}}...", "cloze": true, "tags": ["tag"]}
          ] }
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class Card:
    front: str | None = None
    back: str | None = None
    text: str | None = None   # for cloze
    cloze: bool = False
    tags: list[str] = field(default_factory=list)


def _stable_id(seed: str) -> int:
    """Stable positive 31-bit int from a string. Anki IDs fit in 31 bits."""
    h = hashlib.sha256(seed.encode("utf-8")).digest()
    return int.from_bytes(h[:4], "big") & 0x7FFFFFFF


def build_apkg(cards: list[Card], deck_name: str, output_path: str) -> str:
    if not cards:
        raise ValueError("cards must be non-empty")
    import genanki

    basic_model = genanki.Model(
        _stable_id(f"model-basic:{deck_name}"),
        "School Skills Basic",
        fields=[{"name": "Front"}, {"name": "Back"}],
        templates=[{
            "name": "Card 1",
            "qfmt": "{{Front}}",
            "afmt": "{{FrontSide}}<hr id=answer>{{Back}}",
        }],
    )
    cloze_model = genanki.Model(
        _stable_id(f"model-cloze:{deck_name}"),
        "School Skills Cloze",
        fields=[{"name": "Text"}],
        templates=[{
            "name": "Cloze",
            "qfmt": "{{cloze:Text}}",
            "afmt": "{{cloze:Text}}",
        }],
        model_type=genanki.Model.CLOZE,
    )

    deck = genanki.Deck(_stable_id(f"deck:{deck_name}"), deck_name)
    for c in cards:
        if c.cloze:
            if not c.text:
                raise ValueError("cloze card requires text")
            note = genanki.Note(model=cloze_model, fields=[c.text], tags=c.tags)
        else:
            if c.front is None or c.back is None:
                raise ValueError("basic card requires front and back")
            note = genanki.Note(
                model=basic_model, fields=[c.front, c.back], tags=c.tags,
            )
        deck.add_note(note)

    out = Path(output_path).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    genanki.Package(deck).write_to_file(str(out))
    return str(out)


def _cli() -> int:
    parser = argparse.ArgumentParser(description="Build Anki .apkg from JSON deck spec.")
    parser.add_argument("--input", required=True, help="JSON file with deck spec.")
    parser.add_argument("--out", required=True, help="Output .apkg path.")
    args = parser.parse_args()

    spec = json.loads(Path(args.input).read_text(encoding="utf-8"))
    cards = [Card(**c) for c in spec["cards"]]
    build_apkg(cards, spec["name"], args.out)
    print(f"Wrote {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(_cli())
```

- [ ] **Step 4: Run tests**

Run: `pytest tests/test_anki_export.py -v`
Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add shared/scripts/anki_export.py tests/test_anki_export.py
git commit -m "feat: add shared anki_export.py using genanki"
```

**Acceptance:** `build_apkg()` produces a valid zip containing `collection.anki*` and `media`. Supports basic and cloze cards plus tags. Uses deterministic IDs (same deck name → same model/deck IDs, so Anki re-imports cleanly). CLI reads JSON spec.

---

## Task 11: Write shared templates

**Files:**
- Create: `shared/templates/worksheet.html`
- Create: `shared/templates/coloring-page.html`
- Create: `shared/templates/quiz.html`
- Create: `shared/templates/rubric.html`
- Create: `shared/templates/paper.tex`
- Create: `shared/templates/problem-set.tex`

These are minimal, opinionated base templates. Per-skill plans customize/extend.

- [ ] **Step 1: Write failing test**

Create `tests/test_templates.py`:
```python
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
TEMPLATES = REPO_ROOT / "shared" / "templates"

EXPECTED_HTML = ["worksheet.html", "coloring-page.html", "quiz.html", "rubric.html"]
EXPECTED_TEX = ["paper.tex", "problem-set.tex"]


def test_all_html_templates_exist():
    for name in EXPECTED_HTML:
        assert (TEMPLATES / name).exists(), f"missing {name}"


def test_all_tex_templates_exist():
    for name in EXPECTED_TEX:
        assert (TEMPLATES / name).exists(), f"missing {name}"


def test_html_templates_have_placeholders():
    # Templates use {{ TITLE }} / {{ CONTENT }}-style placeholders.
    for name in EXPECTED_HTML:
        content = (TEMPLATES / name).read_text()
        assert "{{" in content and "}}" in content, f"{name} has no placeholders"


def test_tex_templates_have_documentclass():
    for name in EXPECTED_TEX:
        content = (TEMPLATES / name).read_text()
        assert r"\documentclass" in content
```

- [ ] **Step 2: Run to confirm failure**

Run: `pytest tests/test_templates.py -v`
Expected: fails on missing files.

- [ ] **Step 3: Create `shared/templates/worksheet.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{ TITLE }}</title>
  <style>
    @page { size: Letter; margin: 0.5in; }
    body { font-family: "Georgia", "Times New Roman", serif; color: #111; font-size: 12pt; }
    .header { border-bottom: 2px solid #111; padding-bottom: 0.25in; margin-bottom: 0.25in; }
    .header h1 { margin: 0 0 4pt 0; font-size: 18pt; }
    .meta { display: flex; justify-content: space-between; font-size: 10pt; color: #555; }
    .problem { margin: 0.2in 0; page-break-inside: avoid; }
    .problem-number { font-weight: bold; margin-right: 0.1in; }
    .answer-line { display: inline-block; border-bottom: 1px solid #111; min-width: 2in; }
    .instructions { background: #f4f4f4; padding: 0.15in; margin-bottom: 0.25in; border-left: 3px solid #333; }
    .answer-key-break { page-break-before: always; }
    .answer-key h2 { border-bottom: 1px solid #111; }
  </style>
</head>
<body>
  <div class="header">
    <h1>{{ TITLE }}</h1>
    <div class="meta">
      <span>Name: ____________________</span>
      <span>Date: ____________</span>
      <span>{{ GRADE_LEVEL }}</span>
    </div>
  </div>
  <div class="instructions">{{ INSTRUCTIONS }}</div>
  <div class="problems">
    {{ PROBLEMS }}
  </div>
  {{ ANSWER_KEY }}
</body>
</html>
```

- [ ] **Step 4: Create `shared/templates/coloring-page.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{ TITLE }}</title>
  <style>
    @page { size: Letter; margin: 0.25in; }
    body { margin: 0; padding: 0; text-align: center; font-family: "Comic Sans MS", "Chalkboard SE", sans-serif; }
    h1 { font-size: 28pt; margin: 0.25in 0; }
    .svg-wrap { display: flex; justify-content: center; align-items: center; height: 9in; }
    .svg-wrap svg { max-width: 7in; max-height: 8.5in; }
    .svg-wrap svg path, .svg-wrap svg line, .svg-wrap svg circle, .svg-wrap svg rect, .svg-wrap svg polygon {
      fill: none; stroke: #000; stroke-width: 2.5;
    }
    .footer { font-size: 10pt; color: #888; }
  </style>
</head>
<body>
  <h1>{{ TITLE }}</h1>
  <div class="svg-wrap">{{ SVG }}</div>
  <div class="footer">{{ FOOTER }}</div>
</body>
</html>
```

- [ ] **Step 5: Create `shared/templates/quiz.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{ TITLE }}</title>
  <style>
    @page { size: Letter; margin: 0.5in; }
    body { font-family: "Helvetica", "Arial", sans-serif; font-size: 11pt; color: #111; }
    h1 { font-size: 16pt; margin: 0 0 4pt; }
    .meta { font-size: 10pt; color: #555; margin-bottom: 0.25in; border-bottom: 1px solid #111; padding-bottom: 0.1in; }
    .question { margin: 0.15in 0; page-break-inside: avoid; }
    .question-number { font-weight: bold; }
    .choices { margin-left: 0.25in; }
    .choice { margin: 2pt 0; }
    .short-answer { border-bottom: 1px solid #111; height: 0.4in; margin: 0.1in 0; }
    .answer-key { page-break-before: always; }
  </style>
</head>
<body>
  <h1>{{ TITLE }}</h1>
  <div class="meta">
    Name: ____________________ &nbsp; Date: ____________ &nbsp; {{ GRADE_LEVEL }} &nbsp; Points: {{ POINTS }}
  </div>
  <div class="questions">{{ QUESTIONS }}</div>
  {{ ANSWER_KEY }}
</body>
</html>
```

- [ ] **Step 6: Create `shared/templates/rubric.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{ TITLE }}</title>
  <style>
    @page { size: Letter; margin: 0.5in; landscape: true; }
    body { font-family: "Helvetica", sans-serif; font-size: 10pt; color: #111; }
    h1 { font-size: 16pt; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #111; padding: 6pt; vertical-align: top; }
    th { background: #e6e6e6; font-size: 11pt; }
    .criterion-name { font-weight: bold; background: #f4f4f4; width: 1.5in; }
    .total-row td { font-weight: bold; background: #e6e6e6; }
  </style>
</head>
<body>
  <h1>{{ TITLE }}</h1>
  <div>{{ ASSIGNMENT_DESCRIPTION }}</div>
  <table>
    <thead><tr>{{ LEVEL_HEADERS }}</tr></thead>
    <tbody>{{ CRITERIA_ROWS }}</tbody>
  </table>
</body>
</html>
```

- [ ] **Step 7: Create `shared/templates/paper.tex`**

```latex
% Generic academic paper template.
% Customize via \renewcommand / adding packages at the marked spot.
\documentclass[11pt,letterpaper]{article}

\usepackage[margin=1in]{geometry}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{microtype}
\usepackage{graphicx}
\usepackage{amsmath, amssymb, amsthm}
\usepackage{hyperref}
\hypersetup{colorlinks=true, linkcolor=blue, urlcolor=blue, citecolor=blue}

% === PLACEHOLDERS ===
\title{{{TITLE}}}
\author{{{AUTHOR}}}
\date{{{DATE}}}

\begin{document}
\maketitle

\begin{abstract}
{{ABSTRACT}}
\end{abstract}

{{BODY}}

\end{document}
```

- [ ] **Step 8: Create `shared/templates/problem-set.tex`**

```latex
% Problem-set template. Numbered problems + answer-key appendix.
\documentclass[11pt,letterpaper]{article}

\usepackage[margin=1in]{geometry}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{amsmath, amssymb, amsthm}
\usepackage{enumitem}
\usepackage{fancyhdr}

\pagestyle{fancy}
\fancyhf{}
\rhead{{{COURSE}}}
\lhead{{{TITLE}}}
\rfoot{\thepage}

\newcounter{problem}
\newcommand{\problem}[1]{\stepcounter{problem}\vspace{0.2in}\noindent\textbf{Problem \theproblem.} #1}

\begin{document}
\begin{center}
  \textbf{\Large {{TITLE}}}\\[2pt]
  \textit{{{COURSE}} --- {{DATE}}}
\end{center}

\noindent Name: \underline{\hspace{3in}}

\vspace{0.2in}

{{PROBLEMS}}

% === ANSWER KEY (printed separately) ===
\newpage
\begin{center}\textbf{\Large Answer Key}\end{center}

{{ANSWER_KEY}}

\end{document}
```

- [ ] **Step 9: Run tests**

Run: `pytest tests/test_templates.py -v`
Expected: all 4 tests PASS.

- [ ] **Step 10: Commit**

```bash
git add shared/templates/ tests/test_templates.py
git commit -m "feat: add shared HTML and LaTeX templates"
```

**Acceptance:** All 6 templates exist. HTML templates contain `{{ ... }}` placeholders. LaTeX templates contain `\documentclass`. Per-skill plans will extend or fork these for their specific layouts.

---

## Task 12: Write README.md

Non-techie-friendly install guide with per-skill catalog.

**Files:**
- Create: `README.md`
- Create: `docs/assets/screenshots/` (placeholder directory with a `.gitkeep`)

- [ ] **Step 1: Write failing test**

Create `tests/test_readme.py`:
```python
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

SKILL_NAMES = [
    "flashcards", "quiz-generator", "worksheet", "lesson-plan", "rubric",
    "socratic-tutor", "latex-paper", "lecture-to-study-guide", "concept-map",
    "language-drill", "coloring-page", "arts-crafts", "circle-time",
]


def test_readme_exists():
    assert (REPO_ROOT / "README.md").exists()


def test_readme_documents_all_13_skills():
    content = (REPO_ROOT / "README.md").read_text()
    for s in SKILL_NAMES:
        assert s in content, f"README missing skill: {s}"


def test_readme_has_plugin_install_instructions():
    content = (REPO_ROOT / "README.md").read_text()
    assert "/plugin marketplace add" in content
    assert "/plugin install" in content


def test_readme_has_npx_install_instructions():
    content = (REPO_ROOT / "README.md").read_text()
    assert "npx school-skills" in content


def test_readme_mentions_non_techie():
    # Heuristic: README has a "for non-developers" or "no terminal" section.
    content = (REPO_ROOT / "README.md").read_text().lower()
    assert ("no terminal" in content
            or "non-technical" in content
            or "teacher-friendly" in content
            or "without coding" in content)
```

- [ ] **Step 2: Run to confirm failure**

Run: `pytest tests/test_readme.py -v`
Expected: all 5 FAIL.

- [ ] **Step 3: Create `docs/assets/screenshots/.gitkeep`**

Create empty file `docs/assets/screenshots/.gitkeep` so the directory exists in git.

- [ ] **Step 4: Write `README.md`**

````markdown
# School Skills for Claude Code

**13 AI skills for teachers and students — no coding required.**

Turn Claude Code into a teaching assistant that makes flashcards, quizzes, worksheets, lesson plans, rubrics, study guides, and more. Works for K-12 through graduate school.

---

## For non-technical users: one-click install (recommended)

If you have Claude Code installed, you can install this whole toolkit in two commands — no terminal knowledge needed.

1. Open Claude Code (the chat app).
2. Type this, then press Enter:
   ```
   /plugin marketplace add jellypod/school-skills
   ```
   ![Step 1 screenshot](docs/assets/screenshots/01-marketplace-add.png)

3. Then type:
   ```
   /plugin install school-skills@school-skills
   ```
   ![Step 2 screenshot](docs/assets/screenshots/02-plugin-install.png)

4. Done. All 13 skills are now available. Try asking Claude:
   > "Make me 20 flashcards on the French Revolution for 8th graders."

### Don't have Claude Code yet?

Download it at [claude.ai/code](https://claude.ai/code). It's free. Install takes about 2 minutes.

---

## For developers: install via npx

If you prefer the command line:

```bash
# Install all 13 skills to ~/.claude/skills/
npx school-skills install

# Or install just one
npx school-skills install flashcards

# List available skills
npx school-skills list
```

Restart Claude Code after installing.

---

## Skill catalog

### Cross-subject techniques

| Skill | What it does | Trigger example |
|---|---|---|
| **flashcards** | Generate flashcards from notes, chapters, or topics. Exports to Anki, Quizlet, CSV, markdown. | "Make flashcards from this chapter" |
| **quiz-generator** | Multiple-choice, short-answer, cloze, essay. Outputs markdown, Google Forms CSV, printable PDF. | "Quiz me on photosynthesis" |
| **worksheet** | Printable PDF worksheets with answer keys. Math, reading, fill-in-the-blank. | "Make a 2nd-grade multiplication worksheet" |
| **lesson-plan** | Standards-aligned plans (Common Core, NGSS, IB). Objectives, materials, assessment, differentiation. | "Plan a 45-min lesson on fractions for 4th grade" |
| **rubric** | Build assignment rubrics. Bloom's taxonomy, 3-6 criteria, 3-5 levels. Output: markdown, CSV, PDF. | "Make a rubric for a 5-paragraph essay" |
| **socratic-tutor** | Tutoring mode that asks guiding questions instead of giving answers. | "Help me understand derivatives without telling me the answer" |
| **latex-paper** | Generate LaTeX papers and problem sets. IEEE/APA/MLA templates. | "Write a LaTeX lab report on Hooke's Law" |
| **lecture-to-study-guide** | Turn lecture notes, transcripts, or slides into a study guide with outline, terms, practice Qs. | "Make a study guide from these lecture notes" |
| **concept-map** | Produce mind maps / concept maps in Mermaid, Graphviz, or Markmap. | "Make a concept map of the water cycle" |

### Subject- and age-specific

| Skill | What it does | Trigger example |
|---|---|---|
| **language-drill** | Vocab, verb conjugation, dialogue practice. 11 languages. CEFR-calibrated (A1-C2). | "Drill me on Spanish subjunctive, B2 level" |
| **coloring-page** | SVG coloring pages by theme and age (2-10). Printable PDF, black-and-white line art. | "Make a coloring page of a dinosaur for a 4-year-old" |
| **arts-crafts** | Craft project plans: supplies, steps, safety notes, mess level, prep time. Ages K-5. | "Craft idea for preschoolers using recycled cardboard" |
| **circle-time** | PreK-2 morning meeting plans: greeting, song, story, movement, closing. Original songs, public-domain tunes. | "Circle time plan for Monday, fall theme" |

---

## What's included (technical)

- 13 skills in `skills/`
- Shared Python scripts (`shared/scripts/`): `pdf_render.py` (Playwright), `latex_compile.py` (tectonic/pdflatex), `anki_export.py` (genanki)
- Shared HTML and LaTeX templates in `shared/templates/`

### Optional setup (only if you'll use PDF or LaTeX output)

Some skills (worksheet, quiz PDF, coloring-page, latex-paper) call Python scripts that need one-time setup. **If you only use skills that output markdown/CSV, skip this.**

```bash
# Python packages
pip install -r requirements.txt

# Chromium for PDF rendering
python -m playwright install chromium

# LaTeX compiler (pick ONE; tectonic preferred — single binary)
brew install tectonic        # macOS
# OR
sudo apt install texlive-full  # Linux, if you want pdflatex
```

---

## Issues, feedback, feature requests

Open an issue at [github.com/jellypod/school-skills/issues](https://github.com/jellypod/school-skills/issues).

## License

MIT © Jellypod, Inc.
````

- [ ] **Step 5: Run tests**

Run: `pytest tests/test_readme.py -v`
Expected: all 5 PASS.

- [ ] **Step 6: Commit**

```bash
git add README.md tests/test_readme.py docs/assets/screenshots/.gitkeep
git commit -m "docs: add teacher-friendly README with install guide and skill catalog"
```

**Acceptance:** README names all 13 skills, shows both install paths (plugin + npx), calls out non-technical users explicitly, and has a dev-setup section for PDF/LaTeX deps. Screenshots directory reserved for Task 15.

---

## Task 13: End-to-end marketplace install test

Verifies the full "user clones repo → adds as local marketplace → installs plugin → skills appear" flow.

**Files:**
- Create: `tests/test_e2e_marketplace_install.sh`

- [ ] **Step 1: Write the integration test**

Create `tests/test_e2e_marketplace_install.sh`:
```bash
#!/usr/bin/env bash
# End-to-end test: simulate a user adding this repo as a local marketplace
# and installing the plugin via Claude Code CLI.
#
# Prerequisites: `claude` CLI on PATH.
# Skips gracefully if not installed.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

if ! command -v claude >/dev/null 2>&1; then
  echo "SKIP: claude CLI not found. Install from claude.ai/code to run e2e tests."
  exit 0
fi

# 1. Validate plugin + marketplace manifests.
echo "[e2e] validating manifests..."
claude plugin validate .
echo "PASS: manifests valid"

# 2. Isolated fake HOME so we don't pollute the user's config.
FAKE_HOME="$(mktemp -d)"
trap 'rm -rf "$FAKE_HOME"' EXIT
export HOME="$FAKE_HOME"

# 3. Add this repo as a local marketplace at project scope (scoped to fake HOME).
echo "[e2e] adding local marketplace..."
claude plugin marketplace add "$REPO_ROOT" --scope user
echo "PASS: marketplace added"

# 4. List marketplaces — should include school-skills.
echo "[e2e] listing marketplaces..."
LIST_JSON=$(claude plugin marketplace list --json)
if ! echo "$LIST_JSON" | grep -q '"school-skills"'; then
  echo "FAIL: school-skills not in marketplace list"
  echo "$LIST_JSON"
  exit 1
fi
echo "PASS: marketplace listed"

# 5. Install the plugin.
echo "[e2e] installing plugin..."
claude plugin install school-skills@school-skills --scope user
echo "PASS: plugin installed"

# 6. Sanity-check the cached plugin has expected files.
CACHE_DIR="$FAKE_HOME/.claude/plugins/cache"
if [[ ! -d "$CACHE_DIR" ]]; then
  echo "FAIL: plugin cache dir missing at $CACHE_DIR"
  exit 1
fi
if ! find "$CACHE_DIR" -name "plugin.json" | head -1 | grep -q .; then
  echo "FAIL: plugin.json not found in cache"
  exit 1
fi
echo "PASS: plugin cached with plugin.json"

# 7. Verify at least one SKILL.md was cached (real skills come from per-skill plans,
#    so this is best-effort: if no skills exist yet, we warn but don't fail).
if find "$CACHE_DIR" -name "SKILL.md" | head -1 | grep -q .; then
  echo "PASS: at least one SKILL.md cached"
else
  echo "WARN: no SKILL.md found — per-skill plans not yet implemented"
fi

echo
echo "All e2e marketplace tests passed."
```

Make it executable: `chmod +x tests/test_e2e_marketplace_install.sh`.

- [ ] **Step 2: Run it locally**

Run: `bash tests/test_e2e_marketplace_install.sh`

Expected (with `claude` CLI installed):
- All PASS lines print
- Exit 0

Expected (without `claude` CLI):
- `SKIP: claude CLI not found...`
- Exit 0

- [ ] **Step 3: Commit**

```bash
git add tests/test_e2e_marketplace_install.sh
git commit -m "test: add end-to-end marketplace install test"
```

**Acceptance:** Script validates manifests, adds repo as local marketplace, installs plugin, verifies cache population — all in an isolated `$HOME`. Skips gracefully when `claude` CLI is absent.

---

## Task 14: Wire up `npm test` and CI scaffold

**Files:**
- Create: `.github/workflows/test.yml`
- Modify: `package.json` (confirm `scripts.test` is correct)

- [ ] **Step 1: Write `.github/workflows/test.yml`**

```yaml
name: Test

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install Python deps
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt

      - name: Install Playwright browsers
        run: python -m playwright install --with-deps chromium

      - name: Run Python tests
        run: pytest tests/ -v

      - name: Run shell tests (install.js)
        run: bash tests/test_install_js.sh

      # e2e marketplace test skips gracefully without `claude` CLI.
      - name: Run e2e marketplace test
        run: bash tests/test_e2e_marketplace_install.sh
```

- [ ] **Step 2: Verify `package.json` test script**

Confirm `package.json` has:
```json
"scripts": {
  "test": "bash tests/test_install_js.sh && pytest tests/"
}
```

If missing or wrong, edit to match.

- [ ] **Step 3: Run `npm test` locally**

Run: `npm test`
Expected: shell tests pass, pytest passes.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/test.yml package.json
git commit -m "ci: add GitHub Actions workflow running all tests"
```

**Acceptance:** `npm test` runs both shell and Python tests. GitHub Actions workflow covers Node + Python + Playwright + e2e on every push/PR.

---

## Task 15: Final polish — screenshots placeholder, version bump, tag

**Files:**
- Create: `docs/assets/screenshots/README.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add screenshots README**

Create `docs/assets/screenshots/README.md`:
```markdown
# Screenshots

This directory holds install-flow screenshots referenced by the top-level `README.md`.

**Required screenshots** (add before 0.1.0 release):
- `01-marketplace-add.png` — Claude Code showing `/plugin marketplace add jellypod/school-skills`
- `02-plugin-install.png` — Claude Code showing `/plugin install school-skills@school-skills`

Capture at ~1400x900 (retina fine). Crop to the relevant terminal area.
```

- [ ] **Step 2: Update CHANGELOG.md**

Move the "Added" bullets from `[Unreleased]` into `[0.1.0] - 2026-04-14`. Leave `[Unreleased]` empty for next development cycle:

```markdown
## [Unreleased]

## [0.1.0] - 2026-04-14

### Added
- Plugin manifest (`.claude-plugin/plugin.json`)
- Self-hosted marketplace manifest (`.claude-plugin/marketplace.json`)
- `npx school-skills install` installer (`bin/install.js`)
- Shared Python scripts: `pdf_render.py`, `latex_compile.py`, `anki_export.py`
- Shared templates: worksheet, coloring-page, quiz, rubric, paper, problem-set
- Teacher-friendly README with plugin + npx install paths
- GitHub Actions test workflow
- End-to-end marketplace install test

### Skills
(filled in by per-skill plans before 0.1.0 release)
```

- [ ] **Step 3: Verify version consistency**

Check that version `0.1.0` appears identically in:
- `package.json` → `.version`
- `.claude-plugin/plugin.json` → `.version`
- `.claude-plugin/marketplace.json` → `.metadata.version`
- `CHANGELOG.md` → `[0.1.0]` heading

Add a smoke test `tests/test_version_consistency.py`:
```python
import json
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent


def _read_json(p):
    return json.loads((REPO_ROOT / p).read_text())


def test_versions_match():
    pkg = _read_json("package.json")["version"]
    plugin = _read_json(".claude-plugin/plugin.json")["version"]
    market = _read_json(".claude-plugin/marketplace.json")["metadata"]["version"]
    assert pkg == plugin == market, f"mismatch: pkg={pkg} plugin={plugin} market={market}"

    changelog = (REPO_ROOT / "CHANGELOG.md").read_text()
    assert f"[{pkg}]" in changelog, f"CHANGELOG missing [{pkg}] heading"


def test_version_is_semver():
    pkg = _read_json("package.json")["version"]
    assert re.match(r"^\d+\.\d+\.\d+(-[\w.]+)?$", pkg)
```

- [ ] **Step 4: Run all tests one last time**

Run: `npm test`
Expected: everything passes.

- [ ] **Step 5: Commit**

```bash
git add docs/assets/screenshots/README.md CHANGELOG.md tests/test_version_consistency.py
git commit -m "chore: cut 0.1.0 — version consistency test, screenshots placeholder, changelog"
```

- [ ] **Step 6: Tag**

```bash
git tag -a v0.1.0 -m "0.1.0: initial infrastructure (skills pending)"
```

Do NOT push tag until per-skill plans are complete. At 0.1.0 release time, verify at least flashcards + quiz-generator + worksheet skills are present (the success-criteria trio from the master spec).

**Acceptance:** Four version-holding files all say `0.1.0`. CHANGELOG has proper `[0.1.0]` section. Screenshots README documents required assets. Local tag `v0.1.0` created.

---

## Versioning Strategy

**Semver:** `MAJOR.MINOR.PATCH`

- `MAJOR`: breaking changes — removing a skill, changing a shared-script public API (`render_html_to_pdf` signature, `Card` dataclass fields, etc.), changing the plugin manifest name, incompatible template placeholder renames.
- `MINOR`: adding a new skill, adding a new shared script, adding a non-required field to existing APIs, adding a new template.
- `PATCH`: bug fixes, doc updates, template styling tweaks, README screenshot updates, dep bumps that don't change behavior.

**Single source of truth:** `.claude-plugin/plugin.json` is authoritative per Claude Code docs. `package.json` and `.claude-plugin/marketplace.json` mirror it. `test_version_consistency.py` enforces the mirror.

**Release cadence:**
- `0.1.0` — initial release (this plan + all 13 skills + at least flashcards/quiz/worksheet working end-to-end)
- `0.x` — iterating while still pre-1.0; breaking changes allowed per semver but document them
- `1.0.0` — all 13 skills have passing evals + successful non-techie install test (per master spec success criteria)

**Changelog:** Keep-a-Changelog 1.1.0 format. Every user-facing change gets a line before the version is cut.

**Git tagging:** `v0.1.0`, `v0.1.1`, etc. Tags trigger GitHub release automation later (deferred to post-V1).

---

## Testing Approach

**Unit tests (`pytest tests/`)** — every shared script + every manifest:
- `test_plugin_json.py`, `test_marketplace_json.py` — schema validity, required fields
- `test_requirements.py` — Python deps list integrity
- `test_pdf_render.py`, `test_latex_compile.py`, `test_anki_export.py` — shared-script behavior
- `test_templates.py` — template files exist with expected placeholders
- `test_readme.py` — README covers all 13 skills + both install paths
- `test_version_consistency.py` — versions across 4 files match

**Shell integration tests (`bash tests/*.sh`)**:
- `test_install_js.sh` — `npx school-skills` CLI behavior (--help, --version, list, install, install <one>, install unknown)
- `test_e2e_marketplace_install.sh` — full clone → marketplace add → plugin install flow using real `claude` CLI in an isolated `$HOME`

**CI (`.github/workflows/test.yml`)**:
- Runs all of the above on every push/PR
- Installs Playwright Chromium
- e2e skips if `claude` CLI unavailable

**How we know the marketplace flow works:**
1. `claude plugin validate .` — manifest-level lint
2. `tests/test_e2e_marketplace_install.sh` — actually adds the local repo as a marketplace and installs the plugin into a fake `$HOME`, inspecting the plugin cache to confirm files landed
3. Manual smoke test (one-time before 0.1.0): install on a real macOS + Linux + Windows/WSL machine from a public GitHub URL (`jellypod/school-skills`), run `/plugin install`, invoke one skill

**Manual test checklist before 0.1.0:**
- [ ] On macOS: `/plugin marketplace add jellypod/school-skills` → `/plugin install school-skills@school-skills` → flashcards skill produces a deck
- [ ] On Linux (WSL): same
- [ ] `npx school-skills install flashcards` installs to `~/.claude/skills/flashcards/`
- [ ] Non-technical tester (a teacher) follows README from scratch → installs → generates a flashcard deck in under 10 minutes (matches master-spec success criterion)

---

## Self-Review

**1. Spec coverage check:**
- ✅ Distribution: Claude Code marketplace (Tasks 3, 4, 13) + npx (Tasks 5, 6)
- ✅ Repo structure per master spec: `.claude-plugin/`, `bin/`, `shared/scripts/`, `shared/templates/`, `package.json`, `README.md` — all created
- ✅ Shared scripts: `pdf_render.py` (Task 8), `latex_compile.py` (Task 9), `anki_export.py` (Task 10), `image_fetch.py` audited & dropped (Task 1)
- ✅ Shared templates for worksheet/coloring/LaTeX paper/problem set (Task 11)
- ✅ Python deps: `requirements.txt` (Task 7)
- ✅ README non-techie install + per-skill catalog (Task 12)
- ✅ Plugin schema verification as Task 1 (flagged as must-check)
- ✅ Testing approach covering marketplace install (Tasks 13, 14)
- ✅ Semver + changelog strategy (Task 2, Task 15, Versioning section)
- ✅ Success criteria: `/plugin install school-skills` works (Task 13 e2e); non-techie README (Task 12); plugin appears in `/plugin list` (verified by Task 13)

**2. Placeholder scan:** No TBDs, no "TODO", no "add appropriate error handling" — all steps have exact code or exact commands. Template files contain `{{ PLACEHOLDER }}` markers by design (they're templates); that's not a plan placeholder.

**3. Type consistency:**
- `PdfOptions` dataclass fields referenced consistently: `page_size`, `margin`, `dpi`, `landscape`, `print_background` — same in module, CLI, tests
- `Card` dataclass fields consistent: `front`, `back`, `text`, `cloze`, `tags` — same in anki_export.py and test_anki_export.py
- `detect_compiler()` / `compile_latex(tex_path, output_path, *, passes)` — signatures consistent
- Version string `0.1.0` referenced identically in Tasks 2, 3, 4, 5, 15 and in the consistency test

**4. Task count:** 15 tasks. Within the 5-15 sweet spot.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-14-infrastructure-plan.md`. Per the user's instruction to skip user-review checkpoints, execution proceeds directly. Recommended approach for this plan:

- **Subagent-Driven Development** — each of the 15 tasks is self-contained with its own tests and commit, ideal for fresh-subagent-per-task dispatch.
- Tasks 1-6 must run sequentially (manifests + npm pkg + install.js depend on each other).
- Tasks 7-11 are independent and can run in parallel after Task 1.
- Tasks 12-15 must run after 1-11 are complete.
