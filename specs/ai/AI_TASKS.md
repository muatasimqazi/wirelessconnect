# AI_TASKS.md
> Open tasks, priority ordered. Update this file as tasks are completed or added.

---

## OPEN TASKS

### P2 — Feature Completion

| # | Task | Location | Details |
|---|------|---------|---------|
| 4 | WhatsApp link on product detail | `app/[locale]/(storefront)/product/[slug]/page.tsx` | PRD §8. Read `whatsapp_enabled` + `whatsapp_number` from `getStoreSettings()`. Render a "Chat on WhatsApp" link when enabled. |
| 5 | Plain-language tooltips on product detail | `app/[locale]/(storefront)/product/[slug]/page.tsx` | PRD §8. Add tooltip/popover for: Unlocked, Battery Health, Clean IMEI, Carrier, Condition. EN+ES via messages/. |
| 6 | Public warranty lookup page | `app/[locale]/(storefront)/warranty/page.tsx` | PRD §4. Allow customers to look up warranty status by email + order number without logging in. Guard: validate both fields match; never expose order by ID alone. |
| 13 | Replace hero "local" slide placeholder photos | `public/local-shop-storefront-0{1,2,3}.jpg` | Generated placeholder images (violet, labeled "PLACEHOLDER"). `01` is the main image (400x800), `02`/`03` are the side images (340x680). Replace with real storefront photos of the Shoreline shop, same filenames/dimensions — no code change needed. |
| 14 | Replace repairs slide 3rd (right) placeholder photo | `public/phone-repair-03.jpg` | Generated placeholder image (emerald, labeled "PLACEHOLDER", 340x680). Replace with a real repair-bench photo, same filename/dimensions — no code change needed. |

### P3 — Analytics

| # | Task | File | Details |
|---|------|------|---------|
| 7 | PostHog explicit events | Multiple client components | PostHog is installed (provider in `app/[locale]/layout.tsx`) but only captures page views. Add explicit `posthog.capture()` calls for: `product_viewed` (product detail), `add_to_cart`, `checkout_started`, `checkout_completed`, `search_query`, `filter_used`. |

### P4 — Phase 3 (Future)

| # | Task | Notes |
|---|------|-------|
| 8 | Loyalty program | Points, rewards, customer tiers. Not scoped. |
| 9 | Inventory reservation (timed holds) | Timed checkout hold before payment. Not scoped. |
| 10 | B2B / Wholesale portal | Wholesale accounts with bulk pricing. Not scoped. |
| 11 | International shipping | OFAC screening required. Not scoped. |
| 12 | RTL language support (Arabic) | Architectural groundwork exists (logical CSS props). Not scoped. |

---

## RECENTLY COMPLETED (for reference)

| Task | Completed |
|------|-----------|
| Hero pixel-fidelity pass vs. Figma `Hero.tsx` | ✅ June 2026 — Rebuilt `HeroCarousel` to match the Figma Make reference exactly: dot-grid background, per-slide accent glow, top progress bar (`animate-hero-progress`, 5.5s), eyebrow pill, two-tone headline (`headlineTop` + accent-colored `headlineAccent`), icon-led CTAs (navy primary w/ trailing arrow, outline secondary), inline trust-checkmark row, inline pill dot-nav, and a 3-image rotated phone composition (main + left + right) with floating price/rating and warranty badges. New `messages/*.json` keys per slide: `headlineTop`, `headlineAccent`, `trust[]`, `badge.{top,value}`, `pill` (replaces old single `headline`). Added `animate-hero-progress` keyframe to `tailwind.config.ts`. |
| Wire hero photography into HeroCarousel | ✅ June 2026 — `HeroCarousel` renders `next/image` per slide, 3 images each (main 400x800 + left/right 340x680): `/certief-preowned-phones-0{1,2,3}.jpg` (shop), `/phone-repair-0{1,2,3}.jpg` (repairs), `/device-trade-in-0{1,2,3}.jpg` (trade-in), `/local-shop-storefront-0{1,2,3}.jpg` (local). Repairs slide image 3 and all 3 local-slide images are generated placeholders (see open tasks #13, #14). |
| Homepage redesign (Figma Make reference) | ✅ June 2026 — new `HeroCarousel` (4 auto-advancing slides), expanded trust bar (6 items), restyled stats/categories/featured-products sections, new Repair Services section, new Local Advantage section (replaced old in-store section). New keys in `messages/en.json` + `messages/es.json` under `home.*`. |
| Homepage color-fidelity pass vs. Figma | ✅ June 2026 — Hero reworked from dark `bg-secondary` panel to Figma's actual white background with navy (`#0F172A`) headline/CTA and per-slide accent colors (`#00AEEF`/`#10B981`/`#F59E0B`/`#8B5CF6` for shop/repairs/trade-in/local). Added additive `wc-blue: #00AEEF` Tailwind token (does not change global `primary`/`secondary`/`accent`). Category, featured-products, and local-advantage sections aligned to `bg-surface` (`#F8FAFC`) per Figma. |
| Admin customer management page | ✅ June 2026 — `/admin/customers`, `getAdminCustomers()` lists `role='customer'` profiles with order count/total spent/last order date |
| Logo in header | ✅ June 2026 — `public/logo.png` + fixed intrinsic dims in `components/layout/header.tsx` |
| Abandoned carts admin page | ✅ June 2026 — `/admin/abandoned-carts`, `?hours=` filter, authenticated-only, mailto outreach |
| Customer filter on orders page | ✅ June 2026 — `?customer=email` on `/admin/orders`; customers page links use it; status pills preserve param; banner with clear link |
| IMEICHECK env vars all set | ✅ June 2026 — `IMEICHECK_SERVICE_ID=11`, `IMEICHECK_BLACKLIST_SERVICE_ID=5`, `IMEICHECK_APPLE_SERVICE_ID=1` in .env.local + Vercel |
| next-intl i18n fix (account namespace) | ✅ June 2026 — `account.profile.title` + `account.addresses.title` added to en.json+es.json; 4 call sites updated |
| Admin nav link in storefront header | ✅ June 2026 — shown for staff/admin; fetched via `getCurrentProfile()` in storefront layout; plain `<a href="/admin">` (no locale prefix) |
| Shipping confirmation email | ✅ June 2026 — `order-shipped.ts`, triggered on `→ shipped` |
| Pickup ready email | ✅ June 2026 — `order-pickup-ready.ts`, triggered on `→ ready_for_pickup` |
| Welcome email | ✅ June 2026 — `welcome.ts`, sent in `signUpAction()` |
| Design overhaul (Back Market-inspired) | ✅ June 2026 — white header, vertical cards, horizontal filter chips |
| Admin user management | ✅ June 2026 — `/admin/users`, role selector, admin-only |
| Wholesale batch intake | ✅ June 2026 — `/admin/intakes/wholesale`, Zebra scanner, API toggle |
| IMEI scanner integration | ✅ June 2026 — IMEICheck.com API, services 11+5+1, $0.03–0.04/device |
| Hold period trigger fix | ✅ June 2026 — migration 018, respects `hold_period_waived` flag |
| Footer reads from settings | ✅ June 2026 — async Server Component, hours auto-grouped |
| Content migration from wirelessconnectnw.com | ✅ June 2026 — stats, about, services, contact, warranty policy |
| Domain migration to wirelessconnectstore.com | ✅ June 2026 — Vercel, Resend, Supabase SMTP all updated |
| OG social images | ✅ — root 1200×630 + per-product dynamic |
| Product reviews | ✅ — star ratings on cards + detail, aggregateRating JSON-LD |
| Lighthouse ≥95 | ✅ — all pages |
