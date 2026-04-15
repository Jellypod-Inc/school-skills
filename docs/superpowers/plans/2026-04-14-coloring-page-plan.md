# coloring-page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the `coloring-page` skill that generates age-calibrated printable SVG/PNG/PDF coloring pages from theme + age inputs, using a bundled public-domain SVG library as the V1 source of line art.

**Architecture:** Skill invokes a deterministic Python CLI (`compose_coloring_page.py`) that (1) resolves theme keywords to SVG assets indexed via a provenance-tracked `manifest.json`, (2) calibrates line-weight/complexity to the age band, (3) composes a page-sized SVG with optional title/text overlay, then (4) rasterizes to PNG (Pillow + svglib/reportlab) and delegates to `shared/scripts/pdf_render.py` for the final PDF. Generated-SVG fallback is deferred behind a strict validator (not in V1).

**Tech Stack:** Python 3.11+, `svglib` (SVG→ReportLab drawing), `reportlab` (vector rasterization), `Pillow` (PNG post-processing), `lxml` (SVG parsing/composition), `pytest` (evals + unit tests), `pypdf` (eval assertions on PDF metadata), `shared/scripts/pdf_render.py` (Playwright-based HTML/SVG → PDF, already defined by master spec).

**Locked defaults (from master + skill spec):**
- Bundled public-domain SVG library is the V1 source of line art.
- Generated SVG is deferred behind a strict validator — **not shipped in V1**, but the validator contract is stubbed so V2 can plug it in.
- PDF engine is `shared/scripts/pdf_render.py` (Playwright).
- Font: **Fredoka** (SIL OFL) bundled under `assets/fonts/` for text overlays.

---

## Critical Non-Code Task: SVG Asset Acquisition & Licensing

**This is a real procurement/curation task, not a code task.** The bundled library is the V1 product — without it, the skill returns blank pages. This work is gated on **human sourcing + license verification**, not code generation. Tasks 3 and 4 execute this.

**Sources (public-domain only, verify each file):**
- **Openclipart.org** — CC0, bulk-downloadable, strong coverage of animals/vehicles/holidays. Primary source.
- **Wikimedia Commons** — filter by `PD-self`, `PD-old-100`, or `CC0`. Good for letters/numbers (typography outlines) and seasonal imagery.
- **SVG Silh** (svgsilh.com) — CC0 silhouettes. Useful for simple 2-4 age band shapes.
- **Public Domain Vectors** (publicdomainvectors.org) — CC0 confirmed. Broad catalog.
- **Reshot icons / Freepik** — **REJECT.** These have restrictive licenses that mimic public domain but require attribution or prohibit redistribution.

**Provenance requirement:** Every SVG in `assets/svg/` MUST have a corresponding row in `assets/manifest.json` with: filename, source URL, license (CC0 / PD-old / PD-self only), original author (or "unknown"), date acquired, tags, age band, complexity. **No manifest row = do not ship the file.** A CI check (Task 5) enforces this.

**Seed target:** 50-100 SVGs across 6 buckets:
- `animals/` (~20): farm, ocean, jungle, pets, dinosaurs, insects
- `vehicles/` (~10): cars, trucks, planes, boats, trains
- `letters/` (~26): A-Z outline
- `numbers/` (~10): 0-9 outline
- `seasonal/` (~15): halloween, thanksgiving, winter-holidays, easter, spring
- `characters-generic/` (~10): robots, astronauts, princesses, pirates, unicorns (no IP)
- `shapes/` (~5): primitive building blocks

**Quality gate per asset** (covered in Task 4 style-normalizer):
- Stroke-only (no `fill` except `none`/`white`).
- Line weight 1.5-4pt after normalization.
- No `<image>`, `<text>`, `<script>`, `<foreignObject>` elements.
- No embedded raster.
- All regions topologically closed for toddler-tier (2-4) assets.

---

## File Structure

**New files under `skills/coloring-page/`:**

```
skills/coloring-page/
├── SKILL.md                                  # under 300 lines, progressive disclosure
├── scripts/
│   ├── compose_coloring_page.py              # main CLI entry point
│   ├── svg_library.py                        # manifest loader + theme→asset resolver
│   ├── svg_normalizer.py                     # style normalizer (stroke-width, fill→none)
│   ├── svg_validator.py                      # strict validator (for future generated SVG)
│   ├── page_composer.py                      # arranges art on page-sized SVG
│   └── text_overlay.py                       # renders outline text (name/letter)
├── assets/
│   ├── manifest.json                         # provenance + metadata per SVG
│   ├── fonts/
│   │   └── Fredoka-Regular.ttf              # SIL OFL, bundled
│   └── svg/
│       ├── animals/                          # 20 SVGs + companion meta
│       ├── vehicles/                         # 10 SVGs
│       ├── letters/                          # 26 SVGs
│       ├── numbers/                          # 10 SVGs
│       ├── seasonal/                         # 15 SVGs
│       ├── characters-generic/               # 10 SVGs
│       └── shapes/                           # 5 SVGs
├── references/
│   ├── age-calibration.md                    # line weight, shape count, detail per age
│   ├── safe-content.md                       # copyrighted-IP bans, age guidelines
│   ├── theme-catalog.md                      # themes + synonym map
│   ├── svg-style-guide.md                    # stroke-only rules, line weight, margins
│   └── license-policy.md                     # acquisition rules + rejected-source list
├── tests/
│   ├── test_svg_library.py
│   ├── test_svg_normalizer.py
│   ├── test_page_composer.py
│   ├── test_text_overlay.py
│   ├── test_manifest_integrity.py            # CI gate: every SVG has manifest row
│   └── test_cli.py                           # end-to-end CLI tests
├── evals/
│   └── evals.json                            # 5 prompts (see Task 13)
├── requirements.txt                          # svglib, reportlab, Pillow, lxml, pypdf, pytest
└── pyproject.toml                            # or setup.cfg, for local pytest config
```

**Existing files referenced (do NOT modify here — owned by marketplace plan):**
- `shared/scripts/pdf_render.py` — invoked as subprocess.
- `shared/templates/coloring-page.html` — page shell.

---

## Tasks

### Task 1: Scaffold skill directory + dependencies

**Files:**
- Create: `skills/coloring-page/requirements.txt`
- Create: `skills/coloring-page/pyproject.toml`
- Create: `skills/coloring-page/tests/__init__.py`
- Create: `skills/coloring-page/scripts/__init__.py`

- [ ] **Step 1: Create `requirements.txt`**

```
svglib==1.5.1
reportlab==4.0.9
Pillow==10.2.0
lxml==5.1.0
pypdf==4.0.1
pytest==8.0.0
pytest-cov==4.1.0
```

- [ ] **Step 2: Create `pyproject.toml` for pytest config**

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
pythonpath = ["scripts"]
```

- [ ] **Step 3: Create empty `__init__.py` stubs**

```bash
touch skills/coloring-page/tests/__init__.py
touch skills/coloring-page/scripts/__init__.py
```

- [ ] **Step 4: Install deps and sanity-check**

Run: `cd skills/coloring-page && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && pytest --collect-only`
Expected: 0 tests collected, no import errors.

- [ ] **Step 5: Commit**

```bash
git add skills/coloring-page/
git commit -m "feat(coloring-page): scaffold skill directory and deps"
```

---

### Task 2: Write reference docs (license-policy, age-calibration, safe-content, theme-catalog, svg-style-guide)

**Files:**
- Create: `skills/coloring-page/references/license-policy.md`
- Create: `skills/coloring-page/references/age-calibration.md`
- Create: `skills/coloring-page/references/safe-content.md`
- Create: `skills/coloring-page/references/theme-catalog.md`
- Create: `skills/coloring-page/references/svg-style-guide.md`

- [ ] **Step 1: Write `license-policy.md`**

Contents must include:
- **Accepted licenses:** CC0 1.0 Universal, Public Domain (US expired copyright, PD-old-100+), PD-self (author-released).
- **Accepted sources:** Openclipart.org, Wikimedia Commons (verify tag), SVG Silh, Public Domain Vectors.
- **Rejected sources:** Freepik, Flaticon, Reshot, The Noun Project (non-CC0 tier), Shutterstock, Adobe Stock. Any "free with attribution" source is rejected — attribution bundled in a CLI output is brittle.
- **Per-file manifest requirement:** every SVG must have `source_url`, `license`, `author`, `date_acquired`, `verified_by` fields in `manifest.json`.
- **Audit trail:** when in doubt, reject the file.

- [ ] **Step 2: Write `age-calibration.md`**

Include the table from spec §8 verbatim, plus normalizer rules:
- 2-4: min stroke 3.0pt, max path count 6, min feature size 0.75in.
- 5-7: stroke 2.0-3.0pt, paths 10-20.
- 8-10: stroke 1.5-2.5pt, paths 20+.

- [ ] **Step 3: Write `safe-content.md`**

From spec §10: copyrighted-character ban (Disney, Pokémon, Marvel, Nintendo, etc.), weapon/violence rules per age band, generic substitution examples.

- [ ] **Step 4: Write `theme-catalog.md`**

Enumerate themes with synonyms:
- "ocean" ≡ "sea" ≡ "underwater" ≡ "marine"
- "dinosaurs" ≡ "dinos" ≡ "prehistoric"
- (full list derived from `manifest.json` buckets)

- [ ] **Step 5: Write `svg-style-guide.md`**

Stroke-only, 2-4pt weight (age-dependent), no gradients, no `fill` other than `none`/`white`, no text inside art, 0.5in safe margins.

- [ ] **Step 6: Commit**

```bash
git add skills/coloring-page/references/
git commit -m "docs(coloring-page): add reference docs for license, age, safety, themes, style"
```

---

### Task 3: ACQUISITION — Source + verify 50-100 public-domain SVGs

**This task is primarily human curation, not code. Time budget: 4-8 hours.**

**Files:**
- Create: `skills/coloring-page/assets/svg/{animals,vehicles,letters,numbers,seasonal,characters-generic,shapes}/*.svg`
- Create: `skills/coloring-page/assets/manifest.json`
- Create: `skills/coloring-page/assets/fonts/Fredoka-Regular.ttf`

- [ ] **Step 1: Bootstrap `manifest.json` schema**

```json
{
  "version": 1,
  "assets": [
    {
      "filename": "animals/cow.svg",
      "tags": ["farm", "animals", "cow", "cattle"],
      "theme_bucket": "animals/farm",
      "min_age": 2,
      "max_age": 10,
      "complexity": "low",
      "source_url": "https://openclipart.org/detail/XXXXX/cow",
      "license": "CC0-1.0",
      "author": "username or 'unknown'",
      "date_acquired": "2026-04-14",
      "verified_by": "pierson"
    }
  ]
}
```

- [ ] **Step 2: Acquire animals bucket (~20 SVGs)**

Targets — farm (cow, pig, sheep, chicken, horse), ocean (fish, octopus, whale, starfish, crab), jungle (lion, elephant, monkey, giraffe, tiger), pets (dog, cat), dinosaurs (t-rex, brontosaurus), insects (butterfly, bee).

For each: download from Openclipart (filter `license:cc0`) → verify license on the download page → save to `assets/svg/animals/<slug>.svg` → append manifest row.

- [ ] **Step 3: Acquire vehicles bucket (~10 SVGs)**

Targets: car, truck, fire-truck, school-bus, airplane, helicopter, sailboat, rocket, train, tractor.

- [ ] **Step 4: Acquire letters A-Z (26 SVGs)**

Strategy: use a single public-domain outline font (e.g., **Amaranth** or **Fredoka-outline-variant** under SIL OFL — OFL permits bundled distribution), generate each letter as an outlined SVG via `fonttools` OR manually export from Inkscape using a CC0 font. Save as `letters/A.svg`, `letters/B.svg`, etc.

Note: SIL OFL is NOT public-domain but IS permissive enough for bundling; flag in manifest `license: "OFL-1.1"` and note in `license-policy.md` that OFL is accepted specifically for fonts/letter-outlines.

- [ ] **Step 5: Acquire numbers 0-9 (10 SVGs)**

Same strategy as letters — outline digits.

- [ ] **Step 6: Acquire seasonal bucket (~15 SVGs)**

Targets: halloween (pumpkin, ghost, bat, spider, haunted-house), thanksgiving (turkey, cornucopia), winter-holidays (snowman, tree, wreath, gift), easter (egg, bunny, basket), spring (flower).

- [ ] **Step 7: Acquire characters-generic bucket (~10 SVGs)**

Targets: robot, astronaut, princess (generic), pirate, unicorn, knight, wizard, mermaid, dragon (friendly), fairy. **Every single one must be original/CC0 — no IP reference.** Reject anything that looks Disney-adjacent.

- [ ] **Step 8: Acquire shapes bucket (~5 SVGs)**

Targets: circle, square, triangle, star, heart. These are primitive composition blocks.

- [ ] **Step 9: Acquire Fredoka font**

Download `Fredoka-Regular.ttf` from Google Fonts (SIL OFL 1.1). Save to `assets/fonts/`. Copy the `OFL.txt` license next to it.

- [ ] **Step 10: Full manifest audit**

Run: `ls skills/coloring-page/assets/svg/**/*.svg | wc -l`
Expected: 80-100 files.

Run (will be implemented in Task 5, stub for now):
```bash
python -c "import json; m=json.load(open('skills/coloring-page/assets/manifest.json')); print(len(m['assets']))"
```
Expected: count matches filesystem count.

- [ ] **Step 11: Commit**

```bash
git add skills/coloring-page/assets/
git commit -m "feat(coloring-page): add seed SVG library (N assets, all CC0/PD/OFL)"
```

---

### Task 4: Build `svg_normalizer.py` — normalize every bundled SVG to style-guide compliance

**Files:**
- Create: `skills/coloring-page/scripts/svg_normalizer.py`
- Create: `skills/coloring-page/tests/test_svg_normalizer.py`

- [ ] **Step 1: Write the failing test**

```python
# tests/test_svg_normalizer.py
import pytest
from lxml import etree
from svg_normalizer import normalize_svg, NormalizeError

SAMPLE_FILLED = b'''<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M10 10 L90 10 L90 90 L10 90 Z" fill="red" stroke="black" stroke-width="0.5"/>
</svg>'''

def test_normalize_strips_fill_and_bumps_stroke():
    out = normalize_svg(SAMPLE_FILLED, target_stroke_pt=2.5)
    root = etree.fromstring(out)
    ns = {"s": "http://www.w3.org/2000/svg"}
    path = root.find(".//s:path", ns)
    assert path.get("fill") == "none"
    assert float(path.get("stroke-width")) == pytest.approx(2.5)
    assert path.get("stroke") == "black"

def test_normalize_rejects_image_element():
    bad = b'<svg xmlns="http://www.w3.org/2000/svg"><image href="x.png"/></svg>'
    with pytest.raises(NormalizeError, match="image"):
        normalize_svg(bad, target_stroke_pt=2.5)

def test_normalize_rejects_script_element():
    bad = b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
    with pytest.raises(NormalizeError, match="script"):
        normalize_svg(bad, target_stroke_pt=2.5)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skills/coloring-page && pytest tests/test_svg_normalizer.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'svg_normalizer'`.

- [ ] **Step 3: Implement `svg_normalizer.py`**

```python
# scripts/svg_normalizer.py
"""Normalize SVGs to the coloring-page style guide: stroke-only, bounded stroke width."""
from lxml import etree

SVG_NS = "http://www.w3.org/2000/svg"
FORBIDDEN_TAGS = {"image", "script", "foreignObject", "text"}
ALLOWED_FILL = {"none", "white", "#fff", "#ffffff", None}


class NormalizeError(ValueError):
    pass


def normalize_svg(svg_bytes: bytes, target_stroke_pt: float = 2.5) -> bytes:
    """Return normalized SVG bytes or raise NormalizeError.

    - Rejects <image>, <script>, <foreignObject>, <text> elements.
    - Sets fill="none" on all shape elements.
    - Sets stroke="black" if missing.
    - Sets stroke-width=target_stroke_pt on all shape elements.
    """
    parser = etree.XMLParser(remove_blank_text=False, resolve_entities=False)
    try:
        root = etree.fromstring(svg_bytes, parser)
    except etree.XMLSyntaxError as e:
        raise NormalizeError(f"invalid SVG: {e}") from e

    for el in root.iter():
        tag = etree.QName(el).localname
        if tag in FORBIDDEN_TAGS:
            raise NormalizeError(f"forbidden element: {tag}")
        if tag in {"path", "circle", "rect", "polygon", "polyline", "ellipse", "line"}:
            el.set("fill", "none")
            if not el.get("stroke"):
                el.set("stroke", "black")
            el.set("stroke-width", f"{target_stroke_pt}")
            el.set("stroke-linecap", "round")
            el.set("stroke-linejoin", "round")

    return etree.tostring(root, xml_declaration=True, encoding="utf-8")
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_svg_normalizer.py -v`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add skills/coloring-page/scripts/svg_normalizer.py skills/coloring-page/tests/test_svg_normalizer.py
git commit -m "feat(coloring-page): add svg_normalizer with style-guide enforcement"
```

---

### Task 5: Build `manifest_integrity` test — gate that every bundled SVG has a manifest row

**Files:**
- Create: `skills/coloring-page/tests/test_manifest_integrity.py`

- [ ] **Step 1: Write the failing test**

```python
# tests/test_manifest_integrity.py
import json
from pathlib import Path

ASSETS = Path(__file__).parent.parent / "assets"
SVG_DIR = ASSETS / "svg"
MANIFEST = ASSETS / "manifest.json"

REQUIRED_FIELDS = {
    "filename", "tags", "theme_bucket", "min_age", "max_age",
    "complexity", "source_url", "license", "author", "date_acquired", "verified_by",
}
ACCEPTED_LICENSES = {"CC0-1.0", "PD-old-100", "PD-self", "PD-US", "OFL-1.1"}


def test_every_svg_has_manifest_row():
    data = json.loads(MANIFEST.read_text())
    manifest_files = {a["filename"] for a in data["assets"]}
    on_disk = {
        str(p.relative_to(SVG_DIR)).replace("\\", "/")
        for p in SVG_DIR.rglob("*.svg")
    }
    missing = on_disk - manifest_files
    assert not missing, f"SVGs on disk without manifest row: {missing}"
    orphaned = manifest_files - on_disk
    assert not orphaned, f"manifest rows without file: {orphaned}"


def test_every_manifest_row_has_required_fields():
    data = json.loads(MANIFEST.read_text())
    for asset in data["assets"]:
        missing = REQUIRED_FIELDS - set(asset.keys())
        assert not missing, f"{asset.get('filename')}: missing {missing}"


def test_every_license_is_accepted():
    data = json.loads(MANIFEST.read_text())
    for asset in data["assets"]:
        assert asset["license"] in ACCEPTED_LICENSES, (
            f"{asset['filename']}: rejected license {asset['license']}"
        )
```

- [ ] **Step 2: Run test**

Run: `pytest tests/test_manifest_integrity.py -v`
Expected: PASS if Task 3 manifest is complete; FAIL otherwise — the test IS the acceptance criterion for Task 3.

- [ ] **Step 3: If failing, return to Task 3 and fix manifest**

Fix all `AssertionError`s by either adding missing rows, removing orphaned entries, or correcting license tags. Re-run until all 3 tests pass.

- [ ] **Step 4: Commit**

```bash
git add skills/coloring-page/tests/test_manifest_integrity.py
git commit -m "test(coloring-page): gate manifest integrity (1:1 file/row, licenses, fields)"
```

---

### Task 6: Build `svg_library.py` — manifest loader + theme→asset resolver

**Files:**
- Create: `skills/coloring-page/scripts/svg_library.py`
- Create: `skills/coloring-page/tests/test_svg_library.py`

- [ ] **Step 1: Write the failing test**

```python
# tests/test_svg_library.py
import pytest
from svg_library import SvgLibrary, NoMatchError

def test_resolve_exact_tag():
    lib = SvgLibrary.load_default()
    assets = lib.resolve(theme="dinosaurs", age_band="5-7", count=1)
    assert len(assets) == 1
    assert "dinosaur" in assets[0].tags or assets[0].theme_bucket.startswith("animals")

def test_resolve_respects_age_band():
    lib = SvgLibrary.load_default()
    assets = lib.resolve(theme="ocean", age_band="2-4", count=3)
    for a in assets:
        assert a.min_age <= 2 and a.max_age >= 4
        assert a.complexity in {"low"}

def test_resolve_raises_on_no_match():
    lib = SvgLibrary.load_default()
    with pytest.raises(NoMatchError):
        lib.resolve(theme="quantum-mechanics-symbols", age_band="5-7", count=1)

def test_synonym_resolution():
    lib = SvgLibrary.load_default()
    a = lib.resolve(theme="sea creatures", age_band="5-7", count=1)
    b = lib.resolve(theme="underwater", age_band="5-7", count=1)
    # both map to ocean bucket
    assert a[0].theme_bucket == b[0].theme_bucket
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_svg_library.py -v`
Expected: FAIL with `ModuleNotFoundError`.

- [ ] **Step 3: Implement `svg_library.py`**

```python
# scripts/svg_library.py
"""Load asset manifest, resolve theme+age queries to SVG file paths."""
from __future__ import annotations
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

ASSETS_DIR = Path(__file__).parent.parent / "assets"

SYNONYMS = {
    "sea": "ocean", "underwater": "ocean", "marine": "ocean", "sea creatures": "ocean",
    "dinos": "dinosaurs", "prehistoric": "dinosaurs",
    "xmas": "winter-holidays", "christmas": "winter-holidays", "holidays": "winter-holidays",
    "trucks": "vehicles", "cars": "vehicles", "transportation": "vehicles",
}

AGE_BAND_TO_RANGE = {"2-4": (2, 4), "5-7": (5, 7), "8-10": (8, 10)}
AGE_BAND_TO_COMPLEXITY = {"2-4": {"low"}, "5-7": {"low", "medium"}, "8-10": {"low", "medium", "high"}}


class NoMatchError(LookupError):
    pass


@dataclass(frozen=True)
class Asset:
    filename: str
    path: Path
    tags: tuple[str, ...]
    theme_bucket: str
    min_age: int
    max_age: int
    complexity: str


class SvgLibrary:
    def __init__(self, assets: list[Asset]):
        self._assets = assets

    @classmethod
    def load_default(cls) -> "SvgLibrary":
        data = json.loads((ASSETS_DIR / "manifest.json").read_text())
        assets = [
            Asset(
                filename=a["filename"],
                path=ASSETS_DIR / "svg" / a["filename"],
                tags=tuple(a["tags"]),
                theme_bucket=a["theme_bucket"],
                min_age=a["min_age"],
                max_age=a["max_age"],
                complexity=a["complexity"],
            )
            for a in data["assets"]
        ]
        return cls(assets)

    def resolve(self, *, theme: str, age_band: str, count: int) -> list[Asset]:
        key = theme.strip().lower()
        key = SYNONYMS.get(key, key)
        lo, hi = AGE_BAND_TO_RANGE[age_band]
        allowed_complexity = AGE_BAND_TO_COMPLEXITY[age_band]

        def matches(a: Asset) -> bool:
            if a.min_age > lo or a.max_age < hi:
                return False
            if a.complexity not in allowed_complexity:
                return False
            hay = " ".join(a.tags) + " " + a.theme_bucket
            return any(tok in hay for tok in key.split())

        candidates = [a for a in self._assets if matches(a)]
        if not candidates:
            raise NoMatchError(f"no assets match theme={theme!r} age_band={age_band!r}")
        # Deterministic selection: sort by filename, take first `count`, cycle if needed.
        candidates.sort(key=lambda a: a.filename)
        out: list[Asset] = []
        i = 0
        while len(out) < count:
            out.append(candidates[i % len(candidates)])
            i += 1
        return out
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_svg_library.py -v`
Expected: 4 passed. (If synonym test fails, inspect which bucket your ocean assets landed in and adjust SYNONYMS.)

- [ ] **Step 5: Commit**

```bash
git add skills/coloring-page/scripts/svg_library.py skills/coloring-page/tests/test_svg_library.py
git commit -m "feat(coloring-page): add svg_library manifest loader and theme resolver"
```

---

### Task 7: Build `text_overlay.py` — render outline text for name/letter overlays

**Files:**
- Create: `skills/coloring-page/scripts/text_overlay.py`
- Create: `skills/coloring-page/tests/test_text_overlay.py`

- [ ] **Step 1: Write the failing test**

```python
# tests/test_text_overlay.py
from lxml import etree
from text_overlay import render_outline_text

def test_render_outline_text_emits_path_or_text_element():
    svg_snippet = render_outline_text("For Leo", x=100, y=50, font_size_pt=36)
    root = etree.fromstring(svg_snippet)
    # Accept either converted-to-path or styled <text> with fill=none stroke=black.
    ns = {"s": "http://www.w3.org/2000/svg"}
    text_el = root if etree.QName(root).localname == "text" else root.find(".//s:text", ns)
    if text_el is not None:
        assert text_el.get("fill") == "none"
        assert text_el.get("stroke") == "black"
        assert text_el.text == "For Leo"

def test_render_truncates_long_strings():
    svg_snippet = render_outline_text("ThisNameIsWayTooLongToFit", x=0, y=0, font_size_pt=24)
    root = etree.fromstring(svg_snippet)
    ns = {"s": "http://www.w3.org/2000/svg"}
    text_el = root if etree.QName(root).localname == "text" else root.find(".//s:text", ns)
    assert len(text_el.text) <= 12
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_text_overlay.py -v`
Expected: FAIL `ModuleNotFoundError`.

- [ ] **Step 3: Implement `text_overlay.py`**

```python
# scripts/text_overlay.py
"""Render outline (stroke-only) text for coloring-page overlays."""
from lxml import etree

SVG_NS = "http://www.w3.org/2000/svg"
MAX_LEN = 12
FONT_FAMILY = "Fredoka"


def render_outline_text(text: str, *, x: float, y: float, font_size_pt: float,
                        stroke_width_pt: float = 2.0) -> bytes:
    """Return an SVG fragment (with xmlns) containing a stroke-only text element.

    Truncates text to MAX_LEN chars. Uses Fredoka (bundled). The parent composer
    is responsible for embedding the font in the final SVG.
    """
    clipped = text[:MAX_LEN]
    root = etree.Element(f"{{{SVG_NS}}}g", nsmap={None: SVG_NS})
    text_el = etree.SubElement(root, f"{{{SVG_NS}}}text")
    text_el.set("x", str(x))
    text_el.set("y", str(y))
    text_el.set("font-family", FONT_FAMILY)
    text_el.set("font-size", f"{font_size_pt}pt")
    text_el.set("fill", "none")
    text_el.set("stroke", "black")
    text_el.set("stroke-width", f"{stroke_width_pt}")
    text_el.set("text-anchor", "middle")
    text_el.text = clipped
    return etree.tostring(root, xml_declaration=True, encoding="utf-8")
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_text_overlay.py -v`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add skills/coloring-page/scripts/text_overlay.py skills/coloring-page/tests/test_text_overlay.py
git commit -m "feat(coloring-page): add text_overlay renderer"
```

---

### Task 8: Build `page_composer.py` — assemble title + art + overlay onto a page-sized SVG

**Files:**
- Create: `skills/coloring-page/scripts/page_composer.py`
- Create: `skills/coloring-page/tests/test_page_composer.py`

- [ ] **Step 1: Write the failing test**

```python
# tests/test_page_composer.py
from pathlib import Path
from lxml import etree
from page_composer import compose_page, PageSpec

ASSET = Path(__file__).parent.parent / "assets" / "svg" / "shapes" / "star.svg"


def test_compose_letter_portrait_has_correct_dimensions():
    spec = PageSpec(page_size="Letter", orientation="portrait", title="Stars",
                    text_overlay=None, age_band="5-7")
    out = compose_page([ASSET.read_bytes()], spec)
    root = etree.fromstring(out)
    # 8.5in x 11in at 72pt/in = 612 x 792
    assert root.get("width") == "612pt"
    assert root.get("height") == "792pt"


def test_compose_embeds_title_band():
    spec = PageSpec(page_size="Letter", orientation="portrait", title="My Stars",
                    text_overlay=None, age_band="5-7")
    out = compose_page([ASSET.read_bytes()], spec)
    assert b"My Stars" in out


def test_compose_landscape_swaps_dimensions():
    spec = PageSpec(page_size="Letter", orientation="landscape", title="Hi",
                    text_overlay=None, age_band="5-7")
    out = compose_page([ASSET.read_bytes()], spec)
    root = etree.fromstring(out)
    assert root.get("width") == "792pt"
    assert root.get("height") == "612pt"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_page_composer.py -v`
Expected: FAIL `ModuleNotFoundError`.

- [ ] **Step 3: Implement `page_composer.py`**

```python
# scripts/page_composer.py
"""Compose one or more SVG assets onto a page-sized SVG canvas."""
from __future__ import annotations
from dataclasses import dataclass
from typing import Optional
from lxml import etree
from svg_normalizer import normalize_svg
from text_overlay import render_outline_text

SVG_NS = "http://www.w3.org/2000/svg"

PAGE_DIMENSIONS_PT = {
    "Letter": (612, 792),   # 8.5 x 11 in @ 72pt/in
    "A4": (595, 842),
}
MARGIN_PT = 36  # 0.5 in
TITLE_BAND_PT = 48

STROKE_BY_AGE = {"2-4": 3.5, "5-7": 2.5, "8-10": 2.0}


@dataclass(frozen=True)
class PageSpec:
    page_size: str
    orientation: str           # "portrait" | "landscape"
    title: Optional[str]
    text_overlay: Optional[str]
    age_band: str              # "2-4" | "5-7" | "8-10"


def compose_page(asset_svgs: list[bytes], spec: PageSpec) -> bytes:
    w, h = PAGE_DIMENSIONS_PT[spec.page_size]
    if spec.orientation == "landscape":
        w, h = h, w

    root = etree.Element(
        f"{{{SVG_NS}}}svg",
        nsmap={None: SVG_NS},
        attrib={"width": f"{w}pt", "height": f"{h}pt", "viewBox": f"0 0 {w} {h}"},
    )

    # Title band.
    if spec.title:
        title_el = etree.SubElement(root, f"{{{SVG_NS}}}text")
        title_el.set("x", str(w / 2))
        title_el.set("y", str(MARGIN_PT + 20))
        title_el.set("font-family", "Fredoka")
        title_el.set("font-size", "24pt")
        title_el.set("fill", "none")
        title_el.set("stroke", "black")
        title_el.set("stroke-width", "1.5")
        title_el.set("text-anchor", "middle")
        title_el.text = spec.title

    # Art area.
    art_top = MARGIN_PT + (TITLE_BAND_PT if spec.title else 0)
    art_bottom = h - MARGIN_PT
    art_left = MARGIN_PT
    art_right = w - MARGIN_PT
    art_w = art_right - art_left
    art_h = art_bottom - art_top

    # Normalize each asset, then nest as <g transform=...>.
    stroke = STROKE_BY_AGE[spec.age_band]
    cols = max(1, int(len(asset_svgs) ** 0.5))
    rows = (len(asset_svgs) + cols - 1) // cols
    cell_w = art_w / cols
    cell_h = art_h / rows

    for i, svg_bytes in enumerate(asset_svgs):
        normalized = normalize_svg(svg_bytes, target_stroke_pt=stroke)
        child = etree.fromstring(normalized)
        # viewBox-based sizing; drop its xmlns collisions by re-parenting children.
        vb = child.get("viewBox", "0 0 100 100").split()
        vb_w, vb_h = float(vb[2]), float(vb[3])
        scale = min(cell_w / vb_w, cell_h / vb_h) * 0.9
        col, row = i % cols, i // cols
        cx = art_left + col * cell_w + cell_w / 2
        cy = art_top + row * cell_h + cell_h / 2
        tx = cx - (vb_w * scale) / 2
        ty = cy - (vb_h * scale) / 2
        g = etree.SubElement(root, f"{{{SVG_NS}}}g")
        g.set("transform", f"translate({tx},{ty}) scale({scale})")
        for c in child:
            g.append(c)

    # Text overlay (name/letter) bottom-center.
    if spec.text_overlay:
        overlay_frag = render_outline_text(
            spec.text_overlay, x=w / 2, y=h - MARGIN_PT, font_size_pt=32,
        )
        overlay_root = etree.fromstring(overlay_frag)
        for c in overlay_root:
            root.append(c)

    return etree.tostring(root, xml_declaration=True, encoding="utf-8")
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_page_composer.py -v`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add skills/coloring-page/scripts/page_composer.py skills/coloring-page/tests/test_page_composer.py
git commit -m "feat(coloring-page): add page_composer for title/art/overlay layout"
```

---

### Task 9: Build `svg_validator.py` — strict validator (stub for deferred generated-SVG path)

**Files:**
- Create: `skills/coloring-page/scripts/svg_validator.py`
- Create: `skills/coloring-page/tests/test_svg_validator.py`

This module exists so V2 can wire in generated-SVG fallback without re-planning. V1 never calls it on the hot path.

- [ ] **Step 1: Write the failing test**

```python
# tests/test_svg_validator.py
import pytest
from svg_validator import validate_generated_svg, ValidationError

GOOD = b'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M10 10 L90 90" fill="none" stroke="black" stroke-width="2.5"/>
</svg>'''

BAD_FILL = b'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M10 10 L90 90" fill="red" stroke="black" stroke-width="2.5"/>
</svg>'''

BAD_STROKE = b'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M10 10 L90 90" fill="none" stroke="black" stroke-width="10"/>
</svg>'''

def test_validates_clean_svg():
    validate_generated_svg(GOOD, age_band="5-7")  # no raise

def test_rejects_non_none_fill():
    with pytest.raises(ValidationError, match="fill"):
        validate_generated_svg(BAD_FILL, age_band="5-7")

def test_rejects_out_of_range_stroke():
    with pytest.raises(ValidationError, match="stroke-width"):
        validate_generated_svg(BAD_STROKE, age_band="5-7")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_svg_validator.py -v`
Expected: FAIL `ModuleNotFoundError`.

- [ ] **Step 3: Implement `svg_validator.py`**

```python
# scripts/svg_validator.py
"""Strict validator for generated SVG. V1 does not call this on the hot path."""
from lxml import etree

SVG_NS = "http://www.w3.org/2000/svg"
ALLOWED_TAGS = {"svg", "g", "path", "circle", "rect", "polygon", "polyline", "ellipse", "line", "defs", "title", "desc"}
ALLOWED_FILL = {"none", "white", "#fff", "#ffffff"}
STROKE_BOUNDS_PT = {"2-4": (3.0, 4.5), "5-7": (2.0, 3.5), "8-10": (1.5, 3.0)}
PATH_COUNT_BOUNDS = {"2-4": (1, 6), "5-7": (3, 20), "8-10": (10, 200)}


class ValidationError(ValueError):
    pass


def validate_generated_svg(svg_bytes: bytes, *, age_band: str) -> None:
    try:
        root = etree.fromstring(svg_bytes)
    except etree.XMLSyntaxError as e:
        raise ValidationError(f"invalid SVG: {e}") from e

    lo_w, hi_w = STROKE_BOUNDS_PT[age_band]
    lo_n, hi_n = PATH_COUNT_BOUNDS[age_band]
    shape_count = 0

    for el in root.iter():
        tag = etree.QName(el).localname
        if tag not in ALLOWED_TAGS:
            raise ValidationError(f"forbidden tag: {tag}")
        if tag in {"path", "circle", "rect", "polygon", "polyline", "ellipse", "line"}:
            shape_count += 1
            fill = el.get("fill")
            if fill is not None and fill not in ALLOWED_FILL:
                raise ValidationError(f"{tag} fill={fill!r} not allowed")
            sw = el.get("stroke-width")
            if sw is not None:
                try:
                    sw_f = float(sw.rstrip("pt"))
                except ValueError as e:
                    raise ValidationError(f"invalid stroke-width: {sw}") from e
                if not (lo_w <= sw_f <= hi_w):
                    raise ValidationError(
                        f"stroke-width {sw_f}pt out of range [{lo_w},{hi_w}] for {age_band}"
                    )

    if not (lo_n <= shape_count <= hi_n):
        raise ValidationError(
            f"shape count {shape_count} out of range [{lo_n},{hi_n}] for {age_band}"
        )
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_svg_validator.py -v`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add skills/coloring-page/scripts/svg_validator.py skills/coloring-page/tests/test_svg_validator.py
git commit -m "feat(coloring-page): add svg_validator stub for deferred generated-SVG path"
```

---

### Task 10: Build `compose_coloring_page.py` CLI — end-to-end orchestration

**Files:**
- Create: `skills/coloring-page/scripts/compose_coloring_page.py`
- Create: `skills/coloring-page/tests/test_cli.py`

- [ ] **Step 1: Write the failing test**

```python
# tests/test_cli.py
import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).parent.parent / "scripts" / "compose_coloring_page.py"


def run_cli(tmp_path, *args):
    return subprocess.run(
        [sys.executable, str(SCRIPT), *args, "--out-dir", str(tmp_path), "--skip-pdf"],
        capture_output=True, text=True, check=False,
    )


def test_cli_generates_svg_and_png(tmp_path):
    result = run_cli(
        tmp_path,
        "--theme", "dinosaurs",
        "--age-band", "5-7",
        "--count", "1",
        "--title", "Dinosaur Fun",
    )
    assert result.returncode == 0, result.stderr
    svgs = list(tmp_path.glob("*.svg"))
    pngs = list(tmp_path.glob("*.png"))
    assert len(svgs) == 1
    assert len(pngs) == 1
    assert "dinosaur" in svgs[0].name.lower()


def test_cli_count_produces_multiple_svgs(tmp_path):
    result = run_cli(
        tmp_path,
        "--theme", "alphabet", "--age-band", "2-4", "--count", "5",
    )
    assert result.returncode == 0, result.stderr
    assert len(list(tmp_path.glob("*.svg"))) == 5


def test_cli_rejects_missing_theme(tmp_path):
    result = run_cli(tmp_path, "--age-band", "5-7")
    assert result.returncode != 0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_cli.py -v`
Expected: FAIL — script doesn't exist.

- [ ] **Step 3: Implement `compose_coloring_page.py`**

```python
#!/usr/bin/env python3
# scripts/compose_coloring_page.py
"""CLI: generate coloring-page SVG/PNG/PDF from theme + age band."""
from __future__ import annotations
import argparse
import re
import subprocess
import sys
from pathlib import Path

from svg_library import SvgLibrary, NoMatchError
from page_composer import compose_page, PageSpec
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPM

SHARED_PDF_RENDERER = Path(__file__).parent.parent.parent.parent / "shared" / "scripts" / "pdf_render.py"


def slugify(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Generate a coloring page.")
    p.add_argument("--theme", required=True)
    p.add_argument("--age-band", choices=["2-4", "5-7", "8-10"], default="5-7")
    p.add_argument("--count", type=int, default=1)
    p.add_argument("--text-overlay", default=None)
    p.add_argument("--page-size", choices=["Letter", "A4"], default="Letter")
    p.add_argument("--orientation", choices=["portrait", "landscape"], default="portrait")
    p.add_argument("--title", default=None)
    p.add_argument("--out-dir", type=Path, default=Path.cwd())
    p.add_argument("--skip-pdf", action="store_true", help="Skip PDF render (tests).")
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    args.out_dir.mkdir(parents=True, exist_ok=True)

    lib = SvgLibrary.load_default()
    try:
        assets = lib.resolve(theme=args.theme, age_band=args.age_band, count=args.count)
    except NoMatchError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 2

    theme_slug = slugify(args.theme)
    svg_paths: list[Path] = []

    for idx, asset in enumerate(assets, start=1):
        spec = PageSpec(
            page_size=args.page_size,
            orientation=args.orientation,
            title=args.title,
            text_overlay=args.text_overlay,
            age_band=args.age_band,
        )
        page_svg = compose_page([asset.path.read_bytes()], spec)
        suffix = f"-{idx:02d}" if args.count > 1 else ""
        svg_path = args.out_dir / f"coloring-{theme_slug}-{args.age_band}{suffix}.svg"
        svg_path.write_bytes(page_svg)
        svg_paths.append(svg_path)

        # PNG preview via svglib + reportlab.
        png_path = svg_path.with_suffix(".png")
        drawing = svg2rlg(str(svg_path))
        renderPM.drawToFile(drawing, str(png_path), fmt="PNG", dpi=300)

    # Single PDF with all pages.
    if not args.skip_pdf:
        pdf_path = args.out_dir / f"coloring-{theme_slug}-{args.age_band}.pdf"
        subprocess.run(
            [sys.executable, str(SHARED_PDF_RENDERER),
             "--input-svgs", *[str(p) for p in svg_paths],
             "--page-size", args.page_size,
             "--orientation", args.orientation,
             "--output", str(pdf_path)],
            check=True,
        )
        print(f"PDF: {pdf_path}")

    for p in svg_paths:
        print(f"SVG: {p}")
        print(f"PNG: {p.with_suffix('.png')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_cli.py -v`
Expected: 3 passed. If `svg2rlg` fails on a specific asset, trace back to Task 4 normalizer and fix the offending file.

- [ ] **Step 5: Commit**

```bash
git add skills/coloring-page/scripts/compose_coloring_page.py skills/coloring-page/tests/test_cli.py
git commit -m "feat(coloring-page): add compose_coloring_page CLI orchestration"
```

---

### Task 11: Write `SKILL.md` — under 300 lines, progressive disclosure

**Files:**
- Create: `skills/coloring-page/SKILL.md`

- [ ] **Step 1: Write `SKILL.md` with required sections**

Contents (abbreviated structure — write real content, not TODOs):

````markdown
---
name: coloring-page
description: Generate printable black-and-white coloring pages by theme and age. Triggers on phrases like "coloring page for dinosaurs", "easter coloring sheets for kindergarten", "simple coloring page for my 3-year-old", "alphabet coloring pack", "transportation coloring pack letter size", "printable coloring sheet with my kid's name on it". Outputs SVG, PNG preview, and printable PDF. Ages 2-10.
---

# coloring-page

Generate age-calibrated printable coloring pages from a theme and age band. Uses a bundled public-domain SVG library; outputs SVG + PNG + PDF.

## When to use

Fire when the user asks for coloring pages, coloring sheets, coloring packs, or printable coloring printouts — for teachers, parents, or students. See trigger phrases in the description.

## Inputs

| Input | Required | Values |
|-------|----------|--------|
| theme | yes | free-form string (e.g. "dinosaurs", "farm animals", "letter A") |
| age-band | yes (default 5-7) | `2-4`, `5-7`, `8-10` |
| count | no (default 1) | integer |
| text-overlay | no | string up to 12 chars |
| page-size | no (default Letter) | `Letter`, `A4` |
| orientation | no (default portrait) | `portrait`, `landscape` |
| title | no | string printed at top |

## How to run

Call the bundled CLI:

```bash
python scripts/compose_coloring_page.py \
  --theme "dinosaurs" \
  --age-band 5-7 \
  --count 1 \
  --title "Dinosaur Fun"
```

Outputs three files into the working directory:
- `coloring-{slug}-{age}.svg`
- `coloring-{slug}-{age}.png` (300dpi preview)
- `coloring-{slug}-{age}.pdf` (printable; uses `shared/scripts/pdf_render.py`)

## Outputs

See filename convention above. Multi-page packs produce one SVG per page and a single PDF with N pages.

## Edge cases

- **Copyrighted characters:** refuse specific IP (Elsa, Pikachu, Mickey). Offer generic substitute. See `references/safe-content.md`.
- **Unknown theme:** if no matching asset, ask user to pick a nearest-neighbor theme or bail. Do NOT produce a blank page. Generated-SVG fallback is deferred to V2.
- **Inappropriate themes for age:** see `references/safe-content.md`.
- **Long names:** truncate to 12 chars with warning.

## References (load on demand)

- `references/age-calibration.md` — shape counts, line weight, detail per age band
- `references/safe-content.md` — IP bans, age-appropriate content rules
- `references/theme-catalog.md` — themes and synonyms the bundled library covers
- `references/svg-style-guide.md` — visual style the bundled assets conform to
- `references/license-policy.md` — asset acquisition and licensing rules

## Locked defaults

- **Source of line art:** bundled public-domain SVG library (V1). Generated SVG deferred behind `svg_validator.py`.
- **PDF engine:** `shared/scripts/pdf_render.py` (Playwright).
- **Font:** Fredoka (SIL OFL), bundled in `assets/fonts/`.

## Evals

`evals/evals.json` — 5 prompts with objective assertions. Run `pytest tests/` for the full suite.
````

- [ ] **Step 2: Verify line count under 300**

Run: `wc -l skills/coloring-page/SKILL.md`
Expected: <300 lines.

- [ ] **Step 3: Commit**

```bash
git add skills/coloring-page/SKILL.md
git commit -m "docs(coloring-page): add SKILL.md with triggers, I/O, edge cases"
```

---

### Task 12: Wire PDF rendering — verify `shared/scripts/pdf_render.py` integration

**Files:**
- Modify: `skills/coloring-page/tests/test_cli.py` (remove `--skip-pdf` in one test)

- [ ] **Step 1: Add PDF-generation test**

Append to `tests/test_cli.py`:

```python
def test_cli_generates_pdf_with_correct_page_count(tmp_path):
    from pypdf import PdfReader
    result = subprocess.run(
        [sys.executable, str(SCRIPT),
         "--theme", "easter", "--age-band", "5-7", "--count", "3",
         "--out-dir", str(tmp_path)],
        capture_output=True, text=True, check=False,
    )
    assert result.returncode == 0, result.stderr
    pdfs = list(tmp_path.glob("*.pdf"))
    assert len(pdfs) == 1
    reader = PdfReader(str(pdfs[0]))
    assert len(reader.pages) == 3


def test_cli_pdf_page_size_is_us_letter(tmp_path):
    from pypdf import PdfReader
    result = subprocess.run(
        [sys.executable, str(SCRIPT),
         "--theme", "easter", "--age-band", "5-7", "--page-size", "Letter",
         "--out-dir", str(tmp_path)],
        capture_output=True, text=True, check=False,
    )
    assert result.returncode == 0, result.stderr
    pdf = next(iter(tmp_path.glob("*.pdf")))
    reader = PdfReader(str(pdf))
    media = reader.pages[0].mediabox
    # 8.5 x 11 in at 72pt/in = 612 x 792
    assert abs(float(media.width) - 612) < 2
    assert abs(float(media.height) - 792) < 2
```

- [ ] **Step 2: Run test**

Run: `pytest tests/test_cli.py::test_cli_generates_pdf_with_correct_page_count tests/test_cli.py::test_cli_pdf_page_size_is_us_letter -v`
Expected: Both pass. If `shared/scripts/pdf_render.py` doesn't accept `--input-svgs`, adjust the CLI call in `compose_coloring_page.py:main` to match the actual shared renderer signature (the shared renderer is defined by the marketplace plan — coordinate with that plan; do NOT modify it from this plan).

- [ ] **Step 3: Commit**

```bash
git add skills/coloring-page/tests/test_cli.py
git commit -m "test(coloring-page): verify PDF page count and letter size via pypdf"
```

---

### Task 13: Write `evals/evals.json` — 5 prompts with objective assertions

**Files:**
- Create: `skills/coloring-page/evals/evals.json`

- [ ] **Step 1: Write `evals.json`**

```json
{
  "skill": "coloring-page",
  "version": 1,
  "prompts": [
    {
      "id": "dinosaur-5-7",
      "user_prompt": "Make a coloring page for dinosaurs, age 5-7.",
      "expected_cli": {
        "args": {"theme": "dinosaurs", "age_band": "5-7", "count": 1}
      },
      "assertions": [
        {"type": "file_exists", "glob": "coloring-dinosaur*-5-7.pdf"},
        {"type": "pdf_page_count", "glob": "coloring-dinosaur*-5-7.pdf", "eq": 1},
        {"type": "svg_no_fill_other_than_none_white", "glob": "coloring-dinosaur*-5-7.svg"},
        {"type": "filename_slug_contains", "glob": "coloring-*.pdf", "substr": "dinosaur"}
      ]
    },
    {
      "id": "toddler-farm-simple",
      "user_prompt": "Simple coloring page for my 3-year-old, theme: farm animals.",
      "expected_cli": {
        "args": {"theme": "farm animals", "age_band": "2-4", "count": 1}
      },
      "assertions": [
        {"type": "age_band_resolved", "eq": "2-4"},
        {"type": "svg_shape_count_le", "glob": "coloring-*-2-4.svg", "value": 6},
        {"type": "svg_min_stroke_width_pt_ge", "glob": "coloring-*-2-4.svg", "value": 3.0}
      ]
    },
    {
      "id": "alphabet-kindergarten",
      "user_prompt": "Alphabet coloring pack for kindergarten, letters A through E.",
      "expected_cli": {
        "args": {"theme": "alphabet", "age_band": "5-7", "count": 5}
      },
      "assertions": [
        {"type": "pdf_page_count", "glob": "coloring-alphabet-*.pdf", "eq": 5},
        {"type": "each_svg_contains_letter", "letters": ["A", "B", "C", "D", "E"]},
        {"type": "filename_slug_contains", "glob": "coloring-*.pdf", "substr": "alphabet"}
      ]
    },
    {
      "id": "intricate-space-leo",
      "user_prompt": "Intricate space coloring page for a 9-year-old with 'For Leo' on it.",
      "expected_cli": {
        "args": {"theme": "space", "age_band": "8-10", "count": 1, "text_overlay": "For Leo"}
      },
      "assertions": [
        {"type": "age_band_resolved", "eq": "8-10"},
        {"type": "svg_contains_text", "glob": "coloring-space-8-10.svg", "substr": "For Leo"},
        {"type": "svg_shape_count_ge", "glob": "coloring-space-8-10.svg", "value": 20}
      ]
    },
    {
      "id": "easter-3-letter",
      "user_prompt": "Easter coloring sheets, 3 pages, letter size.",
      "expected_cli": {
        "args": {"theme": "easter", "age_band": "5-7", "count": 3, "page_size": "Letter"}
      },
      "assertions": [
        {"type": "pdf_page_count", "glob": "coloring-easter-*.pdf", "eq": 3},
        {"type": "pdf_page_size", "glob": "coloring-easter-*.pdf", "width_pt": 612, "height_pt": 792},
        {"type": "filename_slug_contains", "glob": "coloring-*.pdf", "substr": "easter"}
      ]
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add skills/coloring-page/evals/evals.json
git commit -m "test(coloring-page): add 5 evals with objective assertions"
```

---

### Task 14: Full-suite verification + coverage check

**Files:** no new files.

- [ ] **Step 1: Run full pytest suite**

Run: `cd skills/coloring-page && pytest -v --cov=scripts --cov-report=term-missing`
Expected: All tests pass. Coverage on `scripts/` ≥ 80%.

- [ ] **Step 2: Run SKILL.md line check**

Run: `wc -l skills/coloring-page/SKILL.md`
Expected: < 300.

- [ ] **Step 3: Run manifest audit once more**

Run: `pytest tests/test_manifest_integrity.py -v`
Expected: all 3 pass.

- [ ] **Step 4: Manual smoke test — render a real PDF**

Run:
```bash
python skills/coloring-page/scripts/compose_coloring_page.py \
  --theme dinosaurs --age-band 5-7 --count 2 --title "T-Rex Day" \
  --out-dir /tmp/coloring-smoke
open /tmp/coloring-smoke/*.pdf
```
Expected: 2-page PDF, both pages print black-and-white line art with a title, margins look correct, no filled shapes.

- [ ] **Step 5: Commit (if any config fixes)**

```bash
git add -A
git commit -m "chore(coloring-page): verify full suite + smoke test"
```

---

### Task 15: Document known limitations + V2 backlog

**Files:**
- Modify: `skills/coloring-page/SKILL.md` (append "Known limitations" section)

- [ ] **Step 1: Append known-limitations section**

Append to `SKILL.md`:

```markdown
## Known limitations (V1)

- Generated-SVG fallback is not wired — unknown themes fail loudly rather than invent art. `svg_validator.py` ships as a stub for V2.
- RTL text overlays (Arabic, Hebrew) are not supported in V1; Latin-script with accented characters only.
- Seed library is ~50-100 assets. Coverage of very specific themes ("steampunk zebras") will miss.
- Community-contributed assets not accepted yet. Contribution intake requires manifest + license audit; deferred to V2 when this skill graduates to its own repo.
```

- [ ] **Step 2: Commit**

```bash
git add skills/coloring-page/SKILL.md
git commit -m "docs(coloring-page): document V1 limitations and V2 backlog"
```

---

## Self-Review

**Spec coverage:**
- §1 purpose: covered by SKILL.md Task 11.
- §2 triggers: in SKILL.md description (Task 11).
- §3 inputs: CLI flags in Task 10; documented in Task 11.
- §4 outputs: filename convention implemented in Task 10.
- §5 workflow: orchestrated by `compose_coloring_page.py` Task 10.
- §6 bundled scripts: Tasks 4, 6, 7, 8, 9, 10.
- §6.5 source (bundled library V1, generated deferred): Tasks 3, 5 (library), 9 (validator stub).
- §7 references: Task 2.
- §8 age calibration: encoded in `svg_library.py` (Task 6), `page_composer.py` (Task 8), `svg_validator.py` (Task 9), `age-calibration.md` (Task 2).
- §9 evals: Task 13.
- §10 edge cases: documented in SKILL.md Task 11; copyrighted-IP bans in `safe-content.md` Task 2.
- §11 open questions: asset seed size answered (Task 3 targets 80-100), font picked (Fredoka, Task 3), generated-SVG validator stubbed (Task 9), contribution path documented as V2 (Task 15).

**Placeholder scan:** no TODOs, no "implement later," every code step has full code; every test step has expected output.

**Type consistency:** `PageSpec` fields match across page_composer, compose_coloring_page, tests. `Asset` dataclass consistent. `age_band` values `"2-4" | "5-7" | "8-10"` consistent across library, composer, validator, CLI.

**Licensing task is explicit:** Task 3 is a real 4-8h curation task with named sources, rejected sources, verification rules, and a manifest schema. Task 5 gates merge on manifest integrity.
