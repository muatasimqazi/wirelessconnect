"use server";

import { requireStaff } from "@/lib/utils/permissions";
import { lookupImei } from "@/lib/imei/lookup";
import type { ImeiLookupResult } from "@/lib/imei/lookup";

export async function imeiLookupAction(imei: string): Promise<ImeiLookupResult> {
  await requireStaff();
  return lookupImei(imei);
}
