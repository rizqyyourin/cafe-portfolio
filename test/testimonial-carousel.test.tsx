import { render, screen } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";

import { TestimonialCarousel } from "@/components/public/testimonial-carousel";

const testimonials = [
  { id: "one", customerName: "Nadia", content: "First guest note.", rating: 5, isActive: true },
  { id: "two", customerName: "Clara", content: "Second guest note.", rating: 4, isActive: true },
];

describe("TestimonialCarousel", () => {
  it("automatically advances to the next quote", () => {
    vi.useFakeTimers();
    render(<TestimonialCarousel testimonials={testimonials} />);

    expect(screen.getByText(/First guest note\./)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(6500));
    expect(screen.getByText(/Second guest note\./)).toBeInTheDocument();

    vi.useRealTimers();
  });
});
