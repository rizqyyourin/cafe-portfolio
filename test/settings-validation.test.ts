import { describe, expect, it } from "vitest";

import { cafeSettingsSchema, weekdayNames } from "@/lib/validations/settings";

const validSettings = {
  cafeName: "Kōhi Coffee",
  tagline: "Coffee worth slowing down for.",
  description: "A modern neighbourhood specialty coffee shop in Kemang, Jakarta.",
  address: "Jl. Kemang Raya No. 28, Jakarta Selatan 12730",
  phone: "+62 21 5550 0188",
  whatsapp: "628111111111",
  email: "hello@kohicoffee.example",
  instagram: "https://instagram.com/kohicoffee",
  threads: "",
  twitter: "",
  tiktok: "",
  facebook: "",
  mapsUrl: "https://maps.google.com/?q=Kemang+Jakarta",
  openingHours: Object.fromEntries(weekdayNames.map((day) => [day, "08:00 - 22:00"])),
};

describe("cafe settings validation", () => {
  it("accepts the complete settings contract with optional fields blank", () => {
    expect(cafeSettingsSchema.safeParse(validSettings).success).toBe(true);
  });

  it.each([
    ["cafeName", ""],
    ["email", "not-an-email"],
    ["mapsUrl", "http://maps.google.com"],
    ["openingHours.Monday", "08:00 to 22:00"],
    ["openingHours.Tuesday", "20:00 - 08:00"],
  ])("rejects invalid %s without weakening the other fields", (field, value) => {
    const input = structuredClone(validSettings) as Record<string, unknown>;
    if (field.startsWith("openingHours.")) {
      input.openingHours = { ...validSettings.openingHours, [field.split(".")[1]!]: value };
    } else {
      input[field] = value;
    }

    expect(cafeSettingsSchema.safeParse(input).success).toBe(false);
  });

  it("accepts Closed as an explicit opening-hours state", () => {
    const input = structuredClone(validSettings);
    input.openingHours.Sunday = "Closed";

    expect(cafeSettingsSchema.safeParse(input).success).toBe(true);
  });
});
