"use client";

import { ArrowRight, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import type { TestimonialActionState } from "@/actions/admin-testimonials";
import { Button } from "@/components/ui/button";
import type { AdminTestimonial } from "@/db/testimonials";

export type TestimonialAction = (formData: FormData) => Promise<TestimonialActionState>;
export type { AdminTestimonial };

export type TestimonialsPageData = {
  testimonials: AdminTestimonial[];
  publishedCount: number;
};

type TestimonialsViewProps = {
  data: TestimonialsPageData;
  createTestimonialAction: TestimonialAction;
  updateTestimonialAction: TestimonialAction;
  deleteTestimonialAction: TestimonialAction;
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
  return <div className="fixed inset-0 z-50 grid place-items-center p-4"><button aria-label={dismissLabel} className="absolute inset-0 cursor-default bg-[#1e1b18]/60" disabled={locked} onClick={onClose} type="button" /><section aria-describedby={`${id}-description`} aria-labelledby={`${id}-title`} aria-modal="true" className="relative z-10 max-h-[min(90vh,48rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#ded2c2] bg-[#fffdf9] p-6 shadow-2xl sm:p-8" onClick={(event) => event.stopPropagation()} role="dialog"><div className="flex items-start justify-between gap-6"><div><p className="eyebrow">Testimonials management</p><h2 className="display mt-2 text-3xl font-semibold" id={`${id}-title`}>{title}</h2><p className="mt-2 text-sm text-muted-foreground" id={`${id}-description`}>{description}</p></div><button aria-label={closeLabel} className="grid size-10 shrink-0 place-items-center rounded-full text-[#70685e] hover:bg-[#f1ece5]" disabled={locked} onClick={onClose} type="button"><X size={18} /></button></div><div className="mt-7">{children}</div></section></div>;
}

function ActionFeedback({ state }: { state?: TestimonialActionState }) {
  if (!state) return null;
  if (state.success) return state.message ? <p aria-live="polite" className="rounded-lg border border-[#b8d0b3] bg-[#eef7eb] p-3 text-sm text-[#557154]" role="status">{state.message}</p> : null;
  const fieldErrors = Object.values(state.errors ?? {}).flat();
  return <div aria-live="polite" className="rounded-lg border border-[#d49b96] bg-[#fff2f1] p-3 text-sm text-[#8d3d39]" role="alert"><p>{state.message ?? "Please check the details and try again."}</p>{fieldErrors.length > 0 ? <ul className="mt-1 list-inside list-disc">{fieldErrors.map((error) => <li key={error}>{error}</li>)}</ul> : null}</div>;
}

function TestimonialModal({ testimonial: item, action, onClose, onRequestDelete }: {
  testimonial?: AdminTestimonial;
  action: TestimonialAction;
  onClose: () => void;
  onRequestDelete?: (testimonial: AdminTestimonial) => void;
}) {
  const router = useRouter();
  const [state, setState] = useState<TestimonialActionState>();
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
      setState({ success: false, message: "Something went wrong while saving the testimonial." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return <Modal closeLabel={`${isEditing ? "Close edit" : "Close add"} testimonial dialog`} description={`${isEditing ? "Update" : "Add"} a guest note for the public website. Ratings are limited to one through five stars.`} dismissLabel={`Dismiss ${isEditing ? "edit" : "add"} testimonial dialog`} locked={isSubmitting} onClose={onClose} title={isEditing ? "Edit testimonial" : "Add testimonial"}><form className="grid gap-5" onSubmit={handleSubmit}><input defaultValue={item?.id} name="id" type="hidden" /><label className="grid gap-2 text-sm font-semibold">Customer name<input aria-label="Customer name" className="min-h-12 rounded-lg border bg-white px-4 font-normal outline-none focus:border-[#8b4a2b]" defaultValue={item?.customerName} name="customerName" placeholder="Nadia Ramadhani" required /></label><label className="grid gap-2 text-sm font-semibold">Guest note<textarea aria-label="Guest note" className="min-h-32 rounded-lg border bg-white px-4 py-3 font-normal leading-6 outline-none focus:border-[#8b4a2b]" defaultValue={item?.content} maxLength={500} name="content" placeholder="What did this guest love about the cafe?" required /></label><div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Rating<select aria-label="Rating" className="min-h-12 rounded-lg border bg-white px-4 font-normal outline-none focus:border-[#8b4a2b]" defaultValue={item?.rating ?? 5} name="rating" required>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} {rating === 1 ? "star" : "stars"}</option>)}</select></label><label className="flex items-end gap-3 pb-3 text-sm font-semibold"><input defaultChecked={item?.isActive ?? true} name="isActive" type="checkbox" value="on" />Published</label></div><ActionFeedback state={state} /><div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between"><div>{isEditing && item && onRequestDelete ? <Button disabled={isSubmitting} onClick={() => onRequestDelete(item)} type="button" variant="ghost"><Trash2 size={15} />Delete testimonial</Button> : null}</div><div className="flex flex-col-reverse gap-3 sm:flex-row"><Button disabled={isSubmitting} onClick={onClose} type="button" variant="ghost">Cancel</Button><Button disabled={isSubmitting} type="submit">{isSubmitting ? "Saving…" : "Save testimonial"}<ArrowRight size={16} /></Button></div></div></form></Modal>;
}

function DeleteTestimonialModal({ testimonial: item, action, onClose }: { testimonial: AdminTestimonial; action: TestimonialAction; onClose: () => void }) {
  const router = useRouter();
  const [state, setState] = useState<TestimonialActionState>();
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
      setState({ success: false, message: "Something went wrong while deleting the testimonial." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return <Modal closeLabel="Close delete testimonial dialog" description="This removes the guest note from the CMS and public website. This action cannot be undone." dismissLabel="Dismiss delete testimonial dialog" locked={isSubmitting} onClose={onClose} title="Delete testimonial"><div className="grid gap-6"><div className="rounded-xl bg-[#f7f2e9] p-5"><p className="font-semibold">{item.customerName}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">“{item.content}”</p></div><p className="text-sm leading-6 text-muted-foreground">Are you sure you want to delete this testimonial? Hidden notes can be kept without publishing them.</p><ActionFeedback state={state} /><div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end"><Button disabled={isSubmitting} onClick={onClose} type="button" variant="ghost">Keep testimonial</Button><Button className="bg-[#954b48] text-white hover:bg-[#7f3d3a]" disabled={isSubmitting} onClick={handleDelete} type="button"><Trash2 size={15} />{isSubmitting ? "Deleting…" : "Delete testimonial"}</Button></div></div></Modal>;
}

export function TestimonialsView({ data, createTestimonialAction, updateTestimonialAction, deleteTestimonialAction }: TestimonialsViewProps) {
  const [formTestimonial, setFormTestimonial] = useState<AdminTestimonial>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTestimonial, setDeleteTestimonial] = useState<AdminTestimonial>();

  function openCreate() {
    setFormTestimonial(undefined);
    setIsFormOpen(true);
  }

  function openEdit(item: AdminTestimonial) {
    setFormTestimonial(item);
    setIsFormOpen(true);
  }

  return <><div className="space-y-9"><header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="eyebrow flex items-center gap-3">Content <span aria-hidden="true">/</span> Testimonials</p><h1 className="display mt-5 text-5xl font-medium tracking-[-0.055em] sm:text-6xl">Guest notes</h1><p className="mt-2 text-base text-muted-foreground">{data.publishedCount} published stories from the people who make Kōhi feel like home.</p></div><Button className="self-start rounded-md px-6 py-4 tracking-[0.14em] sm:self-auto" onClick={openCreate} type="button"><Plus size={16} />Add testimonial</Button></header>{data.testimonials.length === 0 ? <section aria-label="Testimonial list" className="grid min-h-80 place-items-center rounded-md border bg-[#fffdf9] p-8 text-center"><div><MessageIcon /><h2 className="display mt-4 text-2xl font-medium">No testimonials yet.</h2><p className="mt-2 text-sm text-muted-foreground">Add a guest note to start building social proof for the public website.</p><Button className="mt-5" onClick={openCreate} type="button">Add first testimonial</Button></div></section> : <section aria-label="Testimonial list" className="grid gap-6 md:grid-cols-2">{data.testimonials.map((item) => <article className="min-h-[23.5rem] rounded-md border border-[#ded2c2] bg-[#fffdf9] p-7 sm:p-8" key={item.id}><div className="flex items-center justify-between gap-4"><div aria-label={`Rating: ${item.rating} out of 5`} className="flex gap-1" role="img">{[1, 2, 3, 4, 5].map((star) => <Star className={star <= item.rating ? "fill-current text-[#8d794a]" : "text-[#ded2c2]"} key={star} size={17} strokeWidth={1.5} />)}</div><span className={item.isActive ? "rounded-full bg-[#dcebd7] px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#557154]" : "rounded-full bg-[#f1e3e2] px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#954b48]"}>{item.isActive ? "Published" : "Hidden"}</span></div><blockquote className="display mt-7 text-2xl font-medium leading-[1.15] tracking-[-0.03em] sm:text-3xl">“{item.content}”</blockquote><div className="mt-5 flex items-center justify-between gap-4"><p className="font-semibold text-muted-foreground">{item.customerName}</p><Button aria-label={`Edit ${item.customerName}`} className="shrink-0 px-0 text-[#8d794a] hover:bg-transparent hover:text-[#1e1b18]" onClick={() => openEdit(item)} size="sm" type="button" variant="ghost"><Pencil size={15} />Edit</Button></div></article>)}</section>}<p className="text-sm text-muted-foreground">Hidden testimonials remain saved but won’t appear on the public website.</p></div>{isFormOpen ? <TestimonialModal action={formTestimonial ? updateTestimonialAction : createTestimonialAction} onClose={() => setIsFormOpen(false)} onRequestDelete={(item) => { setIsFormOpen(false); setDeleteTestimonial(item); }} testimonial={formTestimonial} /> : null}{deleteTestimonial ? <DeleteTestimonialModal action={deleteTestimonialAction} onClose={() => setDeleteTestimonial(undefined)} testimonial={deleteTestimonial} /> : null}</>;
}

function MessageIcon() {
  return <span aria-hidden="true" className="mx-auto grid size-10 place-items-center rounded-full bg-[#f1ece5] text-[#8d794a]"><Plus size={18} /></span>;
}
