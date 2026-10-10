# JanSahayak (जनसहायक) — Product Requirements Document (PRD)

**Document Version:** 1.0.0
**Project:** JanSahayak College Community Engagement Project (CEP)
**Status:** Baseline Active
**Maintained by:** JanSahayak Engineering Team

---

## 1. Problem Statement

Across India, hundreds of central and state welfare initiatives exist to provide direct benefit transfers, crop subsidies, healthcare coverage, scholarships, and pensions. However, millions of eligible citizens remain unaware of their entitlements due to:

1. **Information Fragmentation**: Scheme guidelines are scattered across dozens of individual ministry websites, gazettes, and state portals.
2. **Complex Eligibility Criteria**: Statutory exclusions (land caps, income brackets, tax payment history, social category thresholds) are written in dense administrative language that citizens struggle to interpret.
3. **Language Barriers**: Most government portals have inadequate or broken regional language localization, alienating non-English-speaking rural populations.
4. **Digital Divide & Lack of Assistance**: Illiterate or semi-literate citizens lack guided tools to assess document readiness before visiting Common Service Centres (CSCs) or government offices.

JanSahayak bridges this divide by delivering a free, citizen-first, lightweight web platform that unifies welfare scheme data and translates citizen demographics into clear eligibility verdicts and actionable guidance.

---

## 2. Target Users & Personas

### Persona 1: Ramesh Patil (Smallholder Farmer, Maharashtra)
* **Demographics**: 46 years old, rural Satara, 1.2 hectares landholding, annual income ₹95,000, Marathi speaker.
* **Goal**: Wants to check if he qualifies for PM-KISAN, crop insurance, or solar pump subsidies without paying middlemen fees at cyber cafes.
* **Pain Points**: Confused by exclusion rules; cannot read English; slow 3G mobile internet.

### Persona 2: Sunita Devi (Rural Homemaker & SHG Member, Uttar Pradesh)
* **Demographics**: 32 years old, mother of two daughters, annual household income ₹1.2 Lakhs, Hindi speaker.
* **Goal**: Needs to find scholarship and financial assistance programs for her 8-year-old daughter (Sukanya Samriddhi, Balika Samridhi Yojana).
* **Pain Points**: Uses an entry-level Android smartphone; needs simple step-by-step document requirements.

### Persona 3: Aniket Kamble (College Student, First-Generation Learner)
* **Demographics**: 19 years old, pursuing B.Sc, SC category, annual family income ₹1.8 Lakhs, bilingual (English & Marathi).
* **Goal**: Needs higher education post-matric scholarship and skilling stipend information.
* **Pain Points**: Misses annual application deadlines; unsure which certificates must be verified in advance.

### Persona 4: Prakash Rao (Gram Panchayat Facilitator / CSC Operator)
* **Demographics**: 28 years old, operates a rural service point assisting 30–50 villagers daily.
* **Goal**: Rapidly screens citizens, compares 2–3 competing schemes, and prints out a consolidated PDF checklist of documents for the applicant to gather.

---

## 3. User Journeys

### Journey A: Direct Scheme Discovery & Filtering
```
Citizen arrives at Home/Schemes
  ──> Selects Category (e.g. "Agriculture")
  ──> Searches keyword or filters by State
  ──> Clicks Scheme Card to open Detail Modal
  ──> Reviews Benefits, Document Checklist, Helpline & Apply Link
  ──> Saves Scheme or Downloads PDF
```

### Journey B: Guided Eligibility Screening
```
Citizen opens Eligibility Wizard
  ──> Selects Language (English / Hindi / Marathi)
  ──> Enters Demographics (Age, Gender, State, Category, Income, Landholding)
  ──> Rule Engine evaluates profile against statutory rules
  ──> Receives Sorted Match Results (Eligible / Possibly Eligible / Not Eligible)
  ──> Inspects "Why am I eligible?" and "Missing Criteria" breakdown
  ──> Bookmarks matching schemes
```

### Journey C: Document Readiness Assessment
```
Citizen opens Document Checker
  ──> Checks off possessed documents (Aadhaar, 7/12, Income Certificate, etc.)
  ──> Portal displays readiness score and highlights schemes currently unlocked
  ──> Identifies missing prerequisite certificates prior to visiting enrollment center
```

---

## 4. Implementation Status Matrix

### 4.1 Implemented & Verified
* **Scheme Directory & Search Engine**: 53 verified schemes across 8 categories with text search, state filtering, and modal drawers ([`SchemesPage.tsx`](./src/pages/SchemesPage.tsx)).
* **Deterministic Eligibility Engine**: Real-time evaluation evaluating 15+ demographic properties, generating match scores (0–100%) and criteria tags ([`eligibilityEngine.ts`](./src/utils/eligibilityEngine.ts)).
* **Scheme Comparison Matrix**: Multi-column comparison of up to 3 selected schemes covering benefits, age limits, income caps, and documents ([`ComparePage.tsx`](./src/pages/ComparePage.tsx)).
* **Multilingual UI & Localizer**: Dynamic switching across English, Hindi, and Marathi with localized scheme metadata ([`translations.ts`](./src/i18n/translations.ts), [`schemeLocalizer.ts`](./src/utils/schemeLocalizer.ts)).
* **Document Readiness Checker**: Interactive document inventory linked to scheme prerequisites with session persistence ([`DocumentCheckerPage.tsx`](./src/pages/DocumentCheckerPage.tsx)).
* **Saved Schemes & PDF Summary Export**: LocalStorage bookmarking and client-side PDF generation ([`pdfGenerator.ts`](./src/utils/pdfGenerator.ts)).
* **Accessibility Suite**: High-contrast mode, dark theme, font scaling, accent palette toggles ([`AppContext.tsx`](./src/context/AppContext.tsx)).
* **Anonymous Citizen Feedback**: Floating feedback widget with validation and Firestore collection persistence ([`AnonymousFeedbackWidget.tsx`](./src/components/AnonymousFeedbackWidget.tsx)).
* **Administrator Portal & Telemetry**: Firebase Auth with cryptographically verified Custom Claims (`token.admin == true`), telemetry dashboards, search query tracking, and document deletion ([`AdminPanelPage.tsx`](./src/pages/AdminPanelPage.tsx)).
* **Firestore Security Rules**: Hardened rule set blocking unauthorized reads/deletes and enforcing payload bounds ([`firestore.rules`](./firestore.rules)).

### 4.2 Implemented but Conditionally Verified
* **Voice-Activated Search**: Speech recognition using the Web Speech API ([`VoiceSearchModal.tsx`](./src/components/VoiceSearchModal.tsx)). Works in Chromium-based browsers; requires microphone permission; falls back gracefully in unsupported browsers.

### 4.3 Partially Implemented
* **Scheme Data Synchronization**: Scheme addition and editing from the Admin Portal persist to the operator's browser `localStorage` (`jansahayak_custom_schemes`), rather than syncing to a shared central Firestore collection.

### 4.4 Planned / Not Yet Implemented
* **DigiLocker Integration**: Automated retrieval and verification of digital identity and income certificates via official DigiLocker APIs.
* **SMS & WhatsApp Deadline Alerts**: Push notifications and reminders for seasonal application deadlines (e.g. scholarship windows, PM-KISAN eKYC cycles).
* **Multi-Admin Role Hierarchy**: Granular sub-roles (e.g. State-level Content Reviewer vs System Superadmin) via tiered claims.
* **Cloud Function Rate-Limiting**: IP-based abuse prevention and Firebase App Check integration for public feedback endpoints.

---

## 5. Functional Requirements

### FR-01: Catalog & Scheme Discovery
* The system shall display scheme listings categorized under 8 distinct categories.
* Users shall be able to filter schemes by category, state coverage, and free-text search.
* Scheme details shall include official ministry names, financial benefits, statutory criteria, documents required, and links to verified `.gov.in` websites.

### FR-02: Eligibility Evaluation
* The questionnaire shall capture age, gender, state, social category, annual income, landholding, BPL status, occupation, and disability status.
* The evaluation engine shall execute deterministically in the client without sending citizen demographic profiles to remote servers.
* Results shall be classified into `eligible` (≥80% match), `possibly_eligible` (50–79%), and `not_eligible` (<50%).

### FR-03: Localization & Language Equivalence
* The user interface must support seamless switching between English (`en`), Hindi (`hi`), and Marathi (`mr`).
* Scheme names, descriptions, and category badges must display localized text when Hindi or Marathi is active.
* All form validation messages, toasts, and buttons must be localized without UI breakage or overflow.

### FR-04: Document Checklist & Verification
* The system shall maintain an interactive document checklist.
* Checklist selections must be stored temporarily in `sessionStorage` and purged when the session ends.

### FR-05: Offline Capabilities & PDF Export
* Saved schemes must remain accessible without active network connectivity via `localStorage`.
* Users shall be able to export saved scheme summaries and document requirements to a printable PDF document.

### FR-06: Feedback & Telemetry
* Public citizens must be able to submit anonymous 1–5 star ratings and textual feedback up to 2,000 characters without creating an account.
* Feedback submissions must be validated by type, length, and allowed keys before persisting to Firestore.

### FR-07: Administrator Portal & Authorization
* Access to administrative telemetry, feedback moderation, and search logs shall strictly require Firebase Authentication with the verified `admin: true` Custom Claim.
* The client shall evaluate claims upon token refresh (`onIdTokenChanged`) and block non-admin accounts.

---

## 6. Non-Functional Requirements

* **NFR-01: Privacy & Data Minimization**: No Personally Identifiable Information (PII) such as Aadhaar numbers, PAN numbers, or bank account credentials shall ever be requested, stored, or transmitted.
* **NFR-02: Client-Side Performance**: First Contentful Paint (FCP) must remain under 1.5 seconds on a standard 4G connection; production bundle size must remain optimized with dead-code elimination.
* **NFR-03: Accessibility (WCAG 2.1 AA)**: The UI must maintain minimum color contrast ratios (4.5:1 for standard text, 7:1 in high-contrast mode), full keyboard navigability, and clear ARIA roles.
* **NFR-04: Reliability & Offline Resilience**: Key citizen features (scheme search, wizard evaluation, bookmarks) must operate client-side without crashing if backend services are offline.
* **NFR-05: Security**: Administrative authorization must be enforced cryptographically at the database boundary (Firestore Rules) rather than relying exclusively on frontend visibility checks.
