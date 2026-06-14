# AI_SCHEMA.md
> Complete database schema. Supabase PostgreSQL 15. 18 migrations (001–018).
> Reader is a coding agent — no prose, prefer tables.

---

## ENUMS (migration 002)

```sql
user_role:                  customer | staff | admin
product_category_type:      phone | tablet | laptop | accessory | other
device_condition:           like_new | excellent | good | fair
product_status:             draft | active | archived | sold_out
intake_status:              received | testing | needs_imei_check | needs_photos |
                            hold_period | ready_to_list | converted_to_product | rejected
verification_status:        not_checked | passed | failed | needs_review
testing_status:             not_started | in_progress | passed | failed | needs_review
carrier_type:               unlocked | att | verizon | tmobile | sprint | other | unknown
order_status:               pending | paid | processing | ready_for_pickup | shipped |
                            delivered | picked_up | cancelled | refunded
fulfillment_method:         pickup | shipping
payment_status:             unpaid | paid | failed | refunded | partially_refunded
warranty_claim_status:      none | submitted | under_review | approved | denied | resolved
request_status:             submitted | under_review | approved | denied | completed | cancelled
coupon_type:                percentage | fixed_amount | free_shipping
seller_id_type:             drivers_license | state_id | passport | military_id | other
acquisition_payment_method: cash | check | zelle | venmo | store_credit | other
audit_action:               create | update | delete | status_change | role_change |
                            login | export | request_submitted
repair_status:              requested | confirmed | received | in_progress |
                            waiting_on_parts | ready_for_pickup | completed | cancelled
trade_in_status:            submitted | under_review | offer_sent | accepted |
                            rejected | expired | completed
```

---

## TABLES

### profiles
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid PK | FK → auth.users(id) ON DELETE CASCADE |
| email | text | NOT NULL |
| full_name | text | |
| phone | text | |
| role | user_role | NOT NULL DEFAULT 'customer' |
| avatar_url | text | |
| preferred_locale | text | NOT NULL DEFAULT 'en' — **NO CHECK constraint** |
| created_at, updated_at | timestamptz | |

Indexes: email, role.
Security: Role changes ONLY via service-role server actions. Trigger `prevent_role_self_escalation` blocks client-side changes.

---

### categories
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | NOT NULL |
| slug | text | UNIQUE NOT NULL |
| type | product_category_type | NOT NULL |
| description | text | |
| translations | jsonb | `{"es": {"name": "..."}}` |
| image_url | text | |
| sort_order | int | DEFAULT 0 |
| active | boolean | DEFAULT true |

Seeded slugs: `iphones`, `samsung-phones`, `google-pixel`, `tablets`, `laptops`, `accessories`.

---

### products
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| category_id | uuid | FK → categories |
| slug | text | UNIQUE NOT NULL |
| title, subtitle, description | text | |
| translations | jsonb | `{"es": {"title": "...", "subtitle": "...", "description": "..."}}` |
| category_type | product_category_type | NOT NULL |
| brand, model, storage, color | text | |
| carrier, original_carrier | carrier_type | |
| condition | device_condition | |
| battery_health | int | CHECK 0–100 |
| battery_cycle_count | int | CHECK ≥0 |
| supported_bands | text[] | |
| network_compatibility | text[] | |
| **PRIVATE** imei | text | Excluded from public_products view |
| **PRIVATE** serial_number | text | Excluded from public_products view |
| **PRIVATE** cost | numeric(10,2) | Excluded from public_products view |
| **PRIVATE** acquisition_source, acquisition_date | text/date | Excluded |
| **PRIVATE** internal_device_notes | text | Excluded |
| is_clean_imei | boolean | DEFAULT false |
| imei_verification_status | verification_status | DEFAULT 'not_checked' |
| imei_verified_at | timestamptz | |
| imei_verified_by | uuid | FK → auth.users |
| is_unlocked, activation_lock_removed | boolean | |
| is_tested | boolean | DEFAULT false |
| testing_status | testing_status | DEFAULT 'not_started' |
| tested_at | timestamptz | |
| tested_by | uuid | FK → auth.users |
| is_data_wiped, factory_reset_verified | boolean | |
| includes_charger, includes_cable | boolean | |
| warranty_days | int | DEFAULT 30 |
| price | numeric(10,2) | NOT NULL CHECK ≥0 |
| compare_at_price | numeric(10,2) | NULLABLE |
| quantity | int | DEFAULT 1 CHECK ≥0 |
| sku | text | UNIQUE |
| status | product_status | DEFAULT 'draft' |
| featured | boolean | DEFAULT false |
| allow_pickup, allow_shipping | boolean | DEFAULT true |
| seo_title, seo_description | text | |
| seo_translations | jsonb | |

Indexes: category_id, slug, status, featured, brand, model, price, condition, carrier, sku, imei, testing_status, imei_verification_status. Full-text GIN index on title+brand+model+storage+color.

---

### product_images
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| product_id | uuid | FK → products ON DELETE CASCADE |
| image_url | text | NOT NULL |
| alt_text | text | |
| alt_text_translations | jsonb | |
| sort_order | int | DEFAULT 0 |
| is_primary | boolean | DEFAULT false |

Constraint: `UNIQUE (product_id) WHERE is_primary = true` — one primary per product.
Storage: Supabase Storage bucket `product-images`. Press photos in `phones/` prefix (31 files).

---

### carts
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid | FK → auth.users NULLABLE (guest carts) |
| anonymous_id | text | Cookie-based guest ID |
| currency | text | DEFAULT 'usd' |
| expires_at | timestamptz | DEFAULT now() + 30 days |

Merged on login via `mergeGuestCart(userId)` in `/auth/callback`.

### cart_items
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| cart_id | uuid | FK → carts ON DELETE CASCADE |
| product_id | uuid | FK → products ON DELETE CASCADE |
| quantity | int | DEFAULT 1 CHECK >0 |

Constraint: `UNIQUE (cart_id, product_id)`.

---

### addresses
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid | FK → auth.users NULLABLE |
| full_name | text | NOT NULL |
| phone | text | E.164 format |
| line1, line2 | text | |
| city, state, postal_code | text | state = 2-letter US code |
| country | text | DEFAULT 'US' |
| is_default_shipping, is_default_billing | boolean | |

---

### orders
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| order_number | text | UNIQUE, format WC-{seq} from order_number_seq (starts 10001) |
| user_id | uuid | FK → auth.users NULLABLE |
| customer_email | text | NOT NULL |
| customer_name, customer_phone | text | |
| customer_locale | text | NO CHECK — validated at app layer |
| **guest_access_token** | uuid | DEFAULT gen_random_uuid() — required for guest order view |
| status | order_status | DEFAULT 'pending' |
| payment_status | payment_status | DEFAULT 'unpaid' |
| fulfillment_method | fulfillment_method | NOT NULL |
| subtotal, discount_total, shipping_total, tax_total, total | numeric(10,2) | |
| shipping_insurance_amount | numeric(10,2) | DEFAULT 0 |
| shipping_address_id, billing_address_id | uuid | FK → addresses |
| tracking_number, shipping_carrier | text | Set when marking shipped |
| shipped_at | timestamptz | |
| pickup_location_name, pickup_location_address | text | |
| stripe_checkout_session_id | text | UNIQUE |
| stripe_payment_intent_id | text | |
| stripe_tax_calculation_id, tax_jurisdiction | text | |
| coupon_id | uuid | FK → coupons |
| coupon_code | text | |
| notes | text | Customer-visible |
| **admin_notes** | text | NEVER returned to customers |
| paid_at, fulfilled_at, cancelled_at, refunded_at, warranty_started_at | timestamptz | |
| cancellation_requested_at, cancellation_request_reason | timestamptz/text | Never auto-cancels |
| cancellation_request_status | request_status | |

---

### order_items
Immutable snapshot — captured at payment time via Stripe webhook.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| order_id | uuid | FK → orders ON DELETE CASCADE |
| product_id | uuid | FK → products ON DELETE SET NULL |
| product_title, product_slug, product_sku | text | Snapshot |
| **product_serial_number** | text | Admin-only — excluded from customer_order_items view |
| **product_imei** | text | Admin-only — excluded from customer_order_items view |
| product_image_url | text | |
| unit_price | numeric(10,2) | CHECK ≥0 |
| quantity | int | DEFAULT 1 CHECK >0 |
| line_total | numeric(10,2) | CHECK ≥0 |
| device_brand, device_model, device_storage, device_color | text | Snapshot |
| device_condition | device_condition | Snapshot |
| battery_health | int | Snapshot |
| warranty_days | int | DEFAULT 30 — copied from product at order time |
| warranty_expires_at | timestamptz | |

Sequence: `order_number_seq` starts at 10001.

---

### device_intakes
RCW 19.60 compliance table.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| brand, model, storage, color | text | |
| condition | device_condition | |
| imei, serial_number | text | |
| **Seller Identity (RCW 19.60)** | | |
| seller_full_name | text | |
| seller_phone, seller_email | text | |
| seller_id_type | seller_id_type | |
| seller_id_number_encrypted | text | AES-256-GCM: `iv:authTag:ciphertext` — NEVER plaintext |
| seller_id_state | text | |
| seller_id_expiry | date | |
| seller_address | text | |
| seller_declaration_signed | boolean | DEFAULT false |
| seller_declaration_signed_at | timestamptz | |
| **Acquisition** | | |
| acquisition_source | text | 'individual_purchase' \| 'wholesale_supplier' \| etc. |
| acquisition_date | date | DEFAULT current_date |
| acquisition_payment_method | acquisition_payment_method | |
| cost | numeric(10,2) | Per-unit cost |
| supplier_notes | text | Invoice # etc. for wholesale |
| **Hold Period** | | |
| hold_until_date | date | acquisition_date + hold_period_days |
| hold_period_days | int | DEFAULT 3 (min per policy) |
| hold_period_waived | boolean | DEFAULT false |
| hold_period_waived_reason | text | |
| **Status** | | |
| status | intake_status | DEFAULT 'received' |
| **IMEI Verification** | | |
| imei_verification_status | verification_status | DEFAULT 'not_checked' |
| is_clean_imei | boolean | |
| is_blacklisted | boolean | |
| is_financed | boolean | |
| activation_lock_removed | boolean | DEFAULT false |
| imei_verification_service | text | 'IMEICheck.com' |
| **Testing Checklist (14 gates)** | | |
| testing_status | testing_status | DEFAULT 'not_started' |
| power_on_passed, touchscreen_passed, face_or_touch_id_passed | boolean | |
| cellular_passed, wifi_passed, bluetooth_passed | boolean | |
| cameras_passed, speakers_passed, microphone_passed | boolean | |
| buttons_passed, charging_port_passed | boolean | |
| screen_quality_passed, battery_passed, all_gates_passed | boolean | |
| tested_at | timestamptz | |
| **Publishing** | | |
| price, compare_at_price | numeric(10,2) | |
| warranty_days | int | DEFAULT 30 |
| featured_candidate | boolean | |
| created_by, updated_by | uuid | FK → auth.users |

DB Trigger (`enforce_intake_hold_period`, migration 012, fixed in 018):
Blocks `status → ready_to_list` if `hold_until_date > current_date AND coalesce(hold_period_waived, false) != true`.

---

### warranties
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| order_id | uuid | FK → orders |
| order_item_id | uuid | FK → order_items |
| product_id | uuid | FK → products ON DELETE SET NULL |
| product_title, customer_name, customer_email | text | Snapshot |
| customer_locale | text | |
| device_brand, device_model, device_imei, device_serial_number | text | Snapshot |
| active | boolean | DEFAULT true |
| warranty_days | int | |
| starts_at, expires_at | timestamptz | |
| claim_status | warranty_claim_status | DEFAULT 'none' |
| claim_description | text | |
| claim_submitted_at | timestamptz | |
| staff_notes | text | |

---

### coupons
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| code | text | UNIQUE NOT NULL |
| type | coupon_type | NOT NULL |
| value | numeric(10,2) | CHECK ≥0 |
| active | boolean | DEFAULT true |
| usage_limit | int | NULLABLE = unlimited |
| used_count | int | DEFAULT 0 CHECK ≥0 |
| minimum_order_amount | numeric(10,2) | |
| starts_at, expires_at | timestamptz | |

Atomic redemption: `UPDATE ... SET used_count = used_count + 1 WHERE code = ? AND active = true AND (usage_limit IS NULL OR used_count < usage_limit)`.

---

### webhook_events
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| stripe_event_id | text | UNIQUE — idempotency key |
| event_type | text | e.g. 'checkout.session.completed' |
| processed_at | timestamptz | DEFAULT now() |
| payload | jsonb | |

Check before processing any Stripe event. Insert after processing.

---

### admin_audit_logs
Append-only. No UPDATE or DELETE.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| actor_id | uuid | FK → auth.users NULLABLE |
| actor_email | text | |
| action | audit_action | |
| table_name | text | |
| record_id | text | |
| old_values, new_values | jsonb | Never include seller_id_number_encrypted |
| notes | text | |
| created_at | timestamptz | |

---

### settings
Single key-value store. Key = `'store'`.

```jsonb
{
  "store_name": "Wireless Connect",
  "store_address": "14723 Aurora Ave N, Shoreline, WA 98133",
  "store_phone": "206-423-2965",
  "store_email": "officialwirelessconnect@gmail.com",
  "store_hours": {
    "monday": "10:00-19:00",
    "tuesday": "10:00-19:00",
    "wednesday": "10:00-19:00",
    "thursday": "10:00-19:00",
    "friday": "10:00-19:00",
    "saturday": "10:00-18:00",
    "sunday": "closed"
  },
  "whatsapp_enabled": false,
  "whatsapp_number": "",
  "default_warranty_days": 30,
  "hold_period_days": 3,
  "stripe_tax_enabled": true,
  "shipping_insurance_threshold": 20000,
  "free_shipping_threshold": null,
  "pickup_enabled": true,
  "shipping_enabled": true
}
```

Read via `getStoreSettings()` (lib/data/settings.ts) — 60s in-memory cache.

---

### Phase 2 Tables (migration 017)

**repairs** — customer_name, customer_email, customer_phone, customer_locale, device_brand, device_model, device_issue, requested_service, customer_notes, status(repair_status DEFAULT 'requested'), appointment_start/end, staff_notes, user_id FK.

**trade_ins** — customer info, device_type, brand, model, storage, carrier, condition, battery_health, customer_description, status(trade_in_status DEFAULT 'submitted'), offer_amount, offer_notes, offer_sent_at, user_id FK.

**trade_in_images** — trade_in_id FK, image_url, is_approved(default false). Internal-only unless approved.

**reviews** — product_id FK, user_id FK, rating(1–5 CHECK), title, body, approved(boolean DEFAULT false). `getReviewSummaries()` returns Map for O(1) lookup. Only `approved = true` shown on storefront.

---

## VIEWS (migration 013)

### public_products
Selects from `products WHERE status = 'active'`. Excludes: `imei`, `serial_number`, `cost`, `acquisition_source`, `acquisition_date`, `internal_device_notes`, `imei_verified_by`, `tested_by`.
**Use for all storefront product queries.**

### customer_order_items
Selects from `order_items`. Excludes: `product_imei`, `product_serial_number`.
**Use for all customer-facing order detail queries.**

---

## TRIGGERS (migration 012, 018)

| Trigger | Table | Effect |
|---------|-------|--------|
| `set_updated_at` | All tables with updated_at | Auto-sets updated_at on UPDATE |
| `handle_new_user` | auth.users (INSERT) | Creates matching profiles row |
| `prevent_role_self_escalation` | profiles (UPDATE) | Raises error if auth.uid() tries to change own role |
| `enforce_intake_hold_period` | device_intakes (UPDATE) | Blocks status→ready_to_list if hold not elapsed and not waived (migration 018 fix) |

---

## KEY FUNCTIONS (migration 010)

```sql
public.is_admin_or_staff() RETURNS boolean  -- SECURITY DEFINER, search_path=public
public.is_admin() RETURNS boolean            -- SECURITY DEFINER, search_path=public
```

Used in RLS policies. Never trust JWT for role checks.
