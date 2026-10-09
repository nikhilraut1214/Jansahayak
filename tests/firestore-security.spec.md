# JanSahayak Firestore Security Rules Test Specification

## 1. Executive Summary & Authorization Model

This document specifies the authorization matrix, abuse prevention rules, and validation test scenarios for [`firestore.rules`](file:///d:/CEP/Jansahayak/firestore.rules).

The JanSahayak authorization model enforces **genuine administrator verification via Firebase Auth Custom Claims** (`request.auth.token.admin == true`). It strictly mitigates the authorization gap where any non-anonymous or ordinary signed-in user could previously read, update, or delete sensitive administrative records or public feedback.

---

## 2. Test Matrix: Personas vs. Operations

| Persona | Description | `request.auth` State |
| :--- | :--- | :--- |
| **P1: Unauthenticated** | Public visitor without session | `null` |
| **P2: Anonymous User** | Guest user with temporary auth token | `token.firebase.sign_in_provider == 'anonymous'` |
| **P3: Ordinary Authenticated** | Signed-in user (e.g. citizen / standard account) | `uid != null`, `admin` claim is missing or `false` |
| **P4: Authorized Administrator** | Official administrator with server-assigned claim | `uid != null`, non-anonymous, `token.admin == true` |

### Detailed Rules Matrix

| Collection | Operation | P1: Unauthenticated | P2: Anonymous | P3: Ordinary User | P4: Authorized Admin | Condition / Validation Enforced |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `/feedback/{id}` | **Create** | ✅ ALLOW | ✅ ALLOW | ✅ ALLOW | ✅ ALLOW | Valid schema (`rating` 1..5, bounded text strings, no extraneous fields) |
| `/feedback/{id}` | **Create (Abuse)** | ❌ DENY | ❌ DENY | ❌ DENY | ❌ DENY | Oversized payload, invalid rating, injected fields |
| `/feedback/{id}` | **Read (List/Get)** | ❌ DENY | ❌ DENY | ❌ DENY | ✅ ALLOW | Strict: citizen PII protected |
| `/feedback/{id}` | **Update** | ❌ DENY | ❌ DENY | ❌ DENY | ❌ DENY | Feedback records are immutable audit logs |
| `/feedback/{id}` | **Delete** | ❌ DENY | ❌ DENY | ❌ DENY | ✅ ALLOW | Requires verified `admin == true` custom claim |
| `/analytics_events/{id}` | **Create** | ✅ ALLOW | ✅ ALLOW | ✅ ALLOW | ✅ ALLOW | Valid event schema (`eventName` max 64 chars, etc.) |
| `/analytics_events/{id}` | **Read** | ❌ DENY | ❌ DENY | ❌ DENY | ✅ ALLOW | Telemetry hidden from public inspection |
| `/analytics_events/{id}` | **Update** | ❌ DENY | ❌ DENY | ❌ DENY | ❌ DENY | Append-only event log |
| `/analytics_events/{id}` | **Delete** | ❌ DENY | ❌ DENY | ❌ DENY | ✅ ALLOW | Requires verified `admin == true` custom claim |
| `/search_logs/{id}` | **Create** | ✅ ALLOW | ✅ ALLOW | ✅ ALLOW | ✅ ALLOW | Valid search log schema (`query` max 128 chars) |
| `/search_logs/{id}` | **Read** | ❌ DENY | ❌ DENY | ❌ DENY | ✅ ALLOW | Search history hidden from public inspection |
| `/search_logs/{id}` | **Update** | ❌ DENY | ❌ DENY | ❌ DENY | ❌ DENY | Append-only search audit |
| `/search_logs/{id}` | **Delete** | ❌ DENY | ❌ DENY | ❌ DENY | ✅ ALLOW | Requires verified `admin == true` custom claim |
| `/{document=**}` (All other) | **Any Operation** | ❌ DENY | ❌ DENY | ❌ DENY | ❌ DENY | Default-deny catch-all rule |

---

## 3. Test Cases (Formal Specification)

### Test Suite 1: Anonymous & Unauthenticated Citizen Access
* **TC-1.1**: Public visitor can submit valid feedback (`rating: 5`, `message: "Helpful app"`).
  - *Expected*: `PERMISSION_GRANTED`
* **TC-1.2**: Public visitor attempts to submit feedback with rating > 5 or < 1.
  - *Expected*: `PERMISSION_DENIED`
* **TC-1.3**: Public visitor attempts to submit feedback with unexpected fields (`role: 'admin'`).
  - *Expected*: `PERMISSION_DENIED` (`hasOnly` check fails)
* **TC-1.4**: Public visitor attempts to read `/feedback` collection.
  - *Expected*: `PERMISSION_DENIED`
* **TC-1.5**: Anonymous user attempts to read `/search_logs` or `/analytics_events`.
  - *Expected*: `PERMISSION_DENIED`
* **TC-1.6**: Anonymous user attempts to delete a feedback document.
  - *Expected*: `PERMISSION_DENIED`

### Test Suite 2: Ordinary Authenticated User (Authorization Barrier)
* **TC-2.1**: User signed in with email/password but WITHOUT `admin: true` claim attempts to read `/feedback`.
  - *Expected*: `PERMISSION_DENIED`
* **TC-2.2**: Ordinary authenticated user attempts to read `/analytics_events` or `/search_logs`.
  - *Expected*: `PERMISSION_DENIED`
* **TC-2.3**: Ordinary authenticated user attempts to delete `/feedback/{id}`.
  - *Expected*: `PERMISSION_DENIED`
* **TC-2.4**: Ordinary authenticated user attempts to modify an existing scheme or submit arbitrary documents to root.
  - *Expected*: `PERMISSION_DENIED`

### Test Suite 3: Authorized Administrator Access
* **TC-3.1**: User signed in with non-anonymous provider AND token with `{ admin: true }` reads `/feedback`.
  - *Expected*: `PERMISSION_GRANTED`
* **TC-3.2**: Authorized administrator deletes a feedback entry `/feedback/{id}`.
  - *Expected*: `PERMISSION_GRANTED`
* **TC-3.3**: Authorized administrator reads `/analytics_events` and `/search_logs`.
  - *Expected*: `PERMISSION_GRANTED`
* **TC-3.4**: Authorized administrator attempts to update an existing feedback document (`update`).
  - *Expected*: `PERMISSION_DENIED` (immutable schema preserved even for admins)

---

## 4. How to Execute with Firebase Local Emulator Suite

### Prerequisites
1. Install Java Development Kit (JDK 17 or higher) for the Firebase emulator.
2. Install `firebase-tools`:
   ```bash
   npm install -g firebase-tools
   ```
3. Initialize emulators in the project root:
   ```bash
   firebase init emulators
   # Select: Firestore Emulator (Port 8080) and Auth Emulator (Port 9099)
   ```

### Running Automated Test Suite
Install `@firebase/rules-unit-testing` as a dev dependency:
```bash
npm install --save-dev @firebase/rules-unit-testing
```
Run tests with the emulator:
```bash
firebase emulators:exec --only firestore,auth "node tests/run-rules-tests.mjs"
```

*Note: In the current offline/restricted local development environment, `firebase-tools` is not installed globally or locally. The test cases above define the contract against which `firestore.rules` was authored and reviewed.*
