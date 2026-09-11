import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import AdminGalleryError from "@/app/admin/(dashboard)/gallery/error";
import AdminGalleryLoading from "@/app/admin/(dashboard)/gallery/loading";

describe("gallery loading and error states", () => {
  it("shows a gallery-specific loading skeleton with an accessible status", () => {
    render(<AdminGalleryLoading />);

    expect(screen.getByRole("status", { name: "Loading gallery" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading gallery");
  });

  it("explains a gallery data failure and retries only when requested", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    render(<AdminGalleryError error={new Error("Turso unavailable")} reset={reset} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Gallery unavailable");
    expect(screen.getByRole("alert")).toHaveTextContent("Nothing was changed.");
    expect(reset).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
