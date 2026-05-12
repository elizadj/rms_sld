# Claude Code prompt — Add pre-meter tap-offs (incomer branches) to the SLD builder

Copy everything below the `---` line into Claude Code.

---

## Task

Add support for **pre-meter tap-offs** (incomer branches) to the RMS SLD builder. These are sub-feeders that tap off the **incomer cable above the main CT and meter** — they are fed by the incomer but **not measured by the MSB's main meter**. Each tap may optionally carry its **own** CT, meter, NMI, Rx and notes (i.e. separately metered, just not by the MSB's main meter).

Read `CLAUDE.md` first — it has the project conventions, the data model, and the layout-constant pointers. Read `docs/decisions.md` and `docs/planning.md` too. Adhere to the working conventions strictly:

- Australian English in user-facing text.
- **Confirm before any destructive change or structural rewrite** — show me what you intend to change and wait for sign-off before saving.
- Keep the app as a single HTML file. No build step. No new external dependencies.
- Backwards compatibility on import: older JSON / Excel exports must still load cleanly (missing `preMeterTaps` should just be treated as an empty array).
- Append a session summary to `docs/chat-log.md` and add design decisions to `docs/decisions.md` when you're done.
- When complete, commit and push to `main` (remote `https://github.com/elizadj/rms_sld`). Do not create branches.

## Real-world topology this models

Site: **Wendouree Shopping Centre**, page **MSB-4**.

The hand sketch shows:

- 2500 A main incomer drops from above.
- The incomer cable **branches BEFORE the main CT/meter** to feed two unmetered (by MSB-4) loads: **Woolies** and **Safety**, on a 750 A tap.
- The main feed then continues **through the 1500/5 CT and the M-4 meter** (`#21987 6026`, NMI `16203940...`, Rx=300) onto the MSB-4 busbar.
- The MSB-4 busbar then feeds the normal tenant circuits (DBSLC etc.).

The new feature must let me draw this faithfully: visible tap(s) coming off the incomer **above** the main CT, each with its own CB, an *optional* CT + meter + labels, and an *optional* downstream load-name box.

## 1) Data model changes

Add a new collection on each **Page**:

```
Page.preMeterTaps[] = [
  {
    id,
    name,              // e.g. "Woolies + Safety"
    amps,              // e.g. "750"
    phases,            // "1" | "2" | "3"
    ct,                // e.g. "1000/5" — OPTIONAL (this tap's own CT, separate from main)
    meter,             // OPTIONAL — this tap's own meter number
    nmi,               // OPTIONAL
    rx,                // OPTIONAL
    kwh,               // OPTIONAL initial reading
    status,            // Active | OFF | VACANT | DISCONNECTED | NO LOAD | SPARE | TO VERIFY
    side,              // "left" | "right"  — which side of the incomer drop the stub extends
    notes,             // free text
    shops              // OPTIONAL free text listing tenants fed by this tap (e.g. "Woolies, Safety")
  }
]
```

Use the existing `uid()` helper for `id`. Status values must match the existing `SC` colour map.

Also add a derived/flag on the page (or just document it in `docs/decisions.md`) noting that the **page's main meter does NOT measure these pre-meter taps**. This is a billing-reconciliation concept — it doesn't need new UI beyond a small caption near the main meter when `preMeterTaps.length > 0`, e.g. *"Main meter excludes pre-meter taps"*.

## 2) Rendering changes (`buildSchematicSVG` in `sld_builder.html`, ~lines 506–756)

The current incomer drop is: arrow → wire → amps → CT → meter → phase ticks → busbar. Don't break this for pages with no pre-meter taps.

When `page.preMeterTaps` is non-empty:

- Reserve extra vertical space in `INC_DROP_H` (currently 150 px) so the taps have room to render **above the main CT**. Compute the needed height from the number of taps and whether they carry CT/meter.
- For each tap, draw a **horizontal stub off the incomer wire**, extending to `side: "left"` or `"right"`. The stub should include, in order along its length:
  1. Phase ticks crossing the stub.
  2. Amps label.
  3. CB box (re-use the existing CB rendering — colour-coded by status, text black, per the existing convention).
  4. *Optional* CT slot (reuse the same CT symbol as the main incomer).
  5. *Optional* Meter slot (reuse the M circle) with vertical labels for `#meter`, NMI, Rx.
  6. *Optional* load-name box at the far end (same vertical-text box used for circuits/sub-boards), showing `name` on line 1 and `shops` wrapped onto lines 2–3. Max 3 lines as per existing convention.
- Use the existing layout constants where possible. Add new ones if necessary (e.g. `TAP_STUB_LEN`, `TAP_ROW_H`) and keep them in the constants block (`sld_builder.html` ~lines 390–410) so they remain easy to tune.
- If two taps are on the same side, stack them vertically (top-most closest to the incomer arrow).
- The boundary band labels (OUTSIDE EN / INSIDE EN) on the busbar must remain unaffected.
- Footer title block unchanged.

Make sure the SVG width auto-extends if a tap's load-name box would overflow past the existing left/right padding.

## 3) Modals / UI

- Add a new modal **"Add Pre-Meter Tap"** modelled on the existing Add Sub-Board modal. Fields: name, amps, phases, side (left/right radio), CT, meter, NMI, Rx, kWh, status, shops, notes.
- Add a button next to the existing **+ Circuit** and **+ Sub-Board** buttons: **+ Pre-Meter Tap**. Show it only when a page is selected.
- Add context-menu entries in the sidebar tree (right-click) for pre-meter taps: **Edit** / **Delete**. Confirm-before-delete dialog must match the existing pattern.
- The sidebar tree should list pre-meter taps under the page, **above** circuits and sub-boards, with a small label like *"Pre-meter taps"* so they're visually distinct.

## 4) Import / Export

### Excel (SheetJS, `sld_builder.html` ~lines 1036–1130)

- Add a new sheet called **`PreMeterTaps`** with columns matching the data-model fields (id, page_ref, name, amps, phases, side, ct, meter, nmi, rx, kwh, status, shops, notes).
- Update the **Instructions** sheet (in `exportExcel()`) to document the new sheet and its columns.
- Update `importExcel()` to read the new sheet. If the sheet is absent, treat as no pre-meter taps (backwards compatibility).
- Keep the existing `mtype` `3ph`/`1ph`/`2ph` → `metered` conversion intact.

### JSON

Just round-trip the new array. Old JSON files without `preMeterTaps` must load fine — initialise to `[]` when absent. Verify by reloading the existing `SLD.JSON.json` (Wendouree Shopping Centre) after your changes.

## 5) Print

The A3 landscape print view (one page / all pages) must include the pre-meter taps in the rendered SVG. Since print uses the same `buildSchematicSVG` output, this should be free — but verify by triggering the print preview after changes and confirming layout doesn't clip.

## Verification checklist (do all of these before committing)

1. Open `sld_builder.html` in a browser — no console errors.
2. Load `SLD.JSON.json` — Wendouree opens, MSB-4 renders with **no** pre-meter taps (backwards compat).
3. Add a pre-meter tap **"Woolies + Safety"** to MSB-4: 750 A, 3-phase, side=left, no CT, no meter, shops="Woolies, Safety". Confirm it renders as a left-side stub **above** the main 1500/5 CT.
4. Add a second pre-meter tap on the right with its **own** CT (1000/5) and meter (dummy NMI). Confirm both CT and Meter symbols render on the stub with vertical labels and don't collide with the main incomer labels.
5. Export to Excel. Open the file. Confirm a `PreMeterTaps` sheet exists with both rows and the Instructions sheet mentions it.
6. Export to JSON. Re-import. Confirm both taps survive the round-trip with identical fields.
7. Delete one tap via the right-click context menu. Confirm-before-delete dialog appears. Confirm the SVG re-renders correctly with one tap remaining.
8. Print preview (one page) — confirm the taps appear and aren't clipped at the A3 boundary.
9. Switch to a page with **no** taps — confirm the incomer still renders exactly as before (no regression in `INC_DROP_H` or label positions).

## Done when

- All nine verification steps pass.
- `docs/chat-log.md` has a session summary appended.
- `docs/decisions.md` has an entry for: "Pre-meter taps — data model, side stubs, optional own CT/meter, billing-reconciliation note on main meter."
- Changes are committed and pushed to `main`.

## What to ask me before starting

Before writing any code, please confirm:

1. Do I want the pre-meter tap's load-name box to be the same height as the main circuit boxes (210 px), or shorter? *(Default: same — for visual consistency. Confirm.)*
2. Should the small caption *"Main meter excludes pre-meter taps"* render on the schematic itself, or only in the Excel export? *(Default: both — small grey italic text near the main meter.)*
3. Anything else you'd like to clarify about the topology before I start.
