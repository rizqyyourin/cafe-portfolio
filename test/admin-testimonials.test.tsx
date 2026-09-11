import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => navigationMocks }));

import { TestimonialsView, type TestimonialAction, type TestimonialsPageData } from "@/components/admin/testimonials-view";

const testimonialsData: TestimonialsPageData = {
  publishedCount: 3,
  testimonials: [
    { id: "testimonial-1", customerName: "Nadia Ramadhani", content: "The kind of place you find once — then quietly make part of your week.", rating: 5, isActive: true },
    { id: "testimonial-2", customerName: "Clara Wibowo", content: "The truffle scramble alone is worth crossing the city for.", rating: 4, isActive: true },
    { id: "testimonial-3", customerName: "Arga Pradana", content: "They remember your order and somehow the room always feels just right.", rating: 5, isActive: true },
    { id: "testimonial-4", customerName: "Dimas Putra", content: "Coffee that makes a slow Sunday even better.", rating: 5, isActive: false },
  ],
};

function renderTestimonials(overrides: Partial<TestimonialsPageData> = {}, actions?: {
  createTestimonialAction?: TestimonialAction;
  updateTestimonialAction?: TestimonialAction;
  deleteTestimonialAction?: TestimonialAction;
}) {
  const createTestimonialAction = actions?.createTestimonialAction ?? vi.fn().mockResolvedValue({ success: true, message: "Testimonial created." });
  const updateTestimonialAction = actions?.updateTestimonialAction ?? vi.fn().mockResolvedValue({ success: true, message: "Testimonial updated." });
  const deleteTestimonialAction = actions?.deleteTestimonialAction ?? vi.fn().mockResolvedValue({ success: true, message: "Testimonial deleted." });

  return {
    createTestimonialAction,
    updateTestimonialAction,
    deleteTestimonialAction,
    ...render(<TestimonialsView createTestimonialAction={createTestimonialAction} data={{ ...testimonialsData, ...overrides }} deleteTestimonialAction={deleteTestimonialAction} updateTestimonialAction={updateTestimonialAction} />),
  };
}

async function fillTestimonialForm(dialog: HTMLElement, user: ReturnType<typeof userEvent.setup>) {
  await user.type(within(dialog).getByLabelText("Customer name"), "Maya Prasetyo");
  await user.type(within(dialog).getByLabelText("Guest note"), "A calm room and a thoughtful cup worth returning for.");
  await user.selectOptions(within(dialog).getByLabelText("Rating"), "5");
}

describe("testimonials module", () => {
  beforeEach(() => navigationMocks.refresh.mockReset());

  it("renders the designed guest notes grid, ratings, and hidden status", () => {
    renderTestimonials();

    expect(screen.getByRole("heading", { name: "Guest notes" })).toBeInTheDocument();
    expect(screen.getByText("3 published stories from the people who make Kōhi feel like home.")).toBeInTheDocument();
    expect(screen.getByText(/The kind of place you find once — then quietly make part of your week\./)).toBeInTheDocument();
    expect(screen.getByText(/Coffee that makes a slow Sunday even better\./)).toBeInTheDocument();
    expect(screen.getByText("Hidden")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Rating: 4 out of 5" })).toBeInTheDocument();
  });

  it("opens create, blocks empty required input, and closes with Escape", async () => {
    const user = userEvent.setup();
    const { createTestimonialAction } = renderTestimonials();

    await user.click(screen.getByRole("button", { name: /add testimonial/i }));
    const dialog = screen.getByRole("dialog", { name: "Add testimonial" });
    expect(within(dialog).getByLabelText("Customer name")).toBeRequired();
    await user.click(within(dialog).getByRole("button", { name: "Save testimonial" }));
    expect(createTestimonialAction).not.toHaveBeenCalled();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Add testimonial" })).not.toBeInTheDocument();
  });

  it("creates a testimonial, refreshes, and prevents duplicate submit while pending", async () => {
    const user = userEvent.setup();
    let resolveAction!: (value: { success: boolean; message: string }) => void;
    const createTestimonialAction = vi.fn().mockReturnValue(new Promise((resolve) => { resolveAction = resolve; }));
    renderTestimonials({}, { createTestimonialAction });

    await user.click(screen.getByRole("button", { name: /add testimonial/i }));
    const dialog = screen.getByRole("dialog", { name: "Add testimonial" });
    await fillTestimonialForm(dialog, user);
    const submit = within(dialog).getByRole("button", { name: "Save testimonial" });
    await user.click(submit);
    expect(submit).toBeDisabled();
    await user.click(submit);
    expect(createTestimonialAction).toHaveBeenCalledOnce();

    resolveAction({ success: true, message: "Testimonial created." });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Add testimonial" })).not.toBeInTheDocument());
    expect(navigationMocks.refresh).toHaveBeenCalledOnce();
  });

  it("keeps create open and shows server validation errors", async () => {
    const user = userEvent.setup();
    const createTestimonialAction = vi.fn().mockResolvedValue({ success: false, message: "Please check the testimonial.", errors: { content: ["Guest note is too long."] } });
    renderTestimonials({}, { createTestimonialAction });

    await user.click(screen.getByRole("button", { name: /add testimonial/i }));
    const dialog = screen.getByRole("dialog", { name: "Add testimonial" });
    await fillTestimonialForm(dialog, user);
    await user.click(within(dialog).getByRole("button", { name: "Save testimonial" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Guest note is too long.");
    expect(screen.getByRole("dialog", { name: "Add testimonial" })).toBeInTheDocument();
  });

  it("prefills edit, toggles published state, and refreshes after success", async () => {
    const user = userEvent.setup();
    const updateTestimonialAction = vi.fn().mockResolvedValue({ success: true, message: "Testimonial updated." });
    renderTestimonials({}, { updateTestimonialAction });

    await user.click(screen.getByRole("button", { name: "Edit Nadia Ramadhani" }));
    const dialog = screen.getByRole("dialog", { name: "Edit testimonial" });
    expect(within(dialog).getByLabelText("Customer name")).toHaveValue("Nadia Ramadhani");
    expect(within(dialog).getByLabelText("Published")).toBeChecked();
    await user.click(within(dialog).getByLabelText("Published"));
    await user.click(within(dialog).getByRole("button", { name: "Save testimonial" }));

    await waitFor(() => expect(updateTestimonialAction).toHaveBeenCalledOnce());
    expect(updateTestimonialAction.mock.calls[0]?.[0].get("id")).toBe("testimonial-1");
    expect(updateTestimonialAction.mock.calls[0]?.[0].get("isActive")).toBe(null);
    expect(navigationMocks.refresh).toHaveBeenCalledOnce();
  });

  it("requires explicit delete confirmation and deletes after confirmation", async () => {
    const user = userEvent.setup();
    const deleteTestimonialAction = vi.fn().mockResolvedValue({ success: true, message: "Testimonial deleted." });
    renderTestimonials({}, { deleteTestimonialAction });

    await user.click(screen.getByRole("button", { name: "Edit Nadia Ramadhani" }));
    await user.click(within(screen.getByRole("dialog", { name: "Edit testimonial" })).getByRole("button", { name: "Delete testimonial" }));
    const confirm = screen.getByRole("dialog", { name: "Delete testimonial" });
    expect(confirm).toHaveTextContent("Nadia Ramadhani");
    expect(deleteTestimonialAction).not.toHaveBeenCalled();

    await user.click(within(confirm).getByRole("button", { name: "Delete testimonial" }));
    await waitFor(() => expect(deleteTestimonialAction).toHaveBeenCalledOnce());
    expect(deleteTestimonialAction.mock.calls[0]?.[0].get("id")).toBe("testimonial-1");
    expect(navigationMocks.refresh).toHaveBeenCalledOnce();
  });

  it("keeps delete open after a persistence failure", async () => {
    const user = userEvent.setup();
    const deleteTestimonialAction = vi.fn().mockResolvedValue({ success: false, message: "We could not delete that testimonial right now." });
    renderTestimonials({}, { deleteTestimonialAction });

    await user.click(screen.getByRole("button", { name: "Edit Nadia Ramadhani" }));
    await user.click(within(screen.getByRole("dialog", { name: "Edit testimonial" })).getByRole("button", { name: "Delete testimonial" }));
    const confirm = screen.getByRole("dialog", { name: "Delete testimonial" });
    await user.click(within(confirm).getByRole("button", { name: "Delete testimonial" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("We could not delete that testimonial right now.");
    expect(within(screen.getByRole("dialog", { name: "Delete testimonial" })).getByRole("button", { name: "Delete testimonial" })).not.toBeDisabled();
    expect(navigationMocks.refresh).not.toHaveBeenCalled();
  });

  it("shows an empty state while keeping testimonial creation available", () => {
    renderTestimonials({ testimonials: [], publishedCount: 0 });

    expect(screen.getByText("No testimonials yet.")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /testimonial/i })).toHaveLength(2);
  });
});
