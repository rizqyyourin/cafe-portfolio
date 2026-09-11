"use client";

import { Save } from "lucide-react";
import { useState } from "react";

import type { SettingsActionState } from "@/actions/admin-settings";
import { Button } from "@/components/ui/button";
import type { CafeSettings } from "@/db/settings";
import { weekdayNames, type Weekday } from "@/lib/validations/settings";

export type { CafeSettings };
export type SettingsAction = (formData: FormData) => Promise<SettingsActionState>;

const tabs = [
  { id: "general", label: "General" },
  { id: "contact", label: "Contact & location" },
  { id: "social", label: "Social links" },
  { id: "hours", label: "Opening hours" },
] as const;

type SettingsTab = (typeof tabs)[number]["id"];

function ActionFeedback({ state }: { state?: SettingsActionState }) {
  if (!state) return null;
  if (state.success) return <p aria-live="polite" className="rounded-md bg-[#dfeeda] px-5 py-4 text-sm text-[#557154]" role="status">{state.message}</p>;

  const errors = Object.entries(state.errors ?? {});
  return <div aria-live="polite" className="rounded-md border border-[#d49b96] bg-[#fff2f1] p-4 text-sm text-[#8d3d39]" role="alert"><p>{state.message ?? "Please check the highlighted fields."}</p>{errors.length > 0 ? <ul className="mt-2 list-inside list-disc">{errors.map(([field, messages]) => <li key={field}>{messages[0]}</li>)}</ul> : null}</div>;
}

function Field({ label, name, value, onChange, type = "text", placeholder }: { label: string; name: string; value: string; onChange: (value: string) => void; type?: "email" | "text" | "url"; placeholder?: string }) {
  return <label className="grid gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground" htmlFor={name}>{label}<input aria-label={label} className="min-h-14 rounded-md border-0 bg-[#f4f0e7] px-5 text-base font-normal normal-case tracking-normal text-foreground outline-none placeholder:text-[#9c9489] focus:ring-2 focus:ring-[#8b4a2b]" id={name} name={name} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} value={value} /></label>;
}

function TextAreaField({ label, name, value, onChange, placeholder }: { label: string; name: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="grid gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground" htmlFor={name}>{label}<textarea aria-label={label} className="min-h-28 resize-y rounded-md border-0 bg-[#f4f0e7] px-5 py-4 text-base font-normal normal-case tracking-normal text-foreground outline-none placeholder:text-[#9c9489] focus:ring-2 focus:ring-[#8b4a2b]" id={name} name={name} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} /></label>;
}

function PanelIntro({ title, description }: { title: string; description: string }) {
  return <div><h2 className="display text-4xl font-medium tracking-[-0.045em]">{title}</h2><p className="mt-5 text-base text-muted-foreground">{description}</p></div>;
}

export function SettingsView({ data, saveSettingsAction }: { data: CafeSettings; saveSettingsAction: SettingsAction }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [formState, setFormState] = useState<CafeSettings>(() => ({ ...data, openingHours: { ...data.openingHours } }));
  const [actionState, setActionState] = useState<SettingsActionState>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  function setField(field: keyof Omit<CafeSettings, "id" | "openingHours">, value: string) {
    setFormState((current) => ({ ...current, [field]: value }));
    setActionState(undefined);
  }

  function setHours(day: Weekday, value: string) {
    setFormState((current) => ({ ...current, openingHours: { ...current.openingHours, [day]: value } }));
    setActionState(undefined);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setActionState(undefined);
    setIsSubmitting(true);
    const formData = new FormData();
    for (const field of ["cafeName", "tagline", "description", "logoUrl", "address", "phone", "whatsapp", "email", "instagram", "tiktok", "facebook", "mapsUrl", "mapsEmbedUrl"] as const) formData.set(field, formState[field] ?? "");
    for (const day of weekdayNames) formData.set(`openingHours.${day}`, formState.openingHours[day] ?? "");

    try {
      setActionState(await saveSettingsAction(formData));
    } catch {
      setActionState({ success: false, message: "Something went wrong while saving the cafe settings." });
    } finally {
      setIsSubmitting(false);
    }
  }

  const activeLabel = tabs.find((tab) => tab.id === activeTab)?.label ?? "General";

  return <div className="space-y-9"><header className="flex flex-wrap items-end justify-between gap-6"><div><p className="eyebrow flex items-center gap-3">Configuration <span aria-hidden="true">/</span> Public website</p><h1 className="display mt-5 text-5xl font-medium tracking-[-0.055em] sm:text-6xl">Cafe settings</h1><p className="mt-2 text-base text-muted-foreground">Changes here appear automatically on the public website.</p></div><Button className="self-start rounded-md px-6 py-4 tracking-[0.14em] sm:self-auto" disabled={isSubmitting} form="cafe-settings-form" type="submit"><Save size={16} />{isSubmitting ? "Saving…" : "Save changes"}</Button></header><div className="grid gap-8 xl:grid-cols-[17rem_minmax(0,1fr)]"><nav aria-label="Settings sections" className="flex gap-1 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible">{tabs.map((tab) => <button aria-controls={`settings-panel-${tab.id}`} aria-selected={activeTab === tab.id} className={`shrink-0 rounded-md px-5 py-4 text-left text-sm font-semibold transition-colors ${activeTab === tab.id ? "bg-[#e8deca] text-[#1e1b18]" : "text-[#5f5850] hover:bg-[#f1ede4]"}`} id={`settings-tab-${tab.id}`} key={tab.id} onClick={() => setActiveTab(tab.id)} role="tab" type="button">{tab.label}</button>)}</nav><div className="space-y-8"><section aria-label={activeLabel} aria-labelledby={`settings-tab-${activeTab}`} className="min-h-[44rem] rounded-md border bg-[#fffdf9] p-6 sm:p-10" id={`settings-panel-${activeTab}`} role="tabpanel"><form id="cafe-settings-form" onSubmit={handleSubmit}>{activeTab === "general" ? <div className="grid gap-8"><PanelIntro description="This is the core information customers see first." title="General information" />{!formState.cafeName && !formState.tagline && !formState.description ? <p className="rounded-md bg-[#fff9e8] p-4 text-sm text-[#80652e]" role="status">Add the public details your guests should see.</p> : null}<div className="grid gap-6"><Field label="Cafe name" name="cafeName" onChange={(value) => setField("cafeName", value)} placeholder="Kōhi Coffee" value={formState.cafeName} /><Field label="Tagline" name="tagline" onChange={(value) => setField("tagline", value)} placeholder="Coffee worth slowing down for." value={formState.tagline} /><TextAreaField label="Short description" name="description" onChange={(value) => setField("description", value)} placeholder="Tell guests what makes your cafe special." value={formState.description} /></div><div className="grid gap-5 border-t pt-7 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:items-center"><div aria-label={formState.logoUrl ? "Brand logo preview" : "Default brand logo"} className="grid size-24 place-items-center rounded-md bg-[#2c2926] bg-cover bg-center text-2xl font-serif text-[#fffaf3]" role="img" style={formState.logoUrl ? { backgroundImage: `url(${formState.logoUrl})` } : undefined}>{formState.logoUrl ? null : "KŌ"}</div><div><p className="font-semibold">Brand logo</p><p className="mt-1 text-sm text-muted-foreground">Paste an HTTPS image URL. PNG, JPG, or SVG. 2MB max.</p><Field label="Logo URL" name="logoUrl" onChange={(value) => setField("logoUrl", value)} placeholder="https://example.com/logo.svg" value={formState.logoUrl ?? ""} /></div><Button className="sm:self-end" onClick={() => document.getElementById("logoUrl")?.focus()} type="button" variant="outline">Replace logo</Button></div></div> : null}{activeTab === "contact" ? <div className="grid gap-8"><PanelIntro description="Make it easy for guests to find and reach the cafe." title="Contact & location" /><div className="grid gap-6"><TextAreaField label="Address" name="address" onChange={(value) => setField("address", value)} value={formState.address} /><div className="grid gap-6 md:grid-cols-2"><Field label="Phone" name="phone" onChange={(value) => setField("phone", value)} type="text" value={formState.phone} /><Field label="WhatsApp" name="whatsapp" onChange={(value) => setField("whatsapp", value)} type="text" value={formState.whatsapp} /><Field label="Email" name="email" onChange={(value) => setField("email", value)} type="email" value={formState.email} /><Field label="Maps URL" name="mapsUrl" onChange={(value) => setField("mapsUrl", value)} type="url" value={formState.mapsUrl} /></div><Field label="Maps embed URL" name="mapsEmbedUrl" onChange={(value) => setField("mapsEmbedUrl", value)} type="url" value={formState.mapsEmbedUrl ?? ""} /></div></div> : null}{activeTab === "social" ? <div className="grid gap-8"><PanelIntro description="Add the channels where guests can follow along." title="Social links" /><div className="grid gap-6"><Field label="Instagram" name="instagram" onChange={(value) => setField("instagram", value)} type="url" value={formState.instagram ?? ""} /><Field label="TikTok" name="tiktok" onChange={(value) => setField("tiktok", value)} type="url" value={formState.tiktok ?? ""} /><Field label="Facebook" name="facebook" onChange={(value) => setField("facebook", value)} type="url" value={formState.facebook ?? ""} /></div><p className="text-sm text-muted-foreground">Leave a channel blank when the cafe does not use it.</p></div> : null}{activeTab === "hours" ? <div className="grid gap-8"><PanelIntro description="These hours are shown wherever guests plan a visit." title="Opening hours" /><div className="grid gap-3">{weekdayNames.map((day) => <label className="grid items-center gap-4 border-b py-4 text-sm font-semibold last:border-b-0 sm:grid-cols-[8rem_minmax(0,1fr)]" htmlFor={`openingHours.${day}`} key={day}>{day}<input aria-label={`${day} hours`} className="min-h-12 rounded-md border-0 bg-[#f4f0e7] px-4 text-base font-normal outline-none focus:ring-2 focus:ring-[#8b4a2b]" id={`openingHours.${day}`} name={`openingHours.${day}`} onChange={(event) => setHours(day, event.target.value)} placeholder="08:00 - 22:00 or Closed" value={formState.openingHours[day] ?? ""} /></label>)}</div><p className="text-sm text-muted-foreground">Use the format <span className="font-mono">HH:MM - HH:MM</span>, or write <span className="font-mono">Closed</span>.</p></div> : null}</form></section><ActionFeedback state={actionState} /></div></div></div>;
}
