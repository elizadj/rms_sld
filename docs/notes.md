# Notes & Open Items

A running list of things flagged during chat sessions to come back to later.

**How this works:**
- Say *"make a note of this"* (or any close variation) — Claude appends a new line to the **Open** list below with the date, the topic, and short context.
- Say *"recall my notes"* (or *"show my notes"*, *"open items"*, etc.) — Claude reads this file and walks through the open items one at a time so you can tick them off, defer them, or drop them.
- Items get moved to the **Done** list when resolved, with the date they were closed and a one-line outcome.

---

## Open

- [ ] **2026-05-12 — Revisit public visibility of hosted app + source code.** Currently the repo `elizadj/rms_sld` is **public** (required for GitHub Pages on the free plan) and the app is live at https://elizadj.github.io/rms_sld/. Both the source code/commit history AND the live app URL are reachable by anyone. Acceptable for now during dev iteration, but revisit before any production / customer-facing use. Options to make private later: (a) upgrade to GitHub Pro/Team for private Pages, (b) move hosting to Netlify/Vercel with password-protect, (c) move to internal RMS infrastructure. To reverse immediately: `gh repo edit elizadj/rms_sld --visibility private --accept-visibility-change-consequences` (Pages stops serving within ~10 min). Note: anything crawled while public is already indexed externally.

- [ ] **2026-05-13 — Move/reorder circuits and sub-boards within an SLD.** Currently items are rendered in the order they were added to the page (`circuits[]` / `subBoards[]` array order). No UI to rearrange. Need a way to drag-and-drop or use up/down arrows so the user can reorder columns on the busbar to match the physical board layout. Should work for circuits, sub-boards, and possibly pre-meter taps. Consider whether order should be persisted in the data model (probably yes — append a sort index) or stay implicit via array order.

- [ ] **2026-05-12 — Sync write race condition.** During a large JSON import (271 KB Stockland file), the autoSave-hooked `_syncWriteToFile()` calls fired in rapid succession (one per render/save inside the import loop) and at least one write got truncated — left `test_sync.json` mid-string with invalid JSON. Need to serialise sync writes via a promise queue: if a write is in progress, queue the next write to fire after the current one's `close()` resolves. Coalescing rapid changes into one trailing write would also help. Reproduced once on the hosted app during initial import.

- [ ] **2026-05-12 — Phase 2B: per-project logo override.** Phase 2A (app-wide logo with upload / URL / SVG markup input methods, position picker, white chip backdrop) is shipped. Phase 2B layers on a *Scope* toggle in the Settings modal (App-wide default ↔ This project only), per-SLD logo storage on `sld.logo`, and render logic that prefers `sld.logo` over `project.settings.logo` falling back to the RMS default. Required for the SAAS-ready use case where each client project carries its own brand.

- [ ] **2026-05-12 — Optional: Logo background colour picker in Settings.** Currently the custom-logo backdrop is always a white chip (works for any logo). Could expose a picker: White (default) / Transparent / Navy / Custom hex — so logos pre-designed for dark backgrounds can sit transparently on the navy bar without the white chip. Low priority; ask if anyone hits a case where they actually want this.

---

## Done

- [x] **2026-05-12 — Public URL / hosting for sld_builder.html.** Repo made public via `gh repo edit --visibility public`; GitHub Pages enabled via API (`POST /repos/elizadj/rms_sld/pages` with source main / root). App live at **https://elizadj.github.io/rms_sld/**. Outcome: unblocked the FSAA real-sync (now connectable over https://) and provides a hosted URL for any embedding / sharing.
