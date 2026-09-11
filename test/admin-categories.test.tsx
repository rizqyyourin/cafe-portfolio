import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => navigationMocks }));

import { CategoriesView, type CategoryAction, type CategoriesPageData } from "@/components/admin/categories-view";

const categoriesData: CategoriesPageData = {
  categories: [
    { id: "coffee", name: "Coffee", slug: "coffee", displayOrder: 1, isActive: true, menuItemCount: 2 },
    { id: "breakfast", name: "Breakfast", slug: "breakfast", displayOrder: 2, isActive: true, menuItemCount: 1 },
    { id: "seasonal", name: "Seasonal", slug: "seasonal", displayOrder: 3, isActive: false, menuItemCount: 0 },
  ],
};

function renderCategories(overrides: Partial<CategoriesPageData> = {}, actions?: {
  createCategoryAction?: CategoryAction;
  updateCategoryAction?: CategoryAction;
  deleteCategoryAction?: CategoryAction;
}) {
  const createCategoryAction = actions?.createCategoryAction ?? vi.fn().mockResolvedValue({ success: true, message: "Category created." });
  const updateCategoryAction = actions?.updateCategoryAction ?? vi.fn().mockResolvedValue({ success: true, message: "Category updated." });
  const deleteCategoryAction = actions?.deleteCategoryAction ?? vi.fn().mockResolvedValue({ success: true, message: "Category deleted." });

  return {
    createCategoryAction,
    updateCategoryAction,
    deleteCategoryAction,
    ...render(<CategoriesView createCategoryAction={createCategoryAction} data={{ ...categoriesData, ...overrides }} deleteCategoryAction={deleteCategoryAction} updateCategoryAction={updateCategoryAction} />),
  };
}

async function fillCategoryForm(dialog: HTMLElement, user: ReturnType<typeof userEvent.setup>) {
  await user.type(within(dialog).getByLabelText("Name"), "Cold Drinks");
  await user.type(within(dialog).getByLabelText("Slug"), "cold-drinks");
  await user.clear(within(dialog).getByLabelText("Display order"));
  await user.type(within(dialog).getByLabelText("Display order"), "4");
}

describe("categories module", () => {
  beforeEach(() => navigationMocks.refresh.mockReset());

  it("renders active and inactive categories with order and status", () => {
    renderCategories();

    expect(screen.getByRole("heading", { name: "Menu categories" })).toBeInTheDocument();
    expect(screen.getByText("Coffee")).toBeInTheDocument();
    expect(screen.getByText("/coffee")).toBeInTheDocument();
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getAllByText("ACTIVE")).toHaveLength(2);
    expect(screen.getByText("INACTIVE")).toBeInTheDocument();
    expect(screen.getByText("Use the display order to control the sequence on the public menu.")).toBeInTheDocument();
  });

  it("sorts by display order in both directions", async () => {
    const user = userEvent.setup();
    renderCategories();

    const sortButton = screen.getByRole("button", { name: "Sort categories descending" });
    await user.click(sortButton);

    expect(screen.getByRole("button", { name: "Sort categories ascending" })).toBeInTheDocument();
    const rows = screen.getAllByRole("row");
    expect(within(rows[1]!).getByText("Seasonal")).toBeInTheDocument();
    expect(within(rows[3]!).getByText("Coffee")).toBeInTheDocument();
  });

  it("opens create, blocks invalid required input, and closes with Escape", async () => {
    const user = userEvent.setup();
    const { createCategoryAction } = renderCategories();

    await user.click(screen.getByRole("button", { name: /add category/i }));
    const dialog = screen.getByRole("dialog", { name: "Add category" });
    expect(within(dialog).getByLabelText("Name")).toBeRequired();
    await user.click(within(dialog).getByRole("button", { name: "Save category" }));
    expect(createCategoryAction).not.toHaveBeenCalled();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Add category" })).not.toBeInTheDocument();
  });

  it("creates a category, refreshes, and prevents duplicate submit while pending", async () => {
    const user = userEvent.setup();
    let resolveAction!: (value: { success: boolean; message: string }) => void;
    const createCategoryAction = vi.fn().mockReturnValue(new Promise((resolve) => { resolveAction = resolve; }));
    renderCategories({}, { createCategoryAction });

    await user.click(screen.getByRole("button", { name: /add category/i }));
    const dialog = screen.getByRole("dialog", { name: "Add category" });
    await fillCategoryForm(dialog, user);
    const submit = within(dialog).getByRole("button", { name: "Save category" });
    await user.click(submit);
    expect(submit).toBeDisabled();
    await user.click(submit);
    expect(createCategoryAction).toHaveBeenCalledOnce();

    resolveAction({ success: true, message: "Category created." });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Add category" })).not.toBeInTheDocument());
    expect(navigationMocks.refresh).toHaveBeenCalledOnce();
  });

  it("keeps create open and shows server field errors", async () => {
    const user = userEvent.setup();
    const createCategoryAction = vi.fn().mockResolvedValue({ success: false, message: "That slug is already in use.", errors: { slug: ["Use a unique slug."] } });
    renderCategories({}, { createCategoryAction });

    await user.click(screen.getByRole("button", { name: /add category/i }));
    const dialog = screen.getByRole("dialog", { name: "Add category" });
    await fillCategoryForm(dialog, user);
    await user.click(within(dialog).getByRole("button", { name: "Save category" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("That slug is already in use.");
    expect(screen.getByText("Use a unique slug.")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Add category" })).toBeInTheDocument();
  });

  it("prefills edit, updates active state, and refreshes after success", async () => {
    const user = userEvent.setup();
    const updateCategoryAction = vi.fn().mockResolvedValue({ success: true, message: "Category updated." });
    renderCategories({}, { updateCategoryAction });

    await user.click(screen.getByRole("button", { name: "Edit Coffee" }));
    const dialog = screen.getByRole("dialog", { name: "Edit category" });
    expect(within(dialog).getByLabelText("Name")).toHaveValue("Coffee");
    await user.click(within(dialog).getByLabelText("Active"));
    await user.click(within(dialog).getByRole("button", { name: "Save category" }));

    await waitFor(() => expect(updateCategoryAction).toHaveBeenCalledOnce());
    expect(updateCategoryAction.mock.calls[0]?.[0].get("id")).toBe("coffee");
    expect(updateCategoryAction.mock.calls[0]?.[0].get("isActive")).toBe(null);
    expect(navigationMocks.refresh).toHaveBeenCalledOnce();
  });

  it("requires explicit delete confirmation and deletes an unused category", async () => {
    const user = userEvent.setup();
    const deleteCategoryAction = vi.fn().mockResolvedValue({ success: true, message: "Category deleted." });
    renderCategories({}, { deleteCategoryAction });

    await user.click(screen.getByRole("button", { name: "Edit Seasonal" }));
    await user.click(within(screen.getByRole("dialog", { name: "Edit category" })).getByRole("button", { name: "Delete category" }));
    const confirm = screen.getByRole("dialog", { name: "Delete category" });
    expect(confirm).toHaveTextContent("Seasonal");
    expect(deleteCategoryAction).not.toHaveBeenCalled();

    await user.click(within(confirm).getByRole("button", { name: "Delete category" }));
    await waitFor(() => expect(deleteCategoryAction).toHaveBeenCalledOnce());
    expect(deleteCategoryAction.mock.calls[0]?.[0].get("id")).toBe("seasonal");
    expect(navigationMocks.refresh).toHaveBeenCalledOnce();
  });

  it("keeps an in-use delete confirmation open and explains the reassignment guard", async () => {
    const user = userEvent.setup();
    const deleteCategoryAction = vi.fn().mockResolvedValue({ success: false, message: "This category still contains 2 menu items. Reassign them before deleting." });
    renderCategories({}, { deleteCategoryAction });

    await user.click(screen.getByRole("button", { name: "Edit Coffee" }));
    await user.click(within(screen.getByRole("dialog", { name: "Edit category" })).getByRole("button", { name: "Delete category" }));
    const confirm = screen.getByRole("dialog", { name: "Delete category" });
    expect(confirm).toHaveTextContent("2 menu items");
    await user.click(within(confirm).getByRole("button", { name: "Delete category" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Reassign them before deleting.");
    expect(within(screen.getByRole("dialog", { name: "Delete category" })).getByRole("button", { name: "Delete category" })).not.toBeDisabled();
    expect(navigationMocks.refresh).not.toHaveBeenCalled();
  });

  it("shows an empty state while keeping category creation available", () => {
    renderCategories({ categories: [] });

    expect(screen.getByText("No menu categories yet.")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /add category/i })).toHaveLength(2);
  });
});
