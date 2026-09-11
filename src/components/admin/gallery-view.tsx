"use client";

import Image from "next/image";
import { getPublicMenuImageUrl } from "@/lib/site";
import { ArrowRight, ChevronDown, ImagePlus, Trash2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import type { GalleryActionState } from "@/actions/admin-gallery";
import { Button } from "@/components/ui/button";
import type { AdminGalleryImage } from "@/db/gallery";

export type GalleryAction = (formData: FormData) => Promise<GalleryActionState>;
export type { AdminGalleryImage };

export type GalleryPageData = {
  categories: string[];
  images: AdminGalleryImage[];
};

type GalleryViewProps = {
  data: GalleryPageData;
  createGalleryImageAction: GalleryAction;
  updateGalleryImageAction: GalleryAction;
  deleteGalleryImageAction: GalleryAction;
};

const defaultCategories = ["coffee", "interior", "food", "events"];

function labelCategory(value: string) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

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
  return <div className="fixed inset-0 z-50 grid place-items-center p-4"><button aria-label={dismissLabel} className="absolute inset-0 cursor-default bg-[#1e1b18]/60" disabled={locked} onClick={onClose} type="button" /><section aria-describedby={`${id}-description`} aria-labelledby={`${id}-title`} aria-modal="true" className="relative z-10 max-h-[min(90vh,52rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#ded2c2] bg-[#fffdf9] p-6 shadow-2xl sm:p-8" onClick={(event) => event.stopPropagation()} role="dialog"><div className="flex items-start justify-between gap-6"><div><p className="eyebrow">Gallery management</p><h2 className="display mt-2 text-3xl font-semibold" id={`${id}-title`}>{title}</h2><p className="mt-2 text-sm text-muted-foreground" id={`${id}-description`}>{description}</p></div><button aria-label={closeLabel} className="grid size-10 shrink-0 place-items-center rounded-full text-[#70685e] hover:bg-[#f1ece5]" disabled={locked} onClick={onClose} type="button"><X size={18} /></button></div><div className="mt-7">{children}</div></section></div>;
}

function ActionFeedback({ state }: { state?: GalleryActionState }) {
  if (!state) return null;
  if (state.success) return state.message ? <p aria-live="polite" className="rounded-lg border border-[#b8d0b3] bg-[#eef7eb] p-3 text-sm text-[#557154]" role="status">{state.message}</p> : null;
  const fieldErrors = Object.values(state.errors ?? {}).flat();
  return <div aria-live="polite" className="rounded-lg border border-[#d49b96] bg-[#fff2f1] p-3 text-sm text-[#8d3d39]" role="alert"><p>{state.message ?? "Please check the details and try again."}</p>{fieldErrors.length > 0 ? <ul className="mt-1 list-inside list-disc">{fieldErrors.map((error) => <li key={error}>{error}</li>)}</ul> : null}</div>;
}

function GalleryImageModal({ image: item, categories, action, onClose, onRequestDelete }: {
  image?: AdminGalleryImage;
  categories: string[];
  action: GalleryAction;
  onClose: () => void;
  onRequestDelete?: (image: AdminGalleryImage) => void;
}) {
  const router = useRouter();
  const [state, setState] = useState<GalleryActionState>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(item);
  const categoryOptions = [...new Set([...defaultCategories, ...categories, ...(item ? [item.category] : [])])];

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
      setState({ success: false, message: "Something went wrong while saving the gallery image." });
    } finally {
      setIsSubmitting(false);
    }
  }

return <Modal closeLabel={`${isEditing ? "Close edit" : "Close add"} gallery image dialog`} description={`${isEditing ? "Update" : "Add"} an Unsplash image and its accessible metadata. Required fields are checked again on the server.`} dismissLabel={`Dismiss ${isEditing ? "edit" : "add"} gallery image dialog`} locked={isSubmitting} onClose={onClose} title={isEditing ? "Edit gallery image" : "Add gallery image"}><form className="grid gap-5" onSubmit={handleSubmit}><input defaultValue={item?.id} name="id" type="hidden" /><label className="grid gap-2 text-sm font-semibold">Image URL <span className="font-normal text-muted-foreground">(Unsplash photo link or image URL)<input aria-label="Image URL" className="mt-2 min-h-12 w-full rounded-lg border bg-white px-4 font-normal outline-none focus:border-[#8b4a2b]" defaultValue={item?.imageUrl} name="imageUrl" placeholder="https://unsplash.com/photos/..." required type="url" /></span></label><div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Caption<input aria-label="Caption" className="min-h-12 rounded-lg border bg-white px-4 font-normal outline-none focus:border-[#8b4a2b]" defaultValue={item?.caption} name="caption" placeholder="Morning pour" required /></label><label className="grid gap-2 text-sm font-semibold">Category<span className="relative block"><select aria-label="Category" className="h-12 w-full appearance-none rounded-lg border bg-white px-4 pr-10 font-normal outline-none focus:border-[#8b4a2b]" defaultValue={item?.category ?? "coffee"} name="category" required>{categoryOptions.map((category) => <option key={category} value={category}>{labelCategory(category)}</option>)}</select><ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#70685e]" size={17} /></span></label></div><label className="grid gap-2 text-sm font-semibold">Alt text<input aria-label="Alt text" className="min-h-12 rounded-lg border bg-white px-4 font-normal outline-none focus:border-[#8b4a2b]" defaultValue={item?.altText} name="altText" placeholder="Describe what guests should see in the image." required /></label><div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 self-start text-sm font-semibold">Display order<input aria-label="Display order" className="min-h-12 rounded-lg border bg-white px-4 font-normal outline-none focus:border-[#8b4a2b]" defaultValue={item?.displayOrder ?? 0} min={0} name="displayOrder" required step={1} type="number" /></label><fieldset className="min-w-0 self-start"><legend className="mb-2 text-sm font-semibold">Publishing</legend><label className="gallery-publishing-option flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border bg-white px-4 py-3"><input aria-label="Published" className="gallery-publishing-checkbox" defaultChecked={item?.isActive ?? true} name="isActive" type="checkbox" value="on" /><span><span className="block text-sm font-semibold">Published</span><span className="mt-1 block text-xs text-muted-foreground">Visible in the public gallery</span></span></label></fieldset></div><ActionFeedback state={state} /><div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between"><div>{isEditing && item && onRequestDelete ? <Button disabled={isSubmitting} onClick={() => onRequestDelete(item)} type="button" variant="ghost"><Trash2 size={15} />Delete image</Button> : null}</div><div className="flex flex-col-reverse gap-3 sm:flex-row"><Button disabled={isSubmitting} onClick={onClose} type="button" variant="ghost">Cancel</Button><Button disabled={isSubmitting} type="submit">{isSubmitting ? "Saving…" : "Save image"}<ArrowRight size={16} /></Button></div></div></form></Modal>;
}

function DeleteGalleryImageModal({ image: item, action, onClose }: { image: AdminGalleryImage; action: GalleryAction; onClose: () => void }) {
  const router = useRouter();
  const [state, setState] = useState<GalleryActionState>();
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
      setState({ success: false, message: "Something went wrong while deleting the gallery image." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return <Modal closeLabel="Close delete gallery image dialog" description="This removes the image record from the CMS and public gallery. The remote Unsplash image is not changed." dismissLabel="Dismiss delete gallery image dialog" locked={isSubmitting} onClose={onClose} title="Delete gallery image"><div className="grid gap-6"><div className="rounded-xl bg-[#f7f2e9] p-5"><p className="font-semibold">{item.caption}</p><p className="mt-1 text-sm text-muted-foreground">{labelCategory(item.category)} · {item.isActive ? "Published" : "Draft"}</p></div><p className="text-sm leading-6 text-muted-foreground">Are you sure you want to delete this gallery image? This action cannot be undone.</p><ActionFeedback state={state} /><div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end"><Button disabled={isSubmitting} onClick={onClose} type="button" variant="ghost">Keep image</Button><Button className="bg-[#954b48] text-white hover:bg-[#7f3d3a]" disabled={isSubmitting} onClick={handleDelete} type="button"><Trash2 size={15} />{isSubmitting ? "Deleting…" : "Delete image"}</Button></div></div></Modal>;
}

export function GalleryView({ data, createGalleryImageAction, updateGalleryImageAction, deleteGalleryImageAction }: GalleryViewProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [formImage, setFormImage] = useState<AdminGalleryImage>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteImage, setDeleteImage] = useState<AdminGalleryImage>();
  const publishedCount = data.images.filter((image) => image.isActive).length;

  const filteredImages = useMemo(() => data.images.filter((image) => activeCategory === "all" || image.category === activeCategory), [activeCategory, data.images]);

  function openCreate() {
    setFormImage(undefined);
    setIsFormOpen(true);
  }

  function openEdit(item: AdminGalleryImage) {
    setFormImage(item);
    setIsFormOpen(true);
  }

  return <><div className="space-y-9"><header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="eyebrow flex items-center gap-3">Content <span aria-hidden="true">/</span> Gallery</p><h1 className="display mt-5 text-5xl font-medium tracking-[-0.055em] sm:text-6xl">Gallery</h1><p className="mt-2 text-base text-muted-foreground">{publishedCount} published images across {data.categories.length} moments</p></div><Button className="self-start rounded-md px-6 py-4 tracking-[0.14em] sm:self-auto" onClick={openCreate} type="button"><Upload size={16} />Upload image</Button></header><nav aria-label="Gallery filters" className="flex flex-wrap gap-3"><Button aria-pressed={activeCategory === "all"} className={activeCategory === "all" ? "bg-[#e8deca] text-[#1e1b18]" : "border border-[#ded2c2] bg-[#fffdf9] text-[#1e1b18] hover:bg-[#f1ede4]"} onClick={() => setActiveCategory("all")} type="button" variant="ghost">All images</Button>{data.categories.map((category) => <Button aria-pressed={activeCategory === category} className={activeCategory === category ? "bg-[#e8deca] text-[#1e1b18]" : "border border-[#ded2c2] bg-[#fffdf9] text-[#1e1b18] hover:bg-[#f1ede4]"} key={category} onClick={() => setActiveCategory(category)} type="button" variant="ghost">{labelCategory(category)}</Button>)}</nav>{filteredImages.length === 0 ? <section aria-label="Gallery image list" className="grid min-h-80 place-items-center rounded-md border bg-[#fffdf9] p-8 text-center"><div><ImagePlus className="mx-auto size-9 text-[#b9a16a]" /><h2 className="display mt-4 text-2xl font-medium">{data.images.length === 0 ? "No gallery images yet." : "No images in this moment."}</h2><p className="mt-2 text-sm text-muted-foreground">{data.images.length === 0 ? "Add an Unsplash image to start building the public gallery." : "Choose another category or show all images."}</p>{data.images.length > 0 ? <Button className="mt-5" onClick={() => setActiveCategory("all")} type="button" variant="outline">All images</Button> : <Button className="mt-5" onClick={openCreate} type="button">Add first image</Button>}</div></section> : <section aria-label="Gallery image list" className="grid gap-x-5 gap-y-10 sm:grid-cols-2 xl:grid-cols-4">{filteredImages.map((item) => <article key={item.id}><div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-[#bca995]"><Image alt={item.altText} fill sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 25vw" src={getPublicMenuImageUrl(item.imageUrl)} /></div><div className="mt-3 flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-semibold">{item.caption}</h2><p className="mt-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{labelCategory(item.category)} <span className="mx-2">•</span> {item.isActive ? "Published" : "Draft"}</p></div><Button aria-label={`Edit ${item.caption}`} className="shrink-0 px-0 text-[#8d794a] hover:bg-transparent hover:text-[#1e1b18]" onClick={() => openEdit(item)} size="sm" type="button" variant="ghost">Edit <ArrowRight size={15} /></Button></div></article>)}</section>}<p className="text-sm text-muted-foreground">Use display order to control the sequence on the public gallery.</p></div>{isFormOpen ? <GalleryImageModal action={formImage ? updateGalleryImageAction : createGalleryImageAction} categories={data.categories} image={formImage} onClose={() => setIsFormOpen(false)} onRequestDelete={(item) => { setIsFormOpen(false); setDeleteImage(item); }} /> : null}{deleteImage ? <DeleteGalleryImageModal action={deleteGalleryImageAction} image={deleteImage} onClose={() => setDeleteImage(undefined)} /> : null}</>;
}
