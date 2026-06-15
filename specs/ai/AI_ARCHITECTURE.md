# AI_ARCHITECTURE.md
> Tech stack, folder structure, data flow, integrations, auth rules, business rules, critical workflows.

---

## TECH STACK

| Layer | Choice |
|-------|--------|
| Language | TypeScript (strict) |
| Framework | Next.js 15.x, App Router, React 19 |
| Styling | Tailwind CSS v3, shadcn/ui (Radix primitives) |
| Database | Supabase (PostgreSQL 15) — 18 migrations applied |
| Auth | Supabase Auth (email+password, PKCE flow) |
| ORM | Supabase JS client directly — no Drizzle/Prisma |
| Hosting | Vercel |
| Storage | Supabase Storage — bucket: `product-images` (public read) |
| Payments | Stripe Checkout + Stripe Tax |
| Email | Resend — FROM: `orders@wirelessconnectstore.com` |
| Auth SMTP | Supabase Auth → Resend (smtp.resend.com:465, user=resend, pass=RESEND_API_KEY) |
| Analytics | PostHog (us.i.posthog.com) — page views only; explicit events pending |
| Rate limiting | Upstash Redis |
| i18n | next-intl v4 — locales: `en` (default), `es` |
| Package manager | pnpm |
| Font | Inter (system-ui fallback) |

---

## ENVIRONMENT VARIABLES

| Var | Notes |
|-----|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://wirelessconnectstore.com` — used in metadataBase and OG image URLs |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key — safe for browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role — SERVER ONLY, never browser |
| `STRIPE_SECRET_KEY` | Live `sk_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Live `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` from Stripe dashboard webhook |
| `STRIPE_TAX_ENABLED` | `true` in production |
| `RESEND_API_KEY` | Resend API key |
| `SELLER_ID_ENCRYPTION_KEY` | 32-byte hex (AES-256-GCM). Generate: `openssl rand -hex 32` |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
| `IMEICHECK_API_KEY` | IMEICheck.com API key |
| `IMEICHECK_SERVICE_ID` | `11` — IMEI to Brand/Model/Name ($0.01, all brands) |
| `IMEICHECK_BLACKLIST_SERVICE_ID` | `5` — Blacklist Status GSMA ($0.02, all brands) |
| `IMEICHECK_APPLE_SERVICE_ID` | `1` — Find My iPhone ON/OFF ($0.01, Apple only) |

---

## FOLDER STRUCTURE

```
app/
  [locale]/
    (storefront)/         # Customer pages — uses Header+Footer layout
      page.tsx            # Homepage (server component)
      shop/               # Catalog — horizontal filter chips, full-width grid
      product/[slug]/     # Detail page + opengraph-image.tsx (edge runtime)
      cart/, checkout/    # Cart and Stripe checkout
      order-confirmation/ # Guest order view (requires guest_access_token)
      account/            # Auth-guarded. returnTo must be locale-free.
      legal/              # 5 legal pages EN+ES
      about/, contact/, repairs/, trade-in/
    auth/callback/        # Supabase PKCE code exchange + cart merge on login
    layout.tsx            # metadataBase, PostHog provider, locale HTML attrs
  admin/                  # No locale prefix. English-only. requireStaff() on every render.
    intakes/new/          # Individual intake form + IMEI scanner
    intakes/wholesale/    # Batch intake (supplier once, scan many IMEIs)
    intakes/[id]/         # Intake detail + 14-point testing + publishing gates
    users/                # Admin-only: role management UI
    abandoned-carts/      # Authenticated customers with items but no checkout; ?hours= filter; mailto outreach link
    customers/            # Customer list with order count + total spent; "Orders →" links to /admin/orders?customer=
    products/, orders/, warranties/, coupons/, settings/
    repairs/, trade-ins/, reviews/
  api/stripe/webhook/     # Stripe event handler (verify sig → idempotency → process)
  opengraph-image.tsx     # Root OG 1200×630 (edge runtime, dark gradient)
  globals.css             # CSS custom properties, scrollbar-hide utility

components/
  layout/
    header.tsx            # White, two-level: top bar + category pills strip
                          # Logo: LOGO_FILE="/logo.png" constant — swap for real file
    footer.tsx            # Async Server Component — reads getStoreSettings()
  store/
    product-card.tsx      # Back Market style: vertical always, square image top
    shop-filter-bar.tsx   # Horizontal chips (category + condition). NO function props from Server.
    imei-scanner-input.tsx  # Zebra scanner + IMEICheck.com result display
  admin/
    imei-scanner-input.tsx  # Admin IMEI scanner (same component, different import path)

features/                 # "use server" actions grouped by domain
  admin/{domain}/         # actions.ts + queries.ts per admin area
  checkout/actions.ts     # createCheckoutSession
  {domain}/actions.ts     # Customer-facing mutations

lib/
  supabase/server.ts      # Cookie-based client (RLS enforced) — use in Server Components
  supabase/admin.ts       # Service-role client — SERVER ONLY, bypasses RLS
  data/products.ts        # getProducts() — always queries public_products view
  data/categories.ts      # getCategories()
  data/settings.ts        # getStoreSettings() — 60s in-memory cache
  imei/lookup.ts          # IMEICheck.com API + Luhn validation
  email/send.ts           # Resend wrapper (graceful skip if no API key)
  email/templates/        # 7 templates: order-confirmation, order-shipped,
                          # order-pickup-ready, order-cancellation, warranty-claim,
                          # admin-new-order, welcome — all EN+ES
  admin/encrypt.ts        # AES-256-GCM encrypt/decrypt seller ID
  admin/audit.ts          # writeAuditLog() — append-only
  cart/                   # Cart queries + mergeGuestCart()
  rate-limit.ts           # Upstash Redis wrapper (isCheckoutAllowed)

supabase/migrations/      # 001–018 applied in sequence
messages/en.json          # All EN i18n strings
messages/es.json          # All ES i18n strings
public/logo.png           # Present — loaded via LOGO_FILE="/logo.png" in components/layout/header.tsx
specs/ai/                 # AI session context files (AI_CONTEXT, AI_ARCHITECTURE, AI_SCHEMA, AI_API, AI_TASKS)
specs/docs/               # 13 original spec documents (PRD, design guidelines, etc.)
```

---

## DATA FLOW

1. **Server Components** read via `lib/data/*` using the cookie-based RLS client.
2. **Mutations** go through `features/*/actions.ts` (`"use server"`, Zod-validated, role-checked).
3. **Admin mutations** use `supabaseAdmin()` (service role, bypasses RLS).
4. **Payments**: Stripe webhook (`/api/stripe/webhook`) is the source of truth. Inventory decremented **only** in the webhook handler, never in `createCheckoutSession`.
5. **Stripe events** deduplicated via `webhook_events` table (unique on `stripe_event_id`).
6. **IMEI lookup**: server action → `lib/imei/lookup.ts` → 3 parallel GET requests to IMEICheck.com → merged result → client `onResult()` callback fills form fields.
7. **Emails**: `lib/email/send.ts` wraps Resend. All templates receive `locale` param for EN/ES. Non-fatal — silently skips if `RESEND_API_KEY` not set.
8. **Auth flow**: Supabase PKCE → `/auth/callback` → `exchangeCodeForSession` → `mergeGuestCart()` → redirect to `returnTo` (must be locale-free).

---

## AUTHORIZATION RULES

### Roles
| Role | Scope |
|------|-------|
| `customer` | Own profile, own orders, own addresses, own warranty claims |
| `staff` | All admin routes except /admin/users and /admin/settings |
| `admin` | Everything: settings, user roles, audit logs |

### Route Guards
- Every admin page calls `requireStaff()` or `requireAdmin()` at render time (not middleware).
- `requireStaff()`/`requireAdmin()` read from `profiles` table — never trust JWT claims (stale).
- Account routes redirect unauthenticated users to `/${locale}/sign-in?returnTo=/account`.
  - **`returnTo` must be locale-free** — next-intl `router.push()` auto-prepends locale.

### DB-Level Security
- `is_admin_or_staff()` and `is_admin()` are `SECURITY DEFINER` SQL functions with locked `search_path = public`.
- Role changes blocked by `prevent_role_self_escalation` trigger — only service role can update `profiles.role`.
- `public_products` view and `customer_order_items` view are the only safe customer-facing query interfaces.
- `admin_audit_logs`: insert via service role only. No client updates or deletes.
- `settings`: staff/admin read; admin write only.

### Guest Order Access
- `guest_access_token` (UUID, generated by DB default) required in URL.
- Never expose orders by `id` or `order_number` alone for unauthenticated users.

---

## BUSINESS RULES

| Rule | Constraint |
|------|-----------|
| Hold period | `hold_until_date = acquisition_date + hold_period_days`. DB trigger blocks `ready_to_list` if `hold_until_date > current_date AND coalesce(hold_period_waived, false) != true`. |
| Wholesale hold | `hold_period_waived = true` auto-set in `createWholesaleBatch()`. RCW 19.60 applies to individual sellers only. |
| Publishing gates | 15 gates must all pass server-side in `checkPublishingGates()` before intake → active product. Key gates: hold elapsed, IMEI passed, testing passed, `is_clean_imei = true`, ≥1 photo, price > 0. |
| Inventory decrement | `UPDATE products SET quantity = quantity - 1 WHERE id = ? AND quantity > 0`. Only in Stripe webhook. Never at session creation. |
| Coupon redemption | Single atomic `UPDATE coupons SET used_count = used_count + 1 WHERE code = ? AND active = true AND (usage_limit IS NULL OR used_count < usage_limit)`. |
| Seller ID encryption | AES-256-GCM. Format: `iv_hex:authTag_hex:ciphertext_hex`. Key = `SELLER_ID_ENCRYPTION_KEY` (32-byte hex). Never stored plaintext. |
| Warranty creation | From `order_item` snapshot at Stripe payment webhook. `warranty_days` from snapshot — not current product value. |
| Webhook idempotency | Check `webhook_events.stripe_event_id` before processing any event. Insert after processing. |
| Prices | DB: `numeric(10,2)` in dollars. App layer: integer cents. `formatMoney(cents)` divides by 100. |
| Order numbers | Sequential: `WC-{n}` from `order_number_seq` starting at 10001. Generated server-side. |
| Cart persistence | Guest: 30 days (`expires_at`). Authenticated: permanent. Merge on login via `mergeGuestCart()`. |
| Blacklisted IMEI | Allowed in intake (for parts/review). Sets `imei_verification_status = 'failed'`, `is_clean_imei = false`. Blocks the is_clean_imei publishing gate. |
| CCPA footer | "Do Not Sell" link rendered in **both** English and Spanish in footer, always, regardless of active locale. |
| RCW 19.60 | WA secondhand dealer law. Requires: seller full identity, encrypted govt ID, hold period, IMEI + serial recording. Applies to individual purchases only. |
| Shipping insurance | Auto-added for orders above `shipping_insurance_threshold` setting (default $200). |
| Stripe Tax | Auto-calculated. `STRIPE_TAX_ENABLED=true` in production. |

---

## CRITICAL WORKFLOWS

### Checkout
1. `createCheckoutSession()`: validate input (Zod) → rate limit (Upstash, 10/5min/IP).
2. Load cart → re-fetch prices from `public_products` view (never trust cart cache).
3. Validate stock + fulfillment method per product.
4. Validate + atomically redeem coupon if provided.
5. Calculate totals server-side. Create pending `orders` row.
6. Create Stripe Checkout Session with line items from DB prices → return redirect URL.
7. **Stripe webhook** (async, after payment): decrement inventory → create `order_items` snapshot → create `warranties` → update order status/timestamps → send order confirmation email (customer locale) → send admin notification.

### Individual Device Intake
1. Optional: scan IMEI with Zebra → `imeiLookupAction()` → auto-fill brand/model/storage/color/serial/blacklist/FMI.
2. Staff fills form. `createIntake()`: encrypt `seller_id_number`, compute `hold_until_date = acquisition_date + 3`.
3. Staff completes 14-point testing checklist → `updateTestingChecklist()`.
4. Staff records IMEI verification result → `updateImeiVerification()`.
5. Staff uploads photos to Supabase Storage.
6. `checkPublishingGates()`: all 15 gates must pass.
7. `convertIntakeToProduct()`: creates product row, copies images, sets `status = 'active'`.
8. DB trigger enforces hold: blocks step 7 if `hold_until_date > today AND hold_period_waived != true`.

### Wholesale Batch Intake
1. Fill supplier info once (name, invoice, date, payment, per-unit cost default).
2. Toggle IMEI Lookup: ON = 3 API calls ($0.03–0.04), OFF = Luhn-only (free).
3. Scan each IMEI (Enter auto-triggers lookup). Each adds an editable row.
4. Adjust condition, cost, notes per device. Duplicate IMEI detected and blocked.
5. Submit → `createWholesaleBatch()` → bulk INSERT. `hold_period_waived = true`, `acquisition_source = 'wholesale_supplier'`.

### IMEI Lookup (IMEICheck.com)
API: `GET https://alpha.imeicheck.com/api/php-api/create?key=KEY&service=ID&imei=IMEI`
1. Luhn checksum (local, free, 15-digit check).
2. Three parallel requests:
   - Service 11: Brand/Model/Name ($0.01, all brands) → brand, model, name
   - Service 5: Blacklist GSMA ($0.02, all brands) → blacklist status, brand from blProps
   - Service 1: FMI Apple ($0.01, Apple only) → fmiOn boolean
3. Merge results: brand from blProps fallback when deviceInfo returns false (non-Apple on Apple service).
4. `onResult()` callback → `setValue()` on intake form: brand, model, storage, color, imei, serial_number, is_clean_imei, imei_verification_status.
5. UI shows: device name, condition badges, blacklist badge (clean/blacklisted/unknown), FMI warning for Apple.

### Order Status Emails (triggered in `updateOrderStatus`)
| Transition | Template | Required fields |
|-----------|----------|----------------|
| → `shipped` | order-shipped.ts | `tracking_number`, `shipping_carrier` |
| → `ready_for_pickup` | order-pickup-ready.ts | `store_address` from `getStoreSettings()` |
| → `cancelled` | order-cancellation.ts | — |

All emails sent in `order.customer_locale`. Templates at `lib/email/templates/`.

### Stripe Webhook (checkout.session.completed)
1. Verify Stripe signature (`STRIPE_WEBHOOK_SECRET`).
2. Check `webhook_events` table — skip if `stripe_event_id` already exists.
3. Fetch Stripe session + line items.
4. Create `order_items` rows (immutable snapshot of product at purchase time).
5. Decrement `products.quantity` atomically per item (`UPDATE WHERE quantity > 0`).
6. Create `warranties` from order_item snapshots (warranty_days, device info, customer info).
7. Update order: `status = 'paid'`, `payment_status = 'paid'`, `paid_at = now()`.
8. Send order confirmation email to customer (locale-aware).
9. Send admin new-order notification.
10. Insert into `webhook_events` to mark as processed.
