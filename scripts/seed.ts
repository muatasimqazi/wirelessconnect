/**
 * Database seed script — Wireless Connect
 *
 * Run:  pnpm seed
 * Env:  reads .env.local automatically
 *
 * Seeds:
 *  ▸ 5 categories (phones, tablets, accessories)
 *  ▸ 10 products (iPhones, Samsung, Pixel) with images
 *  ▸ 3 coupons
 *  ▸ 5 orders in various states + order items
 *  ▸ 1 warranty (for delivered order)
 *  ▸ 3 device intakes (received → ready_to_list)
 *
 * Safe to re-run — uses upsert (on_conflict: nothing) for idempotency.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";
import ws from "ws";

// ── Load .env.local ───────────────────────────────────────────────────────────
config({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  // Node 20 lacks native WebSocket — provide via the 'ws' package
  realtime: { transport: ws } as never,
});

// ── Cleanup (delete previous seed data in FK-safe order) ─────────────────────

async function cleanup() {
  // Delete in reverse-dependency order so FK constraints don't block
  await supabase.from("warranties").delete().in("id", ["e2000001-0000-0000-0000-000000000001"]);
  await supabase.from("order_items").delete().in("id", [
    "d1000001-0000-0000-0000-000000000001",
    "d1000002-0000-0000-0000-000000000002",
    "d1000003-0000-0000-0000-000000000003",
    "d1000004-0000-0000-0000-000000000004",
    "d1000005-0000-0000-0000-000000000005",
  ]);
  await supabase.from("orders").delete().in("id", [
    "c1000001-0000-0000-0000-000000000001",
    "c1000002-0000-0000-0000-000000000002",
    "c1000003-0000-0000-0000-000000000003",
    "c1000004-0000-0000-0000-000000000004",
    "c1000005-0000-0000-0000-000000000005",
  ]);
  await supabase.from("addresses").delete().in("id", [
    "a2000001-0000-0000-0000-000000000001",
    "a2000002-0000-0000-0000-000000000002",
    "a2000003-0000-0000-0000-000000000003",
  ]);
  await supabase.from("product_images").delete().in("id", [
    "e1000001-0000-0000-0000-000000000001",
    "e1000002-0000-0000-0000-000000000002",
    "e1000003-0000-0000-0000-000000000003",
    "e1000004-0000-0000-0000-000000000004",
    "e1000005-0000-0000-0000-000000000005",
    "e1000006-0000-0000-0000-000000000006",
    "e1000007-0000-0000-0000-000000000007",
    "e1000008-0000-0000-0000-000000000008",
    "e1000009-0000-0000-0000-000000000009",
    "e100000a-0000-0000-0000-00000000000a",
  ]);
  await supabase.from("device_intakes").delete().in("id", [
    "f2000001-0000-0000-0000-000000000001",
    "f2000002-0000-0000-0000-000000000002",
    "f2000003-0000-0000-0000-000000000003",
  ]);
  await supabase.from("products").delete().in("id", [
    "b1000001-0000-0000-0000-000000000001",
    "b1000002-0000-0000-0000-000000000002",
    "b1000003-0000-0000-0000-000000000003",
    "b1000004-0000-0000-0000-000000000004",
    "b1000005-0000-0000-0000-000000000005",
    "b1000006-0000-0000-0000-000000000006",
    "b1000007-0000-0000-0000-000000000007",
    "b1000008-0000-0000-0000-000000000008",
    "b1000009-0000-0000-0000-000000000009",
    "b100000a-0000-0000-0000-00000000000a",
  ]);
  await supabase.from("categories").delete().in("slug", [
    "iphones", "samsung", "google-pixel", "tablets", "accessories",
  ]);
  await supabase.from("coupons").delete().in("id", [
    "f1000001-0000-0000-0000-000000000001",
    "f1000002-0000-0000-0000-000000000002",
    "f1000003-0000-0000-0000-000000000003",
  ]);
  console.log("  ✓ cleaned up previous seed data");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function daysAgo(days: number) {
  return daysFromNow(-days);
}

// ── IDs (stable across re-runs) ───────────────────────────────────────────────

// All IDs follow standard UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
const CAT = {
  iphone:    "ca000001-0000-0000-0000-000000000001",
  samsung:   "ca000002-0000-0000-0000-000000000002",
  pixel:     "ca000003-0000-0000-0000-000000000003",
  tablets:   "ca000004-0000-0000-0000-000000000004",
  accessory: "ca000005-0000-0000-0000-000000000005",
};

const PROD = {
  iphone15pm:  "b1000001-0000-0000-0000-000000000001",
  iphone14pro: "b1000002-0000-0000-0000-000000000002",
  iphone13:    "b1000003-0000-0000-0000-000000000003",
  s24ultra:    "b1000004-0000-0000-0000-000000000004",
  s23plus:     "b1000005-0000-0000-0000-000000000005",
  pixel8pro:   "b1000006-0000-0000-0000-000000000006",
  pixel7:      "b1000007-0000-0000-0000-000000000007",
  iphone12:    "b1000008-0000-0000-0000-000000000008",
  galaxyA54:   "b1000009-0000-0000-0000-000000000009",
  pixel8a:     "b100000a-0000-0000-0000-00000000000a",
};

const ORDER = {
  wc1001: "c1000001-0000-0000-0000-000000000001",
  wc1002: "c1000002-0000-0000-0000-000000000002",
  wc1003: "c1000003-0000-0000-0000-000000000003",
  wc1004: "c1000004-0000-0000-0000-000000000004",
  wc1005: "c1000005-0000-0000-0000-000000000005",
};

const ITEM = {
  item1: "d1000001-0000-0000-0000-000000000001",
  item2: "d1000002-0000-0000-0000-000000000002",
  item3: "d1000003-0000-0000-0000-000000000003",
  item4: "d1000004-0000-0000-0000-000000000004",
  item5: "d1000005-0000-0000-0000-000000000005",
};

// ── 1. Categories ─────────────────────────────────────────────────────────────

async function seedCategories() {
  const categories = [
    {
      id: CAT.iphone,
      name: "iPhones",
      slug: "iphones",
      type: "phone",
      sort_order: 1,
      active: true,
      translations: { es: { name: "iPhones", description: "iPhones usados y reacondicionados" } },
      description: "Certified pre-owned iPhones — tested, cleaned, and ready to use.",
    },
    {
      id: CAT.samsung,
      name: "Samsung",
      slug: "samsung",
      type: "phone",
      sort_order: 2,
      active: true,
      translations: { es: { name: "Samsung", description: "Teléfonos Samsung usados y reacondicionados" } },
      description: "Pre-owned Samsung Galaxy phones — unlocked and fully tested.",
    },
    {
      id: CAT.pixel,
      name: "Google Pixel",
      slug: "google-pixel",
      type: "phone",
      sort_order: 3,
      active: true,
      translations: { es: { name: "Google Pixel", description: "Teléfonos Google Pixel usados y reacondicionados" } },
      description: "Pre-owned Google Pixel phones — the cleanest Android experience.",
    },
    {
      id: CAT.tablets,
      name: "Tablets",
      slug: "tablets",
      type: "tablet",
      sort_order: 4,
      active: true,
      translations: { es: { name: "Tabletas", description: "Tabletas usadas y reacondicionadas" } },
      description: "Pre-owned tablets — iPads and Android tablets.",
    },
    {
      id: CAT.accessory,
      name: "Accessories",
      slug: "accessories",
      type: "accessory",
      sort_order: 5,
      active: true,
      translations: { es: { name: "Accesorios", description: "Accesorios para dispositivos móviles" } },
      description: "Cables, cases, chargers, and more.",
    },
  ];

  const { error } = await supabase.from("categories").upsert(categories, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw new Error(`categories: ${error.message}`);
  console.log(`  ✓ ${categories.length} categories`);
}

// ── 2. Products ───────────────────────────────────────────────────────────────

async function seedProducts() {
  const products = [
    // ── iPhones ──
    {
      id: PROD.iphone15pm,
      title: "iPhone 15 Pro Max 256GB",
      subtitle: "Natural Titanium · Unlocked",
      slug: "iphone-15-pro-max-256gb-natural-titanium",
      brand: "Apple",
      model: "iPhone 15 Pro Max",
      storage: "256GB",
      color: "Natural Titanium",
      price: 79900,
      compare_at_price: 119900,
      condition: "like_new",
      status: "active",
      category_id: CAT.iphone,
      category_type: "phone",
      carrier: "unlocked",
      is_unlocked: true,
      battery_health: 98,
      battery_cycle_count: 12,
      warranty_days: 90,
      quantity: 1,
      featured: true,
      is_tested: true,
      testing_status: "passed",
      is_data_wiped: true,
      factory_reset_verified: true,
      activation_lock_removed: true,
      is_clean_imei: true,
      imei_verification_status: "passed",
      imei: "351234567890123",
      serial_number: "F2LXK4NABC1",
      sku: "IP15PM-256-NT-001",
      includes_charger: false,
      includes_cable: true,
      allow_pickup: true,
      allow_shipping: true,
      description: "Excellent condition iPhone 15 Pro Max in Natural Titanium. Titanium frame, A17 Pro chip, 48MP camera system, USB-C, Action Button. Battery health 98%. Barely used — no scratches on screen, light handling marks on frame. Data wiped and factory reset.",
      seo_title: "iPhone 15 Pro Max 256GB Natural Titanium — Pre-Owned | Wireless Connect",
      seo_description: "Buy a certified pre-owned iPhone 15 Pro Max 256GB in Natural Titanium. Battery health 98%, fully unlocked, 90-day warranty. Shoreline, WA.",
      translations: {
        es: {
          title: "iPhone 15 Pro Max 256GB",
          subtitle: "Titanio Natural · Desbloqueado",
          description: "iPhone 15 Pro Max en excelente estado. Marco de titanio, chip A17 Pro, cámara de 48MP, USB-C. Salud de batería 98%.",
        },
      },
      seo_translations: {},
    },
    {
      id: PROD.iphone14pro,
      title: "iPhone 14 Pro 128GB",
      subtitle: "Deep Purple · Unlocked",
      slug: "iphone-14-pro-128gb-deep-purple",
      brand: "Apple",
      model: "iPhone 14 Pro",
      storage: "128GB",
      color: "Deep Purple",
      price: 54900,
      compare_at_price: 99900,
      condition: "excellent",
      status: "active",
      category_id: CAT.iphone,
      category_type: "phone",
      carrier: "unlocked",
      is_unlocked: true,
      battery_health: 91,
      battery_cycle_count: 87,
      warranty_days: 90,
      quantity: 1,
      featured: false,
      is_tested: true,
      testing_status: "passed",
      is_data_wiped: true,
      factory_reset_verified: true,
      activation_lock_removed: true,
      is_clean_imei: true,
      imei_verification_status: "passed",
      imei: "351234567890124",
      serial_number: "F1MXK4NABC2",
      sku: "IP14P-128-DP-001",
      includes_charger: false,
      includes_cable: true,
      allow_pickup: true,
      allow_shipping: true,
      description: "iPhone 14 Pro in Deep Purple with Dynamic Island, 48MP main camera, Always-On display, and A16 Bionic chip. Minor wear on frame, screen is flawless. Battery at 91%. Fully unlocked and ready to activate.",
      seo_title: "iPhone 14 Pro 128GB Deep Purple — Pre-Owned | Wireless Connect",
      seo_description: "Pre-owned iPhone 14 Pro 128GB Deep Purple. Battery 91%, Dynamic Island, unlocked. 90-day warranty. Shoreline, WA.",
      translations: { es: { title: "iPhone 14 Pro 128GB", subtitle: "Morado Oscuro · Desbloqueado", description: "iPhone 14 Pro en color Morado Oscuro con Dynamic Island. Batería al 91%." } },
      seo_translations: {},
    },
    {
      id: PROD.iphone13,
      title: "iPhone 13 128GB",
      subtitle: "Midnight · Unlocked",
      slug: "iphone-13-128gb-midnight",
      brand: "Apple",
      model: "iPhone 13",
      storage: "128GB",
      color: "Midnight",
      price: 34900,
      compare_at_price: 79900,
      condition: "good",
      status: "active",
      category_id: CAT.iphone,
      category_type: "phone",
      carrier: "unlocked",
      is_unlocked: true,
      battery_health: 84,
      battery_cycle_count: 210,
      warranty_days: 90,
      quantity: 2,
      featured: false,
      is_tested: true,
      testing_status: "passed",
      is_data_wiped: true,
      factory_reset_verified: true,
      activation_lock_removed: true,
      is_clean_imei: true,
      imei_verification_status: "passed",
      imei: "351234567890125",
      serial_number: "F0NXK4NABC3",
      sku: "IP13-128-MN-001",
      includes_charger: false,
      includes_cable: false,
      allow_pickup: true,
      allow_shipping: true,
      description: "iPhone 13 in Midnight with A15 Bionic, improved 12MP dual cameras, and 5G. Good condition with light scratches on the back and frame — no cracks. Screen is clean. Battery at 84%.",
      seo_title: "iPhone 13 128GB Midnight — Pre-Owned | Wireless Connect",
      seo_description: "Pre-owned iPhone 13 128GB Midnight. Good condition, battery 84%, unlocked. 90-day warranty. Shoreline, WA.",
      translations: { es: { title: "iPhone 13 128GB", subtitle: "Medianoche · Desbloqueado", description: "iPhone 13 en Medianoche. Buena condición, batería al 84%." } },
      seo_translations: {},
    },
    {
      id: PROD.iphone12,
      title: "iPhone 12 64GB",
      subtitle: "Blue · Unlocked",
      slug: "iphone-12-64gb-blue",
      brand: "Apple",
      model: "iPhone 12",
      storage: "64GB",
      color: "Blue",
      price: 24900,
      compare_at_price: 69900,
      condition: "good",
      status: "active",
      category_id: CAT.iphone,
      category_type: "phone",
      carrier: "unlocked",
      is_unlocked: true,
      battery_health: 82,
      battery_cycle_count: 290,
      warranty_days: 60,
      quantity: 1,
      featured: false,
      is_tested: true,
      testing_status: "passed",
      is_data_wiped: true,
      factory_reset_verified: true,
      activation_lock_removed: true,
      is_clean_imei: true,
      imei_verification_status: "passed",
      imei: "351234567890126",
      serial_number: "G9OXK4NABC4",
      sku: "IP12-64-BL-001",
      includes_charger: false,
      includes_cable: false,
      allow_pickup: true,
      allow_shipping: true,
      description: "iPhone 12 in Blue. 5G capable, OLED Super Retina XDR display, A14 Bionic chip, MagSafe compatible. Good condition with normal wear. Battery at 82%.",
      seo_title: "iPhone 12 64GB Blue — Pre-Owned | Wireless Connect",
      seo_description: "Pre-owned iPhone 12 64GB Blue. Good condition, battery 82%, 5G, unlocked. 60-day warranty. Shoreline, WA.",
      translations: { es: { title: "iPhone 12 64GB", subtitle: "Azul · Desbloqueado", description: "iPhone 12 Azul con 5G y MagSafe. Batería al 82%." } },
      seo_translations: {},
    },

    // ── Samsung ──
    {
      id: PROD.s24ultra,
      title: "Samsung Galaxy S24 Ultra 256GB",
      subtitle: "Titanium Black · Unlocked",
      slug: "samsung-galaxy-s24-ultra-256gb-titanium-black",
      brand: "Samsung",
      model: "Galaxy S24 Ultra",
      storage: "256GB",
      color: "Titanium Black",
      price: 74900,
      compare_at_price: 129999,
      condition: "like_new",
      status: "active",
      category_id: CAT.samsung,
      category_type: "phone",
      carrier: "unlocked",
      is_unlocked: true,
      battery_health: 97,
      battery_cycle_count: 8,
      warranty_days: 90,
      quantity: 1,
      featured: true,
      is_tested: true,
      testing_status: "passed",
      is_data_wiped: true,
      factory_reset_verified: true,
      activation_lock_removed: true,
      is_clean_imei: true,
      imei_verification_status: "passed",
      imei: "352345678901234",
      serial_number: "R3CMKG4ABC1",
      sku: "SGS24U-256-TB-001",
      includes_charger: false,
      includes_cable: true,
      allow_pickup: true,
      allow_shipping: true,
      description: "Like-new Samsung Galaxy S24 Ultra in Titanium Black. Built-in S Pen, 200MP camera, Snapdragon 8 Gen 3, 12GB RAM, 5000mAh battery. Barely used — screen protector still on. Battery at 97%.",
      seo_title: "Samsung Galaxy S24 Ultra 256GB Titanium Black — Pre-Owned | Wireless Connect",
      seo_description: "Pre-owned Samsung Galaxy S24 Ultra 256GB. Like new, S Pen included, battery 97%, unlocked. 90-day warranty. Shoreline, WA.",
      translations: { es: { title: "Samsung Galaxy S24 Ultra 256GB", subtitle: "Negro Titanio · Desbloqueado", description: "Samsung Galaxy S24 Ultra en Negro Titanio. Como nuevo, S Pen incluido. Batería al 97%." } },
      seo_translations: {},
    },
    {
      id: PROD.s23plus,
      title: "Samsung Galaxy S23+ 128GB",
      subtitle: "Phantom Black · Unlocked",
      slug: "samsung-galaxy-s23-plus-128gb-phantom-black",
      brand: "Samsung",
      model: "Galaxy S23+",
      storage: "128GB",
      color: "Phantom Black",
      price: 44900,
      compare_at_price: 99999,
      condition: "excellent",
      status: "active",
      category_id: CAT.samsung,
      category_type: "phone",
      carrier: "unlocked",
      is_unlocked: true,
      battery_health: 93,
      battery_cycle_count: 55,
      warranty_days: 90,
      quantity: 1,
      featured: false,
      is_tested: true,
      testing_status: "passed",
      is_data_wiped: true,
      factory_reset_verified: true,
      activation_lock_removed: true,
      is_clean_imei: true,
      imei_verification_status: "passed",
      imei: "352345678901235",
      serial_number: "R2CMKG4ABC2",
      sku: "SGS23P-128-PB-001",
      includes_charger: false,
      includes_cable: true,
      allow_pickup: true,
      allow_shipping: true,
      description: "Samsung Galaxy S23+ in Phantom Black. 6.6\" Dynamic AMOLED, Snapdragon 8 Gen 2, 50MP camera system. Excellent condition — minimal wear. Battery at 93%.",
      seo_title: "Samsung Galaxy S23+ 128GB Phantom Black — Pre-Owned | Wireless Connect",
      seo_description: "Pre-owned Samsung Galaxy S23+ 128GB. Excellent condition, battery 93%, unlocked. 90-day warranty. Shoreline, WA.",
      translations: { es: { title: "Samsung Galaxy S23+ 128GB", subtitle: "Negro Fantasma · Desbloqueado", description: "Samsung Galaxy S23+ en excelente condición. Batería al 93%." } },
      seo_translations: {},
    },
    {
      id: PROD.galaxyA54,
      title: "Samsung Galaxy A54 128GB",
      subtitle: "Awesome Black · Unlocked",
      slug: "samsung-galaxy-a54-128gb-awesome-black",
      brand: "Samsung",
      model: "Galaxy A54",
      storage: "128GB",
      color: "Awesome Black",
      price: 22900,
      compare_at_price: 44999,
      condition: "excellent",
      status: "active",
      category_id: CAT.samsung,
      category_type: "phone",
      carrier: "unlocked",
      is_unlocked: true,
      battery_health: 95,
      battery_cycle_count: 42,
      warranty_days: 60,
      quantity: 2,
      featured: false,
      is_tested: true,
      testing_status: "passed",
      is_data_wiped: true,
      factory_reset_verified: true,
      activation_lock_removed: true,
      is_clean_imei: true,
      imei_verification_status: "passed",
      imei: "352345678901236",
      serial_number: "R1CMKG4ABC3",
      sku: "SGA54-128-AB-001",
      includes_charger: false,
      includes_cable: true,
      allow_pickup: true,
      allow_shipping: true,
      description: "Great value Samsung Galaxy A54 — the mid-range champion. 6.4\" Super AMOLED, 50MP OIS camera, 5000mAh battery, 5G. Excellent condition with battery at 95%. 4 years of OS updates remaining.",
      seo_title: "Samsung Galaxy A54 128GB Awesome Black — Pre-Owned | Wireless Connect",
      seo_description: "Pre-owned Samsung Galaxy A54 128GB. Excellent condition, battery 95%, 5G, unlocked. 60-day warranty. Shoreline, WA.",
      translations: { es: { title: "Samsung Galaxy A54 128GB", subtitle: "Negro Impresionante · Desbloqueado", description: "Samsung Galaxy A54 en excelente condición. Batería al 95%." } },
      seo_translations: {},
    },

    // ── Google Pixel ──
    {
      id: PROD.pixel8pro,
      title: "Google Pixel 8 Pro 128GB",
      subtitle: "Obsidian · Unlocked",
      slug: "google-pixel-8-pro-128gb-obsidian",
      brand: "Google",
      model: "Pixel 8 Pro",
      storage: "128GB",
      color: "Obsidian",
      price: 59900,
      compare_at_price: 99900,
      condition: "like_new",
      status: "active",
      category_id: CAT.pixel,
      category_type: "phone",
      carrier: "unlocked",
      is_unlocked: true,
      battery_health: 99,
      battery_cycle_count: 5,
      warranty_days: 90,
      quantity: 1,
      featured: true,
      is_tested: true,
      testing_status: "passed",
      is_data_wiped: true,
      factory_reset_verified: true,
      activation_lock_removed: true,
      is_clean_imei: true,
      imei_verification_status: "passed",
      imei: "353456789012345",
      serial_number: "PX8P3NABC1",
      sku: "GP8P-128-OB-001",
      includes_charger: false,
      includes_cable: true,
      allow_pickup: true,
      allow_shipping: true,
      description: "Like-new Google Pixel 8 Pro in Obsidian. Google Tensor G3 chip, 50MP triple camera, Temperature sensor, 7 years of OS updates. Battery at 99% — essentially brand new. 6-month Google warranty still valid.",
      seo_title: "Google Pixel 8 Pro 128GB Obsidian — Pre-Owned | Wireless Connect",
      seo_description: "Pre-owned Google Pixel 8 Pro 128GB. Like new, battery 99%, 7-year updates, unlocked. 90-day warranty. Shoreline, WA.",
      translations: { es: { title: "Google Pixel 8 Pro 128GB", subtitle: "Obsidiana · Desbloqueado", description: "Google Pixel 8 Pro como nuevo en Obsidiana. Batería al 99%." } },
      seo_translations: {},
    },
    {
      id: PROD.pixel7,
      title: "Google Pixel 7 128GB",
      subtitle: "Snow · Unlocked",
      slug: "google-pixel-7-128gb-snow",
      brand: "Google",
      model: "Pixel 7",
      storage: "128GB",
      color: "Snow",
      price: 29900,
      compare_at_price: 59900,
      condition: "excellent",
      status: "active",
      category_id: CAT.pixel,
      category_type: "phone",
      carrier: "unlocked",
      is_unlocked: true,
      battery_health: 90,
      battery_cycle_count: 110,
      warranty_days: 90,
      quantity: 1,
      featured: false,
      is_tested: true,
      testing_status: "passed",
      is_data_wiped: true,
      factory_reset_verified: true,
      activation_lock_removed: true,
      is_clean_imei: true,
      imei_verification_status: "passed",
      imei: "353456789012346",
      serial_number: "PX73NABC2",
      sku: "GP7-128-SW-001",
      includes_charger: false,
      includes_cable: false,
      allow_pickup: true,
      allow_shipping: true,
      description: "Google Pixel 7 in Snow. Google Tensor G2, 50MP camera with Magic Eraser, 5G. Excellent condition. Battery at 90%. 5 years of OS and security updates.",
      seo_title: "Google Pixel 7 128GB Snow — Pre-Owned | Wireless Connect",
      seo_description: "Pre-owned Google Pixel 7 128GB Snow. Excellent condition, battery 90%, unlocked. 90-day warranty. Shoreline, WA.",
      translations: { es: { title: "Google Pixel 7 128GB", subtitle: "Nieve · Desbloqueado", description: "Google Pixel 7 en Nieve. Excelente condición, batería al 90%." } },
      seo_translations: {},
    },
    {
      id: PROD.pixel8a,
      title: "Google Pixel 8a 128GB",
      subtitle: "Aloe · Unlocked",
      slug: "google-pixel-8a-128gb-aloe",
      brand: "Google",
      model: "Pixel 8a",
      storage: "128GB",
      color: "Aloe",
      price: 39900,
      compare_at_price: 49900,
      condition: "excellent",
      status: "active",
      category_id: CAT.pixel,
      category_type: "phone",
      carrier: "unlocked",
      is_unlocked: true,
      battery_health: 96,
      battery_cycle_count: 28,
      warranty_days: 90,
      quantity: 1,
      featured: false,
      is_tested: true,
      testing_status: "passed",
      is_data_wiped: true,
      factory_reset_verified: true,
      activation_lock_removed: true,
      is_clean_imei: true,
      imei_verification_status: "passed",
      imei: "353456789012347",
      serial_number: "PX8A3NABC3",
      sku: "GP8A-128-AL-001",
      includes_charger: false,
      includes_cable: true,
      allow_pickup: true,
      allow_shipping: true,
      description: "Google Pixel 8a in the exclusive Aloe green. Google Tensor G3, 64MP camera, 7 years of updates, IP67 water resistance. Near new — battery at 96%.",
      seo_title: "Google Pixel 8a 128GB Aloe — Pre-Owned | Wireless Connect",
      seo_description: "Pre-owned Google Pixel 8a 128GB Aloe. Excellent condition, battery 96%, 7-year updates, unlocked. 90-day warranty. Shoreline, WA.",
      translations: { es: { title: "Google Pixel 8a 128GB", subtitle: "Aloe · Desbloqueado", description: "Google Pixel 8a en Aloe. Excelente condición, batería al 96%." } },
      seo_translations: {},
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from("products").upsert(products as any, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw new Error(`products: ${error.message}`);
  console.log(`  ✓ ${products.length} products`);
}

// ── 3. Product Images ─────────────────────────────────────────────────────────

async function seedProductImages() {
  // Using placehold.co for seed images — swap with real Supabase Storage URLs in production
  const images = [
    {
      id: "e1000001-0000-0000-0000-000000000001",
      product_id: PROD.iphone15pm,
      image_url: "https://placehold.co/800x800/1a1a1a/ffffff?text=iPhone+15+Pro+Max",
      is_primary: true,
      sort_order: 0,
      alt_text: "iPhone 15 Pro Max Natural Titanium",
      alt_text_translations: { es: { alt_text: "iPhone 15 Pro Max Titanio Natural" } },
    },
    {
      id: "e1000002-0000-0000-0000-000000000002",
      product_id: PROD.iphone14pro,
      image_url: "https://placehold.co/800x800/2d1b4e/ffffff?text=iPhone+14+Pro",
      is_primary: true,
      sort_order: 0,
      alt_text: "iPhone 14 Pro Deep Purple",
      alt_text_translations: { es: { alt_text: "iPhone 14 Pro Morado Oscuro" } },
    },
    {
      id: "e1000003-0000-0000-0000-000000000003",
      product_id: PROD.iphone13,
      image_url: "https://placehold.co/800x800/1c1c1e/ffffff?text=iPhone+13",
      is_primary: true,
      sort_order: 0,
      alt_text: "iPhone 13 Midnight",
      alt_text_translations: { es: { alt_text: "iPhone 13 Medianoche" } },
    },
    {
      id: "e1000004-0000-0000-0000-000000000004",
      product_id: PROD.s24ultra,
      image_url: "https://placehold.co/800x800/0a0a0a/ffffff?text=Galaxy+S24+Ultra",
      is_primary: true,
      sort_order: 0,
      alt_text: "Samsung Galaxy S24 Ultra Titanium Black",
      alt_text_translations: { es: { alt_text: "Samsung Galaxy S24 Ultra Negro Titanio" } },
    },
    {
      id: "e1000005-0000-0000-0000-000000000005",
      product_id: PROD.s23plus,
      image_url: "https://placehold.co/800x800/1a1a1a/ffffff?text=Galaxy+S23+Plus",
      is_primary: true,
      sort_order: 0,
      alt_text: "Samsung Galaxy S23+ Phantom Black",
      alt_text_translations: { es: { alt_text: "Samsung Galaxy S23+ Negro Fantasma" } },
    },
    {
      id: "e1000006-0000-0000-0000-000000000006",
      product_id: PROD.pixel8pro,
      image_url: "https://placehold.co/800x800/0d0d0d/ffffff?text=Pixel+8+Pro",
      is_primary: true,
      sort_order: 0,
      alt_text: "Google Pixel 8 Pro Obsidian",
      alt_text_translations: { es: { alt_text: "Google Pixel 8 Pro Obsidiana" } },
    },
    {
      id: "e1000007-0000-0000-0000-000000000007",
      product_id: PROD.pixel7,
      image_url: "https://placehold.co/800x800/f0f0f0/333333?text=Pixel+7",
      is_primary: true,
      sort_order: 0,
      alt_text: "Google Pixel 7 Snow",
      alt_text_translations: { es: { alt_text: "Google Pixel 7 Nieve" } },
    },
    {
      id: "e1000008-0000-0000-0000-000000000008",
      product_id: PROD.iphone12,
      image_url: "https://placehold.co/800x800/2d5e8e/ffffff?text=iPhone+12",
      is_primary: true,
      sort_order: 0,
      alt_text: "iPhone 12 Blue",
      alt_text_translations: { es: { alt_text: "iPhone 12 Azul" } },
    },
    {
      id: "e1000009-0000-0000-0000-000000000009",
      product_id: PROD.galaxyA54,
      image_url: "https://placehold.co/800x800/111111/ffffff?text=Galaxy+A54",
      is_primary: true,
      sort_order: 0,
      alt_text: "Samsung Galaxy A54 Awesome Black",
      alt_text_translations: { es: { alt_text: "Samsung Galaxy A54 Negro Impresionante" } },
    },
    {
      id: "e100000a-0000-0000-0000-00000000000a",
      product_id: PROD.pixel8a,
      image_url: "https://placehold.co/800x800/8bb88a/ffffff?text=Pixel+8a",
      is_primary: true,
      sort_order: 0,
      alt_text: "Google Pixel 8a Aloe",
      alt_text_translations: { es: { alt_text: "Google Pixel 8a Aloe" } },
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from("product_images").upsert(images as any, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw new Error(`product_images: ${error.message}`);
  console.log(`  ✓ ${images.length} product images`);
}

// ── 4. Coupons ────────────────────────────────────────────────────────────────

async function seedCoupons() {
  const coupons = [
    {
      id: "f1000001-0000-0000-0000-000000000001",
      code: "WELCOME10",
      type: "percentage",
      value: 10,
      active: true,
      usage_limit: 100,
      used_count: 3,
      minimum_order_amount: null,
      starts_at: null,
      expires_at: daysFromNow(365),
    },
    {
      id: "f1000002-0000-0000-0000-000000000002",
      code: "SAVE50",
      type: "fixed_amount",
      value: 5000,
      active: true,
      usage_limit: 50,
      used_count: 1,
      minimum_order_amount: 30000,
      starts_at: null,
      expires_at: daysFromNow(180),
    },
    {
      id: "f1000003-0000-0000-0000-000000000003",
      code: "FREESHIP",
      type: "free_shipping",
      value: 0,
      active: true,
      usage_limit: null,
      used_count: 7,
      minimum_order_amount: null,
      starts_at: null,
      expires_at: null,
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from("coupons").upsert(coupons as any, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw new Error(`coupons: ${error.message}`);
  console.log(`  ✓ ${coupons.length} coupons`);
}

// ── 5. Orders + Order Items ───────────────────────────────────────────────────

async function seedOrders() {
  // Addresses
  const addresses = [
    {
      id: "a2000001-0000-0000-0000-000000000001",
      full_name: "Robert Martinez",
      line1: "8923 Greenwood Ave N",
      line2: null,
      city: "Seattle",
      state: "WA",
      postal_code: "98103",
      country: "US",
      phone: "(206) 555-0191",
      is_default_shipping: false,
      is_default_billing: false,
    },
    {
      id: "a2000002-0000-0000-0000-000000000002",
      full_name: "Sarah Chen",
      line1: "4501 University Way NE",
      line2: "Apt 3B",
      city: "Seattle",
      state: "WA",
      postal_code: "98105",
      country: "US",
      phone: "(206) 555-0142",
      is_default_shipping: false,
      is_default_billing: false,
    },
    {
      id: "a2000003-0000-0000-0000-000000000003",
      full_name: "James Wilson",
      line1: "1234 5th Ave NW",
      line2: null,
      city: "Shoreline",
      state: "WA",
      postal_code: "98177",
      country: "US",
      phone: "(206) 555-0178",
      is_default_shipping: false,
      is_default_billing: false,
    },
  ];

  const { error: addrErr } = await supabase
    .from("addresses")
    .upsert(addresses, { onConflict: "id", ignoreDuplicates: true });
  if (addrErr) throw new Error(`addresses: ${addrErr.message}`);

  // Orders
  const orders = [
    // WC-1001: paid (pickup) — Elena Rodriguez
    {
      id: ORDER.wc1001,
      order_number: "WC-1001",
      status: "paid",
      payment_status: "paid",
      fulfillment_method: "pickup",
      customer_email: "elena.rodriguez@example.com",
      customer_name: "Elena Rodriguez",
      customer_phone: "(206) 555-0101",
      customer_locale: "es",
      subtotal: 34900,
      discount_total: 0,
      shipping_total: 0,
      tax_total: 3177,
      shipping_insurance_amount: 0,
      total: 38077,
      currency: "usd",
      paid_at: daysAgo(2),
      pickup_location_name: "Wireless Connect",
      pickup_location_address: "14723 Aurora Ave N, Shoreline, WA 98133",
      guest_access_token: "ac000001-0000-0000-0000-000000000001",
    },
    // WC-1002: processing (shipping) — James Wilson
    {
      id: ORDER.wc1002,
      order_number: "WC-1002",
      status: "processing",
      payment_status: "paid",
      fulfillment_method: "shipping",
      customer_email: "james.wilson@example.com",
      customer_name: "James Wilson",
      customer_phone: "(206) 555-0178",
      customer_locale: "en",
      shipping_address_id: "a2000003-0000-0000-0000-000000000003",
      subtotal: 54900,
      discount_total: 5000,
      shipping_total: 1499,
      tax_total: 4676,
      shipping_insurance_amount: 500,
      total: 56575,
      currency: "usd",
      coupon_id: "f1000002-0000-0000-0000-000000000002",
      coupon_code: "SAVE50",
      paid_at: daysAgo(3),
      guest_access_token: "ac000002-0000-0000-0000-000000000002",
    },
    // WC-1003: shipped (shipping) — Sarah Chen — with tracking
    {
      id: ORDER.wc1003,
      order_number: "WC-1003",
      status: "shipped",
      payment_status: "paid",
      fulfillment_method: "shipping",
      customer_email: "sarah.chen@example.com",
      customer_name: "Sarah Chen",
      customer_phone: "(206) 555-0142",
      customer_locale: "en",
      shipping_address_id: "a2000002-0000-0000-0000-000000000002",
      subtotal: 59900,
      discount_total: 0,
      shipping_total: 1499,
      tax_total: 5540,
      shipping_insurance_amount: 500,
      total: 67439,
      currency: "usd",
      paid_at: daysAgo(5),
      shipped_at: daysAgo(3),
      tracking_number: "9400111899223456789012",
      shipping_carrier: "USPS",
      guest_access_token: "ac000003-0000-0000-0000-000000000003",
    },
    // WC-1004: delivered (shipping) — Robert Martinez — has warranty
    {
      id: ORDER.wc1004,
      order_number: "WC-1004",
      status: "delivered",
      payment_status: "paid",
      fulfillment_method: "shipping",
      customer_email: "robert.martinez@example.com",
      customer_name: "Robert Martinez",
      customer_phone: "(206) 555-0191",
      customer_locale: "en",
      shipping_address_id: "a2000001-0000-0000-0000-000000000001",
      subtotal: 79900,
      discount_total: 0,
      shipping_total: 1499,
      tax_total: 7368,
      shipping_insurance_amount: 500,
      total: 89267,
      currency: "usd",
      paid_at: daysAgo(14),
      shipped_at: daysAgo(12),
      fulfilled_at: daysAgo(10),
      tracking_number: "9400111899223456789034",
      shipping_carrier: "USPS",
      warranty_started_at: daysAgo(10),
      guest_access_token: "ac000004-0000-0000-0000-000000000004",
    },
    // WC-1005: cancelled (pickup) — Emily Davis
    {
      id: ORDER.wc1005,
      order_number: "WC-1005",
      status: "cancelled",
      payment_status: "refunded",
      fulfillment_method: "pickup",
      customer_email: "emily.davis@example.com",
      customer_name: "Emily Davis",
      customer_phone: "(206) 555-0155",
      customer_locale: "en",
      subtotal: 74900,
      discount_total: 0,
      shipping_total: 0,
      tax_total: 6816,
      shipping_insurance_amount: 0,
      total: 81716,
      currency: "usd",
      paid_at: daysAgo(7),
      cancelled_at: daysAgo(6),
      pickup_location_name: "Wireless Connect",
      pickup_location_address: "14723 Aurora Ave N, Shoreline, WA 98133",
      guest_access_token: "ac000005-0000-0000-0000-000000000005",
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: ordErr } = await supabase.from("orders").upsert(orders as any, { onConflict: "id", ignoreDuplicates: true });
  if (ordErr) throw new Error(`orders: ${ordErr.message}`);

  // Order Items
  const warrantyExpiry = daysFromNow(80); // 90-day warranty started 10 days ago
  const items = [
    {
      id: ITEM.item1,
      order_id: ORDER.wc1001,
      product_id: PROD.iphone13,
      product_title: "iPhone 13 128GB",
      product_sku: "IP13-128-MN-001",
      product_slug: "iphone-13-128gb-midnight",
      product_image_url: "https://placehold.co/800x800/1c1c1e/ffffff?text=iPhone+13",
      product_imei: "351234567890125",
      product_serial_number: "F0NXK4NABC3",
      device_brand: "Apple",
      device_model: "iPhone 13",
      device_color: "Midnight",
      device_storage: "128GB",
      device_condition: "good",
      battery_health: 84,
      quantity: 1,
      unit_price: 34900,
      line_total: 34900,
      warranty_days: 90,
      warranty_expires_at: daysFromNow(88),
    },
    {
      id: ITEM.item2,
      order_id: ORDER.wc1002,
      product_id: PROD.iphone14pro,
      product_title: "iPhone 14 Pro 128GB",
      product_sku: "IP14P-128-DP-001",
      product_slug: "iphone-14-pro-128gb-deep-purple",
      product_image_url: "https://placehold.co/800x800/2d1b4e/ffffff?text=iPhone+14+Pro",
      product_imei: "351234567890124",
      product_serial_number: "F1MXK4NABC2",
      device_brand: "Apple",
      device_model: "iPhone 14 Pro",
      device_color: "Deep Purple",
      device_storage: "128GB",
      device_condition: "excellent",
      battery_health: 91,
      quantity: 1,
      unit_price: 54900,
      line_total: 54900,
      warranty_days: 90,
      warranty_expires_at: daysFromNow(87),
    },
    {
      id: ITEM.item3,
      order_id: ORDER.wc1003,
      product_id: PROD.pixel8pro,
      product_title: "Google Pixel 8 Pro 128GB",
      product_sku: "GP8P-128-OB-001",
      product_slug: "google-pixel-8-pro-128gb-obsidian",
      product_image_url: "https://placehold.co/800x800/0d0d0d/ffffff?text=Pixel+8+Pro",
      product_imei: "353456789012345",
      product_serial_number: "PX8P3NABC1",
      device_brand: "Google",
      device_model: "Pixel 8 Pro",
      device_color: "Obsidian",
      device_storage: "128GB",
      device_condition: "like_new",
      battery_health: 99,
      quantity: 1,
      unit_price: 59900,
      line_total: 59900,
      warranty_days: 90,
      warranty_expires_at: daysFromNow(85),
    },
    {
      id: ITEM.item4,
      order_id: ORDER.wc1004,
      product_id: PROD.iphone15pm,
      product_title: "iPhone 15 Pro Max 256GB",
      product_sku: "IP15PM-256-NT-001",
      product_slug: "iphone-15-pro-max-256gb-natural-titanium",
      product_image_url: "https://placehold.co/800x800/1a1a1a/ffffff?text=iPhone+15+Pro+Max",
      product_imei: "351234567890123",
      product_serial_number: "F2LXK4NABC1",
      device_brand: "Apple",
      device_model: "iPhone 15 Pro Max",
      device_color: "Natural Titanium",
      device_storage: "256GB",
      device_condition: "like_new",
      battery_health: 98,
      quantity: 1,
      unit_price: 79900,
      line_total: 79900,
      warranty_days: 90,
      warranty_expires_at: warrantyExpiry,
    },
    {
      id: ITEM.item5,
      order_id: ORDER.wc1005,
      product_id: PROD.s24ultra,
      product_title: "Samsung Galaxy S24 Ultra 256GB",
      product_sku: "SGS24U-256-TB-001",
      product_slug: "samsung-galaxy-s24-ultra-256gb-titanium-black",
      product_image_url: "https://placehold.co/800x800/0a0a0a/ffffff?text=Galaxy+S24+Ultra",
      product_imei: "352345678901234",
      product_serial_number: "R3CMKG4ABC1",
      device_brand: "Samsung",
      device_model: "Galaxy S24 Ultra",
      device_color: "Titanium Black",
      device_storage: "256GB",
      device_condition: "like_new",
      battery_health: 97,
      quantity: 1,
      unit_price: 74900,
      line_total: 74900,
      warranty_days: 90,
      warranty_expires_at: null,
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: itemErr } = await supabase.from("order_items").upsert(items as any, { onConflict: "id", ignoreDuplicates: true });
  if (itemErr) throw new Error(`order_items: ${itemErr.message}`);

  console.log(`  ✓ ${orders.length} orders, ${items.length} order items`);
}

// ── 6. Warranty ───────────────────────────────────────────────────────────────

async function seedWarranties() {
  const now = new Date();
  const startsAt = new Date(now);
  startsAt.setDate(now.getDate() - 10);

  const warranties = [
    {
      id: "e2000001-0000-0000-0000-000000000001",
      order_id: ORDER.wc1004,
      order_item_id: ITEM.item4,
      product_id: PROD.iphone15pm,
      product_title: "iPhone 15 Pro Max 256GB",
      customer_name: "Robert Martinez",
      customer_email: "robert.martinez@example.com",
      customer_phone: "(206) 555-0191",
      customer_locale: "en",
      device_brand: "Apple",
      device_model: "iPhone 15 Pro Max",
      device_imei: "351234567890123",
      device_serial_number: "F2LXK4NABC1",
      active: true,
      warranty_days: 90,
      starts_at: daysAgo(10),
      expires_at: daysFromNow(80),
      claim_status: "none",
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from("warranties").upsert(warranties as any, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw new Error(`warranties: ${error.message}`);
  console.log(`  ✓ ${warranties.length} warranties`);
}

// ── 7. Device Intakes ─────────────────────────────────────────────────────────

async function seedIntakes() {
  const intakes = [
    {
      id: "f2000001-0000-0000-0000-000000000001",
      brand: "Apple",
      model: "iPhone 16 Pro",
      storage: "128GB",
      color: "Black Titanium",
      condition: "excellent",
      status: "received",
      testing_status: "not_started",
      acquisition_date: daysAgo(1),
      acquisition_source: "Walk-in customer",
      acquisition_payment_method: "cash",
      cost: 55000,
      price: 84900,
      warranty_days: 90,
      hold_period_days: 30,
      hold_period_waived: false,
      hold_until_date: daysFromNow(29),
      imei: "359876543210001",
      serial_number: "F4PXYZ1ABC1",
      sku: "IP16P-128-BT-001",
      carrier: "unlocked",
      seller_full_name: "Michael Torres",
      seller_email: "m.torres@example.com",
      seller_phone: "(206) 555-0188",
      seller_address: "1502 NW 65th St, Seattle, WA 98117",
      seller_id_type: "drivers_license",
      seller_declaration_signed: true,
      seller_declaration_signed_at: daysAgo(1),
      activation_lock_removed: true,
      factory_reset_verified: true,
      data_wiped_verified: true,
      allow_pickup: true,
      allow_shipping: true,
      imei_verification_status: "not_checked",
      featured_candidate: true,
    },
    {
      id: "f2000002-0000-0000-0000-000000000002",
      brand: "Samsung",
      model: "Galaxy S25",
      storage: "256GB",
      color: "Icy Blue",
      condition: "like_new",
      status: "testing",
      testing_status: "in_progress",
      acquisition_date: daysAgo(3),
      acquisition_source: "Trade-in",
      acquisition_payment_method: "store_credit",
      cost: 60000,
      price: 89900,
      warranty_days: 90,
      hold_period_days: 30,
      hold_period_waived: false,
      hold_until_date: daysFromNow(27),
      imei: "352345678901299",
      serial_number: "R5CMKG5XYZ1",
      sku: "SGS25-256-IB-001",
      carrier: "unlocked",
      seller_full_name: "Aisha Patel",
      seller_email: "aisha.patel@example.com",
      seller_phone: "(206) 555-0203",
      seller_address: "720 2nd Ave, Seattle, WA 98104",
      seller_id_type: "state_id",
      seller_declaration_signed: true,
      seller_declaration_signed_at: daysAgo(3),
      activation_lock_removed: true,
      factory_reset_verified: true,
      data_wiped_verified: true,
      allow_pickup: true,
      allow_shipping: true,
      imei_verification_status: "passed",
      is_clean_imei: true,
      battery_health: 99,
      battery_cycle_count: 4,
      featured_candidate: true,
      power_on_passed: true,
      cellular_passed: true,
      wifi_passed: true,
    },
    {
      id: "f2000003-0000-0000-0000-000000000003",
      brand: "Google",
      model: "Pixel 9 Pro",
      storage: "128GB",
      color: "Hazel",
      condition: "excellent",
      status: "ready_to_list",
      testing_status: "passed",
      acquisition_date: daysAgo(6),
      acquisition_source: "Walk-in customer",
      acquisition_payment_method: "cash",
      cost: 42000,
      price: 64900,
      compare_at_price: 99900,
      warranty_days: 90,
      hold_period_days: 30,
      hold_period_waived: false,
      hold_until_date: daysFromNow(24),
      imei: "357654321098765",
      serial_number: "PX9P4NABC9",
      sku: "GP9P-128-HZ-001",
      carrier: "unlocked",
      seller_full_name: "David Kim",
      seller_email: "david.kim@example.com",
      seller_phone: "(206) 555-0219",
      seller_address: "3400 Rainier Ave S, Seattle, WA 98144",
      seller_id_type: "drivers_license",
      seller_declaration_signed: true,
      seller_declaration_signed_at: daysAgo(6),
      activation_lock_removed: true,
      factory_reset_verified: true,
      data_wiped_verified: true,
      allow_pickup: true,
      allow_shipping: true,
      imei_verification_status: "passed",
      is_clean_imei: true,
      battery_health: 95,
      battery_cycle_count: 62,
      featured_candidate: false,
      power_on_passed: true,
      cellular_passed: true,
      wifi_passed: true,
      bluetooth_passed: true,
      cameras_passed: true,
      speakers_passed: true,
      microphone_passed: true,
      buttons_passed: true,
      touchscreen_passed: true,
      charging_port_passed: true,
      face_or_touch_id_passed: true,
      tested_at: daysAgo(2),
      functional_notes: "All functions passed. Minor scuff on the bottom left corner — disclosed.",
      cosmetic_notes: "Minor scuff on bottom-left corner. Screen is scratch-free.",
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from("device_intakes").upsert(intakes as any, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw new Error(`device_intakes: ${error.message}`);
  console.log(`  ✓ ${intakes.length} device intakes`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱  Seeding Wireless Connect database…\n");

  try {
    await cleanup();
    await seedCategories();
    await seedProducts();
    await seedProductImages();
    await seedCoupons();
    await seedOrders();
    await seedWarranties();
    await seedIntakes();

    console.log("\n✅  Seed complete!\n");
    console.log("  Shop:      /en/shop");
    console.log("  Admin:     /admin/orders  /admin/warranties  /admin/intakes");
    console.log("  Coupons:   WELCOME10 (10% off)  |  SAVE50 ($50 off, min $300)  |  FREESHIP");
  } catch (err) {
    console.error("\n❌  Seed failed:", err);
    process.exit(1);
  }
}

main();
