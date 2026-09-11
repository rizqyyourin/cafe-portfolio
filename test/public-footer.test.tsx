import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PublicFooter } from "@/components/layout/public-footer";

const baseSettings = {
  id: "default",
  cafeName: "Kōhi Coffee",
  tagline: "Coffee worth slowing down for.",
  description: "A modern neighbourhood specialty coffee shop.",
  address: "Jl. Kemang Raya No. 28",
  phone: "+62 21 5550 0188",
  whatsapp: "6281255550188",
  email: "hello@kohicoffee.example",
  instagram: null,
  threads: null,
  twitter: null,
  tiktok: null,
  facebook: null,
  mapsUrl: "https://maps.google.com/?q=Kemang+Jakarta",
  openingHours: { Monday: "08:00 - 22:00" },
};

describe("public footer social links", () => {
  it("shows only configured social links and points each link to its saved URL", () => {
    render(<PublicFooter settings={{ ...baseSettings, instagram: "https://instagram.com/kohi", threads: "https://threads.net/@kohi", twitter: "https://x.com/kohi", facebook: "https://facebook.com/kohi", tiktok: "https://tiktok.com/@kohi" }} />);

    for (const [label, href] of [["Instagram", "https://instagram.com/kohi"], ["Threads", "https://threads.net/@kohi"], ["Twitter", "https://x.com/kohi"], ["Facebook", "https://facebook.com/kohi"], ["TikTok", "https://tiktok.com/@kohi"]]) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", href);
    }
  });

  it("hides blank social links", () => {
    render(<PublicFooter settings={baseSettings} />);

    expect(screen.queryByRole("link", { name: "Instagram" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Threads" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Twitter" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Facebook" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "TikTok" })).not.toBeInTheDocument();
  });
});
