# JanSahayak (जनसहायक) — Comprehensive Security Audit Report

**Audit Date:** October 10, 2026
**Auditor:** Senior Security Reviewer & Application Architect
**Repository:** `D:\CEP\Jansahayak`
**Target Branch:** `main`
**Current Commit:** `d054504`
**Audit Methodology:** Static Analysis, Dependency Supply-Chain Audit, Secret Scanning, Architecture Review, and Data Boundary Inspection.

---

## 1. Executive Summary

JanSahayak is an automated e-Governance Single-Page Application (SPA) built with React 19, TypeScript, Vite, and Firebase. A comprehensive, read-only security audit of the repository was conducted across environment variables, Git history, authentication and authorization, database rules, client-side injection sinks, security headers, password mechanics, and supply-chain dependencies.

### Key Positive Security Controls Confirmed:
1. **Server-Enforced Custom Claims Authorization**: Administrative access to Firestore telemetry and search audits is protected by cryptographically signed Firebase Auth Custom Claims (`request.auth.token.admin == true`) in [`firestore.rules`](./firestore.rules) and real-time token tracking (`onIdTokenChanged`) in [`src/lib/firebase.ts`](./src/lib/firebase.ts). Client state tampering cannot bypass backend database rules.
2. **Demographics Data Privacy**: Citizen profile attributes (income, age, landholding, social category, documents) are kept strictly local in `sessionStorage` and are purged when browser tabs close.
3. **Absence of Classic DOM XSS Sinks**: Zero occurrences of `dangerouslySetInnerHTML`, `innerHTML`, or `eval()` exist in application source code.
4. **No Server Secrets in Client Code**: No private keys, database passwords, or Google Cloud IAM service account credentials are embedded in tracked files or client bundles.

### Summary of Vulnerabilities Identified:
* **Critical**: 0
* **High**: 2 (Feedback PII cached across admin logout; Transitive `@grpc/grpc-js` vulnerability)
* **Medium**: 2 (Public Firestore write abuse/flooding; Missing HTTP security headers for hosting)
* **Low**: 2 (Unvalidated URL scheme in custom scheme manager; Unused packages in `package.json`)
* **Informational**: 2 (Historical commit credentials; Verification of live rules deployment)

---

## 2. Scope & Exact Commands Executed

The following targeted, read-only commands were executed during Phase 1:

| Command | Objective | Output / Status |
| :--- | :--- | :--- |
| `Get-ChildItem -Path . -Filter ".env*" -Force` | Search for local `.env` files | Found `.env.example` only; no local `.env` files on disk. |
| `Select-String -Pattern "import\.meta\.env\|process\.env"` | Search all environment variable access | Verified all client vars are non-secret Firebase identifiers. |
| `git grep -iE "BEGIN[ A-Z]*PRIVATE KEY\|service_account"` | Search for private keys and service account JSON | 0 matches across repository. |
| `git log -p \| Select-String -Pattern "AIza[0-9A-Za-z-_]{35}"` | Scan Git commit history for Google API keys | Found initial commit `b3adbf0` containing public client key. |
| `git grep -E "dangerouslySetInnerHTML\|innerHTML\|eval\(" src/` | Search for direct DOM XSS sinks in React code | 0 matches found. |
| `git grep -n 'target=' src/` | Verify `rel="noopener noreferrer"` on external links | Verified all external links carry `noopener noreferrer`. |
| `npm.cmd audit --omit=dev` | Production dependency vulnerability scan | 4 high-severity findings in `@grpc/grpc-js` (via `firebase`). |
| `npm.cmd audit` | Full dependency vulnerability scan (prod + dev) | Same 4 high-severity findings in `@grpc/grpc-js`. |
| `npm.cmd run lint` | TypeScript typecheck (`tsc --noEmit`) | Passed with 0 errors. |
| `npm.cmd run build` | Production bundle build (`vite build`) | Passed with 0 errors. |

---

## 3. Vulnerability Findings & Realistic Threat Analysis

### [HIGH] Finding H-01: Citizen Feedback PII Cached in `localStorage` Persists Across Admin Logout
* **File & Lines**: [`src/context/AppContext.tsx`](./src/context/AppContext.tsx#L328,L350-L354,L488-L490,L501), [`src/pages/AdminPanelPage.tsx`](./src/pages/AdminPanelPage.tsx#L173-L182)
* **Description**:
  When an authorized administrator logs into the Admin Portal, `subscribeToFeedback()` pulls remote citizen feedback records from Firestore. `AppContext.tsx` automatically mirrors these records to browser `localStorage` under `jansahayak_feedback`. A citizen submission can contain real contact PII (`name`, `mobile`, `email`, and message). When the administrator clicks "Sign Out", `handleLogout()` calls `adminSignOut()` but **does not purge `jansahayak_feedback` from `localStorage`**.
* **Impact**:
  If an administrator logs in from a shared computer, office terminal, or cyber cafe, citizen contact numbers, emails, and feedback messages remain readable in plaintext inside `localStorage` by any subsequent user or extension on that machine.
* **Remediation**:
  Purge `localStorage.removeItem('jansahayak_feedback')` and `localStorage.removeItem('jansahayak_search_logs')` upon admin sign-out, or keep remote feedback records in React memory state only rather than persistent `localStorage`.

---

### [HIGH] Finding H-02: High-Severity Transitive Vulnerabilities in `@grpc/grpc-js`
* **File**: `package-lock.json` (`node_modules/@grpc/grpc-js` version `1.9.16`)
* **Advisories**:
  * [GHSA-m9gg-hp2v-232j](https://github.com/advisories/GHSA-m9gg-hp2v-232j): `@grpc/grpc-js` `getAuthContext` can treat unauthorized certificates as authorized in certain configurations.
  * [GHSA-f596-whhp-79r4](https://github.com/advisories/GHSA-f596-whhp-79r4): Method handlers transmit error messages to client in status messages.
* **Context**:
  `@grpc/grpc-js` is pulled transitively by `@firebase/firestore` (which is part of the `firebase` package). In browser environments, Firebase Firestore utilizes WebChannel/WebSocket/fetch transports rather than native gRPC sockets. However, automated scanners and server-side runtimes flag this package.
* **Hazard Warning**: Running `npm audit fix --force` attempts to downgrade `firebase` to `9.14.0`, which would break the React 19 application.
* **Remediation**:
  Add an `overrides` block in `package.json` to force `@grpc/grpc-js` to `^1.13.6` or higher, or update `firebase` when an updated upstream bundle is published.

---

### [MEDIUM] Finding M-01: Potential Denial-of-Wallet & Flooding on Public Firestore Writes
* **File & Lines**: [`firestore.rules`](./firestore.rules#L35-L58,L70-L82,L91-L104), [`src/lib/firebase.ts`](./src/lib/firebase.ts#L163-L175,L191-L209,L226-L234)
* **Description**:
  The Firestore collections `/feedback`, `/analytics_events`, and `/search_logs` permit public creation (`allow create: if ...`) without authentication. While field types, unknown keys, and maximum character lengths are strictly bounded by rules, there is no platform-level rate limit per IP address or client origin.
* **Impact**:
  A malicious actor using an automated HTTP script could spam document creations, exhausting monthly Firestore free quotas (20,000 writes/day) and incurring cloud billing costs or degrading service for citizens.
* **Remediation**:
  1. Enable **Firebase App Check** (attesting that requests originate from the authentic web application using reCAPTCHA Enterprise).
  2. For high-assurance defense, route public feedback and search logging through a Firebase Cloud Function with IP-based rate limiting (`express-rate-limit` or Redis token bucket).

---

### [MEDIUM] Finding M-02: Missing HTTP Security Headers Configuration for Hosting
* **File**: [`firebase.json`](./firebase.json)
* **Description**:
  The repository's `firebase.json` defines Firestore rules but lacks a `"hosting"` configuration block specifying HTTP security response headers.
* **Impact**:
  When deployed to Firebase Hosting, the application is served without standard defense-in-depth headers:
  * Missing `Content-Security-Policy` (CSP)
  * Missing `X-Content-Type-Options: nosniff`
  * Missing `X-Frame-Options: DENY` (clickjacking risk)
  * Missing `Referrer-Policy: strict-origin-when-cross-origin`
  * Missing `Permissions-Policy: camera=(), microphone=(self)`
* **Remediation**:
  Add a standard `"hosting"` configuration in `firebase.json` containing the recommended security headers.

---

### [LOW] Finding L-01: Missing URL Scheme Validation in Custom Scheme Management Form
* **File & Lines**: [`src/pages/AdminPanelPage.tsx`](./src/pages/AdminPanelPage.tsx#L371-L372)
* **Description**:
  In the Admin Portal modal for adding or editing custom schemes, `formWebsite` and `formApplyLink` are saved into scheme records without validating that the string begins with `https://` or `http://`.
* **Impact**:
  If a compromised admin account or malicious local state injection enters a `javascript:...` URI, clicking "Apply Online" or "Official Portal" could execute arbitrary JavaScript.
* **Remediation**:
  Add validation ensuring external links match `^https?://[^\s/$.?#].[^\s]*$` before saving.

---

### [LOW] Finding L-02: Unused Production Dependencies Declared in `package.json`
* **File & Lines**: [`package.json`](./package.json#L16,L17,L28)
* **Description**:
  `express`, `dotenv`, and `@types/express` are declared as project dependencies. Static code analysis proves that no source file in the project imports or executes them.
* **Impact**:
  Unused dependencies needlessly expand the supply chain, increase `node_modules` attack surface, and trigger false-positive backend audit alerts.
* **Remediation**:
  Remove `express`, `dotenv`, and `@types/express` using `npm uninstall express dotenv @types/express`.

---

### [INFORMATIONAL] Finding I-01: Historical Commit Footprint in Git History
* **File & Commit**: Commit `b3adbf0` (`firebase-applet-config.json` and `AdminPanelPage.tsx`)
* **Description**:
  The initial commit contains the earlier demo password and public Firebase browser API key (`AIzaSy...465w`). The active codebase was hardened in commits `3a88d49` and `79c589a`, but Git history preserves the earlier commit.
* **Remediation**:
  1. In Google Cloud Console, ensure the Firebase Web API key is restricted by HTTP Referrer to your approved domains and limited in API scope to Firebase Authentication and Cloud Firestore.
  2. Verify that any real user account has a unique, strong password.

---

### [INFORMATIONAL] Finding I-02: Verification of Live Firestore Rules Deployment
* **File**: [`firestore.rules`](./firestore.rules)
* **Description**:
  The repository contains a hardened `firestore.rules` file enforcing custom claims. However, rules on disk only take effect if they have been deployed to the live Firebase project.
* **Remediation**:
  Verify in the Firebase Console (Firestore -> Rules) that the live rule matches the repository's `firestore.rules`.

---

## 4. Prioritized Remediation Plan (Phase 2 Proposals)

Remediation is planned in three safe, reviewable groups:

| Group | Target Findings | Scope of Changes | Risk / Compatibility |
| :--- | :--- | :--- | :--- |
| **Group 1 (Storage & PII Hygiene)** | **Finding H-01** | Update [`AppContext.tsx`](./src/context/AppContext.tsx) and [`AdminPanelPage.tsx`](./src/pages/AdminPanelPage.tsx) to ensure `jansahayak_feedback` and `jansahayak_search_logs` are purged from `localStorage` upon admin sign-out and not persisted unencrypted across sessions. | Low risk. Prevents PII leakage on shared devices without affecting admin features. |
| **Group 2 (Form Validation & URL Sanitization)** | **Finding L-01** | Add protocol validation in [`AdminPanelPage.tsx`](./src/pages/AdminPanelPage.tsx) ensuring custom scheme links must start with `http://` or `https://`. | Low risk. Prevents `javascript:` link injection. |
| **Group 3 (Dependency & Supply-Chain Cleanup)** | **Finding H-02, L-02** | 1. Remove unused `express`, `dotenv`, and `@types/express` from `package.json`.<br>2. Add an `overrides` entry in `package.json` for `"@grpc/grpc-js": "^1.13.6"` to resolve the high-severity advisory without breaking the modular Firebase SDK. | Medium risk. Requires verifying bundle build and lockfile integrity. |

*(Note: Adding HTTP security headers to `firebase.json` for Finding M-02 requires explicit user approval since `firebase.json` is currently an untracked file).*

---

## 5. Residual Risks & Production Requirements

1. **Absolute Security Disclaimer**: No web application can be guaranteed completely secure. Residual risks include physical device access, compromised administrator endpoint devices, and zero-day vulnerabilities in third-party dependencies.
2. **Platform Rate Limiting**: Client-side code and Firestore security rules cannot prevent automated denial-of-wallet write floods without Firebase App Check or a rate-limited Cloud Functions proxy.
3. **Google Cloud Key Restriction**: The Firebase browser API key must be restricted via HTTP referrers in Google Cloud Console to prevent unauthorized embedding on external domains.

---

**STATUS: Phase 1 Read-Only Audit Complete. Awaiting user review and authorization before proceeding with Phase 2 remediation.**
