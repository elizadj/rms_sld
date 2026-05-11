# Playwright Visual Inspection — Wendouree Schematic
**Date:** 2026-05-11  
**Source file:** `WENDOUREE_Schematic_CORRECTED.xlsx`  
**Script:** `test-sld.js` + `test-print-preview.js`  
**Output:** `test-output/` — 9 canvas screenshots, print preview PNG, PDF

---

## What was tested

1. Opened `sld_builder.html` in Chromium.
2. Imported `WENDOUREE_Schematic_CORRECTED.xlsx` → 9 pages, 70 circuits loaded OK.
3. Clicked every page in the sidebar; took a screenshot of each canvas view.
4. Ran "Print All" and saved the output as a PDF (`wendouree-print-all.pdf`).
5. Measured the print scale of each SVG against A3 landscape printable width (~404 mm / 1526 px).
6. Scanned every text node on every page for clipping (…), "undefined"/"null" values, and bad data.

---

## Print-scale summary (how much each page is shrunk to fit A3)

| Page | Columns | SVG width | Print scale | Note |
|---|---|---|---|---|
| MSB-4 | 16 | 1540 px | **99%** | Fine |
| MSB-NORTH | 18 | 1720 px | **89%** | Text shrinks to ~9 px |
| MSB-2 | 11 | 1090 px | 100% | Fine |
| DB-UNDB 1 | 6 | 640 px | 100% | Footer clips (see Bug 1) |
| DB MSB-4 NORTH | 12 | 1180 px | 100% | Fine |
| TENANCY ISOLATOR | 12 | 1180 px | 100% | Fine |
| UN-DB-2 | 7 | 730 px | 100% | Fine |
| MAIN TENANCY DB @ COLES | 18 | 1720 px | **89%** | Text shrinks to ~9 px |
| MS-B SOUTH | 19 | 1810 px | **84%** | Text shrinks to ~8.5 px ← worst |

---

## Issues found

### Bug 1 — Footer text clipped on DB-UNDB 1 *(confirmed in canvas + text dump + print/PDF)*

**What:** The REF and BY fields in the title block are truncated with `…`:
- REF: `SLD-WDR-202604-R0` → `SLD-WDR-202604-…`
- BY: `Peter de Kock` → `Peter de Ko…`

**Root cause:** Footer column widths are proportional fractions of the SVG width. DB-UNDB 1 has only 6 sub-boards, so the SVG is 640 px wide. The REF column gets 16 % × 640 px = 102 px — not enough for 18 characters at the font size used. The clipText() function truncates the overflow.

**Where in code:** `sld_builder.html` footer section ~line 728, and `clipText()` at ~line 415.

**Fix:** Enforce a minimum SVG width (e.g. 900 px). Change one line:
```js
// current:
const svgW = LEFT_PAD + numCols * COL_W + RIGHT_PAD;

// fix — apply a minimum so the footer always has room:
const svgW = Math.max(900, LEFT_PAD + numCols * COL_W + RIGHT_PAD);
```
900 px gives the REF column 16% × 900 px = 144 px → 24 characters, more than enough.

---

### Bug 2 — Wide pages (18–19 columns) shrink to 84–89% on A3 print

**What:** MSB-NORTH, MAIN TENANCY DB @ COLES, and MS-B SOUTH are all wider than A3 printable width. The browser scales them down to fit, so the 10 px text in load-name boxes prints at ~8.4–8.9 px on paper — very small and hard to read.

**Root cause:** `COL_W = 90` px × 19 columns = 1710 px + padding = 1810 px. A3 landscape at 96 dpi is only ~1526 px wide.

**Fix options (pick one):**
- **Option A — Reduce COL_W:** Change `COL_W = 90` to `COL_W = 78`. This keeps 19 columns within A3 (50 + 19×78 + 50 = 1582 px, ~103% — still slightly over but very close). Drop to `COL_W = 74` for a comfortable fit (50 + 19×74 + 50 = 1506 px).
- **Option B — Auto-scale COL_W:** Calculate COL_W dynamically: `const COL_W = Math.min(90, Math.floor((1480 - LEFT_PAD - RIGHT_PAD) / numCols));` so it never exceeds A3 width regardless of column count.
- **Option C — Use A3 for wide pages:** The print stylesheet could be updated to allow even wider (e.g. A1 landscape) for very wide schematics, but this requires a larger printer.

---

### Bug 3 — "Section A" label hardcoded at the incomer drop on split-bus pages

**What:** On MSB-4 and MSB-NORTH, the code always renders `Section A` at the incomer drop point regardless of what the actual circuit section data says.

**Where in code:** `sld_builder.html` ~line 554–556:
```js
if(page.bustype==='split'){
  s += `<text ...>Section A</text>`;   // ← always "Section A"
}
```

**Why it matters:** If circuits span Section A and Section B, the label is accurate for the left half of the bus. But if Section B appears first in the list, or if the incomer drops in a non-Section-A position, the label is misleading on a legal engineering document.

**Fix:** Remove the hardcoded label entirely (the OUTSIDE EN / INSIDE EN boundary bands already communicate the split), or derive the label from the actual section letters present in the circuit data.

---

### Bug 4 — "INSIDE EN" boundary label visually collides with the incomer on all-inside-EN pages

**What:** On TENANCY ISOLATOR and MAIN TENANCY DB @ COLES (all circuits tagged `boundary='inside'`), the "INSIDE EN" text is centred over all the inside circuits. The incomer drop is also centred (at the mid-point of the bus). Both land at nearly the same x-position, so the text label sits immediately beside or under the incomer wire, making both harder to read.

**Where in code:** `sld_builder.html` ~lines 563–579 (boundary band labels) and ~line 468–475 (incomer x position).

**Fix:** When all circuits are inside EN and there are no outside EN circuits, shift the "INSIDE EN" label to render above the left third of the bus rather than the centre. Or, suppress the label when the entire board is already marked Inside EN at the page level (the subtitle already shows it).

---

## Data observations (not rendering bugs — may be intentional, worth reviewing)

| Page | Observation |
|---|---|
| **UN-DB-2** | Page-level boundary = `Outside EN`, but all 7 circuits individually marked `Inside EN`. The subtitle says "Outside EN" while the diagram shows "INSIDE EN" above the bus — looks contradictory. Verify whether this is correct. |
| **UN-DB-2** | No amps, CT, or meter set on the page — no incomer is drawn. The busbar appears to float with no power feed shown. If an incomer exists, add the data. |
| **DB-UNDB 1** | Same — no incomer drawn. The board feeds 6 sub-boards (CFS1–CFS6) with nothing showing where power enters. |
| **MSB-NORTH** | Individual sub-boards have no `boundary` data set, so no OUTSIDE EN / INSIDE EN zone labels appear even though the page is marked `Mixed EN`. Add boundary data to sub-boards to get the zone labels on the diagram. |
| **MAIN TENANCY DB @ COLES** | Circuits EX-T41 and K10 have CB size `?`. This renders as `? A` on the schematic, which looks odd on a formal drawing. Use `TBC` instead of `?`, or leave blank. |
| **UN-DB-2** | All 7 circuits are marked `TO VERIFY` (amber badges). Possibly correct — flagging it for awareness. |

---

## No issues found

- No `undefined` or `null` values in any text node across all 9 pages.
- No missing circuits — all 70 circuits imported and rendered.
- Meter serial, NMI, and Rx labels render correctly on all pages that have them.
- Status badges (OFF, SPARE, TO VERIFY) render in the correct positions.
- Footer shows correctly on all pages except DB-UNDB 1 (Bug 1 above).
- Import dialog confirmed: `Imported: Wendouree Shopping Centre — 9 pages, 70 circuits`.
- No JavaScript errors during import, rendering, or print.
