# Design Decisions

Record the non-obvious design choices and *why* they were made. If you change a decision, leave the old entry and add a new one below it with the date — don't rewrite history.

---

## 2026-05-11 — Baseline decisions (inferred from current code)

_These are reverse-engineered from the existing app. Confirm or correct as needed during future sessions._

### Single-file HTML application — no build step

**What:** The whole app is one `sld_builder.html` file with embedded CSS and JS. The only runtime dependency is `xlsx.full.min.js` from cdnjs.

**Why:** Drop-in editability and easy distribution. The user can open the file directly in a browser, share it by email, or copy it onto another machine without installing anything.

**Trade-off:** No code-splitting, no module isolation, no automatic dependency management. The file will get large but stays inspectable.

---

### Schematic conventions — AS 1102.101 / IEC 60617, A3 landscape

**What:** Horizontal busbar layout. Incomer drops vertically from the top. Each circuit drops vertically from the bus and ends in a vertical tenant-name box. Footer is a single title block: SITE | MSB | REF | DATE | BY | REV.

**Why:** Matches Australian electrical drafting standards used in metering schematics. A3 landscape gives roughly 410 × 287 mm printable area — fits about 10 circuits across at 100% zoom.

---

### Status communicated by fill colour only — text always black

**What:** Circuit boxes change *fill* colour by status (Active = white, OFF = grey, VACANT = pale grey, etc.), but the text inside is always black.

**Why:** Black text remains legible on every fill colour and on photocopies / faxes / B&W prints. The fill is enough to flag status at a glance without compromising readability.

**Where:** `SC` colour map in [sld_builder.html:313-321](../sld_builder.html#L313-L321).

---

### Load-name box is capped at 3 lines

**What:** Tenant names that wrap to more than three lines are truncated with an ellipsis. Sub-board names use the same rule.

**Why:** The box has a fixed height (`ROW_BOX_H = 210`). Beyond three lines the text becomes too small to read at print scale.

**Where:** `MAX_LINES = 3` in [sld_builder.html:678](../sld_builder.html#L678).

---

### Legacy `mtype` values are silently converted on import

**What:** `3ph` / `1ph` / `2ph` from older Excel exports and saved JSON projects are converted to `metered` on load. The new model has just `metered` | `none`; phase count lives in the separate `phases` field.

**Why:** Old saved projects must still load. The conversion happens in both `importExcel()` and `loadProject()`.

**Where:** [sld_builder.html:1086-1087](../sld_builder.html#L1086-L1087) and [sld_builder.html:1144-1148](../sld_builder.html#L1144-L1148).

---

### Excel format — four sheets + an Instructions sheet

**What:** Export writes `DrawingInfo`, `Pages`, `Circuits`, `SubBoards`, and an `Instructions` sheet that documents the field names and accepted values.

**Why:** The Instructions sheet means a user (or another technician) opening the XLSX on its own can still understand what each column means and what to put in it.

**Where:** `exportExcel()` at [sld_builder.html:1028-1064](../sld_builder.html#L1028-L1064).
