# Chat Log

Short summaries of each working session. Newest first. Keep entries brief — link to commits or files in the project rather than pasting code.

---

## 2026-05-11 — RMS brand theme applied to UI + SLD diagram

Changes made to [sld_builder.html](../sld_builder.html):

- **App UI:** Navy toolbar `#232C63`, RMS blue primary buttons `#35679E`, pink lightning bolt logo icon `#CC3366`, Montserrat for headings/modal titles, Varela Round body font, Google Fonts loaded via `<link>`. Active sidebar items in navy with navy left border. Modal overlay `rgba(35,44,99,.45)`, modal h2 with pink bottom border.
- **SLD diagram — title bar:** Navy `#232C63` background, white title text, muted blue-grey subtitle text `#c8d0e7`.
- **SLD diagram — footer/title block:** Navy `#232C63` background, white field values, muted `#c8d0e7` field labels and AS 1102.101 caption.
- **SLD diagram — busbar:** Changed from black `#000` to navy `#232C63`.
- **SLD diagram — circuit spine lines:** Navy `#232C63` (was `#111`).
- **SLD diagram — load-name box borders:** Navy `#232C63` (was `#111`).
- **SLD diagram — sub-board boxes:** RMS navy-tinted fill `#eef0f7` (was plain grey `#f5f7fa`).
- **SLD diagram — CB status stroke:** All status rows now use navy `#232C63` border.
- **SLD diagram — sub-board CB:** Light RMS blue fill `#c8d9ef` + RMS medium blue stroke `#35679E`.
- **SLD diagram — EN zone labels:** RMS blue `#35679E` (was black).
- **SLD diagram — incomer arrow + wire:** Navy `#232C63` (was `#111`).
- **SLD diagram — NOTE band:** RMS `#eef0f7` tint background, navy NOTE: label.
- **SLD diagram — font family:** Changed SVG `font-family` to `'Varela Round',Arial,sans-serif`.
- Technical symbols (CT circles, meter circles, phase ticks) remain black per AS 1102.101.

Playwright re-test confirmed: all 9 pages at 100% print scale, no regressions.

Commit: `685e400` — pushed to `main`.

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
