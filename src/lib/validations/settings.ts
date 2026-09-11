import { z } from "zod";

export const weekdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
export type Weekday = (typeof weekdayNames)[number];

const optionalHttpsUrl = z.string().trim().refine((value) => {
  if (value === "") return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}, "Use a valid HTTPS URL or leave this field blank.");

const hoursValue = z.string().trim().refine((value) => {
  if (value === "Closed") return true;
  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d) - ([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return false;
  const start = Number(match[1]) * 60 + Number(match[2]);
  const end = Number(match[3]) * 60 + Number(match[4]);
  return end > start;
}, "Use HH:MM - HH:MM or Closed.");

const openingHoursShape = Object.fromEntries(weekdayNames.map((day) => [day, hoursValue])) as Record<Weekday, typeof hoursValue>;

export const cafeSettingsSchema = z.object({
  cafeName: z.string().trim().min(2, "Cafe name must be at least 2 characters.").max(80, "Cafe name must be 80 characters or fewer."),
  tagline: z.string().trim().min(2, "Tagline must be at least 2 characters.").max(140, "Tagline must be 140 characters or fewer."),
  description: z.string().trim().min(10, "Description must be at least 10 characters.").max(500, "Description must be 500 characters or fewer."),
  logoUrl: optionalHttpsUrl,
  address: z.string().trim().min(5, "Address must be at least 5 characters.").max(180, "Address must be 180 characters or fewer."),
  phone: z.string().trim().min(8, "Enter a valid phone number.").max(30, "Enter a valid phone number."),
  whatsapp: z.string().trim().min(8, "Enter a valid WhatsApp number.").max(30, "Enter a valid WhatsApp number."),
  email: z.string().trim().email("Enter a valid email address."),
  instagram: optionalHttpsUrl,
  tiktok: optionalHttpsUrl,
  facebook: optionalHttpsUrl,
  mapsUrl: z.string().trim().url("Enter a valid map URL.").refine((value) => value.startsWith("https://"), "Use a secure HTTPS map URL."),
  mapsEmbedUrl: optionalHttpsUrl,
  openingHours: z.object(openingHoursShape),
});

export type CafeSettingsInput = z.infer<typeof cafeSettingsSchema>;
