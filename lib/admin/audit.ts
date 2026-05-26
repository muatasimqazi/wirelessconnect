/**
 * Admin audit log writer.
 *
 * All key admin actions must be logged here.
 * Audit logs are append-only — no UPDATE or DELETE.
 * Sensitive fields (seller_id_number_encrypted) are never included.
 */

"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type AuditAction = Database["public"]["Enums"]["audit_action"];

export interface AuditLogEntry {
  action: AuditAction;
  table_name?: string;
  record_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  notes?: string;
}

export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const admin = supabaseAdmin();
    await admin.from("admin_audit_logs").insert({
      actor_id: user?.id ?? null,
      actor_email: user?.email ?? null,
      action: entry.action,
      table_name: entry.table_name ?? null,
      record_id: entry.record_id ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      old_values: entry.old_values ? (JSON.parse(JSON.stringify(entry.old_values)) as any) : null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new_values: entry.new_values ? (JSON.parse(JSON.stringify(entry.new_values)) as any) : null,
      notes: entry.notes ?? null,
    });
  } catch (err) {
    // Non-fatal — log but don't throw (audit failure shouldn't block the action)
    console.error("[audit] Failed to write audit log:", err);
  }
}
