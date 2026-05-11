# RMS SLD Builder

A self-contained, single-file HTML + JavaScript web application for drafting Single Line Diagrams (SLDs) — electrical metering schematics — for Remote Metering Solutions' billing/metering operations. Output is styled per Australian standards (AS 1102.101 / IEC 60617).

No build step, no server, no dependencies installed locally. Open `sld_builder.html` in a browser and it runs.

---

## Files

| File | Purpose |
|---|---|
| [sld_builder.html](sld_builder.html) | The entire application — HTML + embedded CSS + embedded JS (~1212 lines). |
| [SLD.JSON.json](SLD.JSON.json) | Saved project data. Currently contains **Wendouree Shopping Centre** (drawing ref `SLD-WDR-202604-R0`, prepared by Peter de Kock, 2026-04-23). |
| [WENDOUREE_Schematic_CORRECTED.xlsx](WENDOUREE_Schematic_CORRECTED.xlsx) | Reference Excel file in the app's import/export format. |
| [docs/](docs/) | Planning notes, chat summaries, and design decisions. See files below. |

### docs/ contents

- [docs/planning.md](docs/planning.md) — roadmap, ideas, open items
- [docs/chat-log.md](docs/chat-log.md) — short summaries of each working session
- [docs/decisions.md](docs/decisions.md) — design choices and the reasoning behind them

---

## External dependencies

Loaded at runtime from CDN (no local install):

- **SheetJS / xlsx 0.18.5** — `https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js` — used for Excel import/export.

If the user is offline the Excel import/export buttons will not work; the rest of the app (drawing, JSON save/load, print) still does.

---

## Data model

```
Project
 └── SLDs[]                      (one per site / building)
      ├── name, desc, ref, date, by, rev
      └── pages[]                (one per Main Switchboard / MSB)
           ├── name, desc, amps, phases, ct, meter, nmi, rx
           ├── bustype           ("solid" | "split" | "trunking")
           ├── boundary          ("" | "inside" | "outside" | "mixed")
           ├── notes
           ├── circuits[]        (individual tenant/load circuits)
           │    ├── amps, phases, ct, rx, meter, nmi, kwh, fx
           │    ├── shop, name, status, mtype, boundary, section, notes
           │    └── status ∈ Active | OFF | VACANT | DISCONNECTED | NO LOAD | SPARE | TO VERIFY
           └── subBoards[]       (downstream feeders to sub-boards)
                ├── name, amps, ct, phases, section, status
                └── shops, notes
```

Every record gets a generated `id` of the form `id_<n>_<base36-timestamp>` from the `uid()` helper.

---

## How the app works

1. **Project navigator** (left sidebar) — tree of SLDs and their Pages. Right-click for context menu (Edit / Add Circuit / Add Sub-Board / Delete).
2. **Canvas** (centre) — live SVG rendering of the selected page. Zoom 40–200% via the slider.
3. **Modals** — New SLD, Add Page (MSB), Add Circuit, Add Sub-Board. Each modal doubles as the Edit form when launched from a context menu.
4. **Import / Export** — Excel (4 sheets: DrawingInfo, Pages, Circuits, SubBoards, plus an Instructions sheet on export) and JSON (full project).
5. **Print** — A3 landscape, one page or all pages. Opens a print window with embedded `@page` rules.

### Rendering conventions (from [sld_builder.html:387-756](sld_builder.html#L387-L756))

- Horizontal busbar layout — incomer drops vertically from top, busbar runs left→right, circuits drop down from the bus.
- Each circuit column has a fixed grid: phase ticks → amps label → CB box → CT (reserved slot) → Meter (reserved slot) → load-name box (vertical text).
- Status is shown by **fill colour only**; all text stays black.
- Boundary bands ("OUTSIDE EN" / "INSIDE EN") are labelled above the busbar when any circuit has a `boundary` set.
- Footer is a single title block: SITE | MSB | REF | DATE | BY | REV.

### Layout constants (key tuning knobs in [sld_builder.html:390-410](sld_builder.html#L390-L410))

- `COL_W = 90` — width per circuit column. Reduce for more circuits per page.
- `ROW_BOX_H = 210` — load-name box height (vertical text).
- `INC_DROP_H = 150` — vertical reserve above the busbar for the incomer.
- `FT_H = 56` — footer height (title block).

---

## Working conventions

- **Australian English** in user-facing text (e.g. "centre", "colour", "labelled").
- The user works in **Excel formulas natively** — when discussing data, Excel-style references and formulas are fine. For HTML/JS, frame explanations in plain English alongside any code.
- **Confirmation before destructive changes** — the user prefers a verification step over speed. Always confirm before deleting, overwriting saved data, or making structural code changes.
- **Backwards compatibility on import** — `mtype` values `3ph`/`1ph`/`2ph` from older exports are auto-converted to `metered` (see [sld_builder.html:1086-1087](sld_builder.html#L1086-L1087) and [sld_builder.html:1144-1148](sld_builder.html#L1144-L1148)). Keep this conversion in place when touching import code.
- **No build step** — keep the project as a single HTML file unless the user explicitly asks to split it. Drop-in editability is a feature.

---

## Quick reference — common edits

| Task | Where to look |
|---|---|
| Add a new field to a circuit | Modal HTML (~[sld_builder.html:223-264](sld_builder.html#L223-L264)) → `saveCircuit()` ~[sld_builder.html:898-920](sld_builder.html#L898-L920) → `buildSchematicSVG()` ~[sld_builder.html:587-721](sld_builder.html#L587-L721) → Excel export/import ~[sld_builder.html:1036-1106](sld_builder.html#L1036-L1106) |
| Adjust a layout dimension | Constants block ~[sld_builder.html:390-410](sld_builder.html#L390-L410) |
| Change a status colour | `SC` map ~[sld_builder.html:313-321](sld_builder.html#L313-L321) |
| Tweak the title block / footer | Footer section ~[sld_builder.html:723-757](sld_builder.html#L723-L757) |
| Change the import format | `importExcel()` ~[sld_builder.html:1066-1130](sld_builder.html#L1066-L1130) and Instructions sheet in `exportExcel()` ~[sld_builder.html:1042-1062](sld_builder.html#L1042-L1062) |

---

## Notes for Claude

- This `CLAUDE.md` is the entry point. **Append session summaries to [docs/chat-log.md](docs/chat-log.md)** and **add design decisions to [docs/decisions.md](docs/decisions.md)** as they come up.
- Don't bloat this file with chat history — keep it as a stable overview.
- The user can read code but doesn't author it. Always explain *why* before showing a code change, and confirm before saving.