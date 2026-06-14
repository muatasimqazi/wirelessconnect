# AI_TASKS.md
> Open tasks, priority ordered. Update this file as tasks are completed or added.

---

## OPEN TASKS

### P1 — High Impact / Quick

| # | Task | File | Notes |
|---|------|------|-------|
| 2 | Add Vercel env vars | Vercel dashboard | Add: `IMEICHECK_APPLE_SERVICE_ID=1`, `IMEICHECK_BLACKLIST_SERVICE_ID=5`. Redeploy after. |

### P2 — Feature Completion

| # | Task | Location | Details |
|---|------|---------|---------|
| 3 | Homepage hero slider | `app/[locale]/(storefront)/page.tsx` | Current hero is static dark section (`bg-secondary`). Replace with an image slider component. Hero images deferred — placeholder until then. |
| 4 | WhatsApp link on product detail | `app/[locale]/(storefront)/product/[slug]/page.tsx` | PRD §8. Read `whatsapp_enabled` + `whatsapp_number` from `getStoreSettings()`. Render a "Chat on WhatsApp" link when enabled. |
| 5 | Plain-language tooltips on product detail | `app/[locale]/(storefront)/product/[slug]/page.tsx` | PRD §8. Add tooltip/popover for: Unlocked, Battery Health, Clean IMEI, Carrier, Condition. EN+ES via messages/. |
| 6 | Public warranty lookup page | `app/[locale]/(storefront)/warranty/page.tsx` | PRD §4. Allow customers to look up warranty status by email + order number without logging in. Guard: validate both fields match; never expose order by ID alone. |

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
| Logo in header | ✅ June 2026 — `public/logo.png` + fixed intrinsic dims in `components/layout/header.tsx` |
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
