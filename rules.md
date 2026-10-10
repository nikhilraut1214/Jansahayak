# JanSahayak (जनसहायक) — Engineering & Development Rules

**Status:** Mandatory & Non-Negotiable
**Applies to:** All Developers, Autonomous Agents, and Contributors

---

## 1. Functional Integrity
* **Rule 1.1 — Preserve Working Code**: Never rewrite, refactor, or delete working components, business logic, or utility functions unless an instruction explicitly requests it.
* **Rule 1.2 — Component & Dependency Reuse**: Reuse existing components (e.g. `SchemeCard`, `SearchInput`, `ToastContainer`) and existing dependencies (`lucide-react`, `recharts`, `jspdf`) rather than introducing redundant packages.
* **Rule 1.3 — Avoid Scope Creep**: Do not introduce unrequested features, backend frameworks, external APIs, or AI/LLM dependencies.

---

## 2. Security & Credentials
* **Rule 2.1 — Authorization Invariance**: Never weaken, disable, or bypass Firebase Authentication, server-side Custom Claims verification (`token.admin == true`), or Firestore Security Rules to make UI components work.
* **Rule 2.2 — No Client-Side Secrets**: Never embed private keys, service account JSON files, database passwords, or server-side API keys in client code or environment variables prefixed with `VITE_`.
* **Rule 2.3 — Secret Scanning**: Never print secret values, API keys, or tokens in terminal commands, log output, commit messages, or generated documentation.
* **Rule 2.4 — Cloud & Remote Isolation**: Do not deploy rules, modify cloud resources, change Firebase project IDs, or alter production settings without explicit approval.

---

## 3. Truthfulness & Data Integrity
* **Rule 3.1 — No Fabricated Government Endorsements**: Do not invent fake government seals, official ministerial endorsements, false approval badges, or misleading statutory claims.
* **Rule 3.2 — No Fabricated Testimonials or Metrics**: Do not add fake user reviews, fabricated ratings, artificial citizen quotes, or fake counter statistics.
* **Rule 3.3 — Scheme Accuracy**: Scheme details, eligibility limits, documents required, and benefit amounts must reflect verified government sources (e.g., `myScheme.gov.in`, official Ministry portals).

---

## 4. Multilingual & Accessibility Standards
* **Rule 4.1 — Tri-Lingual Parity**: All newly added or modified UI text, labels, buttons, placeholders, and error messages must be maintained across English (`en`), Hindi (`hi`), and Marathi (`mr`) in [`src/i18n/translations.ts`](./src/i18n/translations.ts).
* **Rule 4.2 — Text Expansion Tolerance**: UI layouts must accommodate regional text expansion (Hindi and Marathi strings are frequently 20–40% longer than English counterparts) without text clipping or layout overflow.
* **Rule 4.3 — Accessibility First**: Maintain WCAG 2.1 AA standards: high-contrast mode, dark theme support, keyboard navigability, semantic HTML, and dynamic font scaling.

---

## 5. Verification & Testing Discipline
* **Rule 5.1 — Compulsory Verification**: After any meaningful code change, execute both:
  ```powershell
  npm.cmd run lint    # tsc --noEmit
  npm.cmd run build   # vite build
  ```
* **Rule 5.2 — Honest Reporting**: Never claim a test, emulator suite, or verification passed unless it was actually executed and returned exit code 0. If tools are unavailable or an assertion fails, report it as `UNVERIFIED` or `FAILED`.
* **Rule 5.3 — Documentation Alignment**: When implementation, routes, or configurations change, immediately update the relevant documentation (`README.md`, `TRD.md`, `memory.md`, `CHANGELOG_ALIGNMENT.md`).

---

## 6. Git & Repository Etiquette
* **Rule 6.1 — No Destructive Git Commands**: Never execute `git reset --hard`, `git clean -f`, `git checkout .`, or force-push without explicit user authorization.
* **Rule 6.2 — Explicit Staging**: Always stage files explicitly by name (`git add path/to/file`). Avoid broad commands like `git add .` or `git add -A`.
* **Rule 6.3 — Preservation of Untracked Work**: Always preserve existing user changes and untracked configuration files (such as `.firebaserc` and `firebase.json`).
