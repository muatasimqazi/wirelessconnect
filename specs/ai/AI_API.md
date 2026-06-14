# AI_API.md
> All server actions, Stripe webhook, and external API contracts.
> All server actions are in `features/` or `app/` directories with `"use server"` directive.

---

## CONVENTIONS

- All server actions validated with Zod before DB access.
- Admin actions call `requireStaff()` or `requireAdmin()` as first statement.
- Mutations use `supabaseAdmin()` (service role, bypasses RLS).
- Read queries use `createClient()` (cookie-based RLS client).
- Return type: `{ error?: string; [result]?: T }` or `void`.

---

## AUTH ACTIONS

| Action | File | Notes |
|--------|------|-------|
| `signInAction(email, password)` | app/.../sign-in/actions.ts | Returns `{error?}` or void on success |
| `signUpAction(fullName, email, password, locale)` | app/.../sign-up/actions.ts | Sends welcome email (non-fatal). Supabase sends confirm email. |
| `signOut()` | features/account/actions.ts | Clears Supabase session |
| `updateProfile(data)` | features/account/actions.ts | Updates profiles row for current user |
| `updatePreferredLocale(locale)` | features/account/actions.ts | Sets preferred_locale |

---

## CHECKOUT

### `createCheckoutSession(input: CheckoutInput): Promise<CheckoutResult>`
File: `features/checkout/actions.ts`
Auth: None (public). Rate-limited: 10 attempts / 5 min / IP (Upstash).

```ts
interface CheckoutInput {
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  fulfillmentMethod: "pickup" | "shipping";
  couponCode?: string;
  customerLocale?: string;
}
interface CheckoutResult { error?: string; url?: string; }
```

Steps: validate → rate limit → load cart → re-fetch prices from `public_products` → validate stock → validate+redeem coupon → create pending order → create Stripe session → return url.
**Never trust client-provided prices. Never decrement inventory here.**

---

## CART ACTIONS

| Action | File | Notes |
|--------|------|-------|
| `addToCart(productId, quantity?)` | lib/cart/cart-actions.ts | Creates cart if none. Validates product active + in stock. |
| `removeCartItem(itemId)` | lib/cart/cart-actions.ts | |
| `updateCartItemQuantity(itemId, qty)` | lib/cart/cart-actions.ts | Validates qty ≤ available stock |
| `mergeGuestCart(userId)` | lib/cart/cart-actions.ts | Called in /auth/callback after login |

---

## CUSTOMER ACTIONS

| Action | File | Auth | Notes |
|--------|------|------|-------|
| `getCustomerOrders()` | features/orders/queries.ts | requireAuth | Joined with customer_order_items view |
| `getCustomerOrderByNumber(orderNumber)` | features/orders/queries.ts | requireAuth | IDOR protected |
| `submitWarrantyClaim(warrantyId, description)` | features/account/actions.ts | requireAuth | Own warranties only |
| `requestCancellation(orderId, reason)` | features/account/actions.ts | requireAuth | Creates request; never auto-cancels |
| `submitDataDeletion(email, reason)` | features/legal/data-deletion-action.ts | None | Rate-limited. Creates data_deletion_requests row. |
| `submitRepairRequest(data)` | features/repairs/actions.ts | Optional | Saves to repairs, sends admin email |
| `submitTradeIn(data)` | features/trade-in/actions.ts | Optional | Saves to trade_ins, sends admin email |

---

## ADMIN — PRODUCTS

| Action | File | Notes |
|--------|------|-------|
| `createProduct(input)` | features/admin/products/actions.ts | requireStaff |
| `updateProduct(id, input)` | features/admin/products/actions.ts | requireStaff. Writes audit log. |
| `uploadProductImage(productId, file)` | features/admin/products/actions.ts | requireStaff. Uploads to Supabase Storage. |
| `setPrimaryImage(imageId, productId)` | features/admin/products/actions.ts | requireStaff |
| `deleteProductImage(imageId)` | features/admin/products/actions.ts | requireStaff |
| `listStorageImages(prefix?)` | features/admin/products/actions.ts | requireStaff. Lists bucket, returns public URLs. |

---

## ADMIN — DEVICE INTAKES

### `createIntake(input: CreateIntakeInput): Promise<IntakeActionResult>`
File: `features/admin/intakes/actions.ts` — requireStaff.
- Encrypts `seller_id_number` → `seller_id_number_encrypted` (AES-256-GCM).
- Computes `hold_until_date = acquisition_date + hold_period_days`.
- Writes audit log.

### `createWholesaleBatch(supplier: WholesaleSupplier, devices: WholesaleDevice[]): Promise<{ error?, count? }>`
File: `features/admin/intakes/actions.ts` — requireStaff.
- No seller identity fields.
- `hold_period_waived = true`, `acquisition_source = 'wholesale_supplier'` auto-set.
- Bulk inserts all devices in one DB call.

### Other intake actions
| Action | Notes |
|--------|-------|
| `updateTestingChecklist(intakeId, data)` | requireStaff |
| `updateImeiVerification(intakeId, data)` | requireStaff |
| `checkPublishingGates(intakeId)` | requireStaff. Returns {pass, gates[]} for all 15 gates. |
| `convertIntakeToProduct(intakeId)` | requireStaff. All 15 gates must pass. Creates product + copies images. Writes audit log. |
| `waiveHoldPeriod(intakeId, reason)` | requireStaff. Sets hold_period_waived=true. Writes audit log. |
| `rejectIntake(intakeId, reason)` | requireStaff |

---

## ADMIN — ORDERS

### `updateOrderStatus(orderId, newStatus): Promise<OrderActionResult>`
File: `features/admin/orders/actions.ts` — requireStaff.
- Validates status transition against VALID_TRANSITIONS map.
- Requires `tracking_number` on order before `→ shipped`.
- Sends email on: `shipped` (tracking+carrier from order), `ready_for_pickup` (store address from settings), `cancelled`.

| Other action | Notes |
|-------------|-------|
| `updateShippingDetails(orderId, {tracking_number, shipping_carrier})` | requireStaff. Set before marking shipped. |
| `updateOrderAdminNotes(orderId, notes)` | requireStaff |
| `cancelOrder(orderId, reason)` | requireStaff. Sets cancelled_at. Sends cancellation email. |

Valid status transitions:
```
paid → processing | ready_for_pickup | cancelled
processing → ready_for_pickup | shipped | cancelled
ready_for_pickup → picked_up | cancelled
shipped → delivered | cancelled
```

---

## ADMIN — WARRANTIES

| Action | Notes |
|--------|-------|
| `updateWarrantyClaim(warrantyId, {claim_status, staff_notes})` | requireStaff. Sends warranty-claim email to customer. |
| `getAdminWarranties({approved?, limit?})` | requireStaff |

---

## ADMIN — USERS

### `updateUserRole(targetUserId: string, newRole: UserRole): Promise<UserActionResult>`
File: `features/admin/users/actions.ts` — **requireAdmin**.
- Cannot change own role (`currentAdmin.id === targetUserId` → error).
- Valid roles: `'customer' | 'staff' | 'admin'`.

---

## ADMIN — COUPONS

| Action | Notes |
|--------|-------|
| `createCoupon(input)` | requireStaff |
| `enableCoupon(id)` / `disableCoupon(id)` | requireStaff |

---

## ADMIN — SETTINGS

### `updateSettings(input): Promise<{ error? }>`
File: `features/admin/settings/actions.ts` — **requireAdmin**.
Updates the `settings` table key='store'. Clears `getStoreSettings()` cache.

---

## ADMIN — REVIEWS

| Action | Notes |
|--------|-------|
| `approveReview(id)` | requireStaff. Sets approved=true. |
| `deleteReview(id)` | requireStaff |
| `getAdminReviews({approved?, limit?})` | requireStaff |

---

## IMEI LOOKUP

### `imeiLookupAction(imei: string): Promise<ImeiLookupResult>`
File: `features/admin/imei/actions.ts` — requireStaff.

Calls `lookupImei()` in `lib/imei/lookup.ts`.

```ts
interface ImeiLookupResult {
  imei: string;
  valid: boolean;
  brand?: string;
  model?: string;
  storage?: string;
  color?: string;
  carrier?: string;
  serialNumber?: string;
  blacklistStatus?: "clean" | "blacklisted" | "unknown";
  simLock?: string;
  fmiOn?: boolean;
  error?: string;
  rawProperties?: Record<string, unknown>;
}
```

### IMEICheck.com External API

**Endpoint:** `GET https://alpha.imeicheck.com/api/php-api/create?key=KEY&service=SERVICE_ID&imei=IMEI`
Auth: `key` query parameter (NOT Bearer header).
Response on error: `{"status":"error","response":"Credit Error"}` — check account balance.
Response on success: `{ object: { brand, model, ... } }` or `{ object: false }` if service doesn't support device type.

| Service ID | Purpose | Cost | Coverage |
|-----------|---------|------|----------|
| 11 | IMEI to Brand/Model/Name | $0.01 | All brands |
| 5 | Blacklist Status (GSMA) | $0.02 | All brands |
| 1 | Find My iPhone ON/OFF | $0.01 | Apple only |

Three calls run in **parallel**. Total: $0.03 non-Apple, $0.04 Apple.
Service 1 result discarded for non-Apple devices.
Apple brand detected when `blProps.brand === "APPLE"` (normalized to "Apple") or `props.isAppleDevice === true`.

---

## STRIPE WEBHOOK

**Route:** `POST /api/stripe/webhook`
**Signature:** Verified using `STRIPE_WEBHOOK_SECRET` before any processing.

### checkout.session.completed
1. Check `webhook_events` — skip if duplicate.
2. Fetch Stripe session + line items.
3. Re-fetch product details from DB.
4. Create `order_items` (immutable snapshot).
5. Decrement inventory: `UPDATE products SET quantity = quantity - 1 WHERE id = ? AND quantity > 0`.
6. Create `warranties` from order_item snapshots.
7. Update order: `status='paid'`, `payment_status='paid'`, `paid_at=now()`.
8. Send order confirmation email (customer locale).
9. Send admin new-order notification.
10. Insert into `webhook_events`.

### checkout.session.expired
Release inventory reservations (if any). Update order status.

### payment_intent.payment_failed
Update `payment_status = 'failed'` on order.

---

## PRODUCT DATA QUERIES

### `getProducts(options): Promise<{ products: ProductWithImage[], total: number }>`
File: `lib/data/products.ts`
- **Always queries `public_products` view** (never base `products` table).
- Search: `ILIKE` on title, brand, model.
- Sort: featured | newest | price_asc | price_desc | best_condition.
- Returns `ProductWithImage` (public product + `primaryImageUrl: string | null`).

### `getProductBySlug(slug): Promise<ProductWithImage | null>`
Uses `public_products` view. Includes primary image join.

### `getFeaturedProducts(limit): Promise<ProductWithImage[]>`
Queries `public_products WHERE featured = true AND status = 'active'`.

---

## REVIEW SUMMARIES

### `getReviewSummaries(productIds: string[]): Promise<Map<string, { avgRating: number; reviewCount: number }>>`
File: `features/reviews/actions.ts`
Single DB query: `.from("reviews").select("product_id, rating").in("product_id", productIds).eq("approved", true)`.
Aggregates in JS. Returns Map for O(1) card lookup. No N+1 problem.

---

## SETTINGS

### `getStoreSettings(): Promise<StoreSettings>`
File: `lib/data/settings.ts`
60-second in-memory cache. Falls back to defaults if DB unavailable.
Returns: store_name, store_address, store_phone, store_email, store_hours, whatsapp_enabled, whatsapp_number, default_warranty_days, hold_period_days, stripe_tax_enabled, shipping_insurance_threshold.

---

## EMAIL TEMPLATES

All templates: `lib/email/templates/`. All support EN + ES via `locale` param.

| Template | Trigger |
|----------|---------|
| `welcome.ts` | Signup — `signUpAction()` |
| `order-confirmation.ts` | Stripe webhook: checkout.session.completed |
| `order-shipped.ts` | Admin: `updateOrderStatus → shipped` |
| `order-pickup-ready.ts` | Admin: `updateOrderStatus → ready_for_pickup`. Pulls store address from settings. |
| `order-cancellation.ts` | Admin: `updateOrderStatus → cancelled` |
| `warranty-claim.ts` | Admin: `updateWarrantyClaim()` — sent on any status change |
| `admin-new-order.ts` | Stripe webhook: new order notification to admin |

Sent via `sendEmail()` in `lib/email/send.ts`. FROM: `orders@wirelessconnectstore.com`. Gracefully skips if `RESEND_API_KEY` not set.
