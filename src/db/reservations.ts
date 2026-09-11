import { randomUUID } from "node:crypto";

import { and, asc, count, desc, eq, gte, like, lte, or, type SQL } from "drizzle-orm";

import { db } from "@/db/client";
import type { ReservationInput } from "@/lib/validations/reservation";

import { reservation, type ReservationStatus } from "./schema";

type ReservationDatabase = typeof db;

export type AdminReservation = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  reservationDate: string;
  reservationTime: string;
  guestCount: number;
  specialRequest: string | null;
  status: ReservationStatus;
};

export const RESERVATION_PAGE_SIZE = 10;
export type ReservationDateFilter = "all" | "today" | "week" | "month" | "year";
export type ReservationListStatus = "all" | ReservationStatus;
export type ReservationListRequest = {
  offset: number;
  status: ReservationListStatus;
  dateFilter: ReservationDateFilter;
  year: string;
  query: string;
};
export type ReservationPageResult = {
  reservations: AdminReservation[];
  hasMore: boolean;
  nextOffset: number | null;
};

export type ReservationPageData = {
  today: string;
  weekStart: string;
  weekEnd: string;
  pendingCount: number;
  reservations: AdminReservation[];
  hasMore: boolean;
  nextOffset: number | null;
};

export type ReservationPageOptions = {
  limit?: number;
  offset?: number;
  status?: ReservationStatus;
  dateFilter?: ReservationDateFilter;
  year?: string;
  query?: string;
};

const reservationColumns = {
  id: reservation.id,
  name: reservation.name,
  phone: reservation.phone,
  email: reservation.email,
  reservationDate: reservation.reservationDate,
  reservationTime: reservation.reservationTime,
  guestCount: reservation.guestCount,
  specialRequest: reservation.specialRequest,
  status: reservation.status,
};

function dateValue(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return dateValue(date);
}

export function getReservationDateWindow(referenceDate = new Date()) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(referenceDate);
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
  const daysSinceMonday = (weekday + 6) % 7;

  return {
    today,
    weekStart: addDays(today, -daysSinceMonday),
    weekEnd: addDays(today, 6 - daysSinceMonday),
  };
}

export async function getReservationPageData(
  database: ReservationDatabase = db,
  options: ReservationPageOptions = {},
): Promise<ReservationPageData> {
  const dateWindow = getReservationDateWindow();
  const limit = Math.min(Math.max(options.limit ?? RESERVATION_PAGE_SIZE, 1), 50);
  const offset = Math.max(options.offset ?? 0, 0);
  const conditions: SQL[] = [];

  if (options.status) conditions.push(eq(reservation.status, options.status));
  if (options.dateFilter === "today") conditions.push(eq(reservation.reservationDate, dateWindow.today));
  if (options.dateFilter === "week") {
    conditions.push(gte(reservation.reservationDate, dateWindow.weekStart));
    conditions.push(lte(reservation.reservationDate, dateWindow.weekEnd));
  }
  if (options.dateFilter === "month") conditions.push(like(reservation.reservationDate, `${dateWindow.today.slice(0, 7)}-%`));
  if (options.dateFilter === "year") conditions.push(like(reservation.reservationDate, `${options.year ?? dateWindow.today.slice(0, 4)}-%`));
  const query = options.query?.trim();
  if (query) {
    const searchPattern = `%${query}%`;
    conditions.push(or(
      like(reservation.name, searchPattern),
      like(reservation.phone, searchPattern),
      like(reservation.email, searchPattern),
      like(reservation.specialRequest, searchPattern),
    )!);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const [pendingRows, pageRows] = await Promise.all([
    database.select({ value: count() }).from(reservation).where(eq(reservation.status, "PENDING")),
    database
      .select(reservationColumns)
      .from(reservation)
      .where(whereClause)
      .orderBy(asc(reservation.reservationDate), asc(reservation.reservationTime), desc(reservation.createdAt), asc(reservation.id))
      .limit(limit + 1)
      .offset(offset),
  ]);
  const hasMore = pageRows.length > limit;
  const reservations = pageRows.slice(0, limit);

  return {
    ...dateWindow,
    pendingCount: pendingRows[0]?.value ?? 0,
    reservations,
    hasMore,
    nextOffset: hasMore ? offset + limit : null,
  };
}

/** Persist a validated public reservation request and return its stable id. */
export async function insertReservation(
  values: ReservationInput,
  database: ReservationDatabase = db,
) {
  const id = randomUUID();

  await database.insert(reservation).values({
    id,
    name: values.name,
    phone: values.phone,
    email: values.email || null,
    reservationDate: values.reservationDate,
    reservationTime: values.reservationTime,
    guestCount: values.guestCount,
    specialRequest: values.specialRequest || null,
  });

  return id;
}

const allowedTransitions: Record<ReservationStatus, readonly ReservationStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  CANCELLED: ["PENDING"],
  COMPLETED: [],
};

export class ReservationNotFoundError extends Error {
  constructor() {
    super("Reservation not found.");
    this.name = "ReservationNotFoundError";
  }
}

export class InvalidReservationTransitionError extends Error {
  constructor(currentStatus: ReservationStatus, nextStatus: ReservationStatus) {
    super(`Cannot move a ${currentStatus} reservation to ${nextStatus}.`);
    this.name = "InvalidReservationTransitionError";
  }
}

/** Apply only the workflow transitions exposed by the admin dashboard. */
export async function updateReservationStatus(
  id: string,
  nextStatus: ReservationStatus,
  database: ReservationDatabase = db,
) {
  const rows = await database
    .select({ status: reservation.status })
    .from(reservation)
    .where(eq(reservation.id, id))
    .limit(1);
  const currentStatus = rows[0]?.status;

  if (!currentStatus) {
    throw new ReservationNotFoundError();
  }

  if (!allowedTransitions[currentStatus].includes(nextStatus)) {
    throw new InvalidReservationTransitionError(currentStatus, nextStatus);
  }

  await database
    .update(reservation)
    .set({ status: nextStatus, updatedAt: new Date() })
    .where(eq(reservation.id, id));
}
