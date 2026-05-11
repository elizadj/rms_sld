# Chat Log

Short summaries of each working session. Newest first. Keep entries brief — link to commits or files in the project rather than pasting code.

---

## 2026-05-11 — Bug fixes (all 4 from Playwright inspection)

Changes made to [sld_builder.html](../sld_builder.html):

- **Bug 1 fixed — Footer clipping on narrow pages:** Added `Math.max(900, ...)` to `svgW` so the SVG is never narrower than 900 px. DB-UNDB 1 and UN-DB-2 both grew from 640/730 px to 900 px; REF and BY now show in full.
- **Bug 2 fixed — Wide pages scaling down on A3 print:** Made column width dynamic inside `buildSchematicSVG()` — `colW = Math.min(COL_W, floor((1480 - pads) / numCols))`. All 9 pages now print at **100%** on A3 landscape (MSB-NORTH, MAIN TENANCY DB @ COLES, and MS-B SOUTH went from 84–89% down to 100%).
- **Bug 3 fixed — Hardcoded "Section A" label at split-bus incomer:** Removed the three lines that always rendered `Section A` next to the incomer drop. OUTSIDE EN / INSIDE EN boundary bands already communicate the split.
- **Bug 4 fixed — "INSIDE EN" boundary label overlapping incomer:** Changed boundary-label logic so labels only render when **both** OUTSIDE EN and INSIDE EN circuits are present on the same page. Single-zone pages no longer show a floating label that collides with the incomer wire (TENANCY ISOLATOR, MAIN TENANCY DB @ COLES).

Playwright re-test confirmed: zero clipping, zero text errors, all 9 pages at 100% print scale.

---

## 2026-05-11 — Project familiarisation & docs setup

- Reviewed [sld_builder.html](../sld_builder.html), [SLD.JSON.json](../SLD.JSON.json) and the Wendouree XLSX.
- Scanned project files for prompt injections — clean.
- Created [CLAUDE.md](../CLAUDE.md) as the project entry point: overview, data model, rendering conventions, quick-reference table for common edits.
- Created `docs/` folder with three files:
  - `planning.md` — backlog / in-progress / done lists
  - `chat-log.md` — this file
  - `decisions.md` — design decisions and rationale
- No code changes this session.
