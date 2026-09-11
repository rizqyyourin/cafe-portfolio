import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getReservationDateWindow, getReservationPageData, insertReservation, InvalidReservationTransitionError, ReservationNotFoundError, updateReservationStatus } from "@/db/reservations";
import * as schema from "@/db/schema";
import { reservation } from "@/db/schema";

const databasePath = join(tmpdir(), `kohi-reservation-test-${randomUUID()}.db`);
const client = createClient({ url: `file:${databasePath}` });
const testDb = drizzle(client, { schema });

beforeAll(async () => {
  await client.execute(`
    CREATE TABLE reservations (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      reservation_date TEXT NOT NULL,
      reservation_time TEXT NOT NULL,
      guest_count INTEGER NOT NULL,
      special_request TEXT,
      status TEXT DEFAULT 'PENDING' NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
});

afterAll(async () => {
  client.close();
  await rm(databasePath, { force: true });
});

describe("insertReservation", () => {
  it("writes a reservation row with the PENDING default", async () => {
    const id = await insertReservation({
      name: "Ahmad Pratama",
      phone: "+62 812 5555 8821",
      email: "",
      reservationDate: "2099-08-14",
      reservationTime: "19:00",
      guestCount: 4,
      specialRequest: "Window seat, please.",
    }, testDb);

    const rows = await testDb.select().from(reservation).where(eq(reservation.id, id));

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id,
      name: "Ahmad Pratama",
      phone: "+62 812 5555 8821",
      email: null,
      reservationDate: "2099-08-14",
      reservationTime: "19:00",
      guestCount: 4,
      specialRequest: "Window seat, please.",
      status: "PENDING",
    });
  });

  it("generates a unique id for each request", async () => {
    const values = {
      name: "Another Guest",
      phone: "081234567890",
      reservationDate: "2099-08-15",
      reservationTime: "12:00",
      guestCount: 1,
      specialRequest: "",
    } as const;

    const firstId = await insertReservation(values, testDb);
    const secondId = await insertReservation(values, testDb);

    expect(firstId).not.toBe(secondId);
  });
});

describe("updateReservationStatus", () => {
  it("allows PENDING → CONFIRMED → COMPLETED", async () => {
    const id = await insertReservation({
      name: "Workflow Guest",
      phone: "081234567890",
      reservationDate: "2099-08-16",
      reservationTime: "12:00",
      guestCount: 2,
      specialRequest: "",
    }, testDb);

    await updateReservationStatus(id, "CONFIRMED", testDb);
    expect((await testDb.select({ status: reservation.status }).from(reservation).where(eq(reservation.id, id)))[0]?.status).toBe("CONFIRMED");
    await updateReservationStatus(id, "COMPLETED", testDb);
    expect((await testDb.select({ status: reservation.status }).from(reservation).where(eq(reservation.id, id)))[0]?.status).toBe("COMPLETED");
  });

  it("allows the confirmed edit branch to cancel and restore a reservation to pending", async () => {
    const id = await insertReservation({
      name: "Restore Guest",
      phone: "081234567890",
      reservationDate: "2099-08-18",
      reservationTime: "12:00",
      guestCount: 2,
      specialRequest: "",
    }, testDb);

    await updateReservationStatus(id, "CONFIRMED", testDb);
    await updateReservationStatus(id, "CANCELLED", testDb);
    expect((await testDb.select({ status: reservation.status }).from(reservation).where(eq(reservation.id, id)))[0]?.status).toBe("CANCELLED");
    await updateReservationStatus(id, "PENDING", testDb);
    expect((await testDb.select({ status: reservation.status }).from(reservation).where(eq(reservation.id, id)))[0]?.status).toBe("PENDING");
    await updateReservationStatus(id, "CONFIRMED", testDb);
    await updateReservationStatus(id, "COMPLETED", testDb);
  });

  it("rejects skipped or repeated transitions", async () => {
    const id = await insertReservation({
      name: "Transition Guest",
      phone: "081234567890",
      reservationDate: "2099-08-17",
      reservationTime: "12:00",
      guestCount: 2,
      specialRequest: "",
    }, testDb);

    await expect(updateReservationStatus(id, "COMPLETED", testDb)).rejects.toBeInstanceOf(InvalidReservationTransitionError);
    await updateReservationStatus(id, "CANCELLED", testDb);
    await expect(updateReservationStatus(id, "CONFIRMED", testDb)).rejects.toBeInstanceOf(InvalidReservationTransitionError);
  });

  it("returns a distinct not-found error for stale dashboard data", async () => {
    await expect(updateReservationStatus("missing-reservation", "CONFIRMED", testDb)).rejects.toBeInstanceOf(ReservationNotFoundError);
  });
});

describe("getReservationPageData", () => {
  it("paginates reservations with a stable offset and preserves status filters", async () => {
    const firstPage = await getReservationPageData(testDb, { limit: 2, offset: 0 });
    const secondPage = await getReservationPageData(testDb, { limit: 2, offset: 2 });
    const pendingPage = await getReservationPageData(testDb, { limit: 1, offset: 0, status: "PENDING" });

    expect(firstPage.reservations).toHaveLength(2);
    expect(firstPage.hasMore).toBe(true);
    expect(firstPage.nextOffset).toBe(2);
    expect(secondPage.reservations[0]?.id).not.toBe(firstPage.reservations[0]?.id);
    expect(pendingPage.reservations.every((item) => item.status === "PENDING")).toBe(true);
  });

  it("returns all requests, the pending count, and a stable Jakarta week window", async () => {
    const result = await getReservationPageData(testDb);

    expect(result.pendingCount).toBe(3);
    expect(result.reservations.some((item) => item.name === "Ahmad Pratama")).toBe(true);
    expect(result.reservations[0]).toEqual(expect.objectContaining({ name: "Ahmad Pratama", status: "PENDING" }));
    expect(result.weekStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.weekEnd).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("calculates the week boundaries from Jakarta local time", () => {
    expect(getReservationDateWindow(new Date("2099-08-12T05:00:00.000Z"))).toEqual({
      today: "2099-08-12",
      weekStart: "2099-08-10",
      weekEnd: "2099-08-16",
    });
  });
});
