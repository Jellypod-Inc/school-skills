#!/usr/bin/env python3
"""Render concept-map syntax files (Mermaid / DOT / Markmap) to PNG/SVG/HTML.

Dispatch by input file extension:
  .mmd, .mermaid  -> mmdc         (Mermaid CLI)
  .dot, .gv       -> dot          (Graphviz)
  .md             -> markmap-cli  (Markmap)

When the required CLI is missing, this script does NOT fail hard. It prints
platform-specific install instructions, points at a zero-install fallback
(https://mermaid.live/edit), and exits 0 so the caller can still ship the
syntax file.

Exit codes:
  0  success, OR renderer missing (graceful fallback)
  2  bad arguments / unknown extension / missing input file

Zero Python dependencies: only stdlib (shutil, subprocess, argparse, pathlib).
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Optional

# Indirection so tests can monkeypatch `render.which`.
which = shutil.which


EXT_TO_TOOL = {
    ".mmd": "mmdc",
    ".mermaid": "mmdc",
    ".dot": "dot",
    ".gv": "dot",
    ".md": "markmap-cli",
}


INSTALL_HINTS = """\
Renderer not found. Install one of the following, then re-run render.py:

  Mermaid (default, for .mmd / .mermaid):
    macOS:   brew install mermaid-cli
    npm:     npm i -g @mermaid-js/mermaid-cli
    binary:  mmdc

  Graphviz (for .dot / .gv):
    macOS:   brew install graphviz
    apt:     sudo apt-get install graphviz
    binary:  dot

  Markmap (for .md markmaps):
    npm:     npm i -g markmap-cli
    binary:  markmap-cli

Zero-install fallback for Mermaid:
  Open https://mermaid.live/edit and paste the .mmd file contents.
"""


def _tool_for(path: Path) -> Optional[str]:
    return EXT_TO_TOOL.get(path.suffix.lower())


def _emit_fallback(src: Path, tool: str) -> None:
    print(f"[render.py] required tool '{tool}' not found on PATH.")
    print(INSTALL_HINTS)
    print(f"Syntax file preserved at: {src}")
    print("Zero-install Mermaid fallback: https://mermaid.live/edit")


def _build_cmd(tool: str, src: Path, out: Path) -> list[str]:
    out_suffix = out.suffix.lower()
    if tool == "mmdc":
        # mmdc -i input.mmd -o output.png|.svg
        return [tool, "-i", str(src), "-o", str(out)]
    if tool == "dot":
        fmt = {".png": "-Tpng", ".svg": "-Tsvg", ".pdf": "-Tpdf"}.get(out_suffix, "-Tsvg")
        return [tool, fmt, str(src), "-o", str(out)]
    if tool == "markmap-cli":
        # markmap emits interactive HTML; use --no-open so we don't launch a browser.
        return [tool, str(src), "-o", str(out), "--no-open"]
    raise ValueError(f"unsupported tool: {tool!r}")


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        prog="render.py",
        description="Render a concept-map syntax file to PNG/SVG/HTML via mmdc, dot, or markmap-cli.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "examples:\n"
            "  python3 render.py --input concept-map.mmd --output concept-map.png\n"
            "  python3 render.py --input tree.dot       --output tree.svg\n"
            "  python3 render.py --input notes.md       --output notes.html\n"
        ),
    )
    parser.add_argument("--input", required=True, help="Path to .mmd / .dot / .md source file")
    parser.add_argument("--output", required=True, help="Path to output .png / .svg / .html / .pdf")
    args = parser.parse_args(argv)

    src = Path(args.input)
    out = Path(args.output)

    if not src.exists():
        print(f"error: input file not found: {src}", file=sys.stderr)
        return 2

    tool = _tool_for(src)
    if tool is None:
        print(
            f"error: unknown input extension {src.suffix!r} "
            f"(expected one of: .mmd, .mermaid, .dot, .gv, .md)",
            file=sys.stderr,
        )
        return 2

    if which(tool) is None:
        _emit_fallback(src, tool)
        return 0

    try:
        out.parent.mkdir(parents=True, exist_ok=True)
        cmd = _build_cmd(tool, src, out)
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except subprocess.CalledProcessError as exc:
        if exc.stderr:
            sys.stderr.buffer.write(exc.stderr)
        print(f"error: {tool} exited {exc.returncode}", file=sys.stderr)
        return exc.returncode or 1
    except ValueError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    print(f"[render.py] rendered {src} -> {out} via {tool}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
