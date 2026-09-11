import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SettingsView, type CafeSettings } from "@/components/admin/settings-view";

const settings: CafeSettings = {
  id: "default",
  cafeName: "Kōhi Coffee",
  tagline: "Coffee worth slowing down for.",
  description: "A modern neighbourhood specialty coffee shop in Kemang, Jakarta.",
  logoUrl: null,
  address: "Jl. Kemang Raya No. 28, Jakarta Selatan 12730",
  phone: "+62 21 5550 0188",
  whatsapp: "628111111111",
  email: "hello@kohicoffee.example",
  instagram: "https://instagram.com/kohicoffee",
  tiktok: null,
  facebook: null,
  mapsUrl: "https://maps.google.com/?q=Kemang+Jakarta",
  mapsEmbedUrl: null,
  openingHours: {
    Monday: "08:00 - 22:00",
    Tuesday: "08:00 - 22:00",
    Wednesday: "08:00 - 22:00",
    Thursday: "08:00 - 22:00",
    Friday: "08:00 - 23:00",
    Saturday: "08:00 - 23:00",
    Sunday: "08:00 - 22:00",
  },
};

describe("settings module", () => {
  it("matches the designed shell and renders editable general information", () => {
    render(<SettingsView data={settings} saveSettingsAction={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Cafe settings" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "General" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("Cafe name")).toHaveValue("Kōhi Coffee");
    expect(screen.getByLabelText("Tagline")).toHaveValue("Coffee worth slowing down for.");
    expect(screen.getByLabelText("Short description")).toHaveValue(settings.description);
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("switches tabs without losing edits and submits one complete settings snapshot", async () => {
    const user = userEvent.setup();
    const saveSettingsAction = vi.fn().mockResolvedValue({ success: true, message: "Settings saved." });
    render(<SettingsView data={settings} saveSettingsAction={saveSettingsAction} />);

    await user.clear(screen.getByLabelText("Cafe name"));
    await user.type(screen.getByLabelText("Cafe name"), "Kōhi House");
    await user.click(screen.getByRole("tab", { name: "Contact & location" }));
    await user.clear(screen.getByLabelText("Address"));
    await user.type(screen.getByLabelText("Address"), "New address, Jakarta");
    await user.click(screen.getByRole("tab", { name: "General" }));
    expect(screen.getByLabelText("Cafe name")).toHaveValue("Kōhi House");

    await user.click(screen.getByRole("tab", { name: "Opening hours" }));
    await user.clear(screen.getByLabelText("Monday hours"));
    await user.type(screen.getByLabelText("Monday hours"), "09:00 - 21:00");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(saveSettingsAction).toHaveBeenCalledOnce();
    const form = saveSettingsAction.mock.calls[0]?.[0] as FormData;
    expect(form.get("cafeName")).toBe("Kōhi House");
    expect(form.get("address")).toBe("New address, Jakarta");
    expect(form.get("openingHours.Monday")).toBe("09:00 - 21:00");
    expect(await screen.findByRole("status")).toHaveTextContent("Settings saved.");
  });

  it("keeps unsaved edits and shows server validation errors", async () => {
    const user = userEvent.setup();
    const saveSettingsAction = vi.fn().mockResolvedValue({ success: false, message: "Please fix the highlighted fields.", errors: { email: ["Enter a valid email."] } });
    render(<SettingsView data={settings} saveSettingsAction={saveSettingsAction} />);

    await user.click(screen.getByRole("tab", { name: "Contact & location" }));
    await user.clear(screen.getByLabelText("Email"));
    await user.type(screen.getByLabelText("Email"), "bad@example.com");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Please fix the highlighted fields.");
    expect(screen.getByLabelText("Email")).toHaveValue("bad@example.com");
    expect(screen.getByRole("button", { name: "Save changes" })).not.toBeDisabled();
  });

  it("locks save while the request is pending and prevents duplicate submissions", async () => {
    const user = userEvent.setup();
    let resolveAction!: (value: { success: boolean; message: string }) => void;
    const saveSettingsAction = vi.fn().mockReturnValue(new Promise((resolve) => { resolveAction = resolve; }));
    render(<SettingsView data={settings} saveSettingsAction={saveSettingsAction} />);

    const save = screen.getByRole("button", { name: "Save changes" });
    await user.click(save);
    expect(save).toBeDisabled();
    await user.click(save);
    expect(saveSettingsAction).toHaveBeenCalledOnce();

    resolveAction({ success: true, message: "Settings saved." });
    expect(await screen.findByRole("status")).toHaveTextContent("Settings saved.");
  });

  it("shows a safe empty configuration when the row has not been seeded", () => {
    render(<SettingsView data={{ ...settings, cafeName: "", tagline: "", description: "", address: "", phone: "", whatsapp: "", email: "", mapsUrl: "" }} saveSettingsAction={vi.fn()} />);

    expect(screen.getByLabelText("Cafe name")).toHaveValue("");
    expect(within(screen.getByRole("tabpanel", { name: "General" })).getByText("Add the public details your guests should see.")).toBeInTheDocument();
  });
});
