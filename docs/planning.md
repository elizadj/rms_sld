# Planning

Roadmap, ideas, and open items for the RMS SLD Builder.

---

## Current state (2026-05-11)

The app is functional end-to-end:

- Create / edit / delete SLDs, Pages (MSBs), Circuits, Sub-Boards.
- Excel import / export with backward-compatible `mtype` handling.
- JSON save / load for full-project persistence.
- Live SVG rendering with status colour-coding and boundary bands.
- A3 landscape print (current page or whole SLD).

Sample project: **Wendouree Shopping Centre** (`SLD-WDR-202604-R0`, Peter de Kock, 2026-04-23).

---

## Ideas / open items

_Add to this list as ideas come up. Move items into "In progress" when work starts and into "Done" when shipped._

### Backlog

- _(empty — add as ideas arise)_

### In progress

- _(empty)_

### Done

- _(empty)_

---

## Known quirks / things to be careful of

- The Excel import expects exact sheet names: `DrawingInfo`, `Pages`, `Circuits`, `SubBoards`. Renaming a sheet will silently skip its data.
- Legacy `mtype` values (`3ph` / `1ph` / `2ph`) are auto-converted to `metered` on both Excel import and JSON load. Keep this conversion if touching that code.
- The xlsx library loads from a CDN. Without internet, Excel buttons fail silently — the rest of the app still works.
- Print output depends on the browser dialog: A3 / Landscape selected and "Headers and Footers" turned OFF for a clean page.

---

## Future ideas (not yet committed)

_Use this space to sketch ideas before deciding whether to commit them to the Backlog._
