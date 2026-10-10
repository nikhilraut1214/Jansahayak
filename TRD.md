# JanSahayak (जनसहायक) — Technical Requirements Document (TRD)

**Document Version:** 1.0.0
**Project:** JanSahayak College Community Engagement Project (CEP)
**Status:** Baseline Active
**Maintained by:** JanSahayak Engineering Team

---

## 1. Technical Stack & Versions

| Layer / Tool | Technology | Version | Purpose / Role |
| :--- | :--- | :--- | :--- |
| **Runtime Environment** | Node.js | `>=20.x` (Tested on `24.19.0`) | JavaScript runtime for development & build |
| **UI Framework** | React | `^19.0.1` | Component-based user interface framework |
| **Language** | TypeScript | `~5.8.2` | Static typing, compile-time safety |
| **Build Tool & Bundler** | Vite | `^6.2.3` | Hot Module Replacement (HMR), production bundling |
| **CSS Framework** | Tailwind CSS | `^4.1.14` | Utility-first styling via `@tailwindcss/vite` |
| **Icons** | Lucide React | `^0.546.0` | Accessible SVG icon library |
| **Charts** | Recharts | `^3.10.1` | Admin telemetry and analytics data visualizations |
| **PDF Generation** | jsPDF | `^4.2.1` | Client-side export of saved scheme checklists |
| **Animation** | Motion | `^12.23.24` | Micro-interactions and subtle transitions |
| **Backend & Auth** | Firebase Web SDK | `^12.17.1` | Client Auth, Cloud Firestore, Web Analytics |
| **Admin Scripting** | Firebase Admin SDK | Dev tool | Privileged custom claim assignment script |

---

## 2. Source Code Architecture & Modules

```
D:\CEP\Jansahayak\
├── src\
│   ├── components\          # Reusable UI widgets and layout blocks
│   │   ├── AnonymousFeedbackWidget.tsx   # Floating feedback & star rating modal
│   │   ├── CategoryCard.tsx              # Scheme category navigation card
│   │   ├── Footer.tsx                    # Citizen links, copyright, disclaimers
│   │   ├── MobileBottomBar.tsx           # Fixed bottom navigation for mobile viewports
│   │   ├── Navbar.tsx                    # Main header: navigation, language, theme toggles
│   │   ├── SchemeCard.tsx                # Scheme summary card with tags and actions
│   │   ├── SchemeDetailModal.tsx         # Comprehensive scheme detail overlay
│   │   ├── SearchInput.tsx               # Keyword search with debounce and voice button
│   │   ├── ToastContainer.tsx            # Global toast notifications
│   │   └── VoiceSearchModal.tsx          # Web Speech API speech-to-text listener
│   ├── context\
│   │   └── AppContext.tsx                # Central state provider (React Context + Hooks)
│   ├── data\
│   │   └── schemesData.ts                # Seed catalog containing 53 curated welfare schemes
│   ├── i18n\
│   │   └── translations.ts               # Translation dictionaries for English, Hindi, Marathi
│   ├── lib\
│   │   └── firebase.ts                   # Firebase initialization, Auth, and Firestore helpers
│   ├── pages\
│   │   ├── AdminPanelPage.tsx            # Telemetry dashboard, query logs, scheme management
│   │   ├── ComparePage.tsx               # Multi-scheme side-by-side comparison
│   │   ├── DocumentCheckerPage.tsx       # Document inventory & readiness checker
│   │   ├── EligibilityWizardPage.tsx     # Multi-step demographic eligibility questionnaire
│   │   ├── FaqAndContactPage.tsx         # FAQs, helpline directory, and support form
│   │   ├── HomePage.tsx                  # Hero banner, category grid, top schemes, CTA
│   │   ├── SavedSchemesPage.tsx          # Bookmarked schemes and PDF export
│   │   └── SchemesPage.tsx               # Complete searchable and filterable scheme catalog
│   ├── utils\
│   │   ├── categoryColors.ts             # Tailwind color tokens mapped per category
│   │   ├── eligibilityEngine.ts          # Deterministic rules evaluation algorithms
│   │   ├── pdfGenerator.ts               # jsPDF layout generator for scheme checklists
│   │   └── schemeLocalizer.ts            # Localizer dictionaries for scheme titles and descriptions
│   ├── App.tsx                           # Root component: theme wrapper and tab router
│   ├── index.css                         # Tailwind CSS directives and custom animations
│   ├── main.tsx                          # React 19 DOM entrypoint (`createRoot`)
│   ├── types.ts                          # TypeScript domain models and interfaces
│   └── vite-env.d.ts                     # Vite environment type declarations
├── scripts\
│   └── set-admin-claim.mjs               # Privileged Firebase Admin SDK custom claims script
├── tests\
│   └── firestore-security.spec.md        # Firestore security rules 4-persona test specification
├── firestore.rules                       # Cloud Firestore security rules
├── index.html                            # HTML5 template entrypoint
├── package.json                          # Package manifest (name: "jansahayak")
├── tsconfig.json                         # TypeScript compiler configuration
└── vite.config.ts                        # Vite configuration with Tailwind CSS plugin
```

---

## 3. Application State & Storage Architecture

State management is centralized in [`src/context/AppContext.tsx`](./src/context/AppContext.tsx) and partitioned into three distinct tiers based on security and persistence requirements:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        JanSahayak Storage Tiers                        │
└────────────────────────────────────────────────────────────────────────┘

 1. Memory State (React Context)
    ├── Active tab navigation ('home', 'schemes', 'wizard', etc.)
    ├── Active search filters, selected compare IDs, UI modals
    └── Toast notification queue

 2. Client Browser Storage
    ├── sessionStorage (Strictly Scoped to Current Browser Session)
    │   ├── jansahayak_user_profile  ── Demographics (age, income, category, land)
    │   └── jansahayak_user_docs     ── Document checklist selections
    │   (Auto-cleared when browser tab closes; legacy localStorage keys purged on boot)
    │
    └── localStorage (Persistent Non-Sensitive Preferences)
        ├── jansahayak_lang          ── Selected language ('en' | 'hi' | 'mr')
        ├── jansahayak_theme         ── Theme ('light' | 'dark' | 'high-contrast')
        ├── jansahayak_font          ── Font scaling ('sm' | 'md' | 'lg')
        ├── jansahayak_accent_color  ── Palette accent ('emerald', 'indigo', etc.)
        ├── jansahayak_saved_schemes ── Array of bookmarked scheme ID strings
        ├── jansahayak_recent_searches── Recent search query strings
        └── jansahayak_custom_schemes── Local edits to scheme catalog

 3. Remote Cloud Firestore (Centralized Telemetry & Audit Logs)
    ├── /feedback/{feedbackId}        ── Public ratings & feedback (admin-readable only)
    ├── /analytics_events/{eventId}   ── Anonymous interaction events (admin-readable only)
    └── /search_logs/{logId}          ── Search terms & results counts (admin-readable only)
```

---

## 4. Firebase Architecture & Security Boundary

### 4.1 Firebase Web Client Configuration
Client initialization in [`src/lib/firebase.ts`](./src/lib/firebase.ts) reads environment variables with fallback to [`firebase-applet-config.json`](./firebase-applet-config.json):
* `apiKey`: Public Web API key (restricted by HTTP Referrer in Google Cloud Console).
* `authDomain`: Firebase authentication domain.
* `projectId`: Firebase project ID (`stone-smoke-w6shk`).
* `firestoreDatabaseId`: Optional named database ID.

### 4.2 Authentication & Custom Claims Authorization
* **Anonymous Authentication**: Invoked silently via `ensureSilentAuth()` for public visitors submitting feedback or logging search terms.
* **Administrator Authentication**: Invoked via `adminSignIn(email, password)` with Firebase Email/Password auth.
* **Custom Claim Verification**:
  ```typescript
  // Forces token refresh to fetch latest server-minted claims
  const tokenResult = await user.getIdTokenResult(true);
  const isAdmin = tokenResult.claims.admin === true;
  ```
* **Real-time Auth Observer**: Uses `onIdTokenChanged(auth, callback)` to listen for token refreshes, login, logout, and claim revocation in real time. If admin status drops, active Firestore listeners are immediately unsubscribed.
* **UI Protection**: [`AdminPanelPage.tsx`](./src/pages/AdminPanelPage.tsx) renders an "Access Restricted" screen if an authenticated user lacks `token.admin == true`.

### 4.3 Database Security Boundary (`firestore.rules`)
```javascript
function isAuthorizedAdmin() {
  return request.auth != null
      && request.auth.token.firebase.sign_in_provider != 'anonymous'
      && request.auth.token.admin == true;
}
```
* **Read / Delete**: Restricted exclusively to `isAuthorizedAdmin()`.
* **Update**: Blocked unconditionally (`allow update: if false;`) across all collections.
* **Create**: Allowed publicly on `/feedback`, `/analytics_events`, and `/search_logs` only if incoming payloads satisfy `hasOnly()`, length limits, and numeric bounds.
* **Default Catch-All**: `match /{document=**} { allow read, write: if false; }`.

---

## 5. Build, Lint, and Execution Workflows

### 5.1 Development Server
```powershell
npm run dev
# Starts Vite on port 3000, host 0.0.0.0
```

### 5.2 TypeScript Typecheck
```powershell
npm run lint
# Executes `tsc --noEmit` using tsconfig.json settings
```

### 5.3 Production Compilation
```powershell
npm run build
# Executes `vite build` with Rollup tree-shaking and minification to dist/
```

### 5.4 Admin Provisioning
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\serviceAccountKey.json"
node scripts/set-admin-claim.mjs admin@jansahayak.gov.in
# Mentions target Project ID and mints { admin: true } custom claim
```

---

## 6. Error Handling & Resilience Patterns

1. **Firestore Fallback**: If Firestore is blocked by ad-blockers, network loss, or permission denial, feedback and search submissions fall back gracefully to local state without breaking the user experience.
2. **Speech Recognition Fallback**: If the Web Speech API is unsupported or microphone access is denied, `VoiceSearchModal` captures the event and displays an informative notification.
3. **Storage Sanitization**: Corrupt or malformed JSON strings in `sessionStorage` or `localStorage` are safely caught inside `try/catch` blocks and initialized with default fallbacks.
4. **Offline Scheme Discovery**: All 53 core welfare schemes are statically bundled in `schemesData.ts`, guaranteeing instant, network-free discovery.
