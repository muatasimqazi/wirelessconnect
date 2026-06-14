# AI_CONTEXT.md
> Machine-readable project memory. Last updated: June 2026. Do not add marketing language.

---

## PROJECT

Wireless Connect is a full-stack e-commerce platform for a physical phone/repair shop in Shoreline, WA (since 2010). Sells certified pre-owned phones online with local pickup or US-wide shipping. Also offers in-store repairs, trade-in estimates, and accessories. Staff manages device intake with RCW 19.60 (WA secondhand dealer) compliance enforced at DB level. Admin dashboard handles full operations. Domain: wirelessconnectstore.com.

---

## MVP STATUS

| Area | Status |
|------|--------|
| Product catalog (browse/search/filter) | ✅ Complete |
| Shopping cart (persist, merge on login) | ✅ Complete |
| Checkout + Stripe Tax + webhook | ✅ Complete (live keys) |
| Customer accounts (orders, addresses, warranty) | ✅ Complete |
| Admin dashboard (products, orders, intakes, warranties, coupons, settings) | ✅ Complete |
| Device intake — individual (RCW 19.60) | ✅ Complete |
| Device intake — wholesale batch | ✅ Complete |
| IMEI scanner (IMEICheck.com API + Zebra) | ✅ Complete |
| Publishing gates (15-gate validation) | ✅ Complete |
| Hold period enforcement (DB trigger + server gate) | ✅ Complete — migration 018 fixes waiver bug |
| Transactional emails (Resend, EN+ES, 7 templates) | ✅ Complete |
| Trade-in storefront + admin | ✅ Complete |
| Repairs storefront + admin | ✅ Complete |
| Product reviews + admin moderation | ✅ Complete |
| Admin user management | ✅ Complete |
| OG social images (root + per-product) | ✅ Complete |
| Legal pages (Terms, Privacy, Returns, Warranty, Shipping — EN+ES) | ✅ Complete |
| SEO (sitemap, robots, JSON-LD LocalBusiness, hreflang, aggregateRating) | ✅ Complete |
| Lighthouse ≥95 | ✅ Complete |
| Domain wirelessconnectstore.com live on Vercel | ✅ Complete |
| Footer reads from store settings dynamically | ✅ Complete |
| Design overhaul (Back Market-inspired white/minimal) | ✅ Complete |
| Homepage hero slider | ⏳ Planned |
| Logo image in header | ⏳ Drop file at public/logo.png |
| WhatsApp link on product detail | ⏳ Not started |
| Plain-language tooltips (product detail) | ⏳ Not started |
| Public warranty lookup (/warranty) | ⏳ Not started |
| Analytics explicit events (PostHog captures) | ⏳ Not started |
| Loyalty program | ❌ Phase 3 |
| Inventory reservation (timed holds) | ❌ Phase 3 |

---

## TECH STACK

| Layer | Choice |
|-------|--------|
| Language | TypeScript (strict) |
| Framework | Next.js 15.x, App Router, React 19 |
| Styling | Tailwind CSS v3, shadcn/ui (Radix primitives) |
| Database | Supabase (PostgreSQL 15) — 18 migrations applied |
| Auth | Supabase Auth (email+password; PKCE flow) |
| ORM | Supabase JS client directly — no Drizzle/Prisma |
| Hosting | Vercel |
| Storage | Supabase Storage — bucket: `product-images` |
| Payments | Stripe Checkout + Stripe Tax (live keys in prod) |
| Email | Resend — FROM: orders@wirelessconnectstore.com |
| Auth SMTP | Supabase Auth → Resend (smtp.resend.com:465, user=resend) |
| Analytics | PostHog (us.i.posthog.com) |
| Rate limiting | Upstash Redis |
| i18n | next-intl v4 — locales: en (default), es |
| Package manager | pnpm |

---

## ARCHITECTURE

### Folder Structure
```
app/
  [locale]/
    (storefront)/       # Customer pages — Header+Footer layout
      page.tsx          # Homepage
      shop/             # Catalog with horizontal filter chips
      product/[slug]/   # Detail page + opengraph-image.tsx
      cart/, checkout/, order-confirmation/
      account/          # Auth-guarded; locale-free returnTo
      legal/            # 5 legal pages EN+ES
      about/, contact/, repairs/, trade-in/
    auth/callback/      # Supabase PKCE code exchange + cart merge
    layout.tsx          # metadataBase, PostHog, locale HTML attrs
  admin/                # No locale prefix. English-only. requireStaff() on every page.
    intakes/new/        # Individual intake + IMEI scanner
    intakes/wholesale/  # Batch intake (supplier once, scan many)
    users/              # Admin-only: role management
    products/, orders/, warranties/, coupons/, settings/, repairs/, trade-ins/, reviews/
  api/stripe/webhook/   # Stripe event handler (signature verified)
  opengraph-image.tsx   # Root OG 1200×630 edge runtime
  globals.css           # CSS vars, scrollbar-hide utility

components/
  layout/header.tsx     # White, two-level (nav + category bar), Logo component
  layout/footer.tsx     # Async Server Component — reads getStoreSettings()
  store/product-card.tsx # Back Market style: vertical, square image, minimal
  store/shop-filter-bar.tsx # Horizontal chips (category + condition). NO function props from Server.
  admin/imei-scanner-input.tsx # Zebra scanner input + IMEICheck.com result display

features/               # "use server" actions grouped by domain
lib/
  supabase/server.ts    # Cookie client (RLS enforced) — for Server Components
  supabase/admin.ts     # Service-role client — SERVER ONLY, bypasses RLS
  data/products.ts      # getProducts() always queries public_products view
  data/settings.ts      # getStoreSettings() — 60s cache, includes store_hours
  imei/lookup.ts        # IMEICheck.com API + Luhn validation
  email/send.ts         # Resend wrapper (graceful skip if no API key)
  admin/encrypt.ts      # AES-256-GCM seller ID encryption/decryption
  admin/audit.ts        # Append-only audit log writer
  cart/                 # Cart queries + mergeGuestCart()
  rate-limit.ts         # Upstash Redis wrapper

supabase/migrations/    # 001–018 applied in order
messages/en.json        # All EN translations
messages/es.json        # All ES translations
public/logo.png         # PENDING — drop logo PNG here to activate header logo
```

### Data Flow
1. Server Components → `lib/data/*` (reads public_products view via RLS client)
2. Mutations → `features/*/actions.ts` ("use server", Zod-validated, role-checked)
3. Admin mutations → `supabaseAdmin()` (service role, bypasses RLS)
4. Payments → Stripe webhook is source of truth; inventory decremented only there
5. Stripe events deduplicated via `webhook_events` table

### External Integrations
| Service | Env Vars |
|---------|----------|
| Stripe | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_TAX_ENABLED` |
| Resend | `RESEND_API_KEY` |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| PostHog | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com` |
| Upstash | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| IMEICheck.com | `IMEICHECK_API_KEY`, `IMEICHECK_SERVICE_ID=11`, `IMEICHECK_BLACKLIST_SERVICE_ID=5`, `IMEICHECK_APPLE_SERVICE_ID=1` |
| Vercel | `NEXT_PUBLIC_SITE_URL=https://wirelessconnectstore.com` |
| Seller ID crypto | `SELLER_ID_ENCRYPTION_KEY` (32-byte hex via openssl rand -base64 32) |

---

## DATA MODEL

### Enums (migration 002)
```
user_role: customer | staff | admin
device_condition: like_new | excellent | good | fair
product_status: draft | active | archived | sold_out
intake_status: received | testing | needs_imei_check | needs_photos | hold_period | ready_to_list | converted_to_product | rejected
verification_status: not_checked | passed | failed | needs_review
testing_status: not_started | in_progress | passed | failed | needs_review
carrier_type: unlocked | att | verizon | tmobile | sprint | other | unknown
order_status: pending | paid | processing | ready_for_pickup | shipped | delivered | picked_up | cancelled | refunded
fulfillment_method: pickup | shipping
warranty_claim_status: none | submitted | under_review | approved | denied | resolved
coupon_type: percentage | fixed_amount | free_shipping
seller_id_type: drivers_license | state_id | passport | military_id | other
acquisition_payment_method: cash | check | zelle | venmo | store_credit | other
repair_status: requested | confirmed | received | in_progress | waiting_on_parts | ready_for_pickup | completed | cancelled
trade_in_status: submitted | under_review | offer_sent | accepted | rejected | expired | completed
audit_action: create | update | delete | status_change | role_change | login | export | request_submitted
```

### Key Tables

**profiles** — id(FK auth.users), email, full_name, role(user_role default customer), preferred_locale(no CHECK).
Role changes: ONLY via service-role server actions. Trigger blocks client-side role escalation.

**products** — slug(unique), title, brand, model, storage, color, carrier, condition, battery_health(0–100), price/compare_at_price(numeric), quantity, status, featured.
Private fields (excluded from public_products view): imei, serial_number, cost, acquisition_source, internal_device_notes.
IMEI fields: is_clean_imei, imei_verification_status, activation_lock_removed, is_tested, testing_status, is_data_wiped, factory_reset_verified.
translations/seo_translations: jsonb `{"es": {"title": "..."}}`.
Full-text search index on title+brand+model+storage+color.

**product_images** — product_id FK, image_url, is_primary(max 1 per product via unique partial index), sort_order, alt_text.

**carts** — user_id(nullable guest), anonymous_id, expires_at(30 days).
**cart_items** — cart_id+product_id unique, quantity.

**orders** — order_number(WC-{seq} from order_number_seq starting 10001), guest_access_token(uuid, NOT the ID), fulfillment_method, stripe_checkout_session_id(unique), subtotal/discount/shipping/tax/total(numeric), customer_locale.
Cancellation: request fields on order — never auto-cancels. admin_notes excluded from all customer queries.

**order_items** — immutable snapshot. product_imei+product_serial_number are admin-only (excluded from customer_order_items view). warranty_days copied from product at order time.

**device_intakes** — seller identity (RCW 19.60): seller_full_name, seller_id_type, seller_id_number_encrypted(AES-256-GCM), seller_declaration_signed. Hold: hold_until_date, hold_period_days, hold_period_waived, hold_period_waived_reason. IMEI: imei_verification_status, is_clean_imei, is_blacklisted. Testing: 14-gate boolean fields. acquisition_source: 'individual_purchase' | 'wholesale_supplier' | etc.

**warranties** — snapshot from order_item (product_title, device_brand, device_model, device_imei, device_serial_number, customer_locale, warranty_days, starts_at, expires_at). claim_status(warranty_claim_status).

**coupons** — code(unique), type, value, active, usage_limit, used_count, minimum_order_amount, expires_at.

**webhook_events** — stripe_event_id(unique). Idempotency guard.

**admin_audit_logs** — append-only. actor_id, actor_email, action, table_name, record_id, old_values, new_values.

**settings** — key='store', value=jsonb. Fields: store_name, store_address, store_phone, store_email, store_hours({"monday":"HH:MM-HH:MM",...,"sunday":"closed"}), whatsapp_enabled, whatsapp_number, default_warranty_days, hold_period_days, stripe_tax_enabled, shipping_insurance_threshold, free_shipping_threshold.

**repairs** — customer info + device info + status(repair_status) + appointment_start/end.
**trade_ins** — customer + device + condition + carrier + customer_description + status(trade_in_status) + offer fields.
**reviews** — product_id FK, user_id FK, rating(1–5), title, body, approved(bool default false). Only approved=true visible on storefront.

### Views (migration 013)
- `public_products` — safe storefront view, status='active' only, excludes imei/serial/cost.
- `customer_order_items` — excludes product_imei, product_serial_number.
- NEVER query base `products` or `order_items` for customer-facing pages.

---

## API CONTRACTS

### Key Server Actions

| Action | File | Auth | Notes |
|--------|------|------|-------|
| `createCheckoutSession` | features/checkout/actions.ts | Public | Rate-limited 10/5min/IP. Re-fetches prices. Stripe Tax. |
| `signUpAction(fullName,email,password,locale)` | app/.../sign-up/actions.ts | None | Sends welcome email. Supabase sends confirm email. |
| `imeiLookupAction(imei)` | features/admin/imei/actions.ts | requireStaff | 3 parallel API calls. Returns ImeiLookupResult. |
| `createIntake(input)` | features/admin/intakes/actions.ts | requireStaff | Encrypts seller ID. Computes hold_until_date. |
| `createWholesaleBatch(supplier, devices[])` | features/admin/intakes/actions.ts | requireStaff | No seller ID. hold_period_waived=true auto-set. |
| `updateOrderStatus(orderId, newStatus)` | features/admin/orders/actions.ts | requireStaff | Emails on shipped/ready_for_pickup/cancelled. |
| `updateUserRole(targetUserId, newRole)` | features/admin/users/actions.ts | requireAdmin | Cannot change own role. |
| `getReviewSummaries(productIds[])` | features/reviews/actions.ts | Public | Single query returning Map<productId, {avgRating, reviewCount}>. |

### Stripe Webhook `/api/stripe/webhook`
Events handled: `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`.
Always: verify signature → check webhook_events idempotency → process → insert webhook_events.
On completed: create order_items (snapshot) → decrement inventory (atomic) → create warranties → send emails.

### IMEICheck.com API
Endpoint: `GET https://alpha.imeicheck.com/api/php-api/create?key=KEY&service=SERVICE_ID&imei=IMEI`
Auth: `key` query param (NOT Bearer header).
Services: 11=Brand/Model/Name($0.01), 5=Blacklist GSMA($0.02), 1=FMI Apple($0.01).
Error response: `{"status":"error","response":"Credit Error"}` — check balance.
Apple devices: all 3 services run in parallel. Non-Apple: services 11+5 only (service 1 result discarded).

---

## AUTHORIZATION RULES

| Role | Can Access |
|------|-----------|
| customer | Own profile, own orders, own addresses, own warranty claims |
| staff | All admin pages except /admin/users and /admin/settings |
| admin | Everything including user roles and settings |

- `requireStaff()` / `requireAdmin()` — reads profiles table (not JWT). Call on every admin render.
- `is_admin_or_staff()` / `is_admin()` — SECURITY DEFINER SQL functions with locked search_path.
- Role update blocked by DB trigger if `auth.uid()` is not null (prevents client escalation).
- Guest order access: requires `guest_access_token` UUID (not order_id or order_number).
- `returnTo` param for auth redirects must be locale-free (e.g., `/account` not `/en/account`).

---

## BUSINESS RULES

| Rule | Constraint |
|------|-----------|
| Hold period | hold_until_date = acquisition_date + hold_period_days. DB trigger blocks ready_to_list if date > today AND waived ≠ true. Wholesale: auto-waived. |
| Publishing gates | 15 gates must all pass before intake→product. Server-side in checkPublishingGates(). |
| Inventory decrement | `UPDATE products SET quantity = quantity-1 WHERE id=? AND quantity > 0`. Only in Stripe webhook. Never in checkout session creation. |
| Coupon redemption | Single atomic `UPDATE WHERE active AND (limit IS NULL OR used_count < limit)`. |
| Seller ID | AES-256-GCM. Format: `iv_hex:authTag_hex:ciphertext_hex`. Never plaintext. |
| Warranty creation | From order_item snapshot at payment time. warranty_days from snapshot, not current product. |
| Webhook idempotency | Check stripe_event_id in webhook_events before processing. |
| Prices | DB: `numeric(10,2)` in dollars. App layer: integer cents. `formatMoney(cents)` divides by 100. |
| Order number | Sequential `WC-{n}` from `order_number_seq` starting 10001. |
| Cart persistence | Guest: 30 days. Auth: permanent. Merge on login. |
| Blacklisted IMEI | Allowed in intake (parts/review). Sets imei_verification_status=failed, is_clean_imei=false. Blocks publishing gate. |
| CCPA | Do Not Sell link in footer in BOTH English AND Spanish always, regardless of active locale. |
| RCW 19.60 | WA law. Applies to individual purchases only (not wholesale from licensed businesses). Requires: seller identity, encrypted govt ID, hold period, IMEI+serial. |

---

## CRITICAL WORKFLOWS

### Checkout
1. Validate input (Zod) → rate limit (Upstash) → load cart.
2. Re-fetch prices from `public_products` view (never trust cart).
3. Validate stock + fulfillment per product.
4. Validate coupon (atomic increment).
5. Calculate totals server-side. Create pending order row.
6. Create Stripe Checkout Session → return redirect URL.
7. **Stripe webhook** (not here): decrement inventory → create order_items → create warranties → send emails.

### Individual Intake
1. (Optional) Zebra scan → IMEICheck.com (3 parallel calls) → auto-fill form.
2. Staff fills form. `createIntake()`: encrypt seller_id_number, compute hold_until_date.
3. Staff completes 14-point testing checklist.
4. Staff uploads photos to Supabase Storage.
5. `checkPublishingGates()`: 15 gates.
6. `convertIntakeToProduct()`: create product, copy images, set status=active.
7. DB trigger enforces hold: blocks step 6 if hold_until_date > today AND hold_period_waived ≠ true.

### Wholesale Batch Intake
1. Fill supplier info once (name, invoice, date, payment, per-unit cost).
2. Toggle IMEI Lookup ON/OFF (ON=$0.03–0.04/device, OFF=Luhn-only free).
3. Scan each IMEI (Enter auto-triggers). Each scan adds a row (editable inline).
4. Submit → `createWholesaleBatch()` → bulk insert. hold_period_waived=true, acquisition_source='wholesale_supplier'.

### Order Status Emails
| Transition | Template | Required |
|-----------|----------|---------|
| → shipped | order-shipped.ts | tracking_number, shipping_carrier |
| → ready_for_pickup | order-pickup-ready.ts | store_address from getStoreSettings() |
| → cancelled | order-cancellation.ts | — |
All sent in customer_locale.

### Stripe Webhook (checkout.session.completed)
Verify sig → check webhook_events → fetch session+items → create order_items (snapshot) → decrement inventory (atomic) → create warranties → update order (status=paid) → send order confirmation (customer locale) → send admin notification → insert webhook_events.

---

## KNOWN DECISIONS

| Decision | Reason | Rejected Alternative |
|----------|--------|---------------------|
| `public_products` view mandatory | Prevents IMEI/cost/serial leakage | Direct table |
| `customer_order_items` view mandatory | Excludes IMEI/serial from customers | Direct order_items |
| No CHECK on locale columns | Adding languages needs no migration | CHECK constraint |
| Stripe webhook = inventory source of truth | Prevents decrement on abandoned sessions | Decrement at session creation |
| Seller ID AES-256-GCM (not hash) | Must be decryptable for law enforcement | Hashing |
| Hold period enforced at DB level (trigger) | App-only can be bypassed | App-only |
| guest_access_token UUID in URL (not order ID) | IDOR prevention | Order ID in URL |
| Admin routes English-only | Staff UI simplicity | Localized admin |
| requireStaff() reads DB (not JWT) | JWT role claims can be stale | JWT claims |
| Coupon atomic single UPDATE | Prevents race/oversell | SELECT then UPDATE |
| next-intl v4 | Project started on v4; v3→v4 is breaking | v3 |
| pnpm | Project default | npm/yarn |
| Wholesale hold auto-waived | RCW 19.60 = individual sellers only | Manual waive |
| returnTo must be locale-free | next-intl router.push() auto-prepends locale | Full locale path |
| Footer async Server Component | Reads settings dynamically | Client useEffect |
| ShopFilterBar has no function props | Server Component cannot pass event handlers | Inline arrow functions |
| IMEICheck.com: GET endpoint | POST /checks returns 404 — discovered empirically | POST body |
| Services 11+5+1 for IMEI | 11=$0.01 universal, 5=$0.02 GSMA, 1=$0.01 Apple FMI | Service 47 ($0.75 overkill) |
| Migration 018 required for hold waiver | Original trigger ignored hold_period_waived | App-level only |
| Product cards vertical everywhere | Back Market style; horizontal cramped at 2-col mobile | Horizontal mobile layout |

---

## KNOWN BUGS (all resolved)

| Issue | Fix |
|-------|-----|
| /en/en/account double locale | account/layout.tsx returnTo now locale-free; sign-in-form strips leading locale segment |
| Hold trigger blocked when waived | Migration 018: `coalesce(hold_period_waived, false) = true` check added |
| Shop 500 on category filter | Removed onOpenAdvanced function prop — Server Component cannot pass to Client |
| Google Maps blocked by CSP | Added https://www.google.com to frame-src in next.config.ts |
| IMEICheck.com 404 | Switched to GET https://alpha.imeicheck.com/api/php-api/create |
| imagePriority not wired | Now destructured and passed as priority={imagePriority} to next/image |

---

## OPEN TASKS (priority order)

1. Drop `public/logo.png` → header auto-activates via `LOGO_FILE` constant in `components/layout/header.tsx`
2. Homepage hero slider component (deferred — static dark hero currently)
3. WhatsApp link on product detail page (PRD §8) — `whatsapp_enabled`+`whatsapp_number` in settings
4. Plain-language tooltips on product detail (PRD §8) — Unlocked, Battery Health, Clean IMEI, Carrier, Condition
5. Public warranty lookup page at `/[locale]/warranty` (PRD §4) — email+order number, no auth required
6. PostHog explicit events: product_viewed, add_to_cart, checkout_started, checkout_completed, search_query, filter_used
7. Vercel env vars to add: `IMEICHECK_APPLE_SERVICE_ID=1`, `IMEICHECK_BLACKLIST_SERVICE_ID=5`

---

## DO NOT CHANGE

| Item | Why |
|------|-----|
| Query `public_products` view for storefront | IMEI/serial/cost are in base table |
| Query `customer_order_items` view for customer order detail | IMEI/serial excluded from customer view |
| Seller ID format `iv:authTag:ciphertext` | Changing breaks existing DB records |
| `order_number_seq` starting at 10001 | Existing orders WC-10001+ |
| `guest_access_token` UUID in URLs | IDOR prevention |
| Webhook idempotency check before processing | Double-processing = oversell + duplicate records |
| Atomic inventory `UPDATE WHERE quantity > 0` | Never SELECT then UPDATE |
| `preferred_locale` has no CHECK constraint | Language additions need no migration |
| Admin routes at `/admin/` (no locale) | English-only by design |
| `supabaseAdmin()` server-only | Service role key must never reach browser |
| next-intl `router.push()` receives locale-free paths | nextintl auto-prepends; full path → /en/en/ |
| `requireStaff()`/`requireAdmin()` on every admin render | JWT can be stale; always verify via DB |
| Stripe webhook signature verification | Prevents forged events |
| `hold_period_waived=true` required to bypass DB trigger | Migration 018 |
| Prices: `numeric(10,2)` in DB, integer cents in app | `formatMoney(cents)` ÷ 100 |
| IMEICheck.com: GET not POST | POST returns 404 |
| Category filter URL param: `?category={slug}` (not ID) | getCategories() resolves slug→ID server-side |
| hold_until_date = acquisition_date + hold_period_days | Not from created_at |
| Warranty records snapshot at payment time | Changing product after sale cannot change warranty |
