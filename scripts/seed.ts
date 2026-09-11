import { and, eq, isNull } from "drizzle-orm";

import { defaultMenuCategories, defaultMenuImageUrls, defaultMenuItems } from "@/db/default-menu";
import { db } from "@/db/client";
import { cafeSetting, category, galleryImage, menuItem, reservation, type ReservationStatus, testimonial } from "@/db/schema";

const imageUrls = defaultMenuImageUrls;

async function seed() {
  const categoryIds = new Map<string, string>();
  for (const categorySeed of defaultMenuCategories) {
    const id = `category-${categorySeed.slug}`;
    const { slug, name, displayOrder } = categorySeed;
    categoryIds.set(slug, id);
    await db.insert(category).values({ id, name, slug, displayOrder }).onConflictDoNothing();
  }

  for (const [index, itemSeed] of defaultMenuItems.entries()) {
    const { categorySlug, ...item } = itemSeed;
    const id = `menu-${item.slug}`;
    const imageUrl = defaultMenuImageUrls[index % defaultMenuImageUrls.length]!;

    await db.insert(menuItem).values({
      id,
      categoryId: categoryIds.get(categorySlug)!,
      ...item,
      imageUrl,
    }).onConflictDoNothing();

    // Re-running the seed fills only missing demo media and never overwrites a CMS image.
    await db.update(menuItem).set({ imageUrl }).where(and(eq(menuItem.id, id), isNull(menuItem.imageUrl)));
  }

  for (const [index, imageUrl] of imageUrls.entries()) {
    const imageCategory = ["interior", "coffee", "food", "events"][index % 4]!;
    await db.insert(galleryImage).values({
      id: `gallery-${index + 1}`,
      imageUrl,
      caption: ["Morning light at the bar", "A careful daily pour", "Shared plates, lingering lunches", "A room made for conversation"][index % 4]!,
      category: imageCategory,
      altText: `Kōhi Coffee ${imageCategory} scene ${index + 1}`,
      displayOrder: index + 1,
    }).onConflictDoNothing();
  }

  const testimonials: Array<[string, string, number]> = [
    ["Nadia Ramadhani", "The kind of place you find once — then quietly make part of your week.", 5],
    ["Clara Wibowo", "The truffle scramble alone is worth crossing the city for.", 4],
    ["Arga Pradana", "They remember your order and somehow the room always feels just right.", 5],
    ["Dimas Putra", "Coffee that makes a slow Sunday even better.", 5],
  ];
  for (const [index, [customerName, content, rating]] of testimonials.entries()) {
    await db.insert(testimonial).values({ id: `testimonial-${index + 1}`, customerName, content, rating, isActive: index < 3 }).onConflictDoNothing();
  }

  const reservations: Array<[string, string, string, string, number, ReservationStatus]> = [
    ["Maya Prasetyo", "6281298412234", "2026-09-12", "18:30", 4, "PENDING"],
    ["Kevin Lim", "6287881259910", "2026-09-13", "11:00", 2, "CONFIRMED"],
    ["Rizki Ananda", "6281311557890", "2026-09-14", "19:00", 6, "PENDING"],
    ["Sarah Wijaya", "6285219356101", "2026-09-15", "15:30", 3, "COMPLETED"],
    ["Bagas Santoso", "6285699238400", "2026-09-16", "20:00", 2, "CANCELLED"],
    ["Putri Anggraini", "6281211112233", "2026-09-17", "18:00", 2, "CONFIRMED"],
    ["Fadli Ramadhan", "6281222223344", "2026-09-18", "12:30", 3, "PENDING"],
    ["Nabila Sari", "6281233334455", "2026-09-19", "19:30", 4, "CONFIRMED"],
    ["Bimo Santoso", "6281244445566", "2026-09-20", "10:00", 2, "COMPLETED"],
    ["Citra Lestari", "6281255556677", "2026-09-21", "16:30", 5, "CANCELLED"],
    ["Reza Pratama", "6281266667788", "2026-09-22", "18:00", 2, "PENDING"],
    ["Ayu Maharani", "6281277778899", "2026-09-23", "11:30", 3, "CONFIRMED"],
    ["Danu Wijaya", "6281288889900", "2026-09-24", "20:00", 6, "COMPLETED"],
    ["Intan Permata", "6281299990011", "2026-09-25", "09:00", 2, "CANCELLED"],
    ["Yoga Saputra", "6281310001122", "2026-09-26", "17:30", 4, "PENDING"],
    ["Sinta Dewi", "6281321112233", "2026-09-27", "13:00", 3, "CONFIRMED"],
    ["Gilang Putra", "6281332223344", "2026-09-28", "18:30", 2, "COMPLETED"],
    ["Lala Kirana", "6281343334455", "2026-09-29", "19:00", 5, "CANCELLED"],
    ["Hanif Maulana", "6281354445566", "2026-09-30", "12:00", 2, "PENDING"],
    ["Vina Kartika", "6281365556677", "2026-10-01", "18:00", 4, "CONFIRMED"],
  ];
  for (const [index, [name, phone, date, time, guests, status]] of reservations.entries()) {
    await db.insert(reservation).values({
      id: `reservation-${index + 1}`,
      name,
      phone,
      reservationDate: date,
      reservationTime: time,
      guestCount: guests,
      status,
      specialRequest: index === 0 ? "A quiet table for a birthday catch-up, please." : null,
    }).onConflictDoNothing();
  }

  await db.insert(cafeSetting).values({
    id: "default",
    cafeName: "Kōhi Coffee",
    tagline: "Coffee worth slowing down for.",
    description: "Modern neighborhood specialty coffee, fresh food, and a space made for good conversations.",
    address: "Jl. Cikajang No. 17, Jakarta Selatan, 12170",
    phone: "+62 21 5550 0188",
    whatsapp: "628111111111",
    email: "hello@kohicoffee.example",
    instagram: "https://instagram.com/kohicoffee",
    mapsUrl: "https://maps.google.com",
    openingHours: { Monday: "08:00 - 22:00", Tuesday: "08:00 - 22:00", Wednesday: "08:00 - 22:00", Thursday: "08:00 - 22:00", Friday: "08:00 - 23:00", Saturday: "08:00 - 23:00", Sunday: "08:00 - 22:00" },
  }).onConflictDoNothing();

  console.log("Kōhi Coffee demo data seeded successfully.");
}

seed().catch((error: unknown) => {
  console.error("Seeding failed:", error);
  process.exitCode = 1;
});
