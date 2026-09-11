"use client";

import { ArrowDown, ArrowRight, ArrowUp, Banknote, ChevronDown, CircleCheck, Coffee, Image as ImageIcon, ListOrdered, Plus, Star, Tag, Trash2, X, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import type { MenuActionState } from "@/actions/admin-menu";
import { Button } from "@/components/ui/button";
import type { AdminMenuItem } from "@/db/menu";
import { formatRupiah } from "@/lib/site";

export type MenuAction = (formData: FormData) => Promise<MenuActionState>;
export type { AdminMenuItem };

export type MenuPageData = {
  categories: Array<{ id: string; name: string }>;
  items: AdminMenuItem[];
};

type MenuViewProps = {
  data: MenuPageData;
  createMenuItemAction: MenuAction;
  updateMenuItemAction: MenuAction;
  deleteMenuItemAction: MenuAction;
};

const PAGE_SIZE = 5;

function Modal({ title, description, closeLabel, dismissLabel, onClose, children, locked = false }: {
  title: string;
  description: string;
  closeLabel: string;
  dismissLabel: string;
  onClose: () => void;
  children: React.ReactNode;
  locked?: boolean;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !locked) onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [locked, onClose]);

  const id = title.toLowerCase().replaceAll(" ", "-");
  return <div className="fixed inset-0 z-50 grid place-items-center p-4"><button aria-label={dismissLabel} className="absolute inset-0 cursor-default bg-[#1e1b18]/60" disabled={locked} onClick={onClose} type="button" /><section aria-describedby={`${id}-description`} aria-labelledby={`${id}-title`} aria-modal="true" className="relative z-10 max-h-[min(90vh,52rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#ded2c2] bg-[#fffdf9] p-6 shadow-2xl sm:p-8" onClick={(event) => event.stopPropagation()} role="dialog"><div className="flex items-start justify-between gap-6"><div><p className="eyebrow">Menu management</p><h2 className="display mt-2 text-3xl font-semibold" id={`${id}-title`}>{title}</h2><p className="mt-2 text-sm text-muted-foreground" id={`${id}-description`}>{description}</p></div><button aria-label={closeLabel} className="grid size-10 shrink-0 place-items-center rounded-full text-[#70685e] hover:bg-[#f1ece5]" disabled={locked} onClick={onClose} type="button"><X size={18} /></button></div><div className="mt-7">{children}</div></section></div>;
}

function ActionFeedback({ state }: { state?: MenuActionState }) {
  if (!state) return null;
  if (state.success) return state.message ? <p aria-live="polite" className="rounded-lg border border-[#b8d0b3] bg-[#eef7eb] p-3 text-sm text-[#557154]" role="status">{state.message}</p> : null;
  const fieldErrors = Object.values(state.errors ?? {}).flat();
  return <div aria-live="polite" className="rounded-lg border border-[#d49b96] bg-[#fff2f1] p-3 text-sm text-[#8d3d39]" role="alert"><p>{state.message ?? "Please check the details and try again."}</p>{fieldErrors.length > 0 ? <ul className="mt-1 list-inside list-disc">{fieldErrors.map((error) => <li key={error}>{error}</li>)}</ul> : null}</div>;
}

function MenuItemModal({ item, categories, action, onClose, onRequestDelete }: {
  item?: AdminMenuItem;
  categories: MenuPageData["categories"];
  action: MenuAction;
  onClose: () => void;
  onRequestDelete?: (item: AdminMenuItem) => void;
}) {
  const router = useRouter();
  const [state, setState] = useState<MenuActionState>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(item);
  const categoryOptions = item && !categories.some((category) => category.id === item.categoryId)
    ? [...categories, { id: item.categoryId, name: `${item.categoryName} (inactive)` }]
    : categories;
  const hasCategories = categoryOptions.length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setState(undefined);
    setIsSubmitting(true);
    try {
      const result = await action(new FormData(form));
      setState(result);
      if (result.success) {
        onClose();
        router.refresh();
      }
    } catch {
      setState({ success: false, message: "Something went wrong while saving the menu item." });
    } finally {
      setIsSubmitting(false);
    }
  }

return <Modal closeLabel={`${isEditing ? "Close edit" : "Close add"} menu item dialog`} description={`${isEditing ? "Update" : "Add"} the item details shown on the public menu. Required fields are checked again on the server.`} dismissLabel={`Dismiss ${isEditing ? "edit" : "add"} menu item dialog`} locked={isSubmitting} onClose={onClose} title={isEditing ? "Edit menu item" : "Add menu item"}><form className="grid gap-5" onSubmit={handleSubmit}><input defaultValue={item?.id} name="id" type="hidden" /><div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Name<input aria-label="Name" className="min-h-12 rounded-lg border bg-white px-4 font-normal outline-none focus:border-[#8b4a2b]" defaultValue={item?.name} minLength={2} name="name" placeholder="e.g. Kōhi Latte" required /></label><label className="grid gap-2 text-sm font-semibold">Slug<input aria-label="Slug" className="min-h-12 rounded-lg border bg-white px-4 font-normal outline-none focus:border-[#8b4a2b]" defaultValue={item?.slug} name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="kohi-latte" required /></label></div><label className="grid gap-2 text-sm font-semibold">Description<textarea aria-label="Description" className="min-h-28 rounded-lg border bg-white px-4 py-3 font-normal outline-none focus:border-[#8b4a2b]" defaultValue={item?.description} minLength={10} name="description" placeholder="Describe the ingredients and character of this item." required /></label><div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Price (IDR)<input aria-label="Price (IDR)" className="min-h-12 rounded-lg border bg-white px-4 font-normal outline-none focus:border-[#8b4a2b]" defaultValue={item?.price} min={0} name="price" required step={1} type="number" /></label><label className="grid gap-2 text-sm font-semibold">Category<span className="relative block"><select aria-label="Category" className="min-h-14 w-full appearance-none rounded-lg border border-[#ded2c2] bg-white px-4 pr-10 font-normal outline-none focus:border-[#8b4a2b] focus:ring-2 focus:ring-[#8b4a2b]" defaultValue={item?.categoryId ?? ""} disabled={!hasCategories} name="categoryId" required><option disabled value="">Choose a category</option>{categoryOptions.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#70685e]" size={17} /></span></label></div><div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Image URL <span className="font-normal text-muted-foreground">(optional)<input aria-label="Image URL" className="mt-2 min-h-12 w-full rounded-lg border bg-white px-4 font-normal outline-none focus:border-[#8b4a2b]" defaultValue={item?.imageUrl ?? ""} name="imageUrl" type="url" /></span></label><label className="grid gap-2 text-sm font-semibold">Badge <span className="font-normal text-muted-foreground">(optional)<input aria-label="Badge" className="mt-2 min-h-12 w-full rounded-lg border bg-white px-4 font-normal outline-none focus:border-[#8b4a2b]" defaultValue={item?.badge ?? ""} maxLength={30} name="badge" /></span></label></div><div className="grid gap-5 sm:grid-cols-2"><div><label className="grid gap-2 text-sm font-semibold" htmlFor="menu-display-order">Display order<input aria-label="Display order" className="min-h-12 rounded-lg border bg-white px-4 font-normal outline-none focus:border-[#8b4a2b]" defaultValue={item?.displayOrder ?? 0} id="menu-display-order" min={0} name="displayOrder" required step={1} type="number" /></label><p className="mt-2 text-xs leading-5 text-muted-foreground">Lower numbers appear first. Duplicate numbers are allowed; ties use the item name.</p></div><fieldset className="min-w-0 self-start"><legend className="mb-2 text-sm font-semibold">Publishing</legend><div className="grid grid-cols-2 gap-2"><label className="menu-publishing-option group relative flex min-h-14 cursor-pointer items-center gap-2.5 rounded-xl border border-[#ded2c2] bg-[#fffdf9] px-3.5 py-3 transition-[border-color,background-color,box-shadow] hover:border-[#b9a16a] has-[:checked]:border-[#557154] has-[:checked]:bg-[#eef5ea] has-[:checked]:shadow-[0_0_0_1px_#557154]"><input aria-label="Available" className="menu-publishing-checkbox" defaultChecked={item?.isAvailable ?? true} name="isAvailable" type="checkbox" value="on" /><span className="min-w-0"><span className="block text-sm font-semibold leading-tight">Available</span><span className="mt-1 block text-[0.65rem] font-normal leading-tight text-muted-foreground">In stock</span></span></label><label className="menu-publishing-option group relative flex min-h-14 cursor-pointer items-center gap-2.5 rounded-xl border border-[#ded2c2] bg-[#fffdf9] px-3.5 py-3 transition-[border-color,background-color,box-shadow] hover:border-[#b9a16a] has-[:checked]:border-[#b28b3c] has-[:checked]:bg-[#fff8e8] has-[:checked]:shadow-[0_0_0_1px_#b28b3c]"><input aria-label="Featured" className="menu-publishing-checkbox" defaultChecked={item?.isFeatured ?? false} name="isFeatured" type="checkbox" value="on" /><span className="min-w-0"><span className="block text-sm font-semibold leading-tight">Featured</span><span className="mt-1 block text-[0.65rem] font-normal leading-tight text-muted-foreground">Highlighted on homepage</span></span></label></div></fieldset></div><ActionFeedback state={state} />{!hasCategories ? <p className="rounded-lg border border-[#e1c98b] bg-[#fff9e8] p-3 text-sm text-[#80652e]" role="status">Add a category before creating a menu item.</p> : null}<div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between"><div>{isEditing && item && onRequestDelete ? <Button disabled={isSubmitting} onClick={() => onRequestDelete(item)} type="button" variant="ghost"><Trash2 size={15} />Delete menu item</Button> : null}</div><div className="flex flex-col-reverse gap-3 sm:flex-row"><Button disabled={isSubmitting} onClick={onClose} type="button" variant="ghost">Cancel</Button><Button disabled={isSubmitting || !hasCategories} type="submit">{isSubmitting ? "Saving…" : "Save menu item"}<ArrowRight size={16} /></Button></div></div></form></Modal>;
}

function DeleteMenuItemModal({ item, action, onClose }: { item: AdminMenuItem; action: MenuAction; onClose: () => void }) {
  const router = useRouter();
  const [state, setState] = useState<MenuActionState>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleDelete() {
    if (isSubmitting) return;
    setState(undefined);
    setIsSubmitting(true);
    const form = new FormData();
    form.set("id", item.id);
    try {
      const result = await action(form);
      setState(result);
      if (result.success) {
        onClose();
        router.refresh();
      }
    } catch {
      setState({ success: false, message: "Something went wrong while deleting the menu item." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return <Modal closeLabel="Close delete menu item dialog" description="This removes the item from the CMS and public menu. This action cannot be undone." dismissLabel="Dismiss delete menu item dialog" locked={isSubmitting} onClose={onClose} title="Delete menu item"><div className="grid gap-6"><div className="rounded-xl bg-[#f7f2e9] p-5"><p className="font-semibold">{item.name}</p><p className="mt-1 text-sm text-muted-foreground">{item.categoryName} · {formatRupiah(item.price)}</p></div><p className="text-sm leading-6 text-muted-foreground">Are you sure you want to delete this menu item? Any public menu cache will be refreshed after the deletion.</p><ActionFeedback state={state} /><div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end"><Button disabled={isSubmitting} onClick={onClose} type="button" variant="ghost">Keep item</Button><Button className="bg-[#954b48] text-white hover:bg-[#7f3d3a]" disabled={isSubmitting} onClick={handleDelete} type="button"><Trash2 size={15} />{isSubmitting ? "Deleting…" : "Delete item"}</Button></div></div></Modal>;
}

type MenuStatusFilter = "all" | "available" | "sold-out" | "featured";

type MenuSortKey = "item" | "category" | "price" | "order" | "status" | "featured";

function TableHeaderCell({ icon: Icon, label, sortKey, activeSortKey, sortDescending, onSort }: {
  icon: LucideIcon;
  label: string;
  sortKey: MenuSortKey;
  activeSortKey?: MenuSortKey;
  sortDescending: boolean;
  onSort: (sortKey: MenuSortKey) => void;
}) {
  const isActive = sortKey === activeSortKey;
  const currentDirection = isActive ? (sortDescending ? "descending" : "ascending") : "none";
  const nextDirection = !isActive || sortDescending ? "ascending" : "descending";
  const DirectionIcon = isActive ? (sortDescending ? ArrowUp : ArrowDown) : null;

  return <span aria-label={label} aria-sort={currentDirection} className="inline-flex min-w-0 items-center" role="columnheader"><button aria-label={`Sort ${label} ${nextDirection}`} className="group inline-flex min-w-0 items-center gap-2 text-left hover:text-[#1e1b18]" onClick={() => onSort(sortKey)} type="button"><Icon aria-hidden="true" className="shrink-0" size={14} strokeWidth={1.8} /><span className="truncate">{label}</span>{DirectionIcon ? <DirectionIcon aria-hidden="true" className="shrink-0" size={13} strokeWidth={2} /> : null}</button></span>;
}

function StatusPill({ isAvailable }: { isAvailable: boolean }) {
  return <span className={`w-fit rounded-full px-3 py-1 text-[0.68rem] font-semibold tracking-[0.14em] ${isAvailable ? "bg-[#dfeada] text-[#557154]" : "bg-[#f5e7bd] text-[#8c7540]"}`}>{isAvailable ? "AVAILABLE" : "SOLD OUT"}</span>;
}

export function MenuView({ data, createMenuItemAction, updateMenuItemAction, deleteMenuItemAction }: MenuViewProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<MenuStatusFilter>("all");
  const [sortKey, setSortKey] = useState<MenuSortKey>();
  const [sortDescending, setSortDescending] = useState(false);
  const [page, setPage] = useState(0);
  const [formItem, setFormItem] = useState<AdminMenuItem>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<AdminMenuItem>();

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...data.items].filter((item) => {
      const matchesSearch = !query || [item.name, item.description, item.categoryName, item.slug].some((value) => value.toLowerCase().includes(query));
      const matchesCategory = categoryFilter === "all" || item.categoryId === categoryFilter;
      const matchesStatus = statusFilter === "all"
        || (statusFilter === "available" && item.isAvailable)
        || (statusFilter === "sold-out" && !item.isAvailable)
        || (statusFilter === "featured" && item.isFeatured);
      return matchesSearch && matchesCategory && matchesStatus;
    }).sort((left, right) => {
      let order: number;
      if (!sortKey) {
        order = left.displayOrder - right.displayOrder || left.name.localeCompare(right.name);
      } else {
        switch (sortKey) {
          case "category":
            order = left.categoryName.localeCompare(right.categoryName) || left.name.localeCompare(right.name);
            break;
          case "price":
            order = left.price - right.price || left.name.localeCompare(right.name);
            break;
          case "order":
            order = left.displayOrder - right.displayOrder || left.name.localeCompare(right.name);
            break;
          case "status":
            order = Number(!left.isAvailable) - Number(!right.isAvailable) || left.name.localeCompare(right.name);
            break;
          case "featured":
            order = Number(left.isFeatured) - Number(right.isFeatured) || left.name.localeCompare(right.name);
            break;
          case "item":
            order = left.name.localeCompare(right.name);
            break;
        }
      }
      return sortDescending ? -order : order;
    });
  }, [categoryFilter, data.items, search, sortDescending, sortKey, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageItems = filteredItems.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const start = filteredItems.length === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const end = Math.min((currentPage + 1) * PAGE_SIZE, filteredItems.length);
  const resetPage = () => setPage(0);
  const clearFilters = () => { setSearch(""); setCategoryFilter("all"); setStatusFilter("all"); resetPage(); };
  const toggleSort = (nextSortKey: MenuSortKey) => {
    if (sortKey === nextSortKey) setSortDescending((value) => !value);
    else { setSortKey(nextSortKey); setSortDescending(false); }
    resetPage();
  };

  function openCreate() {
    setFormItem(undefined);
    setIsFormOpen(true);
  }

  function openEdit(item: AdminMenuItem) {
    setFormItem(item);
    setIsFormOpen(true);
  }

  return <><div className="space-y-9"><header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="eyebrow flex items-center gap-3">Content <span aria-hidden="true">/</span> Menu</p><h1 className="display mt-5 text-5xl font-medium tracking-[-0.055em] sm:text-6xl">Menu items</h1><p className="mt-2 text-base text-muted-foreground">{data.items.length} items across {data.categories.length} active categories</p></div><Button className="self-start rounded-md px-6 py-4 tracking-[0.14em] sm:self-auto" onClick={openCreate} type="button"><Plus size={16} />Add menu item</Button></header><section aria-label="Menu filters" className="flex flex-col gap-3 xl:flex-row"><label className="relative min-w-0 flex-1"><span className="sr-only">Search menu items</span><input aria-label="Search menu items" className="min-h-14 w-full rounded-md border-0 bg-[#f1ede4] px-5 pr-12 text-base outline-none placeholder:text-[#70685e] focus:ring-2 focus:ring-[#8b4a2b]" onChange={(event) => { setSearch(event.target.value); resetPage(); }} placeholder="Search menu items..." role="searchbox" value={search} /> <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[#70685e]">⌕</span></label><div className="flex flex-wrap gap-3"><label className="sr-only" htmlFor="menu-category-filter">Category</label><select aria-label="Category" className="min-h-14 min-w-44 rounded-md border-0 bg-[#e8deca] px-5 text-sm outline-none focus:ring-2 focus:ring-[#8b4a2b]" id="menu-category-filter" onChange={(event) => { setCategoryFilter(event.target.value); resetPage(); }} value={categoryFilter}><option value="all">All categories</option>{data.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><label className="sr-only" htmlFor="menu-status-filter">Status</label><select aria-label="Status" className="min-h-14 min-w-44 rounded-md border-0 bg-[#e8deca] px-5 text-sm outline-none focus:ring-2 focus:ring-[#8b4a2b]" id="menu-status-filter" onChange={(event) => { setStatusFilter(event.target.value as MenuStatusFilter); resetPage(); }} value={statusFilter}><option value="all">All statuses</option><option value="available">Available</option><option value="sold-out">Sold out</option><option value="featured">Featured</option></select>{search || categoryFilter !== "all" || statusFilter !== "all" ? <Button onClick={clearFilters} type="button" variant="ghost">Clear filters</Button> : null}</div></section><section aria-label="Menu item list" className="rounded-md border bg-[#fffdf9] p-4 sm:p-7"><div className="hidden grid-cols-[2.35fr_1fr_0.8fr_0.65fr_0.9fr_0.9fr_0.55fr] gap-5 bg-[#f4f0e7] px-5 py-4 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground lg:grid"><TableHeaderCell activeSortKey={sortKey} icon={Coffee} label="Item" onSort={toggleSort} sortDescending={sortDescending} sortKey="item" /><TableHeaderCell activeSortKey={sortKey} icon={Tag} label="Category" onSort={toggleSort} sortDescending={sortDescending} sortKey="category" /><TableHeaderCell activeSortKey={sortKey} icon={Banknote} label="Price" onSort={toggleSort} sortDescending={sortDescending} sortKey="price" /><TableHeaderCell activeSortKey={sortKey} icon={ListOrdered} label="Order" onSort={toggleSort} sortDescending={sortDescending} sortKey="order" /><TableHeaderCell activeSortKey={sortKey} icon={CircleCheck} label="Status" onSort={toggleSort} sortDescending={sortDescending} sortKey="status" /><TableHeaderCell activeSortKey={sortKey} icon={Star} label="Featured" onSort={toggleSort} sortDescending={sortDescending} sortKey="featured" /><span aria-hidden="true" /></div>{pageItems.length === 0 ? <div className="grid min-h-72 place-items-center p-8 text-center"><div><ImageIcon className="mx-auto size-8 text-[#b9a16a]" /><h2 className="display mt-4 text-2xl font-medium">{data.items.length === 0 ? "No menu items yet." : "No menu items match these filters."}</h2><p className="mt-2 text-sm text-muted-foreground">{data.items.length === 0 ? "Create your first menu item to start filling the public menu." : "Try a different search or clear the active filters."}</p>{data.items.length > 0 && <Button className="mt-5" onClick={clearFilters} type="button" variant="outline">Clear filters</Button>}</div></div> : <div>{pageItems.map((item) => <div className="grid gap-4 border-b px-5 py-5 last:border-b-0 lg:grid-cols-[2.35fr_1fr_0.8fr_0.65fr_0.9fr_0.9fr_0.55fr] lg:items-center lg:gap-5" key={item.id}><div className="flex min-w-0 items-center gap-4"><div aria-label={item.imageUrl ? `${item.name} image` : "No menu image"} className="size-16 shrink-0 rounded-md bg-[#bca995] bg-cover bg-center" role="img" style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : undefined} /> <div className="min-w-0"><p className="truncate font-semibold">{item.name}</p><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p></div></div><p className="text-sm text-muted-foreground"><span className="mr-2 text-xs uppercase tracking-[0.14em] text-muted-foreground lg:hidden">Category:</span>{item.categoryName}</p><p className="font-semibold"><span className="mr-2 text-xs uppercase tracking-[0.14em] text-muted-foreground lg:hidden">Price:</span>{formatRupiah(item.price)}</p><p className="font-mono text-sm text-muted-foreground"><span className="mr-2 text-xs uppercase tracking-[0.14em] text-muted-foreground lg:hidden">Order:</span>{String(item.displayOrder).padStart(2, "0")}</p><div><span className="mr-2 text-xs uppercase tracking-[0.14em] text-muted-foreground lg:hidden">Status:</span><StatusPill isAvailable={item.isAvailable} /></div><p className="text-sm text-[#8d794a]"><span className="mr-2 text-xs uppercase tracking-[0.14em] text-muted-foreground lg:hidden">Featured:</span>{item.isFeatured ? <span className="inline-flex items-center gap-2"><Star className="size-4 fill-current" />Featured</span> : <span className="text-muted-foreground">—</span>}</p><div className="flex justify-end"><Button aria-label={`Edit ${item.name}`} className="px-0 text-[#8d794a] hover:bg-transparent hover:text-[#1e1b18]" onClick={() => openEdit(item)} size="sm" type="button" variant="ghost">Edit <ArrowRight size={15} /></Button></div></div>)}</div>} </section><div className="flex flex-col justify-between gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center"><p>Showing {start}–{end} of {filteredItems.length} items</p>{filteredItems.length > PAGE_SIZE ? <div className="flex gap-2"><Button aria-label="Previous page" disabled={currentPage === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} size="sm" type="button" variant="outline">Previous</Button><Button aria-label="Next page" disabled={currentPage >= pageCount - 1} onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} size="sm" type="button" variant="outline">Next</Button></div> : null}</div></div>{isFormOpen ? <MenuItemModal action={formItem ? updateMenuItemAction : createMenuItemAction} categories={data.categories} item={formItem} onClose={() => setIsFormOpen(false)} onRequestDelete={(item) => { setIsFormOpen(false); setDeleteItem(item); }} /> : null}{deleteItem ? <DeleteMenuItemModal action={deleteMenuItemAction} item={deleteItem} onClose={() => setDeleteItem(undefined)} /> : null}</>;
}
