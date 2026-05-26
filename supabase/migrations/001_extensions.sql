-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 001: Required Postgres Extensions
-- Database Schema Specification §3
-- ─────────────────────────────────────────────────────────────────────────────

-- pgcrypto: Used for pgp_sym_encrypt (seller government ID encryption, RCW 19.60 compliance)
-- and gen_random_uuid() for UUID generation
create extension if not exists "pgcrypto";

-- uuid-ossp: Fallback UUID generation (pgcrypto's gen_random_uuid is preferred)
create extension if not exists "uuid-ossp";
