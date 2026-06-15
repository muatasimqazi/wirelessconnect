import { supabaseAdmin } from "@/lib/supabase/admin";

export interface AdminCustomer {
  id: string;
  email: string;
  fullName: string | null;
  joinedAt: string;
  orderCount: number;
  /** Total spend in cents across all paid orders */
  totalSpent: number;
  lastOrderAt: string | null;
}

export async function getAdminCustomers(): Promise<AdminCustomer[]> {
  const admin = supabaseAdmin();

  const [{ data: profiles, error: profilesError }, { data: orders, error: ordersError }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, email, full_name, created_at")
        .eq("role", "customer")
        .order("created_at", { ascending: false }),
      admin
        .from("orders")
        .select("customer_email, total, created_at, payment_status"),
    ]);

  if (profilesError) throw new Error(`getAdminCustomers profiles: ${profilesError.message}`);
  if (ordersError) throw new Error(`getAdminCustomers orders: ${ordersError.message}`);

  type OrderRow = { customer_email: string; total: number; created_at: string; payment_status: string };

  // Aggregate orders by customer email (only paid orders count toward spend)
  const ordersByEmail = new Map<string, { count: number; totalSpent: number; lastOrderAt: string | null }>();
  for (const o of (orders ?? []) as OrderRow[]) {
    const existing = ordersByEmail.get(o.customer_email) ?? { count: 0, totalSpent: 0, lastOrderAt: null };
    existing.count += 1;
    if (o.payment_status === "paid") {
      existing.totalSpent += Math.round((o.total ?? 0) * 100);
    }
    if (!existing.lastOrderAt || o.created_at > existing.lastOrderAt) {
      existing.lastOrderAt = o.created_at;
    }
    ordersByEmail.set(o.customer_email, existing);
  }

  return (profiles ?? []).map((p) => {
    const agg = ordersByEmail.get(p.email) ?? { count: 0, totalSpent: 0, lastOrderAt: null };
    return {
      id: p.id,
      email: p.email,
      fullName: p.full_name,
      joinedAt: p.created_at,
      orderCount: agg.count,
      totalSpent: agg.totalSpent,
      lastOrderAt: agg.lastOrderAt,
    };
  });
}
