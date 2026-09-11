"use client";

import { ArrowRight, Ban, CalendarDays, Check, Coffee, Image, Tags, UserRound, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { AdminDashboardActionState } from "@/actions/admin-dashboard";
import { Button } from "@/components/ui/button";

export type UpdateReservationStatusAction = (formData: FormData) => Promise<AdminDashboardActionState>;

export type DashboardReservation = {
  id: string;
  name: string;
  reservationDate: string;
  reservationTime: string;
  guestCount: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  specialRequest: string | null;
};

export type DashboardData = {
  greetingName: string;
  dateLabel: string;
  stats: {
    menuItems: number;
    featuredMenuItems: number;
    categories: number;
    activeCategories: number;
    pendingReservations: number;
    pendingToday: number;
    galleryImages: number;
    galleryUpdatedLabel: string;
  };
  categories: Array<{ id: string; name: string }>;
  reservations: DashboardReservation[];
  pendingReservations?: DashboardReservation[];
};

type DashboardViewProps = {
  data: DashboardData;
  updateReservationStatusAction: UpdateReservationStatusAction;
};

const statCards = [
  { key: "menuItems", label: "Menu items", detail: (stats: DashboardData["stats"]) => `${stats.featuredMenuItems} featured`, Icon: Coffee },
  { key: "categories", label: "Categories", detail: (stats: DashboardData["stats"]) => `${stats.activeCategories} active`, Icon: Tags },
  { key: "pendingReservations", label: "Pending reservations", detail: (stats: DashboardData["stats"]) => `${stats.pendingToday} today`, Icon: CalendarIcon },
  { key: "galleryImages", label: "Gallery images", detail: (stats: DashboardData["stats"]) => stats.galleryUpdatedLabel, Icon: Image },
] as const;

function CalendarIcon(props: React.ComponentProps<"svg">) {
  return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}><rect height="17" rx="2" stroke="currentColor" strokeWidth="1.7" width="17" x="3.5" y="4.5" /><path d="M7 2.75v3.5M17 2.75v3.5M3.5 9h17" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>;
}

function formatReservationDate(date: string, time: string) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
  if (date === today) return `Today, ${time}`;

  const formatted = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${date}T${time}:00+07:00`));
  return `${formatted}, ${time}`;
}

function statusClass(status: DashboardReservation["status"]) {
  if (status === "CONFIRMED") return "bg-[#dfeada] text-[#557154]";
  if (status === "CANCELLED") return "bg-[#f4dedd] text-[#954b48]";
  if (status === "COMPLETED") return "bg-[#e6e2dc] text-[#70685e]";
  return "bg-[#f5e7bd] text-[#8c7540]";
}

function Modal({
  title,
  description,
  closeLabel,
  dismissLabel,
  onClose,
  children,
  locked = false,
}: {
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

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" data-testid="modal-layer">
      <button aria-label={dismissLabel} className="absolute inset-0 cursor-default bg-[#1e1b18]/60" disabled={locked} onClick={onClose} type="button" />
      <section aria-describedby={`${title.toLowerCase().replaceAll(" ", "-")}-description`} aria-labelledby={`${title.toLowerCase().replaceAll(" ", "-")}-title`} aria-modal="true" className="relative z-10 max-h-[min(90vh,48rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#ded2c2] bg-[#fffdf9] p-6 shadow-2xl sm:p-8" onClick={(event) => event.stopPropagation()} role="dialog">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="eyebrow">Dashboard action</p>
            <h2 className="display mt-2 text-3xl font-semibold" id={`${title.toLowerCase().replaceAll(" ", "-")}-title`}>{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground" id={`${title.toLowerCase().replaceAll(" ", "-")}-description`}>{description}</p>
          </div>
          <button aria-label={closeLabel} className="grid size-10 shrink-0 place-items-center rounded-full text-[#70685e] hover:bg-[#f1ece5]" disabled={locked} onClick={onClose} type="button"><X size={18} /></button>
        </div>
        <div className="mt-7">{children}</div>
      </section>
    </div>
  );
}

function ActionFeedback({ state }: { state?: AdminDashboardActionState }) {
  if (!state) return null;
  if (state.success) return state.message ? <p aria-live="polite" className="rounded-lg border border-[#b8d0b3] bg-[#eef7eb] p-3 text-sm text-[#557154]" role="status">{state.message}</p> : null;
  const fieldErrors = Object.values(state.errors ?? {}).flat();
  return <div aria-live="polite" className="rounded-lg border border-[#d49b96] bg-[#fff2f1] p-3 text-sm text-[#8d3d39]" role="alert"><p>{state.message ?? "Please check the details and try again."}</p>{fieldErrors.length > 0 ? <ul className="mt-1 list-inside list-disc">{fieldErrors.map((error) => <li key={error}>{error}</li>)}</ul> : null}</div>;
}

function ReservationReviewModal({
  reservations,
  action,
  onClose,
}: {
  reservations: DashboardReservation[];
  action: UpdateReservationStatusAction;
  onClose: () => void;
}) {
  const router = useRouter();
  const [handledIds, setHandledIds] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string>();
  const [state, setState] = useState<AdminDashboardActionState>();
  const visibleReservations = reservations.filter((item) => !handledIds.has(item.id));

  async function handleStatus(id: string, status: "CONFIRMED" | "CANCELLED") {
    if (activeId) return;
    setState(undefined);
    setActiveId(id);
    const form = new FormData();
    form.set("reservationId", id);
    form.set("status", status);

    try {
      const result = await action(form);
      setState(result);
      if (result.success) {
        setHandledIds((current) => new Set(current).add(id));
        router.refresh();
      }
    } catch {
      setState({ success: false, message: "Something went wrong while updating the reservation." });
    } finally {
      setActiveId(undefined);
    }
  }

  return <Modal closeLabel="Close review reservations dialog" description="Confirm or cancel pending table requests. Changes are applied immediately." dismissLabel="Dismiss review reservations dialog" locked={Boolean(activeId)} onClose={onClose} title="Review reservations"><div className="grid gap-4"><ActionFeedback state={state} />{visibleReservations.length === 0 ? <p className="rounded-xl bg-[#f7f2e9] p-5 text-sm text-muted-foreground">No pending reservations.</p> : visibleReservations.map((reservation) => <article className="rounded-xl border bg-white p-4" key={reservation.id}><div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="font-semibold">{reservation.name}</h3><p className="mt-1 text-sm text-muted-foreground">{formatReservationDate(reservation.reservationDate, reservation.reservationTime)} · {reservation.guestCount} guests</p>{reservation.specialRequest ? <p className="mt-2 text-sm text-muted-foreground">“{reservation.specialRequest}”</p> : null}</div><span className={`rounded-full px-3 py-1 text-xs font-semibold tracking-[0.14em] ${statusClass(reservation.status)}`}>{reservation.status}</span></div><div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end"><Button aria-label={`Cancel ${reservation.name}`} disabled={Boolean(activeId)} onClick={() => handleStatus(reservation.id, "CANCELLED")} size="sm" type="button" variant="outline"><Ban size={15} />Cancel</Button><Button aria-label={`Confirm ${reservation.name}`} disabled={Boolean(activeId)} onClick={() => handleStatus(reservation.id, "CONFIRMED")} size="sm" type="button"><Check size={15} />Confirm</Button></div></article>)}</div></Modal>;
}

export function DashboardView({ data, updateReservationStatusAction }: DashboardViewProps) {
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const pendingReservations = useMemo(() => data.pendingReservations ?? data.reservations.filter((item) => item.status === "PENDING"), [data.pendingReservations, data.reservations]);
  const waitingNumber = ["Zero", "One", "Two", "Three", "Four", "Five"][data.stats.pendingReservations] ?? data.stats.pendingReservations;
  const waitingCopy = data.stats.pendingReservations === 0
    ? "Nothing is waiting for your confirmation."
    : `${waitingNumber} table${data.stats.pendingReservations === 1 ? " is" : "s are"} waiting for your confirmation.`;

  return <>
    <div className="space-y-10">
      <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="eyebrow flex items-center gap-3">Overview <span aria-hidden="true">/</span> <span data-testid="dashboard-date">{data.dateLabel}</span></p><h1 className="display mt-5 text-5xl font-medium tracking-[-0.055em] sm:text-6xl">Good morning, {data.greetingName}.</h1></div></header>
      <section aria-label="Overview statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{statCards.map(({ key, label, detail, Icon }) => <article className="rounded-md border bg-[#f1ede4] p-6" key={key}><Icon className="size-6 text-[#8d794a]" /><p className="mt-8 text-4xl font-semibold tracking-[-0.04em]">{data.stats[key]}</p><p className="mt-2 text-xs font-semibold uppercase tracking-[0.17em] text-muted-foreground">{label}</p><p className="mt-3 text-sm text-[#8d794a]">{detail(data.stats)}</p></article>)}</section>
      <section className="grid gap-8 xl:grid-cols-[1.45fr_0.75fr]"><article className="min-h-[31rem] rounded-md border bg-[#fffdf9] p-6 sm:p-8"><div className="flex items-center justify-between gap-4"><h2 className="display text-3xl font-medium">Recent reservations</h2><button className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#8d794a] hover:text-[#1e1b18] sm:flex" onClick={() => setIsReservationModalOpen(true)} type="button">View all <ArrowRight size={15} /></button></div>{data.reservations.length === 0 ? <p className="mt-8 rounded-xl bg-[#f7f2e9] p-5 text-sm text-muted-foreground">No reservations yet.</p> : <div className="mt-8"><div className="hidden grid-cols-[1.4fr_1.2fr_0.55fr_0.85fr] gap-4 bg-[#f4f0e7] px-4 py-3 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground sm:grid"><span className="flex items-center gap-2"><UserRound size={14} />Customer</span><span className="flex items-center gap-2"><CalendarDays size={14} />Date &amp; time</span><span className="flex items-center gap-2"><Users size={14} />Guests</span><span className="flex items-center gap-2"><Check size={14} />Status</span></div>{data.reservations.map((reservation) => <div className="grid gap-3 border-b border-[#ded2c2] px-4 py-5 last:border-b-0 sm:grid-cols-[1.4fr_1.2fr_0.55fr_0.85fr] sm:items-center sm:gap-4" key={reservation.id}><div><p className="font-semibold">{reservation.name}</p><p className="mt-1 text-sm text-muted-foreground sm:hidden">{formatReservationDate(reservation.reservationDate, reservation.reservationTime)} · {reservation.guestCount} guests</p></div><p className="hidden text-sm text-muted-foreground sm:block">{formatReservationDate(reservation.reservationDate, reservation.reservationTime)}</p><p className="hidden text-sm text-muted-foreground sm:block">{reservation.guestCount}</p><span className={`w-fit rounded-full px-3 py-1.5 text-[0.68rem] font-semibold tracking-[0.14em] ${statusClass(reservation.status)}`}>{reservation.status}</span></div>)}</div>}<button className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#8d794a] sm:hidden" onClick={() => setIsReservationModalOpen(true)} type="button">View all <ArrowRight size={15} /></button></article><aside className="flex min-h-[31rem] flex-col justify-between rounded-md bg-[#2c2926] p-7 text-[#fffaf3] sm:p-8"><div><p className="eyebrow text-[#b9a16a]">What needs attention</p><h2 className="display mt-7 text-4xl font-medium leading-[0.98] tracking-[-0.05em]">{waitingCopy}</h2><p className="mt-7 max-w-sm text-base leading-7 text-[#d4ccc0]">Keep the experience thoughtful from the first message.</p></div><Button className="self-start rounded-md bg-[#8b743d] text-[#fffaf3] hover:bg-[#a18a50]" onClick={() => setIsReservationModalOpen(true)} type="button">Review reservations <ArrowRight size={15} /></Button></aside></section>
    </div>
    {isReservationModalOpen ? <ReservationReviewModal action={updateReservationStatusAction} onClose={() => setIsReservationModalOpen(false)} reservations={pendingReservations} /> : null}
  </>;
}
