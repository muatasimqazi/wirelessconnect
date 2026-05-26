# Supabase Database Setup

## Applying Migrations

Run migrations in order against your Supabase project. You can use the Supabase CLI or the SQL editor in the Supabase dashboard.

### Via Supabase CLI (recommended)

```bash
# Install CLI
brew install supabase/tap/supabase

# Link to your project (get project-ref from dashboard URL)
supabase link --project-ref your-project-ref

# Apply all migrations
supabase db push
```

### Via Supabase Dashboard SQL Editor

Run each file in order (001 → 015) in the SQL editor at:
`https://app.supabase.com/project/your-project/sql/new`

## Migration Order

| File | Contents |
|---|---|
| `001_extensions.sql` | pgcrypto, uuid-ossp |
| `002_enums.sql` | All enum types |
| `003_core_tables.sql` | Core MVP tables |
| `004_intake_tables.sql` | Device intake (RCW 19.60) |
| `005_warranty_tables.sql` | Warranty records |
| `006_webhook_events.sql` | Stripe webhook idempotency |
| `007_admin_audit_logs.sql` | Audit trail |
| `008_request_tables.sql` | Cancellation + CCPA deletion requests |
| `009_warranty_claim_images.sql` | Warranty evidence photos |
| `010_rls_helpers.sql` | is_admin_or_staff(), is_admin() |
| `011_rls_policies.sql` | RLS on all 19 tables |
| `012_triggers.sql` | updated_at, new_user, role protection, hold period |
| `013_views.sql` | public_products, customer_order_items |
| `014_storage_policies.sql` | Storage bucket creation + policies |
| `015_seed_data.sql` | 6 categories + store settings |

## After Migrations — Generate TypeScript Types

```bash
supabase gen types typescript --project-id your-project-id \
  --schema public > types/database.types.ts
```

This replaces the placeholder `types/database.types.ts` with accurate generated types.

## Storage Buckets

Migration 014 creates:
- `product-images` — public read, staff/admin write
- `device-intake-images` — private, staff/admin only
- `warranty-claim-images` — private, customer own + staff/admin

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SELLER_ID_ENCRYPTION_KEY` (for pgp_sym_encrypt on seller ID numbers)

## Supabase Auth SMTP (Resend)

Configure Supabase Auth to route password reset and magic link emails through Resend:

1. Supabase Dashboard → Settings → Auth → SMTP
2. Host: `smtp.resend.com`
3. Port: `465`
4. Username: `resend`
5. Password: your Resend API key
6. Sender email: `no-reply@wirelessconnectnw.com` (must be a verified Resend domain)
