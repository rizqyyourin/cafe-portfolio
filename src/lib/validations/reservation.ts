import { z } from "zod";

const phonePattern = /^[+\d][\d\s().-]+$/;

function jakartaToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export const reservationSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(80),
  phone: z.string().trim()
    .min(8, "Please enter a valid WhatsApp number.")
    .max(25, "Please enter a valid WhatsApp number.")
    .refine((value) => phonePattern.test(value) && (value.match(/\d/g)?.length ?? 0) >= 8, "Please enter a valid WhatsApp number."),
  email: z.union([z.string().trim().email("Please enter a valid email."), z.literal("")]).optional(),
  reservationDate: z.string().date("Please choose a reservation date.").refine((value) => value >= jakartaToday(), "Please choose today or a future date."),
  reservationTime: z.string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Please choose a time.")
    .refine((value) => value >= "08:00" && value <= "22:00", "Reservations are available between 08:00 and 22:00."),
  guestCount: z.coerce.number().int().min(1, "At least one guest is required.").max(20),
  specialRequest: z.string().trim().max(500, "Keep your request under 500 characters.").optional(),
});

export type ReservationInput = z.infer<typeof reservationSchema>;
