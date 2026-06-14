# AI_CONTEXT.md
> Master index for this project. Last updated: June 2026.
> Reader is a coding agent — no marketing language, no prose padding.

---

## INDEX

| File | Contents |
|------|----------|
| AI_CONTEXT.md | This file: project overview, MVP status, decisions, constraints, bugs |
| AI_ARCHITECTURE.md | Tech stack, folder structure, data flow, auth rules, business rules, workflows |
| AI_SCHEMA.md | All DB enums, tables, views, indexes, constraints |
| AI_API.md | Server actions, Stripe webhook, external API contracts |
| AI_TASKS.md | Open tasks (priority ordered) |

---

## PROJECT

Wireless Connect — full-stack e-commerce platform for a physical phone/repair shop in Shoreline, WA (est. 2010). Sells certified pre-owned phones online with local pickup or US-wide shipping. Also offers in-store repairs, trade-in estimates, and accessories. Staff manages device intake with RCW 19.60 (WA secondhand dealer law) compliance enforced at DB level. Domain: wirelessconnectstore.com.

---

## MVP STATUS

| Area | Status |
|------|--------|
| Product catalog (browse/search/filter) | ✅ |
| Shopping cart (persist, merge on login) | ✅ |
| Checkout + Stripe Tax + webhook | ✅ live keys |
| Customer accounts (orders, addresses, warranty) | ✅ |
| Admin dashboard (products, orders, intakes, warranties, coupons, settings) | ✅ |
| Device intake — individual (RCW 19.60) | ✅ |
| Device intake — wholesale batch | ✅ |
| IMEI scanner (IMEICheck.com + Zebra) | ✅ |
| Publishing gates (15-gate server validation) | ✅ |
| Hold period enforcement (DB trigger + server gate) | ✅ migration 018 |
| Transactional emails (Resend, EN+ES, 7 templates) | ✅ |
| Trade-in storefront + admin | ✅ |
| Repairs storefront + admin | ✅ |
| Product reviews + admin moderation | ✅ |
| Admin user management (/admin/users) | ✅ |
| OG social images (root + per-product, 1200×630) | ✅ |
| Legal pages (Terms, Privacy, Returns, Warranty, Shipping — EN+ES) | ✅ |
| SEO (sitemap, robots, JSON-LD, hreflang, aggregateRating) | ✅ |
| Lighthouse ≥95 | ✅ |
| Domain wirelessconnectstore.com live on Vercel | ✅ |
| Footer reads store settings dynamically | ✅ |
| Design overhaul (Back Market-inspired white/minimal) | ✅ |
| Homepage hero slider | ⏳ planned |
| Logo in header | ⏳ drop PNG at public/logo.png |
| WhatsApp link on product detail | ⏳ not started |
| Plain-language tooltips on product detail | ⏳ not started |
| Public warranty lookup (/warranty no-auth) | ⏳ not started |
| PostHog explicit event tracking | ⏳ not started |
| Loyalty program | ❌ Phase 3 |
| Inventory reservation (timed holds) | ❌ Phase 3 |

---

## KNOWN DECISIONS

> Must not be re-debated in future sessions.

| Decision | Rejected Alternative |
|----------|---------------------|
| `public_products` view mandatory for all storefront product queries | Direct base table |
| `customer_order_items` view mandatory for customer order detail | Direct order_items |
| No CHECK constraint on locale columns | CHECK constraint |
| Stripe webhook is inventory source of truth — decrement only there | Decrement at session creation |
| Seller ID encrypted AES-256-GCM, never hashed | Hashing |
| Hold period enforced at DB trigger level as final gate | App-only validation |
| `guest_access_token` UUID in order URLs (not order ID or number) | Order ID in URL |
| Admin routes at `/admin/` — no locale prefix, English-only | Localized admin |
| `requireStaff()`/`requireAdmin()` reads DB profiles table, not JWT | JWT claims |
| Coupon redemption: single atomic UPDATE | SELECT then UPDATE |
| next-intl v4 (not v3) | v3 — migration is breaking |
| pnpm package manager | npm/yarn |
| Wholesale hold period auto-waived (RCW 19.60 applies to individuals only) | Manual waive |
| `returnTo` param must be locale-free (e.g. `/account` not `/en/account`) | Full locale path |
| Footer is async Server Component using getTranslations + getStoreSettings | Client component |
| ShopFilterBar receives no function props from Server Components | Inline arrow functions |
| IMEICheck.com: GET endpoint, not POST | POST /checks (returns 404) |
| IMEI services 11 + 5 + 1 ($0.03–0.04/device) | Service 47 ($0.75, overkill) |
| Migration 018 required for hold_period_waived to take effect | App-level only |
| Product cards vertical everywhere (Back Market style) | Horizontal mobile layout |

---

## KNOWN BUGS (all resolved)

| Issue | Fix |
|-------|-----|
| /en/en/account double locale | `returnTo` now locale-free; sign-in-form strips leading locale segment |
| Hold trigger blocked even when waived | Migration 018: checks `coalesce(hold_period_waived, false) = true` |
| Shop 500 on category filter | Removed `onOpenAdvanced` function prop — Server→Client boundary violation |
| Google Maps embed blocked by CSP | Added `https://www.google.com` to `frame-src` in next.config.ts |
| IMEICheck.com 404 | Switched to `GET https://alpha.imeicheck.com/api/php-api/create` |
| imagePriority not wired to next/image | Now destructured and passed as `priority={imagePriority}` |

---

## DO NOT CHANGE

| Constraint | Reason |
|-----------|--------|
| Use `public_products` view for all storefront product reads | Base table exposes IMEI, serial, cost |
| Use `customer_order_items` view for customer order detail | Base table exposes product_imei, product_serial |
| Seller ID format: `iv_hex:authTag_hex:ciphertext_hex` | Changing breaks existing encrypted records |
| `order_number_seq` starts at 10001 (WC-10001+) | Existing orders use this sequence |
| `guest_access_token` UUID in order confirmation URLs | IDOR prevention |
| Check `webhook_events` before processing any Stripe event | Double-processing = oversell + duplicate records |
| Inventory: `UPDATE WHERE quantity > 0` (never SELECT then UPDATE) | Race condition prevention |
| `preferred_locale` has no CHECK constraint | Language additions require no migration |
| `supabaseAdmin()` used server-side only | Service role key must never reach browser |
| next-intl `router.push()` receives locale-free paths | Auto-prepends locale; full path → /en/en/ |
| `requireStaff()`/`requireAdmin()` called on every admin render | JWT can be stale |
| Stripe webhook signature verified before processing | Prevents forged events |
| `hold_period_waived = true` required to bypass DB trigger | Migration 018 enforces this |
| Prices: `numeric(10,2)` in DB (dollars); integer cents in app | `formatMoney(cents)` divides by 100 |
| IMEICheck.com: GET not POST | POST returns 404 |
| Category filter URL param: `?category={slug}` (resolved to ID server-side) | Slug in URL, ID in query |
| `hold_until_date` = `acquisition_date` + `hold_period_days` (not `created_at`) | Correct compliance date |
| Warranty records are immutable snapshots taken at payment time | Product edits post-sale don't affect warranty |
