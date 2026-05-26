/**
 * Admin Settings — server component shell.
 * Loads current settings, renders SettingsForm (client component).
 */

import { requireStaff } from "@/lib/utils/permissions";
import { getStoreSettings } from "@/lib/data/settings";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Settings — Wireless Connect Admin" };

export default async function AdminSettingsPage() {
  await requireStaff();
  const settings = await getStoreSettings();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Store Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Changes take effect immediately. Some env vars (e.g.{" "}
          <code className="rounded bg-muted px-1 font-mono text-xs">STRIPE_TAX_ENABLED</code>)
          override these values.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <SettingsForm defaultValues={settings} />
      </div>
    </div>
  );
}
