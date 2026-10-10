# JanSahayak (जनसहायक) — Documentation & Alignment Tracker

**Document Purpose:** Lightweight alignment checklist and traceability matrix to ensure documentation, actual implementation, and approved design updates remain synchronized.

---

## 1. Traceability & Alignment Matrix

| Feature / Artifact | Implemented Code | PRD.md | TRD.md | architecture.md | design.md | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **53 Seed Welfare Schemes** | [`schemesData.ts`](./src/data/schemesData.ts) | Section 4.1 | Section 2 | Section 1 | Section 3 | ✅ Aligned |
| **Deterministic Eligibility Engine** | [`eligibilityEngine.ts`](./src/utils/eligibilityEngine.ts) | Section 4.1, FR-02 | Section 2 | Section 3 | Section 4 | ✅ Aligned |
| **Scheme Comparison Matrix** | [`ComparePage.tsx`](./src/pages/ComparePage.tsx) | Section 4.1 | Section 2 | Section 2 | Section 4 | ✅ Aligned |
| **Document Readiness Checker** | [`DocumentCheckerPage.tsx`](./src/pages/DocumentCheckerPage.tsx) | Section 4.1, FR-04 | Section 3 | Section 2 | Section 4 | ✅ Aligned |
| **Saved Schemes & jsPDF Export** | [`SavedSchemesPage.tsx`](./src/pages/SavedSchemesPage.tsx), [`pdfGenerator.ts`](./src/utils/pdfGenerator.ts) | Section 4.1, FR-05 | Section 1, 2 | Section 6 | Section 4 | ✅ Aligned |
| **Multilingual (EN, HI, MR)** | [`translations.ts`](./src/i18n/translations.ts), [`schemeLocalizer.ts`](./src/utils/schemeLocalizer.ts) | Section 4.1, FR-03 | Section 2 | Section 1 | Section 2 | ✅ Aligned |
| **Accessibility (Theme/Font/Color)** | [`AppContext.tsx`](./src/context/AppContext.tsx), [`index.css`](./src/index.css) | Section 4.1, NFR-03 | Section 3 | Section 2 | Section 3 | ✅ Aligned |
| **Voice Search Recognition** | [`VoiceSearchModal.tsx`](./src/components/VoiceSearchModal.tsx) | Section 4.2 | Section 6 | Section 6 | Section 4 | ✅ Aligned |
| **Anonymous Firestore Feedback** | [`AnonymousFeedbackWidget.tsx`](./src/components/AnonymousFeedbackWidget.tsx), [`firebase.ts`](./src/lib/firebase.ts) | Section 4.1, FR-06 | Section 3, 4 | Section 5 | Section 4 | ✅ Aligned |
| **Admin Custom Claims Auth** | [`AdminPanelPage.tsx`](./src/pages/AdminPanelPage.tsx), [`firebase.ts`](./src/lib/firebase.ts) | Section 4.1, FR-07 | Section 4 | Section 4 | Section 4 | ✅ Aligned |
| **Firestore Security Rules** | [`firestore.rules`](./firestore.rules) | Section 4.1, NFR-05 | Section 4 | Section 5 | N/A | ✅ Aligned |
| **Custom Claim Script** | [`scripts/set-admin-claim.mjs`](./scripts/set-admin-claim.mjs) | Section 4.1 | Section 5 | Section 4 | N/A | ✅ Aligned |
| **SessionStorage Migration** | [`AppContext.tsx`](./src/context/AppContext.tsx) | NFR-01 | Section 3 | Section 3 | Section 5 | ✅ Aligned |

---

## 2. Pre-Commit / Pre-Release Alignment Checklist

Before introducing code changes or committing updates:

- [ ] **No Secret Exposure**: Verified `.env`, private keys, and service accounts are absent from diff.
- [ ] **Typecheck Passed**: Executed `npm.cmd run lint` (`tsc --noEmit`) with 0 errors.
- [ ] **Build Succeeded**: Executed `npm.cmd run build` (`vite build`) with 0 errors.
- [ ] **Rules Intact**: Confirmed [`firestore.rules`](./firestore.rules) was not weakened.
- [ ] **Tri-Lingual Support**: Added corresponding strings in English, Hindi, and Marathi in [`translations.ts`](./src/i18n/translations.ts).
- [ ] **Session Privacy**: Confirmed no citizen demographic data is stored in `localStorage` or transmitted to remote servers.
- [ ] **Untracked File Safety**: Confirmed `.firebaserc` and `firebase.json` are not accidentally overwritten or force-deleted.
- [ ] **Docs Synchronized**: Updated [`memory.md`](./memory.md) and [`CHANGELOG_ALIGNMENT.md`](./CHANGELOG_ALIGNMENT.md) with latest findings.

---

## 3. Alignment Audit History

### Audit 1: October 10, 2026 — Documentation Baseline
* **Changes Reviewed**:
  - Removed unused `@google/genai` dependency and synchronized `package-lock.json`.
  - Renamed package to `jansahayak` and updated title in `index.html`.
  - Neutralized demo credentials in English, Hindi, and Marathi translations.
  - Authored baseline documentation suite: `README.md`, `PRD.md`, `TRD.md`, `architecture.md`, `memory.md`, `rules.md`, `design.md`, `phases.md`, `CHANGELOG_ALIGNMENT.md`.
* **Verification Status**:
  - `npm run lint`: **PASSED (0 errors)**.
  - `npm run build`: **PASSED (0 errors)**.
  - Working tree: **Clean (5 docs added, application code untouched)**.
