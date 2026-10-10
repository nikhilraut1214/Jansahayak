# JanSahayak (जनसहायक) — Design Guidelines & UI Standards

**Document Version:** 1.0.0
**Status:** Active Design Standard
**Design Philosophy:** Citizen-First, Accessible, Restrained, and Government-Grade Dignity

---

## 1. Visual Philosophy & Core Principles

JanSahayak is an e-Governance service portal intended for real Indian citizens, including rural families and first-generation digital users. The interface must inspire trust, clarity, and ease of use.

### Core Visual Tenets
* **Dignity & Restraint**: Clean, structured, content-driven layouts. Avoid flashy web trends that look like marketing startups.
* **Citizen-First Clarity**: High-legibility typography, clear visual hierarchy, direct Indian rupee formatting (₹), and prominent helpline badges.
* **Prohibited Visual Anti-Patterns**:
  * ❌ NO bubble/jelly gradients, neon glows, or bloated glassmorphism.
  * ❌ NO inflated pill buttons with excessive drop shadows.
  * ❌ NO emoji icons in place of semantic SVG icons (use `lucide-react`).
  * ❌ NO fake metrics (e.g. "Over 10 Million Users Served!"), fake user reviews, or artificial citizen ratings.
  * ❌ NO AI-generated stock imagery, uncanny valley human portraits, or fabricated government seals/emblems.
  * ❌ NO custom cursor effects, scroll-jacking, heavy parallax, or distraction-heavy background particle effects.
* **Asset Integrity**:
  * Only use real, verified public domain or project assets.
  * Do not invent broken SVG/image paths.
  * Reuse existing favicon assets (`/favicon.ico` or standard HTML favicon); do not reference non-existent asset files.
* **Stitch Design Integration Principle**:
  * Treat all Stitch screens and visual prototypes as **design references** until they are implemented and wired to genuine React 19 application state, business logic, and translations.

---

## 2. Typography & Multilingual Hierarchy

### Font Family
* **Primary Sans-Serif**: `Inter`, `system-ui`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `Roboto`, `sans-serif`.
* **Devanagari Support**: Must cleanly render complex Hindi and Marathi ligatures without clipping or unnatural line-height collisions (e.g. `Noto Sans Devanagari`, system font fallbacks).

### Dynamic Font Scaling (Accessibility)
The portal supports citizen font scaling via [`AppContext.tsx`](./src/context/AppContext.tsx):
* **Small (`sm`)**: Base size `0.875rem` (`14px`)
* **Medium (`md` — Default)**: Base size `1rem` (`16px`)
* **Large (`lg`)**: Base size `1.125rem` (`18px`)

### Regional Text Expansion Tolerance
Hindi and Marathi translations frequently occupy **20% to 40% more horizontal space** than English:
* All buttons, badges, table headers, and form labels must use flexible widths (`flex-wrap`, `min-w-0`, `truncate` only where safe with tooltip).
* Avoid fixed pixel widths (`w-[120px]`) on buttons containing translated text.

---

## 3. Color Tokens & Theme Palettes

### 3.1 Theme Modes
1. **Light Mode (Default)**:
   * Background: Slate 50 (`#f8fafc`)
   * Surface / Card: Pure White (`#ffffff`) with subtle border Slate 200 (`#e2e8f0`)
   * Primary Text: Slate 900 (`#0f172a`)
   * Secondary Text: Slate 600 (`#475569`)
2. **Dark Mode**:
   * Background: Slate 950 (`#020617`)
   * Surface / Card: Slate 900 (`#0f172a`) with subtle border Slate 800 (`#1e293b`)
   * Primary Text: Slate 100 (`#f1f5f9`)
   * Secondary Text: Slate 400 (`#94a3b8`)
3. **High-Contrast Mode (Accessibility)**:
   * Background: Pure Black (`#000000`)
   * Primary Text & Accent: Bright Yellow (`#fde047` / `#eab308`)
   * Borders: High-visibility solid yellow / white borders

### 3.2 Category Color Tokens
Category badges utilize semantic color tokens defined in [`src/utils/categoryColors.ts`](./src/utils/categoryColors.ts):
* **Agriculture**: Emerald (`bg-emerald-50 text-emerald-700 border-emerald-200`)
* **Health**: Rose (`bg-rose-50 text-rose-700 border-rose-200`)
* **Students**: Sky (`bg-sky-50 text-sky-700 border-sky-200`)
* **Women**: Purple (`bg-purple-50 text-purple-700 border-purple-200`)
* **Housing**: Amber (`bg-amber-50 text-amber-700 border-amber-200`)
* **Business**: Indigo (`bg-indigo-50 text-indigo-700 border-indigo-200`)
* **Employment**: Blue (`bg-blue-50 text-blue-700 border-blue-200`)
* **Senior Citizens**: Teal (`bg-teal-50 text-teal-700 border-teal-200`)

---

## 4. UI Components & Layout Guidelines

### Navigation
* **Desktop**: Header navbar with brand mark, primary tab links, language switcher (`EN | HI | MR`), theme switcher, and font scale controls.
* **Mobile (< 768px)**: Fixed bottom bar (`MobileBottomBar.tsx`) providing thumb-friendly access to Home, Schemes, Wizard, Saved, and Docs.

### Scheme Cards
* Clean card container with rounded corners (`rounded-2xl`), subtle border, category badge, scheme title, ministry tag, financial benefit highlight, and action buttons (`View Details`, `Save / Bookmark`).

### Modals & Dialogs
* Centered backdrop overlay with subtle blur (`backdrop-blur-sm`).
* Fixed header with title and close button (`X`).
* Scrollable body with structured sections: Benefits, Eligibility, Documents Checklist, Application Steps, and Official Application Link.

### Forms & Inputs
* Distinct focus rings (`focus:ring-2 focus:ring-emerald-500`).
* Explicit `<label>` elements associated with inputs for screen readers.
* Neutral, accessible placeholder text; no hardcoded demo credentials.

---

## 5. Compliance & Legal Pages (Privacy & Terms)

When implementing or updating dedicated **Privacy Policy** and **Terms of Service** views:
* **Reflect Actual Practices**: Must explicitly state that citizen demographic inputs and document checklists remain client-side in browser session storage (`sessionStorage`) and are not transmitted to backend servers.
* **No PII Collection**: State clearly that Aadhaar numbers, biometric data, and bank account credentials are never collected.
* **External Portal Disclaimers**: Disclose that JanSahayak is an informational guidance tool and that official applications take place on respective `.gov.in` portals.
* **Review Flag**: All legal and privacy copy must be flagged for institutional review before public deployment.
