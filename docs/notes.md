# Notes & Open Items

A running list of things flagged during chat sessions to come back to later.

**How this works:**
- Say *"make a note of this"* (or any close variation) — Claude appends a new line to the **Open** list below with the date, the topic, and short context.
- Say *"recall my notes"* (or *"show my notes"*, *"open items"*, etc.) — Claude reads this file and walks through the open items one at a time so you can tick them off, defer them, or drop them.
- Items get moved to the **Done** list when resolved, with the date they were closed and a one-line outcome.

---

## Open

- [ ] **2026-05-12 — Revisit public visibility of hosted app + source code.** Currently the repo `elizadj/rms_sld` is **public** (required for GitHub Pages on the free plan) and the app is live at https://elizadj.github.io/rms_sld/. Both the source code/commit history AND the live app URL are reachable by anyone. Acceptable for now during dev iteration, but revisit before any production / customer-facing use. Options to make private later: (a) upgrade to GitHub Pro/Team for private Pages, (b) move hosting to Netlify/Vercel with password-protect, (c) move to internal RMS infrastructure. To reverse immediately: `gh repo edit elizadj/rms_sld --visibility private --accept-visibility-change-consequences` (Pages stops serving within ~10 min). Note: anything crawled while public is already indexed externally.


- [ ] **2026-05-13 — Add transformer element to SLD drawings.** Need a transformer symbol option in the schematic — typically appears between the supply network and the main incomer (HV → LV) but can also appear at other points in the system. Should support standard transformer notation (two circles, primary/secondary windings, kVA rating, voltage ratio, vector group). Consider whether it lives as: (a) a property on the main incomer (page-level), (b) its own item type like pre-meter tap, or (c) a sub-board variant. Probably (a) for the common HV-feeding-LV case + (b) for in-line distribution transformers.

- [ ] **2026-05-13 — Move/reorder circuits and sub-boards within an SLD.** Currently items are rendered in the order they were added to the page (`circuits[]` / `subBoards[]` array order). No UI to rearrange. Need a way to drag-and-drop or use up/down arrows so the user can reorder columns on the busbar to match the physical board layout. Should work for circuits, sub-boards, and possibly pre-meter taps. Consider whether order should be persisted in the data model (probably yes — append a sort index) or stay implicit via array order.


- [ ] **2026-05-12 — Phase 2B: per-project logo override.** Phase 2A (app-wide logo with upload / URL / SVG markup input methods, position picker, white chip backdrop) is shipped. Phase 2B layers on a *Scope* toggle in the Settings modal (App-wide default ↔ This project only), per-SLD logo storage on `sld.logo`, and render logic that prefers `sld.logo` over `project.settings.logo` falling back to the RMS default. Required for the SAAS-ready use case where each client project carries its own brand.

- [ ] **2026-05-12 — Optional: Logo background colour picker in Settings.** Currently the custom-logo backdrop is always a white chip (works for any logo). Could expose a picker: White (default) / Transparent / Navy / Custom hex — so logos pre-designed for dark backgrounds can sit transparently on the navy bar without the white chip. Low priority; ask if anyone hits a case where they actually want this.

---

## Done

- [x] **2026-05-13 — Sync write race condition.** Fixed by combining: serialised flush queue (debounce 250 ms + `_syncWriting`/`_syncPending` do/while loop in `_syncFlush`), `createWritable({ keepExistingData: true })` + explicit `truncate(json.length)` so the file isn't truncated mid-write, and `beforeunload` + `visibilitychange` handlers that fire any pending flush immediately when the tab is closed or hidden. Verified with the user — `test_sync.json` now writes cleanly with valid JSON closing braces.

- [x] **2026-05-13 — Export SLD / report per project as PDF.** Shipped as part of Phase A of the Report rebuild. Uses html2pdf.js CDN library (~430 KB), renders an off-screen HTML mirror of the report to A4 portrait PDF — no browser print dialog, no URL header/footer artefacts. Respects the per-section "Include in download" checkboxes.

- [x] **2026-05-12 — Public URL / hosting for sld_builder.html.** Repo made public via `gh repo edit --visibility public`; GitHub Pages enabled via API (`POST /repos/elizadj/rms_sld/pages` with source main / root). App live at **https://elizadj.github.io/rms_sld/**. Outcome: unblocked the FSAA real-sync (now connectable over https://) and provides a hosted URL for any embedding / sharing.
