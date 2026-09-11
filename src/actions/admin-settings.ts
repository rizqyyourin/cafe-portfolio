"use server";

import { revalidatePath } from "next/cache";

import { saveCafeSettings as persistCafeSettings } from "@/db/settings";
import { requireAdminSession } from "@/lib/auth-guard";
import { cafeSettingsSchema, weekdayNames } from "@/lib/validations/settings";
import type { z } from "zod";

export type SettingsActionState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function settingsValues(formData: FormData) {
  return {
    cafeName: stringValue(formData, "cafeName"),
    tagline: stringValue(formData, "tagline"),
    description: stringValue(formData, "description"),
    address: stringValue(formData, "address"),
    phone: stringValue(formData, "phone"),
    whatsapp: stringValue(formData, "whatsapp"),
    email: stringValue(formData, "email"),
    instagram: stringValue(formData, "instagram"),
    threads: stringValue(formData, "threads"),
    twitter: stringValue(formData, "twitter"),
    tiktok: stringValue(formData, "tiktok"),
    facebook: stringValue(formData, "facebook"),
    mapsUrl: stringValue(formData, "mapsUrl"),
    openingHours: Object.fromEntries(weekdayNames.map((day) => [day, stringValue(formData, `openingHours.${day}`)])),
  };
}

function fieldErrors(error: z.ZodError) {
  return error.issues.reduce<Record<string, string[]>>((result, issue) => {
    const key = issue.path.join(".") || "form";
    result[key] = [...(result[key] ?? []), issue.message];
    return result;
  }, {});
}

function revalidateSettings() {
  for (const path of ["/", "/about", "/contact", "/menu", "/gallery", "/reservation", "/admin", "/admin/settings"]) {
    revalidatePath(path);
  }
}

export async function saveSettings(formData: FormData): Promise<SettingsActionState> {
  await requireAdminSession();
  const parsed = cafeSettingsSchema.safeParse(settingsValues(formData));
  if (!parsed.success) return { success: false, message: "Please fix the highlighted fields.", errors: fieldErrors(parsed.error) };

  try {
    await persistCafeSettings(parsed.data);
  } catch (error) {
    console.error("Cafe settings save failed", error instanceof Error ? error.message : error);
    return { success: false, message: "We could not save the cafe settings right now. Please try again." };
  }

  revalidateSettings();
  return { success: true, message: "Settings saved." };
}
