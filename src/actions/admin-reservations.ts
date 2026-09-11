"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getReservationPageData, RESERVATION_PAGE_SIZE, updateReservationStatus, type ReservationListRequest, type ReservationPageResult } from "@/db/reservations";
import { requireAdminSession } from "@/lib/auth-guard";

export type AdminReservationActionState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

const reservationStatusSchema = z.object({
  reservationId: z.string().trim().min(1, "Reservation is required."),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]),
});

const reservationPageRequestSchema = z.object({
  offset: z.number().int().min(0).max(100_000),
  status: z.enum(["all", "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]),
  dateFilter: z.enum(["all", "today", "week", "month", "year"]),
  year: z.string().regex(/^\d{4}$/),
  query: z.string().trim().max(80),
});

export async function getAdminReservationsPage(request: ReservationListRequest): Promise<ReservationPageResult> {
  await requireAdminSession();

  const parsed = reservationPageRequestSchema.safeParse(request);
  if (!parsed.success) throw new Error("Invalid reservation page request.");

  const page = await getReservationPageData(undefined, {
    dateFilter: parsed.data.dateFilter === "all" ? undefined : parsed.data.dateFilter,
    limit: RESERVATION_PAGE_SIZE,
    offset: parsed.data.offset,
    query: parsed.data.query,
    status: parsed.data.status === "all" ? undefined : parsed.data.status,
    year: parsed.data.year,
  });

  return {
    reservations: page.reservations,
    hasMore: page.hasMore,
    nextOffset: page.nextOffset,
  };
}

export async function updateAdminReservationStatus(formData: FormData): Promise<AdminReservationActionState> {
  await requireAdminSession();

  const parsed = reservationStatusSchema.safeParse({
    reservationId: stringValue(formData, "reservationId"),
    status: stringValue(formData, "status"),
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateReservationStatus(parsed.data.reservationId, parsed.data.status);
  } catch (error) {
    console.error("Reservation status update failed", error instanceof Error ? error.message : error);
    return { success: false, message: "We could not update that reservation right now. Please refresh and try again." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/reservations");

  const message = parsed.data.status === "CONFIRMED"
    ? "Reservation confirmed."
    : parsed.data.status === "CANCELLED"
      ? "Reservation cancelled."
      : parsed.data.status === "PENDING"
        ? "Reservation restored."
        : "Reservation marked completed.";

  return { success: true, message };
}
