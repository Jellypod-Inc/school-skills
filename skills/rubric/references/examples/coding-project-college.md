---
title: Intro CS Final Project (Python)
grade: College (intro-level)
subject: Computer Science
alignment: Bloom's
framework: 1-5 analytic
total_points: 100
weights: 30/25/20/25
---

# Rubric: College Intro-CS Final Project (Python)

**Assignment:** Build an end-to-end Python program (300-600 LOC) that solves a problem of your choice. Program must read input, perform non-trivial processing (not just I/O), produce output, and include automated tests. Submit source, tests, a README, and a short design document.

**Alignment:** Bloom's Taxonomy · 4 criteria x 5 levels · 100 points · weighted 30/25/20/25

| Criterion | 1 Far Below | 2 Below | 3 Approaches | 4 Meets | 5 Exceeds |
|---|---|---|---|---|---|
| **Correctness (30 pts)** *Apply — Bloom's 3* | Program does not run or crashes on sample input. (6 pts) | Runs on sample input but produces wrong output for most cases. (12 pts) | Produces correct output for typical inputs; fails on edge cases (empty input, malformed data, boundary values). (18 pts) | Produces correct output for typical AND edge cases; handles invalid input gracefully with clear error messages. (24 pts) | Handles all documented cases plus adversarial inputs; performance is acceptable (no obvious inefficiency); behavior matches spec exactly. (30 pts) |
| **Code Quality (25 pts)** *Evaluate — Bloom's 5* | No functions; everything at top level; single-letter variable names. (5 pts) | Some function decomposition; inconsistent naming; long functions (>50 lines). (10 pts) | Functions used for major tasks; descriptive names; most functions under 30 lines; some comments. (15 pts) | Clean module structure; PEP 8 compliant; docstrings on public functions; no obvious code duplication. (20 pts) | Idiomatic Python (comprehensions, context managers, generators where appropriate); single-responsibility functions; clear separation of concerns; type hints on public APIs. (25 pts) |
| **Testing (20 pts)** *Analyze — Bloom's 4* | No tests. (4 pts) | A few tests present; only happy-path; run manually. (8 pts) | Automated tests (pytest or unittest) for main functions; cover happy-path and 1-2 edge cases. (12 pts) | Tests cover happy-path + edge cases + error handling; ≥70% line coverage; run via single command. (16 pts) | Comprehensive test suite including parametrized tests; covers ≥85% of logic; includes at least one integration test; CI-ready. (20 pts) |
| **Design & Documentation (25 pts)** *Create — Bloom's 6* | No README; no design doc; no comments. (5 pts) | README names the project; no design rationale; sparse comments. (10 pts) | README includes how to run and example usage; design doc lists major modules; inline comments on non-obvious code. (15 pts) | README covers setup, usage, examples, and limitations; design doc explains data flow and key decisions; comments explain "why" not "what." (20 pts) | Professional-quality README with screenshots / sample outputs; design doc discusses alternatives considered and tradeoffs; public API fully documented; diagrams where useful. (25 pts) |

**Column totals (per level):** 20 / 40 / 60 / 80 / 100.

**Notes for teachers:** Bloom's tags anchor this to cognitive depth — Correctness is "Apply," Design & Documentation is "Create" because students synthesize their own architecture. For advanced students, consider raising the test-coverage threshold at Level 5. Students often under-weight testing; explicitly requiring the "run tests via single command" indicator at Level 4 has meaningful impact on habits.
