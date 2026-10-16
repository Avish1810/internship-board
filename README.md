# InternBoard – Responsive Internship Listing Interface

A fully accessible, responsive internship listing page built with **plain HTML, CSS, and JavaScript** — no libraries or frameworks.

## 🚀 Live Demo

> _Deploy to GitHub Pages / Netlify / Vercel and paste the link here._

---

## ✅ Features

### 1. Page Structure & Reusable Card Data
- All 12 internship listings live in [`data.js`](data.js) as a plain JS array — easy to add, remove, or edit entries without touching any UI code.
- Page uses semantic HTML5 landmarks: `<header>`, `<main>`, `<footer>`, `<article>`, `<section>`.

### 2. Search & Domain Filters with States
| Feature | Detail |
|---|---|
| **Live Search** | Debounced 250 ms — searches title, company, description, tags, location |
| **Domain Filter Pills** | Dynamically generated from data; arrow-key navigable |
| **Sort** | By deadline, stipend (high/low), company A–Z |
| **Empty State** | Friendly message + "Clear Filters" button when nothing matches |
| **Error State** | Shown on simulated load failure; "Retry" button reloads |
| **Loading State** | Shimmer skeleton cards while data "loads" |

### 3. Accessibility & Responsive Layout
| Feature | Implementation |
|---|---|
| **Skip Link** | "Skip to main content" visible on keyboard focus |
| **Form Labels** | Every input has a visible `<label>` |
| **ARIA** | `aria-live`, `aria-pressed`, `aria-label`, `aria-controls`, `role="list"` |
| **Keyboard Nav** | Arrow keys navigate filter pills; Tab/Enter/Space everywhere |
| **Focus Indicators** | High-contrast `outline` on all interactive elements |
| **Screen Reader** | Live region announces result count on every filter change |
| **Responsive Grid** | 1 col (mobile) → 2 col (≥600 px) → 3 col (≥1024 px) |
| **Fluid Typography** | `clamp()` for hero heading |

---

## 📁 File Structure

```
internship-board/
├── index.html   ← Semantic HTML shell, ARIA attributes
├── style.css    ← Custom properties, responsive grid, animations
├── data.js      ← 12 internship objects + domain list
└── app.js       ← Render, search, filter, sort, states, a11y
```

---

## 🛠 How to Run Locally

```bash
# No build step needed — just open index.html in any browser
# Or serve with a local dev server:
npx serve .
# or
python -m http.server 8000
```

---

## 🧠 Short Explanation

I structured the project by separating concerns across three files. `data.js` acts as the "database" — a plain array of internship objects that drives everything. `app.js` reads from that array, applies the current filter/search/sort state, and re-renders the card grid on every interaction. `style.css` uses CSS custom properties and a CSS Grid layout with no JavaScript involved in responsiveness.

Accessibility was built in from the start, not bolted on: every interactive element has a visible label, focus styles are always visible, ARIA live regions announce filter results to screen readers, and the domain filter pills support full arrow-key navigation. The empty and error states are rendered into the same grid container so they're naturally announced by the live region.
