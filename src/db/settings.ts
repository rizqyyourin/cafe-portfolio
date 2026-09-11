import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import type { CafeSettingsInput } from "@/lib/validations/settings";

import { cafeSetting } from "./schema";

type SettingsDatabase = typeof db;

export type CafeSettings = {
  id: string;
  cafeName: string;
  tagline: string;
  description: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  instagram: string | null;
  threads: string | null;
  twitter: string | null;
  tiktok: string | null;
  facebook: string | null;
  mapsUrl: string;
  openingHours: Record<string, string>;
};

export const defaultCafeSettings: CafeSettings = {
  id: "default",
  cafeName: "Kōhi Coffee",
  tagline: "Coffee worth slowing down for.",
  description: "Modern neighborhood specialty coffee, fresh food, and a space made for good conversations.",
  address: "Jl. Kemang Raya No. 28, Jakarta Selatan, 12730",
  phone: "+62 812 5555 8821",
  whatsapp: "6281255558821",
  email: "hello@kohicoffee.example",
  instagram: "https://instagram.com/kohicoffee",
  threads: null,
  twitter: null,
  tiktok: null,
  facebook: null,
  mapsUrl: "https://maps.google.com/?q=Kemang+Jakarta",
  openingHours: { Monday: "08:00 - 22:00", Tuesday: "08:00 - 22:00", Wednesday: "08:00 - 22:00", Thursday: "08:00 - 22:00", Friday: "08:00 - 23:00", Saturday: "08:00 - 23:00", Sunday: "08:00 - 22:00" },
};

export const emptyCafeSettings: CafeSettings = {
  id: "default",
  cafeName: "",
  tagline: "",
  description: "",
  address: "",
  phone: "",
  whatsapp: "",
  email: "",
  instagram: null,
  threads: null,
  twitter: null,
  tiktok: null,
  facebook: null,
  mapsUrl: "",
  openingHours: Object.fromEntries(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => [day, ""])),
};

const settingsColumns = {
  id: cafeSetting.id,
  cafeName: cafeSetting.cafeName,
  tagline: cafeSetting.tagline,
  description: cafeSetting.description,
  address: cafeSetting.address,
  phone: cafeSetting.phone,
  whatsapp: cafeSetting.whatsapp,
  email: cafeSetting.email,
  instagram: cafeSetting.instagram,
  threads: cafeSetting.threads,
  twitter: cafeSetting.twitter,
  tiktok: cafeSetting.tiktok,
  facebook: cafeSetting.facebook,
  mapsUrl: cafeSetting.mapsUrl,
  openingHours: cafeSetting.openingHours,
};

export async function getCafeSettings(database: SettingsDatabase = db): Promise<CafeSettings | null> {
  const rows = await database.select(settingsColumns).from(cafeSetting).where(eq(cafeSetting.id, "default")).limit(1);
  return rows[0] ?? null;
}

export async function getPublicCafeSettings(database: SettingsDatabase = db) {
  return (await getCafeSettings(database)) ?? defaultCafeSettings;
}

function nullable(value: string) {
  return value.trim() || null;
}

export async function saveCafeSettings(values: CafeSettingsInput, database: SettingsDatabase = db) {
  const persisted = {
    cafeName: values.cafeName,
    tagline: values.tagline,
    description: values.description,
    address: values.address,
    phone: values.phone,
    whatsapp: values.whatsapp,
    email: values.email,
    instagram: nullable(values.instagram),
    threads: nullable(values.threads),
    twitter: nullable(values.twitter),
    tiktok: nullable(values.tiktok),
    facebook: nullable(values.facebook),
    mapsUrl: values.mapsUrl,
    openingHours: values.openingHours,
  };

  await database.insert(cafeSetting).values({ id: "default", ...persisted }).onConflictDoUpdate({ target: cafeSetting.id, set: { ...persisted, updatedAt: new Date() } });
}
