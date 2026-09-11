import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import SettingsLoading from "@/app/admin/(dashboard)/settings/loading";
import SettingsError from "@/app/admin/(dashboard)/settings/error";

describe("settings route states", () => {
  it("exposes an accessible loading state", () => {
    render(<SettingsLoading />);
    expect(screen.getByRole("status", { name: "Loading cafe settings" })).toBeInTheDocument();
  });

  it("exposes a recoverable error state", () => {
    render(<SettingsError error={new Error("database unavailable")} reset={() => undefined} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Cafe settings unavailable");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
