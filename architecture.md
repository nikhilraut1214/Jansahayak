# JanSahayak (जनसहायक) — System Architecture

**Document Version:** 1.0.0
**Project:** JanSahayak College Community Engagement Project (CEP)
**Status:** Baseline Active
**Maintained by:** JanSahayak Engineering Team

---

## 1. High-Level Architecture Overview

JanSahayak is designed as a **client-heavy, privacy-first single-page application (SPA)**. To maximize performance, protect sensitive citizen demographics, and ensure reliability in low-connectivity rural environments, scheme evaluations and document checks execute entirely on the citizen's browser. Centralized cloud services are used solely for anonymous feedback collection, search auditing, and administrative telemetry.

```mermaid
flowchart TD
    subgraph ClientBrowser ["Citizen Client Browser (React 19 + TypeScript)"]
        UI["UI Layer\n(Navbar, Pages, Modals, Feedbacks)"]
        CTX["AppContext Provider\n(State, Translations, Themes)"]
        ENGINE["Eligibility Rules Engine\n(Deterministic Evaluation)"]
        LOCAL_STORAGE[("localStorage\n(Preferences, Bookmarks)")]
        SESSION_STORAGE[("sessionStorage\n(Demographics, Docs)")]
        LOCAL_DATA[("Static Scheme Catalog\n(53 Seed Schemes)")]
    end

    subgraph FirebaseCloud ["Google Cloud / Firebase Backend"]
        AUTH["Firebase Authentication\n(Anonymous & Admin Email/Pass)"]
        RULES["Firestore Security Rules\n(Custom Claims Enforcement)"]
        DB[("Cloud Firestore\n(/feedback, /analytics_events, /search_logs)")]
    end

    subgraph PrivilegedEnvironment ["Privileged Admin Environment"]
        ADMIN_SCRIPT["Node.js Provisioning Script\n(scripts/set-admin-claim.mjs)"]
        SA_KEY["Service Account Key\n(GOOGLE_APPLICATION_CREDENTIALS)"]
    end

    UI --> CTX
    CTX <--> ENGINE
    CTX <--> SESSION_STORAGE
    CTX <--> LOCAL_STORAGE
    CTX <--> LOCAL_DATA

    UI -- "Feedback / Search Telemetry" --> AUTH
    AUTH -- "Verified JWT (Token Claims)" --> DB
    DB -. "Enforced by" .-> RULES

    ADMIN_SCRIPT -- "Mint Custom Claims" --> AUTH
    SA_KEY -. "Authenticates" .-> ADMIN_SCRIPT
```

---

## 2. Component Hierarchy & Layout Structure

The application adopts a top-level tab-based router managed within [`src/App.tsx`](./src/App.tsx) and wrapped by the global `AppProvider`:

```mermaid
graph TD
    App["App.tsx\n(Root Wrapper)"] --> AppProvider["AppContext Provider"]
    AppProvider --> MainContent["MainContent Layout"]

    MainContent --> Navbar["Navbar\n(Brand, Links, Lang, Theme)"]
    MainContent --> TabRouter{"Active Tab Router"}
    MainContent --> Footer["Footer\n(Helplines, Disclaimers)"]
    MainContent --> MobileBar["MobileBottomBar\n(Fixed Mobile Nav)"]
    MainContent --> FeedbackWidget["AnonymousFeedbackWidget\n(Floating Modal)"]
    MainContent --> ToastContainer["ToastContainer\n(Global Alerts)"]

    TabRouter --> |"activeTab == 'home'"| HomePage["HomePage"]
    TabRouter --> |"activeTab == 'schemes'"| SchemesPage["SchemesPage"]
    TabRouter --> |"activeTab == 'wizard'"| WizardPage["EligibilityWizardPage"]
    TabRouter --> |"activeTab == 'compare'"| ComparePage["ComparePage"]
    TabRouter --> |"activeTab == 'saved'"| SavedPage["SavedSchemesPage"]
    TabRouter --> |"activeTab == 'documents'"| DocsPage["DocumentCheckerPage"]
    TabRouter --> |"activeTab == 'faqs'"| FaqPage["FaqAndContactPage"]
    TabRouter --> |"activeTab == 'admin'"| AdminPage["AdminPanelPage"]
```

---

## 3. Citizen Eligibility Data Flow

Demographic data entered during the Eligibility Wizard is kept strictly local to protect citizen privacy:

```mermaid
sequenceDiagram
    actor Citizen as Citizen User
    participant UI as Wizard UI (EligibilityWizardPage)
    participant Ctx as AppContext
    participant Session as sessionStorage
    participant Engine as eligibilityEngine.ts
    participant Data as schemesData.ts

    Citizen->>UI: Enters Age, Income, State, Landholding, Category
    UI->>Ctx: Updates userProfile state
    Ctx->>Session: Saves JSON (jansahayak_user_profile)
    UI->>Engine: Invokes calculateEligibility(profile, schemes)
    Engine->>Data: Reads 53 statutory scheme rules
    Engine->>Engine: Evaluates constraints deterministically
    Engine-->>UI: Returns EligibilityResult[] (Score, Matched, Missing)
    UI-->>Citizen: Renders sorted results with match badges
    Note over Session: Cleared automatically when tab is closed
```

---

## 4. Authentication & Custom Claims Authorization Flow

JanSahayak enforces genuine administrative authorization via cryptographically signed JWT Custom Claims:

```mermaid
sequenceDiagram
    actor Operator as System Administrator
    participant Script as set-admin-claim.mjs
    participant AuthBackend as Firebase Auth Service
    participant ClientUI as AdminPanelPage.tsx
    participant FirebaseLib as firebase.ts
    participant FirestoreBackend as Cloud Firestore Backend

    Note over Operator,Script: Server-Side Claim Provisioning (One-Time)
    Operator->>Script: Run with Service Account Key & target email
    Script->>AuthBackend: setCustomUserClaims(uid, { admin: true })
    AuthBackend-->>Script: Claims updated in user record

    Note over ClientUI,FirestoreBackend: Client Session Lifecycle
    ClientUI->>FirebaseLib: adminSignIn(email, password)
    FirebaseLib->>AuthBackend: signInWithEmailAndPassword()
    AuthBackend-->>FirebaseLib: Returns UserCredential
    FirebaseLib->>AuthBackend: user.getIdTokenResult(true) [Forced Refresh]
    AuthBackend-->>FirebaseLib: JWT with claims: { admin: true }
    FirebaseLib-->>ClientUI: { user, isAdmin: true }

    ClientUI->>FirebaseLib: subscribeToFeedback()
    FirebaseLib->>FirestoreBackend: Query /feedback collection
    FirestoreBackend->>FirestoreBackend: Evaluates firestore.rules<br/>request.auth.token.admin == true
    FirestoreBackend-->>FirebaseLib: Grants Real-Time Snapshot Stream
    FirebaseLib-->>ClientUI: Populates Recharts Dashboard
```

---

## 5. Firestore Collection Schema & Boundaries

```
Firestore Root
├── /feedback/{feedbackId}
│   ├── rating: number (1..5)
│   ├── message: string (1..2000 chars)
│   ├── category: string (optional, max 50 chars)
│   ├── state: string (optional, max 50 chars)
│   ├── page: string (optional, max 50 chars)
│   ├── name: string (optional, max 100 chars)
│   ├── mobile: string (optional, max 20 chars)
│   ├── email: string (optional, max 100 chars)
│   ├── timestamp: string (optional, max 50 chars)
│   └── createdAt: timestamp (serverTimestamp)
│   [Access: Public Create | Admin-Only Read & Delete | No Update]
│
├── /analytics_events/{eventId}
│   ├── eventName: string (1..100 chars)
│   ├── details: string (optional, max 5000 chars)
│   ├── page: string (optional, max 100 chars)
│   ├── query: string (optional, max 200 chars)
│   ├── timestamp: string (optional, max 50 chars)
│   └── createdAt: timestamp (serverTimestamp)
│   [Access: Public Create | Admin-Only Read & Delete | No Update]
│
├── /search_logs/{logId}
│   ├── query: string (1..200 chars)
│   ├── resultsCount: number (0..10000)
│   ├── categoryFilter: string (optional, max 50 chars)
│   ├── timestamp: string (optional, max 50 chars)
│   └── createdAt: timestamp (serverTimestamp)
│   [Access: Public Create | Admin-Only Read & Delete | No Update]
│
└── /{document=**} [Catch-All Default Deny]
    [Access: Blocked unconditionally]
```

---

## 6. External Browser APIs & Integrations

1. **Web Speech API (`webkitSpeechRecognition`)**:
   Used in [`VoiceSearchModal.tsx`](./src/components/VoiceSearchModal.tsx) for hands-free voice input in English, Hindi, and Marathi.
2. **Web Storage API (`sessionStorage` and `localStorage`)**:
   Used for session demographics and persistent user preferences.
3. **HTML5 Canvas / jsPDF**:
   Used in [`pdfGenerator.ts`](./src/utils/pdfGenerator.ts) for client-side rendering and printing of scheme checklists.
4. **Google Firebase Services**:
   Authentication, Cloud Firestore, and Analytics endpoints via official Firebase Web SDK v12.
