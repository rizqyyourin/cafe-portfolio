"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { updateReservationStatus } from "@/db/reservations";
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
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED"]),
});

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
      : "Reservation marked completed.";

  return { success: true, message };
}
