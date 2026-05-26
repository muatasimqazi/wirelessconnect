-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 002: Enum Types
-- Database Schema Specification §5
--
-- IMPORTANT: Do NOT add CHECK constraints to locale columns.
-- Locale values ('en', 'es', etc.) are validated at the application layer only.
-- This allows adding future languages without a schema migration.
-- ─────────────────────────────────────────────────────────────────────────────

create type user_role as enum ('customer', 'staff', 'admin');

create type product_category_type as enum (
  'phone',
  'tablet',
  'laptop',
  'accessory',
  'other'
);

create type device_condition as enum (
  'like_new',
  'excellent',
  'good',
  'fair'
);

create type product_status as enum (
  'draft',
  'active',
  'archived',
  'sold_out'
);

create type intake_status as enum (
  'received',
  'testing',
  'needs_imei_check',
  'needs_photos',
  'hold_period',
  'ready_to_list',
  'converted_to_product',
  'rejected'
);

create type verification_status as enum (
  'not_checked',
  'passed',
  'failed',
  'needs_review'
);

create type testing_status as enum (
  'not_started',
  'in_progress',
  'passed',
  'failed',
  'needs_review'
);

create type carrier_type as enum (
  'unlocked',
  'att',
  'verizon',
  'tmobile',
  'sprint',
  'other',
  'unknown'
);

create type order_status as enum (
  'pending',
  'paid',
  'processing',
  'ready_for_pickup',
  'shipped',
  'delivered',
  'picked_up',
  'cancelled',
  'refunded'
);

create type fulfillment_method as enum (
  'pickup',
  'shipping'
);

create type payment_status as enum (
  'unpaid',
  'paid',
  'failed',
  'refunded',
  'partially_refunded'
);

create type warranty_claim_status as enum (
  'none',
  'submitted',
  'under_review',
  'approved',
  'denied',
  'resolved'
);

create type request_status as enum (
  'submitted',
  'under_review',
  'approved',
  'denied',
  'completed',
  'cancelled'
);

create type coupon_type as enum (
  'percentage',
  'fixed_amount',
  'free_shipping'
);

create type seller_id_type as enum (
  'drivers_license',
  'state_id',
  'passport',
  'military_id',
  'other'
);

create type acquisition_payment_method as enum (
  'cash',
  'check',
  'zelle',
  'venmo',
  'store_credit',
  'other'
);

create type audit_action as enum (
  'create',
  'update',
  'delete',
  'status_change',
  'role_change',
  'login',
  'export',
  'request_submitted'
);

-- Phase 2 enums (created now to avoid future migration conflicts)
create type repair_status as enum (
  'requested',
  'confirmed',
  'received',
  'in_progress',
  'waiting_on_parts',
  'ready_for_pickup',
  'completed',
  'cancelled'
);

create type trade_in_status as enum (
  'submitted',
  'under_review',
  'offer_sent',
  'accepted',
  'rejected',
  'expired',
  'completed'
);
