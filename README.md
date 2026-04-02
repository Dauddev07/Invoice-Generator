# Invoice Studio

A **production-style invoice generator** built with React and Vite. Create invoices with a live preview, multiple templates, local persistence, and PDF/PNG export—no backend required.

![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)

## Features

- **Live preview** — Updates as you type; optional **edit-in-preview** for quick changes.
- **Line items** — Add, remove, and edit unlimited rows; **drag-and-drop** reordering.
- **Totals** — Automatic **subtotal**, **tax %**, **discount** (percent or fixed), and **total**.
- **Templates** — Minimal, Corporate, Modern, and Creative; switch instantly.
- **Currencies** — USD, PKR, EUR, GBP with locale-aware formatting (`Intl`).
- **Status** — Draft, Pending, Paid with clear badges.
- **Company logo** — Upload via click or **drag-and-drop** (stored as data URL).
- **Multiple invoices** — Create, duplicate, switch, and delete; **auto invoice numbers** (`INV-0001`, …).
- **Persistence** — **Zustand** + **localStorage** (theme, all invoices, counter).
- **Export** — **PDF** and **PNG** via `html2canvas` + `jsPDF` (lazy-loaded for smaller initial bundle).
- **Theme** — Light, dark, or system; respects `prefers-color-scheme`.
- **Shortcuts** — `⌘/Ctrl + S` save toast, `⌘/Ctrl + ⇧ + A` add line item.
- **UX** — Responsive layout (mobile Editor / Preview tabs), skeleton loading, toasts, modals, reduced-motion support.

> **Note:** The “Share link” flow uses a **demo URL** only; nothing is uploaded to a server.

## Tech stack

| Area    | Choice                                     |
| ------- | ------------------------------------------ |
| UI      | React 19, CSS (design tokens + components) |
| Tooling | Vite 8, ESLint 9                           |
| State   | Zustand (`persist` → localStorage)         |
| DnD     | @dnd-kit (core, sortable, utilities)       |
| Export  | html2canvas, jsPDF                         |

## Getting started

### Prerequisites

- **Node.js** 20+ (recommended)

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

### Production build

```bash
npm run build
```

Output is written to `dist/`.

### Preview production build locally

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Project structure

```
src/
├── components/
│   ├── invoice/       # Invoice document, line items, logo dropzone, preview fields
│   └── ui/            # Button, Input, Select, Card, Modal, Table, Badge, Skeleton
├── pages/
│   └── InvoiceDashboard.jsx
├── store/
│   └── useInvoiceStore.js
├── utils/             # calculations, constants, export (PDF/PNG), formatCurrency, share link
├── App.jsx
├── main.jsx
└── index.css
```

## Deploying to Vercel

1. Push the repo to GitHub (or GitLab / Bitbucket).
2. In [Vercel](https://vercel.com), **Import** the repository.
3. Vercel detects **Vite**; defaults are **`npm run build`** and output **`dist`**.
4. Deploy — no environment variables are required for the static app.

This repo includes a [`vercel.json`](./vercel.json) so SPA-style routing (if you add a router later) still serves `index.html` for client routes.

## Browser support

Modern evergreen browsers (Chrome, Firefox, Safari, Edge). Export depends on canvas and download APIs; very strict privacy modes may block downloads.

## License

MIT — use freely in portfolios and products.

---

Built with **Invoice Studio** — professional billing in the browser.
