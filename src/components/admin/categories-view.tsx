"use client";

import { ArrowDownUp, ArrowRight, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import type { CategoryActionState } from "@/actions/admin-categories";
import { Button } from "@/components/ui/button";
import type { AdminCategory } from "@/db/categories";

export type CategoryAction = (formData: FormData) => Promise<CategoryActionState>;
export type { AdminCategory };

export type CategoriesPageData = {
  categories: AdminCategory[];
};

type CategoriesViewProps = {
  data: CategoriesPageData;
  createCategoryAction: CategoryAction;
  updateCategoryAction: CategoryAction;
  deleteCategoryAction: CategoryAction;
};

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
  return <div className="fixed inset-0 z-50 grid place-items-center p-4"><button aria-label={dismissLabel} className="absolute inset-0 cursor-default bg-[#1e1b18]/60" disabled={locked} onClick={onClose} type="button" /><section aria-describedby={`${id}-description`} aria-labelledby={`${id}-title`} aria-modal="true" className="relative z-10 max-h-[min(90vh,48rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#ded2c2] bg-[#fffdf9] p-6 shadow-2xl sm:p-8" onClick={(event) => event.stopPropagation()} role="dialog"><div className="flex items-start justify-between gap-6"><div><p className="eyebrow">Category management</p><h2 className="display mt-2 text-3xl font-semibold" id={`${id}-title`}>{title}</h2><p className="mt-2 text-sm text-muted-foreground" id={`${id}-description`}>{description}</p></div><button aria-label={closeLabel} className="grid size-10 shrink-0 place-items-center rounded-full text-[#70685e] hover:bg-[#f1ece5]" disabled={locked} onClick={onClose} type="button"><X size={18} /></button></div><div className="mt-7">{children}</div></section></div>;
}

function ActionFeedback({ state }: { state?: CategoryActionState }) {
  if (!state) return null;
  if (state.success) return state.message ? <p aria-live="polite" className="rounded-lg border border-[#b8d0b3] bg-[#eef7eb] p-3 text-sm text-[#557154]" role="status">{state.message}</p> : null;
  const fieldErrors = Object.values(state.errors ?? {}).flat();
  return <div aria-live="polite" className="rounded-lg border border-[#d49b96] bg-[#fff2f1] p-3 text-sm text-[#8d3d39]" role="alert"><p>{state.message ?? "Please check the details and try again."}</p>{fieldErrors.length > 0 ? <ul className="mt-1 list-inside list-disc">{fieldErrors.map((error) => <li key={error}>{error}</li>)}</ul> : null}</div>;
}

function CategoryModal({ category: item, action, onClose, onRequestDelete }: {
  category?: AdminCategory;
  action: CategoryAction;
  onClose: () => void;
  onRequestDelete?: (category: AdminCategory) => void;
}) {
  const router = useRouter();
  const [state, setState] = useState<CategoryActionState>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(item);

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
      setState({ success: false, message: "Something went wrong while saving the category." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return <Modal closeLabel={`${isEditing ? "Close edit" : "Close add"} category dialog`} description={`${isEditing ? "Update" : "Add"} how this category appears across the public menu. Required fields are checked again on the server.`} dismissLabel={`Dismiss ${isEditing ? "edit" : "add"} category dialog`} locked={isSubmitting} onClose={onClose} title={isEditing ? "Edit category" : "Add category"}><form className="grid gap-5" onSubmit={handleSubmit}><input defaultValue={item?.id} name="id" type="hidden" /><label className="grid gap-2 text-sm font-semibold">Name<input aria-label="Name" className="min-h-12 rounded-lg border bg-white px-4 font-normal outline-none focus:border-[#8b4a2b]" defaultValue={item?.name} minLength={2} name="name" placeholder="e.g. Coffee" required /></label><label className="grid gap-2 text-sm font-semibold">Slug<input aria-label="Slug" className="min-h-12 rounded-lg border bg-white px-4 font-normal outline-none focus:border-[#8b4a2b]" defaultValue={item?.slug} name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="coffee" required /></label><div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Display order<input aria-label="Display order" className="min-h-12 rounded-lg border bg-white px-4 font-normal outline-none focus:border-[#8b4a2b]" defaultValue={item?.displayOrder ?? 0} min={0} name="displayOrder" required step={1} type="number" /></label><label className="flex items-end gap-3 pb-3 text-sm font-semibold"><input defaultChecked={item?.isActive ?? true} name="isActive" type="checkbox" value="on" />Active</label></div><ActionFeedback state={state} /><div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between"><div>{isEditing && item && onRequestDelete ? <Button disabled={isSubmitting} onClick={() => onRequestDelete(item)} type="button" variant="ghost"><Trash2 size={15} />Delete category</Button> : null}</div><div className="flex flex-col-reverse gap-3 sm:flex-row"><Button disabled={isSubmitting} onClick={onClose} type="button" variant="ghost">Cancel</Button><Button disabled={isSubmitting} type="submit">{isSubmitting ? "Saving…" : "Save category"}<ArrowRight size={16} /></Button></div></div></form></Modal>;
}

function DeleteCategoryModal({ category: item, action, onClose }: { category: AdminCategory; action: CategoryAction; onClose: () => void }) {
  const router = useRouter();
  const [state, setState] = useState<CategoryActionState>();
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
      setState({ success: false, message: "Something went wrong while deleting the category." });
    } finally {
      setIsSubmitting(false);
    }
  }

  const itemLabel = `${item.menuItemCount} menu item${item.menuItemCount === 1 ? "" : "s"}`;
  return <Modal closeLabel="Close delete category dialog" description="Only empty categories can be deleted. Categories with menu items must be reassigned first." dismissLabel="Dismiss delete category dialog" locked={isSubmitting} onClose={onClose} title="Delete category"><div className="grid gap-6"><div className="rounded-xl bg-[#f7f2e9] p-5"><p className="font-semibold">{item.name}</p><p className="mt-1 text-sm text-muted-foreground">/{item.slug} · {item.menuItemCount > 0 ? itemLabel : "No menu items"}</p></div><p className="text-sm leading-6 text-muted-foreground">{item.menuItemCount > 0 ? `This category still contains ${itemLabel}. Reassign them before deleting.` : "Are you sure you want to delete this empty category? This action cannot be undone."}</p><ActionFeedback state={state} /><div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end"><Button disabled={isSubmitting} onClick={onClose} type="button" variant="ghost">Keep category</Button><Button className="bg-[#954b48] text-white hover:bg-[#7f3d3a]" disabled={isSubmitting} onClick={handleDelete} type="button"><Trash2 size={15} />{isSubmitting ? "Deleting…" : "Delete category"}</Button></div></div></Modal>;
}

function StatusPill({ isActive }: { isActive: boolean }) {
  return <span className={`w-fit rounded-full px-3 py-1 text-[0.68rem] font-semibold tracking-[0.14em] ${isActive ? "bg-[#dfeada] text-[#557154]" : "bg-[#e6e2dc] text-[#70685e]"}`}>{isActive ? "ACTIVE" : "INACTIVE"}</span>;
}

export function CategoriesView({ data, createCategoryAction, updateCategoryAction, deleteCategoryAction }: CategoriesViewProps) {
  const [sortDescending, setSortDescending] = useState(false);
  const [formCategory, setFormCategory] = useState<AdminCategory>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteCategory, setDeleteCategory] = useState<AdminCategory>();

  const categories = useMemo(() => [...data.categories].sort((left, right) => {
    const order = left.displayOrder - right.displayOrder || left.name.localeCompare(right.name);
    return sortDescending ? -order : order;
  }), [data.categories, sortDescending]);

  function openCreate() {
    setFormCategory(undefined);
    setIsFormOpen(true);
  }

  function openEdit(item: AdminCategory) {
    setFormCategory(item);
    setIsFormOpen(true);
  }

  return <><div className="space-y-9"><header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="eyebrow flex items-center gap-3">Content <span aria-hidden="true">/</span> Categories</p><h1 className="display mt-5 text-5xl font-medium tracking-[-0.055em] sm:text-6xl">Menu categories</h1><p className="mt-2 text-base text-muted-foreground">Organise how your menu appears to guests.</p></div><Button className="self-start rounded-md px-6 py-4 tracking-[0.14em] sm:self-auto" onClick={openCreate} type="button"><Plus size={16} />Add category</Button></header><section aria-label="Menu category list" className="rounded-md border bg-[#fffdf9] p-4 sm:p-7"><div className="grid grid-cols-[minmax(0,2fr)_0.7fr_0.9fr_0.7fr] gap-5 bg-[#f4f0e7] px-5 py-4 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground" role="row"><span role="columnheader">Category</span><span role="columnheader">Order</span><span role="columnheader">Status</span><button aria-label={sortDescending ? "Sort categories ascending" : "Sort categories descending"} className="justify-self-end" onClick={() => setSortDescending((value) => !value)} type="button"><ArrowDownUp size={17} /></button></div>{categories.length === 0 ? <div className="grid min-h-72 place-items-center p-8 text-center"><div><RefreshCw className="mx-auto size-8 text-[#b9a16a]" /><h2 className="display mt-4 text-2xl font-medium">No menu categories yet.</h2><p className="mt-2 text-sm text-muted-foreground">Create your first category to start organising the public menu.</p><Button className="mt-5" onClick={openCreate} type="button">Add category</Button></div></div> : <div>{categories.map((item) => <div className="grid gap-4 border-b px-5 py-6 last:border-b-0 lg:grid-cols-[minmax(0,2fr)_0.7fr_0.9fr_0.7fr] lg:items-center lg:gap-5" key={item.id} role="row"><div role="cell"><p className="font-semibold">{item.name}</p><p className="mt-1 font-mono text-sm text-muted-foreground">/{item.slug}</p><p className="mt-2 text-xs text-muted-foreground lg:hidden">{item.menuItemCount} menu item{item.menuItemCount === 1 ? "" : "s"}</p></div><p className="font-mono text-sm text-muted-foreground" role="cell"><span className="mr-2 text-xs uppercase tracking-[0.14em] lg:hidden">Order:</span>{String(item.displayOrder).padStart(2, "0")}</p><div role="cell"><span className="mr-2 text-xs uppercase tracking-[0.14em] lg:hidden">Status:</span><StatusPill isActive={item.isActive} /></div><div className="flex justify-start lg:justify-end"><Button aria-label={`Edit ${item.name}`} className="px-0 text-[#8d794a] hover:bg-transparent hover:text-[#1e1b18]" onClick={() => openEdit(item)} size="sm" type="button" variant="ghost">Edit <ArrowRight size={15} /></Button></div></div>)}</div>}</section><p className="text-sm text-muted-foreground">Use the display order to control the sequence on the public menu.</p></div>{isFormOpen ? <CategoryModal action={formCategory ? updateCategoryAction : createCategoryAction} category={formCategory} onClose={() => setIsFormOpen(false)} onRequestDelete={(item) => { setIsFormOpen(false); setDeleteCategory(item); }} /> : null}{deleteCategory ? <DeleteCategoryModal action={deleteCategoryAction} category={deleteCategory} onClose={() => setDeleteCategory(undefined)} /> : null}</>;
}
