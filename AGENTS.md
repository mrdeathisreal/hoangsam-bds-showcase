# AGENTS.md

Hướng dẫn cho AI coding agent (Claude Code, Cursor, Codex) khi làm việc trên project này.

## Project

**Hoàng Sâm BĐS** — website bất động sản chính chủ TP.HCM. Live: https://hoangsam-bds.web.app

Brand voice: minh bạch pháp lý, hình ảnh thật, có AI tư vấn viên 24/7 nói VI / EN / 繁體中文.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | HTML + CSS + Vanilla JS (ES modules, **không bundler**) |
| Backend | Firebase Firestore + Auth + Storage + Hosting |
| AI Layer | Gemini 2.5 Flash qua Google Apps Script proxy |
| Email API | Google Apps Script Web App (Gmail) |
| CI/CD | GitHub Actions (4 pipelines: deploy + health-check + Lighthouse + GAS monitoring) |
| Linting | Stylelint cho `styles.css` |

## File Structure

```
hoangsam-bds/
├── index.html                 ← Entry point duy nhất (SPA)
├── app.js                     ← Controller — điều phối mọi module (WITHHELD trong showcase)
├── styles.css                 ← Global styles + design tokens
├── design.md                  ← Design system (tokens, WCAG 2.2 AA)
├── project_structure.md       ← Architecture rationale
├── KNOWN_ISSUES.md            ← Gemini quota + multi-key fallback plan
├── security.md                ← Security model
├── setup_mac.md               ← Local setup guide
├── fix9_notes.md              ← Recent fix notes
│
├── src/                       ← Modules (single-responsibility per file)
│   ├── firebase-config.js     ← khởi tạo app, export { app, db, auth, storage }
│   ├── auth.js                ← signIn / signOut / onAuthChange / isAdmin
│   ├── store.js               ← CRUD + onSnapshot + client-side filter
│   ├── ui-render.js           ← renderCards / renderSkeleton / renderEmpty / toast
│   ├── validator.js           ← validateListing / sanitize / rules
│   ├── utils.js               ← price parser, slug, escapeHtml, debounce
│   ├── ai-client.js           ← Gemini API client (qua GAS proxy)
│   ├── ai-agents.js           ← 7 AI agent prompt definitions
│   ├── ai-ui.js               ← Chat UI rendering
│   ├── i18n.js                ← Translation system (VI / EN / 繁體中文)
│   ├── auto-translate.js      ← Auto translation helpers
│   ├── content-filter.js      ← Content moderation
│   ├── cinematic-fx.js        ← Visual effects
│   └── seed.js                ← Demo data seeder
│
├── gas/
│   └── email-api.gs           ← Google Apps Script: Gmail proxy + Gemini proxy + rate limit
│
├── rules/
│   ├── firestore.rules
│   ├── storage.rules
│   └── setup_security.md
│
├── .github/                   ← 4 GitHub Actions workflows
└── package.json               ← Dev tooling only (stylelint, python http.server)
```

## Repo Pattern — PRIVATE source + PUBLIC showcase

- **Private**: `mrdeathisreal/hoangsam-bds` (this repo)
- **Public**: `mrdeathisreal/hoangsam-bds-showcase` (auto-synced, `app.js` WITHHELD)
- License: **All Rights Reserved**

## Commands

```bash
# Local server (KHÔNG dùng file://, ES modules cần HTTP)
python3 -m http.server 8787         # hoặc: npm run serve
# rồi mở http://localhost:8787

# Lint CSS
npm run lint:css                    # check
npm run lint:css:fix                # auto-fix

# Deploy
git push origin main                # tự deploy qua firebase-deploy.yml
firebase deploy --only hosting      # manual
firebase deploy --only firestore:rules
```

## Design System (theo `design.md`)

### Tokens — KHÔNG hardcode hex, dùng CSS variables

**Typography**: `--fs-xs` (13px) → `--fs-xl` (42px). Body `--fs-md` 16px (iOS-safe).

**Spacing**: `--sp-1` đến `--sp-12` (scale 4/8/12/16/20/24/32/40/48).

**Radius**: `--r-sm` (6px) form inputs → `--r-xl` (22px) modals → `--r-full` (999px) pills/avatars.

**Motion**: `--t-instant` (100ms) → `--t-normal` (550ms).

**Colors (light-only, brand teal)**:
- `--brand` `#0f766e` — primary CTA
- `--accent` `#f59e0b` — warm CTA (call/booking)
- `--surface` `#ffffff` — card/modal
- `--surface-alt` `#f1f5f9` — filled buttons
- `--bg` `#f8fafc` — page background
- `--ink` `#0f172a` — primary text (contrast 17:1 AAA)
- `--ink-soft` `#475569` — secondary (7.9:1 AAA)
- `--ink-mute` `#94a3b8` — placeholder (4.6:1 AA)
- `--text-link` `#0068bd` — inline links (7.8:1 AAA)

**Accessibility**: WCAG 2.2 AA mandatory. Contrast pre-validated trong tokens.

## Conventions

### Imports
- `app.js` ở **root** (không nằm trong `/src`) vì là entry point của `<script type="module">`
- Module imports: `import { db } from './src/firebase-config.js'`
- Mỗi file `/src/*.js` có **một trách nhiệm duy nhất** (Single Responsibility)

### Firestore data
- Collection chính: `listings`
- Realtime: dùng `onSnapshot`, không poll
- Filter: **client-side** (data nhỏ, không paginate trên server)

### AI Chat — Gemini quota
- Free tier: **15 req/phút + 200 req/ngày** cho `gemini-2.0-flash`
- Khi hit limit, GAS tự trả message friendly tiếng Việt
- Quota reset 00:00 PT (= **15:00 VN**)
- **Plan**: hoặc upgrade Tier 1 ($0.10/1M input + $0.40/1M output) hoặc multi-key fallback trong `gas/email-api.gs`

### i18n
- 3 ngôn ngữ: VI / EN / 繁體中文 (zh-TW cho khách Đài Loan)
- VI canonical cho data (CSV interop)
- UI translate labels qua `src/i18n.js`

### CI/CD pipelines (`.github/workflows/`)
- `firebase-deploy.yml` — validate → deploy → health-check trên push main
- `lighthouse.yml` — performance audit hàng tuần
- `gas-health.yml` — test Gemini end-to-end mỗi sáng 7h VN

## Gotchas

1. **`app.js` không có trong showcase repo** — sửa logic chính phải trong private repo
2. **Gemini quota** (xem KNOWN_ISSUES.md):
   - Hit 200/day → site vẫn hoạt động nhưng chat trả friendly message
   - Khi sẵn sàng scale: upgrade Tier 1 hoặc add multi-key
3. **GAS proxy là single point of failure** — nếu Google Apps Script down, cả chat + email die
4. **Firestore rules** trong `rules/firestore.rules` — đừng quên deploy khi đổi
5. **Không có bundler** — ES modules native browser, mọi import phải có `.js` extension đầy đủ
6. **Photo storage**: Firebase Storage, không phải Firestore
7. **Auth roles**: admin / CTV (cộng tác viên) / khách — check `auth.js` cho logic isAdmin
8. **Brand color**: `#0f766e` (teal) — KHÔNG đổi sang xanh khác, đây là brand recognition
9. **WCAG 2.2 AA mandatory** — mọi component mới phải pass contrast check
10. **Mobile-first**: design tokens đã tested cho responsive, KHÔNG override sizing arbitrary

## Khi user yêu cầu thêm tính năng

1. Đọc `design.md` để follow tokens (KHÔNG hardcode hex)
2. Module mới đặt trong `src/`, single-responsibility, default export hoặc named export rõ ràng
3. Mọi text UI phải có 3 bản dịch trong `src/i18n.js`
4. Firestore query: dùng `onSnapshot` không `getDocs` (real-time UX)
5. Test local: `npm run serve` → http://localhost:8787
6. Lint trước commit: `npm run lint:css`
7. Update `KNOWN_ISSUES.md` nếu phát hiện edge case
8. Commit message tiếng Anh, ngắn gọn

## Why this project matters

Đây là business chính của Marshall (BĐS Hoàng Sâm). Site phải:
- Look professional, trust-worthy (BĐS = high-stakes purchase)
- Multilingual cho khách Đài Loan tại VN
- AI chat 24/7 vì Marshall không thể trực điện thoại mọi lúc
- $0/month cost target cho đến khi viral traffic
