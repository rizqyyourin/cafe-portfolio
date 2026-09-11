"use server";

import { revalidatePath } from "next/cache";

import { insertReservation } from "@/db/reservations";
import { reservationSchema } from "@/lib/validations/reservation";

export type ReservationActionState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

/**
 * Public write boundary. Add rate limiting (Upstash/Arcjet) before enabling it
 * in production; validation remains server-side regardless of client UX.
 */
export async function createReservation(
  _previousState: ReservationActionState,
  formData: FormData,
): Promise<ReservationActionState> {
  const parsed = reservationSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await insertReservation(parsed.data);
  } catch (error) {
    console.error("Reservation insert failed", error instanceof Error ? error.message : error);
    return {
      success: false,
      message: "We could not save your request right now. Please try again.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/reservations");

  return {
    success: true,
    message: "Reservation request received. Our team will contact you via WhatsApp to confirm it.",
  };
}
