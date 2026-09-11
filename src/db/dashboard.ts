import { and, asc, count, desc, eq, type SQL } from "drizzle-orm";

import { db } from "@/db/client";

import { category, galleryImage, menuItem, reservation } from "./schema";

type DashboardDatabase = typeof db;

export type DashboardReservation = {
  id: string;
  name: string;
  reservationDate: string;
  reservationTime: string;
  guestCount: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  specialRequest: string | null;
};

export type DashboardData = {
  stats: {
    menuItems: number;
    featuredMenuItems: number;
    categories: number;
    activeCategories: number;
    pendingReservations: number;
    pendingToday: number;
    galleryImages: number;
    galleryUpdatedAt: Date | null;
  };
  categories: Array<{ id: string; name: string }>;
  reservations: DashboardReservation[];
  pendingReservations: DashboardReservation[];
};

function jakartaToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function countRows(database: DashboardDatabase, table: typeof menuItem | typeof category | typeof galleryImage | typeof reservation) {
  const rows = await database.select({ value: count() }).from(table);
  return rows[0]?.value ?? 0;
}

async function countWhere(
  database: DashboardDatabase,
  table: typeof menuItem | typeof category | typeof reservation,
  condition: SQL<unknown>,
) {
  const rows = await database.select({ value: count() }).from(table).where(condition);
  return rows[0]?.value ?? 0;
}

export async function getDashboardData(database: DashboardDatabase = db): Promise<DashboardData> {
  const today = jakartaToday();
  const [menuItems, featuredMenuItems, categories, activeCategories, pendingReservations, pendingToday, galleryImages, latestGallery, activeCategoryRows, recentRows, pendingRows] = await Promise.all([
    countRows(database, menuItem),
    countWhere(database, menuItem, eq(menuItem.isFeatured, true)),
    countRows(database, category),
    countWhere(database, category, eq(category.isActive, true)),
    countWhere(database, reservation, eq(reservation.status, "PENDING")),
    countWhere(database, reservation, and(eq(reservation.status, "PENDING"), eq(reservation.reservationDate, today))!),
    countRows(database, galleryImage),
    database.select({ updatedAt: galleryImage.updatedAt }).from(galleryImage).orderBy(desc(galleryImage.updatedAt)).limit(1),
    database.select({ id: category.id, name: category.name }).from(category).where(eq(category.isActive, true)).orderBy(asc(category.displayOrder), asc(category.name)),
    database.select({
      id: reservation.id,
      name: reservation.name,
      reservationDate: reservation.reservationDate,
      reservationTime: reservation.reservationTime,
      guestCount: reservation.guestCount,
      status: reservation.status,
      specialRequest: reservation.specialRequest,
    }).from(reservation).orderBy(asc(reservation.reservationDate), asc(reservation.reservationTime), desc(reservation.createdAt)).limit(4),
    database.select({
      id: reservation.id,
      name: reservation.name,
      reservationDate: reservation.reservationDate,
      reservationTime: reservation.reservationTime,
      guestCount: reservation.guestCount,
      status: reservation.status,
      specialRequest: reservation.specialRequest,
    }).from(reservation).where(eq(reservation.status, "PENDING")).orderBy(asc(reservation.reservationDate), asc(reservation.reservationTime), desc(reservation.createdAt)),
  ]);

  return {
    stats: {
      menuItems,
      featuredMenuItems,
      categories,
      activeCategories,
      pendingReservations,
      pendingToday,
      galleryImages,
      galleryUpdatedAt: latestGallery[0]?.updatedAt ?? null,
    },
    categories: activeCategoryRows,
    reservations: recentRows,
    pendingReservations: pendingRows,
  };
}
