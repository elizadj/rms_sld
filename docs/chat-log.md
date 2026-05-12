# Chat Log

Short summaries of each working session. Newest first. Keep entries brief — link to commits or files in the project rather than pasting code.

---

## 2026-05-12 — Pre-meter taps + Sync menu + Logo system + Hybrid menu

A long session built around the original ask (pre-meter taps for Wendouree MSB-4) plus four supporting tracks.

**Toolbar consolidation → hybrid menu** ([sld_builder.html](../sld_builder.html)):

- Earlier in the session: four separate Import/Export buttons collapsed into two dropdowns (commit `4e17c6e`, pushed).
- Then: full hybrid layout — single `☰` menu groups Project / Import / Export / Sync / Output sections; `+ Add ▾` dropdown for Circuit / Sub-Board / Pre-Meter Tap; Print Page quick-access; new `⚙` Settings button.

**Per-SLD JSON export bug fix:**

- `saveProject()` was dumping the entire project (all SLDs together). Now mirrors `exportExcel()` — exports just the currently selected SLD with the project-level report + settings blocks.
- `loadProject()` was replacing the entire project on import. Now merges by SLD id (update existing, append new) — mirrors `importExcel()`. Preserves localStorage on round-trip.

**Logo & Branding system (Phase 2A):**

- New Settings modal with file upload / URL paste / SVG markup as input methods (all three).
- Position picker: header/footer × left/right.
- Logo data stored in `project.settings.logo`; survives JSON round-trip.
- Both the toolbar logo and the schematic logo follow the same upload (one source, two render points). Default RMS lightning-bolt + wordmark untouched when no custom logo.
- White rounded chip behind custom logos for legibility against the navy bars.
- Phase 2B (per-project override) deferred — noted.

**Sync menu (step 3):**

- Save/Load × Local file / Test environment items wired up. Test environment uses fixed filename `test_sync.json` for the dev-loop workflow.
- Real two-way File System Access API sync deferred until the app is hosted over `http://` — noted.

**Pre-meter taps (step 4 — the original ask):**

- New `preMeterTaps[]` collection on each Page. Modal supports name, amps, phases, side (Left/Right), status, optional own CT, optional own meter (with NMI/Rx/kWh), shops, notes.
- SVG renders horizontal stub off the incomer wire above the main CT, on the configured side. Phase ticks, CB box, optional CT + meter circles with labels, name + shops label clickable to edit.
- Main meter pushed down by the tap area; italic caption *"Main meter excludes pre-meter taps"* appears nearby when taps exist.
- JSON round-trip with backwards-compat defaults on all import paths.
- xlsx import/export of taps deferred — JSON-only round-trip for now.

**Test data layout cleanup:**

- Deleted `SLD.JSON.json`, `New_Project_Point Cook.json`, `WENDOUREE_Schematic_CORRECTED.xlsx` (stale/superseded).
- Added `Template_Schematic.xlsx` (mirrors the Blank Template button output exactly — single canonical reference).
- `CLAUDE.md` updated with new file layout, source-of-truth section, schema-change workflow.

**New scaffolding:**

- `docs/notes.md` — open-items tracker. Triggers: *"make a note of this"* / *"recall my notes"*. 3 items currently open (public URL hosting, Phase 2B per-project logo, optional logo background colour picker).
- `docs/prompt-pre-meter-taps.md` — the Claude-Code prompt we wrote earlier in the session, kept as a spec reference.

**Working notes:**

- The Edit tool truncated `sld_builder.html` once during the dropdown work (lost ~566 lines). Restored from `git show HEAD:sld_builder.html`. From that point onward, all edits to this file go through an atomic Python script (`tmp + os.replace`) with pre-write assertions. No further truncations.
- The `.git/index.lock` repeatedly reappeared on the Linux mount side. PowerShell `Remove-Item` from Windows + immediate `git push` is the reliable workaround.

Commit: `3721d95` — pushed to `main` (`199cadf..3721d95`).

---

## 2026-05-12 — Report module, auto-save, blank template

Changes made to [sld_builder.html](../sld_builder.html):

- **Report tab:** New "Schematic / Report" view toggle in the canvas toolbar. The Report panel is a full Electrical Network Audit Report editor with collapsible sections: Cover Page, Document Control (revision history table), Distribution, Executive Summary, Scope & Objectives, Methodology, Network Overview & Findings, Meter Testing Results, Audit Objective Outcomes, Recommendations (Immediate / Short / Long term), Conclusion, Appendices.
- **Print Report:** Generates a print-ready A4 HTML window styled with the RMS brand theme. Empty sections are omitted automatically — no blank headings.
- **Report → Excel:** A `Report` sheet is appended to the SLD workbook on every "Export Excel" action, including meter results and recommendations tables.
- **Auto-save:** Project state is written to `localStorage` after every sidebar render, modal save, and report field change. A brief navy "Saved" toast confirms each write. On page load, `tryAutoLoad()` restores the last session.
- **Blank Template:** New toolbar button ("Blank Template") downloads a ready-to-fill Excel workbook with all five sheets and header rows.

Commit: `296aa42` — pushed to `main`.

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
