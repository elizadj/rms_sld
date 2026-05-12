# Notes & Open Items

A running list of things flagged during chat sessions to come back to later.

**How this works:**
- Say *"make a note of this"* (or any close variation) — Claude appends a new line to the **Open** list below with the date, the topic, and short context.
- Say *"recall my notes"* (or *"show my notes"*, *"open items"*, etc.) — Claude reads this file and walks through the open items one at a time so you can tick them off, defer them, or drop them.
- Items get moved to the **Done** list when resolved, with the date they were closed and a one-line outcome.

---

## Open

- [ ] **2026-05-12 — Public URL / hosting for sld_builder.html.** Decide whether to enable GitHub Pages on `elizadj/rms_sld` (or another host) so the app can be served over `http://` / `https://`. Required if we want the Sync button's File System Access API to work — that API is blocked under `file://`. Also unlocks embedding in the RMS website and broader internal access.

- [ ] **2026-05-12 — Phase 2B: per-project logo override.** Phase 2A (app-wide logo with upload / URL / SVG markup input methods, position picker, white chip backdrop) is shipped. Phase 2B layers on a *Scope* toggle in the Settings modal (App-wide default ↔ This project only), per-SLD logo storage on `sld.logo`, and render logic that prefers `sld.logo` over `project.settings.logo` falling back to the RMS default. Required for the SAAS-ready use case where each client project carries its own brand.

- [ ] **2026-05-12 — Optional: Logo background colour picker in Settings.** Currently the custom-logo backdrop is always a white chip (works for any logo). Could expose a picker: White (default) / Transparent / Navy / Custom hex — so logos pre-designed for dark backgrounds can sit transparently on the navy bar without the white chip. Low priority; ask if anyone hits a case where they actually want this.

---

## Done

*(empty)*
