import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import AdminTestimonialsError from "@/app/admin/(dashboard)/testimonials/error";
import AdminTestimonialsLoading from "@/app/admin/(dashboard)/testimonials/loading";

describe("testimonials loading and error states", () => {
  it("shows a testimonial-specific loading skeleton with an accessible status", () => {
    render(<AdminTestimonialsLoading />);

    expect(screen.getByRole("status", { name: "Loading testimonials" })).toBeInTheDocument();
  });

  it("explains a testimonial data failure and retries only when requested", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    render(<AdminTestimonialsError error={new Error("database unavailable")} reset={reset} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Testimonials unavailable");
    expect(screen.getByRole("alert")).toHaveTextContent("Nothing was changed.");
    expect(reset).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
