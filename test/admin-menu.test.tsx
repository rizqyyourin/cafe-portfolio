import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigationMocks,
}));

import { MenuView, type MenuAction, type MenuPageData } from "@/components/admin/menu-view";

const menuData: MenuPageData = {
  categories: [
    { id: "coffee", name: "Coffee" },
    { id: "breakfast", name: "Breakfast" },
  ],
  items: [
    { id: "menu-1", categoryId: "coffee", categoryName: "Coffee", name: "Kōhi Latte", slug: "kohi-latte", description: "Double espresso with silky milk.", price: 38000, imageUrl: null, badge: "Best Seller", isFeatured: true, isAvailable: true, displayOrder: 1 },
    { id: "menu-2", categoryId: "coffee", categoryName: "Coffee", name: "Black Tonic", slug: "black-tonic", description: "Bright espresso with sparkling tonic.", price: 41000, imageUrl: null, badge: null, isFeatured: false, isAvailable: false, displayOrder: 2 },
    { id: "menu-3", categoryId: "breakfast", categoryName: "Breakfast", name: "Miso Toast", slug: "miso-toast", description: "Sourdough with cultured butter and honey.", price: 48000, imageUrl: null, badge: null, isFeatured: false, isAvailable: true, displayOrder: 3 },
    { id: "menu-4", categoryId: "breakfast", categoryName: "Breakfast", name: "Soft Egg Bun", slug: "soft-egg-bun", description: "Potato bun with soft scrambled egg.", price: 58000, imageUrl: null, badge: null, isFeatured: false, isAvailable: true, displayOrder: 4 },
    { id: "menu-5", categoryId: "coffee", categoryName: "Coffee", name: "Oat Flat White", slug: "oat-flat-white", description: "Bold ristretto with creamy oat milk.", price: 42000, imageUrl: null, badge: "New", isFeatured: false, isAvailable: true, displayOrder: 5 },
    { id: "menu-6", categoryId: "breakfast", categoryName: "Breakfast", name: "Granola Bowl", slug: "granola-bowl", description: "House granola with fruit and yogurt.", price: 52000, imageUrl: null, badge: null, isFeatured: false, isAvailable: true, displayOrder: 6 },
  ],
};

function renderMenu(overrides: Partial<MenuPageData> = {}, actions?: {
  createMenuItemAction?: MenuAction;
  updateMenuItemAction?: MenuAction;
  deleteMenuItemAction?: MenuAction;
}) {
  const createMenuItemAction = actions?.createMenuItemAction ?? vi.fn().mockResolvedValue({ success: true, message: "Menu item created." });
  const updateMenuItemAction = actions?.updateMenuItemAction ?? vi.fn().mockResolvedValue({ success: true, message: "Menu item updated." });
  const deleteMenuItemAction = actions?.deleteMenuItemAction ?? vi.fn().mockResolvedValue({ success: true, message: "Menu item deleted." });

  return {
    createMenuItemAction,
    updateMenuItemAction,
    deleteMenuItemAction,
    ...render(<MenuView data={{ ...menuData, ...overrides }} createMenuItemAction={createMenuItemAction} deleteMenuItemAction={deleteMenuItemAction} updateMenuItemAction={updateMenuItemAction} />),
  };
}

function visibleMenuItemNames() {
  return screen.getAllByRole("button", { name: /^Edit / }).map((button) => button.getAttribute("aria-label")?.replace("Edit ", ""));
}

async function fillMenuForm(dialog: HTMLElement, user: ReturnType<typeof userEvent.setup>) {
  await user.type(within(dialog).getByLabelText("Name"), "New Mocha");
  await user.type(within(dialog).getByLabelText("Slug"), "new-mocha");
  await user.type(within(dialog).getByLabelText("Description"), "A chocolate espresso drink for the menu.");
  await user.type(within(dialog).getByLabelText("Price (IDR)"), "45000");
  await user.selectOptions(within(dialog).getByLabelText("Category"), "coffee");
}

describe("menu module", () => {
  beforeEach(() => {
    navigationMocks.refresh.mockReset();
  });

  it("renders the designed menu table with a five-item page and real item metadata", () => {
    renderMenu();

    expect(screen.getByRole("heading", { name: "Menu items" })).toBeInTheDocument();
    expect(screen.getByText("6 items across 2 active categories")).toBeInTheDocument();
    expect(screen.getByText("Kōhi Latte")).toBeInTheDocument();
    expect(screen.getByText("Rp 38.000")).toBeInTheDocument();
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getAllByText("AVAILABLE").length).toBeGreaterThan(0);
    expect(screen.getByText("Showing 1–5 of 6 items")).toBeInTheDocument();
    expect(screen.queryByText("Granola Bowl")).not.toBeInTheDocument();
  });

  it("filters by search, category, and status and exposes a clear empty state", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.type(screen.getByRole("searchbox", { name: "Search menu items" }), "does-not-exist");
    expect(screen.getByText("No menu items match these filters.")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Clear filters" })[0]!);
    expect(screen.getByText("Kōhi Latte")).toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: "Category" }), "breakfast");
    expect(screen.getByText("Miso Toast")).toBeInTheDocument();
    expect(screen.queryByText("Kōhi Latte")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: "Category" }), "all");
    const statusFilter = screen.getByRole("combobox", { name: "Status" });
    await user.selectOptions(statusFilter, "available");
    expect(screen.queryByText("Black Tonic")).not.toBeInTheDocument();
    expect(screen.getByText("Kōhi Latte")).toBeInTheDocument();

    await user.selectOptions(statusFilter, "featured");
    expect(screen.getByText("Kōhi Latte")).toBeInTheDocument();
    expect(screen.queryByText("Miso Toast")).not.toBeInTheDocument();

    await user.selectOptions(statusFilter, "sold-out");
    expect(screen.getByText("Black Tonic")).toBeInTheDocument();
    expect(screen.queryByText("Kōhi Latte")).not.toBeInTheDocument();
  });

  it("sorts each table column in both directions and exposes all status options", async () => {
    const user = userEvent.setup();
    renderMenu();

    const sortCases = [
      { label: "Item", ascending: "Black Tonic", descending: "Soft Egg Bun" },
      { label: "Category", ascending: "Granola Bowl", descending: "Oat Flat White" },
      { label: "Price", ascending: "Kōhi Latte", descending: "Soft Egg Bun" },
      { label: "Order", ascending: "Kōhi Latte", descending: "Granola Bowl" },
      { label: "Status", ascending: "Granola Bowl", descending: "Black Tonic" },
      { label: "Featured", ascending: "Black Tonic", descending: "Kōhi Latte" },
    ] as const;

    for (const { label, ascending, descending } of sortCases) {
      const header = screen.getByRole("columnheader", { name: label });
      expect(header.querySelector("svg")).not.toBeNull();
      await user.click(screen.getByRole("button", { name: `Sort ${label} ascending` }));
      expect(screen.getByRole("button", { name: `Sort ${label} descending` })).toBeInTheDocument();
      expect(visibleMenuItemNames()[0]).toBe(ascending);
      await user.click(screen.getByRole("button", { name: `Sort ${label} descending` }));
      expect(screen.getByRole("button", { name: `Sort ${label} ascending` })).toBeInTheDocument();
      expect(visibleMenuItemNames()[0]).toBe(descending);
    }

    const statusFilter = screen.getByRole("combobox", { name: "Status" });
    expect(within(statusFilter).getByRole("option", { name: "All statuses" })).toBeInTheDocument();
    expect(within(statusFilter).getByRole("option", { name: "Available" })).toBeInTheDocument();
    expect(within(statusFilter).getByRole("option", { name: "Sold out" })).toBeInTheDocument();
    expect(within(statusFilter).getByRole("option", { name: "Featured" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Sort menu items/ })).not.toBeInTheDocument();
  });

  it("paginates and reverses the display order without losing the filter context", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText("Showing 6–6 of 6 items")).toBeInTheDocument();
    expect(screen.getByText("Granola Bowl")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous page" })).not.toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Sort Item ascending" }));
    expect(screen.getByText("Showing 1–5 of 6 items")).toBeInTheDocument();
    expect(screen.getByText("Granola Bowl")).toBeInTheDocument();
  });

  it("opens create, blocks empty required submission, and closes with Escape", async () => {
    const user = userEvent.setup();
    const { createMenuItemAction } = renderMenu();

    await user.click(screen.getByRole("button", { name: /add menu item/i }));
    const dialog = screen.getByRole("dialog", { name: "Add menu item" });
    expect(within(dialog).getByLabelText("Name")).toBeRequired();
    await user.click(within(dialog).getByRole("button", { name: "Save menu item" }));
    expect(createMenuItemAction).not.toHaveBeenCalled();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Add menu item" })).not.toBeInTheDocument();
  });

  it("creates a menu item, refreshes, and prevents duplicate submit while pending", async () => {
    const user = userEvent.setup();
    let resolveAction!: (value: { success: boolean; message: string }) => void;
    const createMenuItemAction = vi.fn().mockReturnValue(new Promise((resolve) => { resolveAction = resolve; }));
    renderMenu({}, { createMenuItemAction });

    await user.click(screen.getByRole("button", { name: /add menu item/i }));
    const dialog = screen.getByRole("dialog", { name: "Add menu item" });
    await fillMenuForm(dialog, user);
    const submit = within(dialog).getByRole("button", { name: "Save menu item" });
    await user.click(submit);
    expect(submit).toBeDisabled();
    await user.click(submit);
    expect(createMenuItemAction).toHaveBeenCalledOnce();

    resolveAction({ success: true, message: "Menu item created." });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Add menu item" })).not.toBeInTheDocument());
    expect(navigationMocks.refresh).toHaveBeenCalledOnce();
  });

  it("keeps the create modal open and shows server errors", async () => {
    const user = userEvent.setup();
    const createMenuItemAction = vi.fn().mockResolvedValue({ success: false, message: "That slug is already in use.", errors: { slug: ["Use a unique slug."] } });
    renderMenu({}, { createMenuItemAction });

    await user.click(screen.getByRole("button", { name: /add menu item/i }));
    const dialog = screen.getByRole("dialog", { name: "Add menu item" });
    await fillMenuForm(dialog, user);
    await user.click(within(dialog).getByRole("button", { name: "Save menu item" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("That slug is already in use.");
    expect(screen.getByText("Use a unique slug.")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Add menu item" })).toBeInTheDocument();
  });

  it("prefills edit, updates the item, and refreshes after success", async () => {
    const user = userEvent.setup();
    const updateMenuItemAction = vi.fn().mockResolvedValue({ success: true, message: "Menu item updated." });
    renderMenu({}, { updateMenuItemAction });

    await user.click(screen.getByRole("button", { name: "Edit Kōhi Latte" }));
    const dialog = screen.getByRole("dialog", { name: "Edit menu item" });
    expect(within(dialog).getByLabelText("Name")).toHaveValue("Kōhi Latte");
    expect(within(dialog).getByLabelText("Category")).toHaveClass("min-h-14");
    expect(within(dialog).getByText("Lower numbers appear first. Duplicate numbers are allowed; ties use the item name.")).toBeInTheDocument();
    expect(within(dialog).getByRole("group", { name: "Publishing" })).toHaveTextContent("In stock");
    expect(within(dialog).getByRole("group", { name: "Publishing" })).toHaveTextContent("Highlighted on homepage");
    await user.click(within(dialog).getByLabelText("Featured"));
    await user.click(within(dialog).getByRole("button", { name: "Save menu item" }));

    await waitFor(() => expect(updateMenuItemAction).toHaveBeenCalledOnce());
    expect(updateMenuItemAction.mock.calls[0]?.[0].get("id")).toBe("menu-1");
    expect(navigationMocks.refresh).toHaveBeenCalledOnce();
  });

  it("requires an explicit delete confirmation and refreshes after delete", async () => {
    const user = userEvent.setup();
    const deleteMenuItemAction = vi.fn().mockResolvedValue({ success: true, message: "Menu item deleted." });
    renderMenu({}, { deleteMenuItemAction });

    await user.click(screen.getByRole("button", { name: "Edit Kōhi Latte" }));
    await user.click(within(screen.getByRole("dialog", { name: "Edit menu item" })).getByRole("button", { name: "Delete menu item" }));
    const confirm = screen.getByRole("dialog", { name: "Delete menu item" });
    expect(confirm).toHaveTextContent("Kōhi Latte");
    expect(deleteMenuItemAction).not.toHaveBeenCalled();

    await user.click(within(confirm).getByRole("button", { name: "Delete item" }));
    await waitFor(() => expect(deleteMenuItemAction).toHaveBeenCalledOnce());
    expect(deleteMenuItemAction.mock.calls[0]?.[0].get("id")).toBe("menu-1");
    expect(navigationMocks.refresh).toHaveBeenCalledOnce();
  });

  it("keeps delete confirmation open after a failed delete and resets pending", async () => {
    const user = userEvent.setup();
    const deleteMenuItemAction = vi.fn().mockResolvedValue({ success: false, message: "This item could not be deleted." });
    renderMenu({}, { deleteMenuItemAction });

    await user.click(screen.getByRole("button", { name: "Edit Kōhi Latte" }));
    await user.click(within(screen.getByRole("dialog", { name: "Edit menu item" })).getByRole("button", { name: "Delete menu item" }));
    const confirm = screen.getByRole("dialog", { name: "Delete menu item" });
    await user.click(within(confirm).getByRole("button", { name: "Delete item" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("This item could not be deleted.");
    expect(within(screen.getByRole("dialog", { name: "Delete menu item" })).getByRole("button", { name: "Delete item" })).not.toBeDisabled();
    expect(navigationMocks.refresh).not.toHaveBeenCalled();
  });

  it("shows a useful empty state when there are no menu items", () => {
    renderMenu({ items: [] });

    expect(screen.getByText("No menu items yet.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add menu item/i })).toBeInTheDocument();
  });

  it("keeps creation safe when there are no active categories", async () => {
    const user = userEvent.setup();
    renderMenu({ categories: [] });

    await user.click(screen.getByRole("button", { name: /add menu item/i }));

    const dialog = screen.getByRole("dialog", { name: "Add menu item" });
    expect(within(dialog).getByRole("status")).toHaveTextContent("Add a category before creating a menu item.");
    expect(within(dialog).getByRole("button", { name: "Save menu item" })).toBeDisabled();
  });
});
