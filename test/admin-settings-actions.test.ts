import { beforeEach, describe, expect, it, vi } from "vitest";

const actionMocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
  saveCafeSettings: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth-guard", () => ({ requireAdminSession: actionMocks.requireAdminSession }));
vi.mock("@/db/settings", () => ({ saveCafeSettings: actionMocks.saveCafeSettings }));
vi.mock("next/cache", () => ({ revalidatePath: actionMocks.revalidatePath }));

import { saveSettings } from "@/actions/admin-settings";

function validForm() {
  const form = new FormData();
  form.set("cafeName", "Kōhi Coffee");
  form.set("tagline", "Coffee worth slowing down for.");
  form.set("description", "A modern neighbourhood specialty coffee shop in Kemang, Jakarta.");
  form.set("address", "Jl. Kemang Raya No. 28, Jakarta Selatan 12730");
  form.set("phone", "+62 21 5550 0188");
  form.set("whatsapp", "628111111111");
  form.set("email", "hello@kohicoffee.example");
  form.set("instagram", "https://instagram.com/kohicoffee");
  form.set("threads", "");
  form.set("twitter", "");
  form.set("tiktok", "");
  form.set("facebook", "");
  form.set("mapsUrl", "https://maps.google.com/?q=Kemang+Jakarta");
  for (const day of ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]) form.set(`openingHours.${day}`, "08:00 - 22:00");
  return form;
}

describe("admin settings server action", () => {
  beforeEach(() => {
    actionMocks.requireAdminSession.mockReset().mockResolvedValue({ user: { id: "admin-1" } });
    actionMocks.saveCafeSettings.mockReset().mockResolvedValue(undefined);
    actionMocks.revalidatePath.mockReset();
  });

  it("requires admin access, saves the complete snapshot, and revalidates public consumers", async () => {
    const result = await saveSettings(validForm());

    expect(actionMocks.saveCafeSettings).toHaveBeenCalledWith(expect.objectContaining({
      cafeName: "Kōhi Coffee",
      openingHours: expect.objectContaining({ Monday: "08:00 - 22:00" }),
    }));
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/");
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/contact");
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith("/admin/settings");
    expect(result).toEqual({ success: true, message: "Settings saved." });
  });

  it("returns field errors and does not write invalid settings", async () => {
    const form = validForm();
    form.set("email", "bad email");
    form.set("openingHours.Friday", "not a range");

    const result = await saveSettings(form);

    expect(result.success).toBe(false);
    expect(result.errors).toEqual(expect.objectContaining({ email: expect.any(Array), "openingHours.Friday": expect.any(Array) }));
    expect(actionMocks.saveCafeSettings).not.toHaveBeenCalled();
  });

  it("keeps persistence failures safe and lets authentication failures propagate", async () => {
    actionMocks.saveCafeSettings.mockRejectedValueOnce(new Error("database unavailable"));
    await expect(saveSettings(validForm())).resolves.toEqual({ success: false, message: "We could not save the cafe settings right now. Please try again." });

    actionMocks.requireAdminSession.mockRejectedValueOnce(new Error("redirect to login"));
    await expect(saveSettings(validForm())).rejects.toThrow("redirect to login");
    expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
  });
});
