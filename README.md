# Hoàng Sâm BĐS — Real-Estate Listings Site

> Production real-estate site for **Hoàng Sâm BĐS** — Vietnamese-market
> property listings with filters, an admin posting flow, multi-language
> UI, and a Gemini-backed assistant that answers questions about each
> property in context.

**🌐 Live:** https://hoangsam-bds.web.app

---

## What you're looking at

Most of the source — HTML, CSS, the entire `src/` module tree, the
Google Apps Script email handler, the Firebase config — is published in
this repo so you can read how it's built.

**🔒 One file is withheld** — [`app.js`](./app.js). It's the controller
that wires everything together (listings, admin, lightbox, AI overlay,
lead form). The repo contains a header-only stub describing what the
real file does. Without it, the modules under `src/` are inert; with
it, the site behaves as on the live deploy.

If you're evaluating this for a hiring decision and want to read the
omitted file, contact: **nhhuy130@gmail.com**.

---

> **⚠️ License**: All Rights Reserved — see [`LICENSE`](./LICENSE). No
> copy, redistribution, embedding, or derivative work. Quoting short
> snippets in reviews with attribution is fine.

---

## Stack

- **HTML / CSS / vanilla JS** — handcrafted, no framework, no build step
- **Firebase**: Hosting · Firestore · Auth · Storage · Cloud Functions
- **Google Apps Script** for the email-intake endpoint
  ([`gas/email-api.gs`](./gas/email-api.gs))
- **Gemini API** (proxied via a Cloud Function) for the in-app
  real-estate assistant
- **i18n**: Vietnamese, English, Chinese, Russian
- **Custom CSS architecture** — `styles.css` (~3.8k lines, hand-rolled
  design tokens, zero framework)
- **Lighthouse + GAS health-check workflows** running in CI on the
  private source repo

---

## File map

```
.
├── README.md              ← this file
├── LICENSE                ← All Rights Reserved
├── NOTICE
├── design.md              ← design system: tokens, layout, typography
├── KNOWN_ISSUES.md        ← engineering rigor — what we know is brittle
├── firebase.json          ← Hosting rewrites, headers, caching rules
├── index.html             ← entry markup (815 lines)
├── styles.css             ← design system in CSS (3.8k lines)
├── app.js                 ← 🔒 withheld controller — see stub
├── gas/
│   └── email-api.gs       ← Google Apps Script: email + lead intake
└── src/                   ← the modules `app.js` imports
    ├── ai-agents.js       ← system prompts for the AI assistant
    ├── ai-client.js       ← Cloud Function client
    ├── ai-ui.js           ← chat overlay UI
    ├── auth.js            ← Firebase Auth wrapper
    ├── auto-translate.js  ← runtime translation helpers
    ├── cinematic-fx.js    ← page transitions, vignette, grain
    ├── content-filter.js  ← admin content safety guard
    ├── firebase-config.js ← Firebase web config (public by design)
    ├── i18n.js            ← translation table (vi / en / zh / ru)
    ├── seed.js            ← dev seed data
    ├── store.js           ← listings/comments data layer
    ├── ui-render.js       ← rendering library (cards, modals, toasts)
    ├── utils.js           ← compress, debounce, parsePrice, ...
    └── validator.js       ← form validation
```

---

## What's on the live site

- **Listings grid** — properties with photos, prices, neighborhoods,
  filterable by type / district / price band
- **Property detail pages** — gallery, map, lightbox, comments thread
- **Admin posting flow** — image compression to ~150KB per photo,
  validation, multi-image upload
- **AI assistant** — "ask anything about a listing" chat, prompt is
  contextually loaded from the listing being viewed
- **Lead intake form** — leads stored via a Cloud Function for the
  agent to follow up
- **Multi-language UI** — full i18n across vi / en / zh / ru, with
  auto-translation fallback for free-form fields

---

## Why some code is withheld

Hoàng Sâm BĐS is a live commercial site. The controller (`app.js`) is
the most reusable part — withholding it stops trivial copy of the site
as a whole, while the modules under `src/` remain readable so the
engineering work is reviewable.

Firebase web config (`src/firebase-config.js`) is intentionally public:
Firebase security is enforced by Firestore Rules, not by key secrecy
(this is documented at the top of the file).

---

Built and maintained by **Marshall Nguyễn Hoàng Huy**
([@mrdeathisreal](https://github.com/mrdeathisreal)).
