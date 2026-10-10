# JanSahayak (जनसहायक) — Phased Engineering Roadmap

**Document Version:** 1.0.0
**Status:** Active Execution Plan
**Scope:** From Repository Baseline to Stitch UI Integration and Production Release

---

## Phase 1: Documentation & Repository Baseline (Completed / Current)

* [x] **Codebase Audit & Secret Hygiene**: Scan all tracked files and commit history for exposed secrets; verify `.gitignore`.
* [x] **Authorization Hardening**: Enforce Firebase custom claims (`token.admin == true`) and strict schema bounds in `firestore.rules`.
* [x] **Branding & Dependency Cleanup**: Remove unused `@google/genai` dependency and clean up AI Studio references.
* [x] **Standard Documentation Suite**: Author and align `README.md`, `PRD.md`, `TRD.md`, `architecture.md`, `memory.md`, `rules.md`, `design.md`, `phases.md`, and `CHANGELOG_ALIGNMENT.md`.
* [x] **Build & Lint Verification**: Confirm clean zero-error passes on `npm run lint` and `npm run build`.

---

## Phase 2: Stitch Design & Screen Review (Upcoming)

* [ ] **Screen Inventory & Gap Analysis**: Review incoming Stitch mockups against existing functional views:
  - Homepage / Hero Banner
  - Schemes Catalog & Detail Views
  - Eligibility Wizard Questionnaire
  - Scheme Comparison Matrix
  - Document Readiness Checker
  - Saved Schemes & PDF Export
  - FAQ, Helpline Directory, and Legal/Privacy Views
  - Administrator Portal & Analytics
* [ ] **Design System Token Extraction**: Map Stitch color palettes, typography scales, card layouts, and spacing to Tailwind CSS v4 tokens.
* [ ] **Anti-Pattern Screen Gate**: Ensure designs conform to [`design.md`](./design.md) (no bubble gradients, no fake statistics, no emoji icons, no unverified government seals).

---

## Phase 3: React UI Implementation

* [ ] **Component-Level Refactoring**: Rebuild or enhance components incrementally (`Navbar`, `Footer`, `SchemeCard`, `CategoryCard`, `SearchInput`).
* [ ] **Layout & Page Shell Modernization**: Apply refined typography, card containers, and responsive grids.
* [ ] **Asset Validation**: Verify that any referenced logos or icons exist and render cleanly across light, dark, and high-contrast modes.
* [ ] **Verification Gate**: Re-run `npm run lint` and `npm run build` after each page modification.

---

## Phase 4: Full Feature & Logic Integration

* [ ] **State & Engine Connection**: Connect redesigned views directly to [`AppContext.tsx`](./src/context/AppContext.tsx) and [`eligibilityEngine.ts`](./src/utils/eligibilityEngine.ts).
* [ ] **Multilingual Binding**: Ensure all newly introduced UI labels link to English, Hindi, and Marathi keys in [`translations.ts`](./src/i18n/translations.ts).
* [ ] **Storage Tier Verification**: Ensure demographic inputs remain session-scoped (`sessionStorage`) and bookmarks remain in `localStorage`.
* [ ] **Admin Portal & Firestore Telemetry**: Verify real-time Recharts streams and custom claims gating continue operating without regressions.

---

## Phase 5: Accessibility & Multilingual Testing

* [ ] **Devanagari Typography Review**: Verify Hindi and Marathi rendering, line-heights, and ligature clarity across all viewports.
* [ ] **Regional Text Expansion**: Confirm no buttons or badges overflow due to longer Hindi or Marathi strings.
* [ ] **WCAG 2.1 AA Audit**: Test high-contrast mode, dark mode, keyboard tab order, skip links, and screen reader labels.
* [ ] **Voice Search Verification**: Verify Web Speech API recognition and graceful degradation across supported and unsupported browsers.

---

## Phase 6: Functional Regression Testing

* [ ] **Eligibility Scoring Audit**: Test edge-case profiles (landless farmers, BPL students, single mothers, senior citizens) to ensure deterministic scoring accuracy.
* [ ] **Comparison Matrix Audit**: Test selection and side-by-side comparison of 2 and 3 schemes.
* [ ] **PDF Checklist Generation**: Test client-side jsPDF export for corrupted fonts or layout collisions.
* [ ] **Offline Resilience**: Verify core scheme browsing and saved schemes function without active internet connectivity.

---

## Phase 7: Final Build & Release Readiness Review

* [ ] **Final Bundle Optimization**: Inspect Vite bundle chunks in `dist/` and apply code-splitting where beneficial.
* [ ] **Secret Scan & Diff Audit**: Final automated scan on Git diff for uncommitted credentials or private keys.
* [ ] **Documentation Synchronization**: Verify [`CHANGELOG_ALIGNMENT.md`](./CHANGELOG_ALIGNMENT.md) against final implementation.
* [ ] **Institutional Review**: Present final application, privacy policy, and CEP deployment package for institutional sign-off.
