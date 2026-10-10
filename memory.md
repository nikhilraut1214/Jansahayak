# JanSahayak (जनसहायक) — Session Memory & Agent Handoff

**Project Identity:** JanSahayak — e-Governance Welfare Scheme Assistant for Indian Citizens
**Repository:** `D:\CEP\Jansahayak` (`https://github.com/nikhilraut1214/Jansahayak.git`)
**Current Active Branch:** `main`
**Current Stage:** Baseline Alignment & Documentation Completed (Ready for Stitch UI redesign)
**Last Updated:** October 2026

---

## 1. Project Context & Objectives

JanSahayak is an automated e-Governance web application created as a college Community Engagement Project (CEP). It empowers Indian citizens—particularly rural farmers, women, students, and unorganized workers—to discover, evaluate eligibility for, and navigate central and state welfare programs.

---

## 2. Verified Technology Stack

* **Frontend**: React 19 (`19.0.1`), TypeScript (`~5.8.2`), Vite 6 (`6.2.3`), Tailwind CSS v4 (`4.1.14` via `@tailwindcss/vite`).
* **Icons & Visuals**: Lucide React (`0.546.0`), Recharts (`3.10.1`), jsPDF (`4.2.1`), Motion (`12.23.24`).
* **Backend**: Firebase Web SDK (`12.17.1`) — Cloud Firestore, Firebase Authentication, Firebase Analytics.
* **Privileged Admin Scripting**: Node.js ESM script using Firebase Admin SDK (`scripts/set-admin-claim.mjs`).
* **Toolchain Constraints**: Windows PowerShell environment. Node `v24.19.0`, npm `11.17.0`. Commands must use `npm.cmd` due to Windows `.ps1` script execution policies.

---

## 3. Important Source Files & Responsibilities

| File | Primary Responsibility |
| :--- | :--- |
| [`src/App.tsx`](./src/App.tsx) | Root application layout, theme wrapper, active tab router (`home`, `schemes`, `wizard`, `compare`, `saved`, `documents`, `faqs`, `admin`). |
| [`src/context/AppContext.tsx`](./src/context/AppContext.tsx) | Centralized state: language, theme, font scaling, user profile, saved schemes, toast queue, auth listener, and Firestore listeners. |
| [`src/data/schemesData.ts`](./src/data/schemesData.ts) | Statically bundled catalog of 53 central and state welfare schemes across 8 categories. |
| [`src/i18n/translations.ts`](./src/i18n/translations.ts) | Full UI translation dictionaries for English (`en`), Hindi (`hi`), and Marathi (`mr`). Neutralized of all demo credentials. |
| [`src/utils/schemeLocalizer.ts`](./src/utils/schemeLocalizer.ts) | Localized names, descriptions, and benefits for individual schemes in Hindi and Marathi. |
| [`src/utils/eligibilityEngine.ts`](./src/utils/eligibilityEngine.ts) | Deterministic eligibility evaluation algorithms (match scores 0–100%, status, matched/missing criteria). |
| [`src/lib/firebase.ts`](./src/lib/firebase.ts) | Firebase initialization, anonymous silent auth, admin auth, custom claims verification, real-time Firestore listeners, and telemetry helpers. |
| [`src/pages/AdminPanelPage.tsx`](./src/pages/AdminPanelPage.tsx) | Authenticated administrative portal with Recharts dashboards, Firestore telemetry, search logs, and custom scheme management. Protected by custom claims gate. |
| [`firestore.rules`](./firestore.rules) | Cloud Firestore security rules with custom claims verification (`token.admin == true`), `hasOnly()` schemas, string size bounds, and immutable submissions. |
| [`scripts/set-admin-claim.mjs`](./scripts/set-admin-claim.mjs) | Standalone privileged script to grant `{ admin: true }` custom claims using Firebase Admin SDK and service account credentials. |

---

## 4. Key Architectural & Security Decisions

1. **Client-Side Demographics Privacy**: Citizen profile inputs (age, income, landholding, social category, documents) are stored strictly in `sessionStorage` (`jansahayak_user_profile`, `jansahayak_user_docs`). They are purged when the browser tab closes and are never saved to remote servers. Legacy `localStorage` keys are explicitly removed on app load.
2. **Cryptographic Custom Claims**: Ordinary authenticated accounts and anonymous visitors cannot read, list, or delete administrative telemetry. Access requires a signed Firebase Auth custom claim (`token.admin == true`), verified both in client code via `onIdTokenChanged()` and at the Firestore database level via `firestore.rules`.
3. **Immutability of Audit Trails**: Updates are unconditionally forbidden (`allow update: if false;`) on `/feedback`, `/analytics_events`, and `/search_logs` across all users, including admins.
4. **Clean Removal of Gemini Dependencies**: The `@google/genai` dependency and `GEMINI_API_KEY` placeholders were removed. The package is now named `jansahayak`, and page title is `JanSahayak - Government Scheme Assistant`.

---

## 5. Current Implementation Status

* **Scheme Directory & Filtering**: **Implemented & Verified** (53 schemes, 8 categories).
* **Eligibility Wizard**: **Implemented & Verified** (Deterministic matching).
* **Scheme Comparison**: **Implemented & Verified** (Up to 3 schemes side-by-side).
* **Saved Schemes & PDF Export**: **Implemented & Verified** (Offline bookmarks + jsPDF).
* **Document Checker**: **Implemented & Verified** (Prerequisite tracking).
* **Multilingual Localization**: **Implemented & Verified** (EN, HI, MR).
* **Accessibility Suite**: **Implemented & Verified** (High-contrast, dark mode, font scaling).
* **Voice Search**: **Implemented (Browser Dependent)** (Requires Web Speech API).
* **Admin Portal & Security Rules**: **Implemented & Verified**.
* **Scheme Catalog Remote Sync**: **Partially Implemented** (Custom admin additions persist in local browser `localStorage`).
* **DigiLocker / SMS Alerts**: **Planned, Not Implemented**.

---

## 6. Technical Debt & Known Limitations

* **No IP Rate-Limiting on Public Writes**: Firestore rules validate types and lengths for `/feedback`, `/analytics_events`, and `/search_logs`, but cannot rate-limit per IP address. Production deployments should route writes through Cloud Functions with Firebase App Check.
* **Offline Emulator Testing**: Firebase CLI (`firebase-tools`) and Java (`JRE`) are not installed on the local system. Security rules have been statically verified, but emulator runtime tests remain documented rather than executed locally.
* **Untracked Firebase Configs**: `.firebaserc` and `firebase.json` are present in the working tree but untracked.

---

## 7. Next Recommended Steps for Future Agents

1. **Stitch UI Redesign Planning**: Review existing screen mockups and plan modular, component-level integration with the established React 19 architecture without breaking working business logic.
2. **Preserve Rules & Logic**: Do not weaken `firestore.rules`, custom claims verification, or translation keys during UI refactoring.
3. **Always Run Verification**: Execute `npm.cmd run lint` (`tsc --noEmit`) and `npm.cmd run build` after every major UI change.
