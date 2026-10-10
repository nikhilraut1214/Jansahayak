# JanSahayak (जनसहायक) — Government Scheme Assistant

> **A citizen-first, multilingual e-Governance discovery and eligibility portal designed for Indian citizens to easily find, verify, and apply for central and state welfare schemes.**

---

## 1. Project Overview

JanSahayak is an automated e-Governance web application created as a college Community Engagement Project (CEP). It addresses the information asymmetry and bureaucratic complexity that prevent eligible citizens—particularly farmers, rural women, students, and unorganized workers—from discovering and claiming statutory welfare benefits.

The portal provides deterministic eligibility screening, side-by-side scheme comparison, required document readiness checklists, offline-accessible scheme details, and citizen feedback channels in English, Hindi, and Marathi.

---

## 2. Target Users

* **Farmers & Rural Households**: Identifying income support, crop insurance, and agricultural infrastructure subsidies (e.g., PM-KISAN, PMFBY, KCC).
* **Students & Youth**: Finding pre-matric, post-matric, higher education scholarships, and skilling programs.
* **Women & Self-Help Groups (SHGs)**: Accessing maternal welfare, micro-credit, and entrepreneurship schemes (e.g., PMMVY, Lakhpati Didi).
* **Daily Wage & Unorganized Workers**: Navigating social security pensions, accidental insurance, and housing subsidies (e.g., PM-SYM, PM-SVANidhi, PMAY).
* **Senior Citizens & Divyangjan**: Screening for national disability assistance, pensions, and assistive equipment schemes.
* **Community Facilitators & CSC VLEs**: Assisting non-tech-savvy citizens during village-level camps.

---

## 3. Implemented Features

| Feature | Description | Status |
| :--- | :--- | :---: |
| **Curated Scheme Directory** | Catalog of 53+ central and state schemes categorized across Agriculture, Health, Students, Women, Housing, Employment, Business, and Senior Citizens. | Implemented & Verified |
| **Deterministic Eligibility Wizard** | Client-side rule engine that evaluates demographic and economic profiles against statutory criteria, outputting match scores (0–100%) and missing criteria. | Implemented & Verified |
| **Multilingual Support (EN, HI, MR)** | Full UI translation and localized scheme summaries in English, Hindi, and Marathi. | Implemented & Verified |
| **Scheme Comparison Matrix** | Side-by-side comparative analysis of benefits, income caps, and document prerequisites for up to 3 schemes simultaneously. | Implemented & Verified |
| **Document Readiness Checker** | Interactive checklist of standard identity and income documents (Aadhaar, 7/12, Income Certificate) mapping directly to scheme requirements. | Implemented & Verified |
| **Offline Bookmarking & PDF Export** | Persistent bookmarking of saved schemes and client-side PDF summary generation using `jspdf`. | Implemented & Verified |
| **Accessibility Controls** | High-contrast visual mode, dark/light themes, dynamic font scaling (`sm`, `md`, `lg`), and customizable accent palettes. | Implemented & Verified |
| **Voice Search** | Speech recognition for scheme queries in English, Hindi, and Marathi via the Web Speech API. | Implemented (Browser Dependent) |
| **Anonymous Citizen Feedback** | Floating feedback widget submitting rating and feedback to Cloud Firestore with strict rule-level validation. | Implemented & Verified |
| **Secure Administrator Portal** | Telemetry and query analytics dashboard with Firebase Authentication and server-minted Custom Claims (`token.admin == true`). | Implemented & Verified |

---

## 4. Technology Stack

* **Frontend Framework**: [React 19](https://react.dev/) (`19.0.1`) with [TypeScript](https://www.typescriptlang.org/) (`~5.8.2`)
* **Build Tool & Bundler**: [Vite 6](https://vitejs.dev/) (`6.2.3`)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (`4.1.14`) via `@tailwindcss/vite`
* **Icons**: [Lucide React](https://lucide.dev/) (`0.546.0`)
* **Charts & Analytics**: [Recharts](https://recharts.org/) (`3.10.1`)
* **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF) (`4.2.1`)
* **Database & Auth**: [Firebase Web SDK v12](https://firebase.google.com/) (`12.17.1`) — Cloud Firestore, Firebase Authentication, Firebase Analytics
* **Admin Scripting**: Node.js ESM with Firebase Admin SDK (`firebase-admin`)

---

## 5. Prerequisites

* **Node.js**: `v20.x` or higher (tested on Node `v24.19.0`)
* **npm**: `v10.x` or higher (or Bun)
* **Web Browser**: Modern Chromium, Firefox, or Safari browser with JavaScript enabled.
* **Firebase Project** (Optional for local UI development; required for Firestore telemetry and Admin authentication).

---

## 6. Local Setup & Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/nikhilraut1214/Jansahayak.git
   cd Jansahayak
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment configuration:
   ```bash
   cp .env.example .env
   ```
   *(On Windows PowerShell: `Copy-Item .env.example .env`)*

   Configure the client-exposed Firebase identifiers in `.env` if connecting to a live Firebase backend:
   ```env
   VITE_FIREBASE_API_KEY="YOUR_FIREBASE_WEB_API_KEY"
   VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="your-project-id"
   VITE_FIREBASE_STORAGE_BUCKET="your-project-id.firebasestorage.app"
   VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_SENDER_ID"
   VITE_FIREBASE_APP_ID="YOUR_APP_ID"
   ```
   *Note: If no `.env` is provided, the application falls back to `firebase-applet-config.json` for development.*

---

## 7. Development & Build Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts Vite development server at `http://localhost:3000` (host: `0.0.0.0`). |
| `npm run lint` | Runs TypeScript static typecheck (`tsc --noEmit`). |
| `npm run build` | Compiles and builds optimized production bundles into `dist/`. |
| `npm run preview` | Serves the production build locally for testing. |

---

## 8. Firebase Configuration & Security

* **Client Configuration**: Embedded client configuration files (`firebase-applet-config.json`, `.firebaserc`, `firebase.json`) contain public project identifiers used by the Firebase Web SDK.
* **Firestore Security Rules**: Defined in [`firestore.rules`](./firestore.rules). Enforces genuine administrator verification via Firebase Auth Custom Claims (`request.auth.token.admin == true`), payload size limits, `hasOnly()` key whitelisting, immutable submission records, and default-deny catch-all.
* **Administrator Claim Provisioning**: Custom claims cannot be assigned from client code. Use the standalone privileged script:
  ```powershell
  $env:GOOGLE_APPLICATION_CREDENTIALS = "path\to\serviceAccountKey.json"
  node scripts/set-admin-claim.mjs admin@jansahayak.gov.in
  ```
  *(Service account JSON files are ignored in `.gitignore` and must never be committed to Git).*

---

## 9. Known Limitations & Technical Constraints

1. **Client-Side Scheme Data**: The scheme catalog is currently statically seeded in [`src/data/schemesData.ts`](./src/data/schemesData.ts). Admin additions and edits are persisted in the operator's browser `localStorage`, not synchronized to a central backend database.
2. **IP Rate Limiting**: Firestore security rules validate schema types and lengths, but client-direct writes cannot enforce IP-based rate limiting. Production deployments should route public feedback through Cloud Functions with Firebase App Check.
3. **Voice Recognition Browser Support**: Voice search relies on the Web Speech API (`webkitSpeechRecognition`), which is available in Google Chrome, Edge, and Android Chromium browsers, but has limited support in Firefox and older iOS Safari versions.
4. **Offline Rule Emulation**: Running the Firebase Local Emulator Suite requires Java (`JRE`) and `firebase-tools`, which are not bundled with npm dependencies.

---

## 10. Project Documentation Index

* [`PRD.md`](./PRD.md) — Product Requirements Document (Problem, users, functional specs)
* [`TRD.md`](./TRD.md) — Technical Requirements Document (Architecture, state, APIs, security)
* [`architecture.md`](./architecture.md) — Component hierarchy, data flows, and security boundaries
* [`memory.md`](./memory.md) — Session handoff, architectural decisions, and current status
* [`rules.md`](./rules.md) — Non-negotiable development and engineering standards
* [`design.md`](./design.md) — Visual standards, typography, accessibility, and UI requirements
* [`phases.md`](./phases.md) — Multi-phase development roadmap
* [`CHANGELOG_ALIGNMENT.md`](./CHANGELOG_ALIGNMENT.md) — Traceability matrix and alignment checklist
