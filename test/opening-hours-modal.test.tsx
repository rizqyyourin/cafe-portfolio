import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { OpeningHoursModal } from "@/components/public/opening-hours-modal";

describe("opening hours modal", () => {
  it("opens the internal weekly hours and closes with Escape", async () => {
    const user = userEvent.setup();
    render(<OpeningHoursModal hours={{ Monday: "09:00 - 21:00", Tuesday: "Closed" }} />);

    await user.click(screen.getByRole("button", { name: "See our weekly hours" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("09:00 - 21:00")).toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
