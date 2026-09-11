"use client";

import { ArrowRight, Ban, CalendarDays, Check, CircleCheck, MessageCircle, RefreshCw, UserRound, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { AdminReservationActionState } from "@/actions/admin-reservations";
import { Button } from "@/components/ui/button";
import type { AdminReservation, ReservationPageData } from "@/db/reservations";

export type { AdminReservation, ReservationPageData };
export type ReservationAction = (formData: FormData) => Promise<AdminReservationActionState>;

type StatusFilter = "all" | AdminReservation["status"];
type DateFilter = "all" | "today" | "week" | "month" | "year";

const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatListDate(date: string, time: string, today: string) {
  if (date === today) return `Today, ${time}`;
  const [, month, day] = date.split("-");
  return `${Number(day)} ${shortMonths[Number(month) - 1] ?? month}, ${time}`;
}

function formatDetailDate(date: string, today: string) {
  const [, month, day] = date.split("-");
  const prefix = date === today ? "TODAY, " : "";
  return `${prefix}${Number(day)} ${shortMonths[Number(month) - 1] ?? month}`;
}

function statusClass(status: AdminReservation["status"]) {
  if (status === "CONFIRMED") return "bg-[#dfeada] text-[#557154]";
  if (status === "CANCELLED") return "bg-[#f4dedd] text-[#954b48]";
  if (status === "COMPLETED") return "bg-[#e6e2dc] text-[#70685e]";
  return "bg-[#f5e7bd] text-[#8c7540]";
}

function normalizeWhatsAppNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
}

function whatsappHref(phone: string) {
  return `https://wa.me/${normalizeWhatsAppNumber(phone)}`;
}

function ActionFeedback({ state }: { state?: AdminReservationActionState }) {
  if (!state) return null;
  if (state.success) return state.message ? <p aria-live="polite" className="rounded-lg border border-[#b8d0b3] bg-[#eef7eb] p-3 text-sm text-[#557154]" role="status">{state.message}</p> : null;
  const errors = Object.values(state.errors ?? {}).flat();
  return <div aria-live="polite" className="rounded-lg border border-[#d49b96] bg-[#fff2f1] p-3 text-sm text-[#8d3d39]" role="alert"><p>{state.message ?? "Please check the request and try again."}</p>{errors.length > 0 ? <ul className="mt-1 list-inside list-disc">{errors.map((error) => <li key={error}>{error}</li>)}</ul> : null}</div>;
}

function EmptyDetail() {
  return <aside aria-label="Selected request" className="flex min-h-[31rem] items-center justify-center rounded-md bg-[#2c2926] p-8 text-center text-[#fffaf3]"><div><RefreshCw className="mx-auto size-9 text-[#b9a16a]" /><h2 className="display mt-5 text-3xl font-medium">Nothing selected.</h2><p className="mt-3 text-sm text-[#d4ccc0]">Select a request to see its details.</p></div></aside>;
}

export function ReservationsView({ data, updateReservationStatusAction }: { data: ReservationPageData; updateReservationStatusAction: ReservationAction }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [yearFilter, setYearFilter] = useState(data.today.slice(0, 4));
  const years = [...new Set([data.today.slice(0, 4), ...data.reservations.map((item) => item.reservationDate.slice(0, 4))])].sort().reverse();
  const [selectedId, setSelectedId] = useState(data.reservations[0]?.id);
  const [actionState, setActionState] = useState<AdminReservationActionState>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredReservations = useMemo(() => data.reservations.filter((item) => {
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesDate = dateFilter === "all"
      || (dateFilter === "today" && item.reservationDate === data.today)
      || (dateFilter === "week" && item.reservationDate >= data.weekStart && item.reservationDate <= data.weekEnd)
      || (dateFilter === "month" && item.reservationDate.slice(0, 7) === data.today.slice(0, 7))
      || (dateFilter === "year" && item.reservationDate.slice(0, 4) === yearFilter);
    return matchesStatus && matchesDate;
  }), [data.reservations, data.today, data.weekEnd, data.weekStart, dateFilter, statusFilter, yearFilter]);

  const selectedReservation = filteredReservations.find((item) => item.id === selectedId) ?? filteredReservations[0];
  const hasFilters = statusFilter !== "all" || dateFilter !== "all";

  async function handleStatus(status: AdminReservation["status"]) {
    if (!selectedReservation || isSubmitting) return;

    setActionState(undefined);
    setIsSubmitting(true);
    const formData = new FormData();
    formData.set("reservationId", selectedReservation.id);
    formData.set("status", status);

    try {
      const result = await updateReservationStatusAction(formData);
      setActionState(result);
      if (result.success) router.refresh();
    } catch {
      setActionState({ success: false, message: "Something went wrong while updating the reservation." });
    } finally {
      setIsSubmitting(false);
    }
  }

  function clearFilters() {
    setStatusFilter("all");
    setDateFilter("all");
    setYearFilter(data.today.slice(0, 4));
    setActionState(undefined);
  }

  return <div className="space-y-9"><header><p className="eyebrow flex items-center gap-3">Operations <span aria-hidden="true">/</span> Reservations</p><h1 className="display mt-5 text-5xl font-medium tracking-[-0.055em] sm:text-6xl">Table requests</h1><p className="mt-2 text-base text-muted-foreground">{data.pendingCount} pending confirmations need your attention</p></header><section aria-label="Reservation filters" className="flex flex-wrap gap-3"><label className="sr-only" htmlFor="reservation-status-filter">Reservation status</label><select aria-label="Reservation status" className="reservation-filter min-h-14 min-w-36 rounded-md border-0 bg-[#e8deca] px-5 text-sm outline-none focus:ring-2 focus:ring-[#8b4a2b]" id="reservation-status-filter" onChange={(event) => { setStatusFilter(event.target.value as StatusFilter); setActionState(undefined); }} value={statusFilter}><option value="all">All status</option><option value="PENDING">Pending</option><option value="CONFIRMED">Confirmed</option><option value="CANCELLED">Cancelled</option><option value="COMPLETED">Completed</option></select><select aria-label="Reservation period" className="reservation-filter min-h-14 min-w-36 rounded-md border-0 bg-[#e8deca] px-5 text-sm outline-none focus:ring-2 focus:ring-[#8b4a2b]" onChange={(event) => { setDateFilter(event.target.value as DateFilter); setActionState(undefined); }} value={dateFilter}><option value="all">All dates</option><option value="today">Today</option><option value="week">This week</option><option value="month">This month</option><option value="year">Year</option></select>{dateFilter === "year" ? <select aria-label="Reservation year" className="reservation-filter min-h-14 min-w-36 rounded-md border-0 bg-[#e8deca] px-5 text-sm outline-none focus:ring-2 focus:ring-[#8b4a2b]" onChange={(event) => { setYearFilter(event.target.value); setActionState(undefined); }} value={yearFilter}>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select> : null}{hasFilters ? <Button onClick={clearFilters} type="button" variant="ghost">Clear filters</Button> : null}</section><p className="eyebrow">Latest requests</p><div className="grid gap-8 xl:grid-cols-[1.45fr_0.75fr]"><section aria-label="Reservation requests" className="min-h-[38rem] overflow-x-auto rounded-md border bg-[#fffdf9] p-4 sm:p-7"><div className="grid min-w-[44rem] grid-cols-[1.4fr_1.2fr_0.55fr_0.85fr] gap-4 bg-[#f4f0e7] px-5 py-4 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground"><span className="flex items-center gap-2"><UserRound aria-hidden="true" size={15} className="shrink-0" />Customer</span><span className="flex items-center gap-2"><CalendarDays aria-hidden="true" size={15} className="shrink-0" />Date &amp; time</span><span className="flex items-center gap-2"><Users aria-hidden="true" size={15} className="shrink-0" />Guests</span><span className="flex items-center gap-2"><CircleCheck aria-hidden="true" size={15} className="shrink-0" />Status</span></div>{filteredReservations.length === 0 ? <div className="grid min-h-[30rem] place-items-center p-8 text-center"><div><h2 className="display text-2xl font-medium">{data.reservations.length === 0 ? "No table requests yet." : "No table requests match these filters."}</h2><p className="mt-3 text-sm text-muted-foreground">{data.reservations.length === 0 ? "Requests from the public reservation form will appear here." : "Try another status or date range."}</p>{hasFilters ? <Button className="mt-5" onClick={clearFilters} type="button" variant="outline">Clear filters</Button> : null}</div></div> : <div className="min-w-[44rem]">{filteredReservations.map((item) => <button aria-pressed={selectedReservation?.id === item.id} aria-label={`Open request from ${item.name}`} className={`grid w-full grid-cols-[1.4fr_1.2fr_0.55fr_0.85fr] items-center gap-4 border-b px-5 py-5 text-left transition-colors last:border-b-0 ${selectedReservation?.id === item.id ? "bg-[#fdf8ec]" : "hover:bg-[#faf7f0]"}`} key={item.id} onClick={() => { setSelectedId(item.id); setActionState(undefined); }} type="button"><span className="font-semibold">{item.name}</span><span className="text-sm text-muted-foreground">{formatListDate(item.reservationDate, item.reservationTime, data.today)}</span><span className="text-sm text-muted-foreground">{item.guestCount}</span><span className={`w-fit rounded-full px-3 py-1 text-[0.68rem] font-semibold tracking-[0.14em] ${statusClass(item.status)}`}>{item.status}</span></button>)}</div>}</section>{selectedReservation ? <aside aria-label="Selected request" className="min-h-[31rem] rounded-md bg-[#2c2926] p-7 text-[#fffaf3] sm:p-8"><p className="eyebrow text-[#b9a16a]">Selected request</p><h2 className="display mt-7 text-4xl font-medium leading-[0.98] tracking-[-0.05em]">{selectedReservation.name}</h2><p className="mt-5 text-base text-[#d4ccc0]">WhatsApp <span className="mx-2 text-[#b9a16a]">•</span> {selectedReservation.phone}</p>{selectedReservation.email ? <p className="mt-2 break-all text-sm text-[#d4ccc0]">{selectedReservation.email}</p> : null}<p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-[#b9a16a]">{formatDetailDate(selectedReservation.reservationDate, data.today)} <span className="mx-2">•</span> {selectedReservation.reservationTime} <span className="mx-2">•</span> {selectedReservation.guestCount} guests</p>{selectedReservation.specialRequest ? <p className="mt-7 text-base leading-7 text-[#f5efe5]">“{selectedReservation.specialRequest}”</p> : null}<p className={`mt-7 inline-flex rounded-full px-3 py-1 text-[0.68rem] font-semibold tracking-[0.14em] ${statusClass(selectedReservation.status)}`}>{selectedReservation.status}</p><div className="mt-7 grid gap-3"><ActionFeedback state={actionState} />{selectedReservation.status === "PENDING" ? <div className="flex flex-wrap gap-3"><Button disabled={isSubmitting} onClick={() => handleStatus("CONFIRMED")} type="button"><Check size={15} />{isSubmitting ? "Updating…" : "Confirm reservation"}</Button><Button className="border-[#b9a16a] text-[#fffaf3] hover:bg-[#4a4139]" disabled={isSubmitting} onClick={() => handleStatus("CANCELLED")} type="button" variant="outline"><Ban size={15} />Cancel request</Button></div> : null}{selectedReservation.status === "CONFIRMED" ? <Button disabled={isSubmitting} onClick={() => handleStatus("COMPLETED")} type="button"><Check size={15} />{isSubmitting ? "Updating…" : "Mark reservation completed"}</Button> : null}<Button asChild className="w-fit border-[#b9a16a] text-[#fffaf3] hover:bg-[#4a4139]" variant="outline"><a aria-label="Chat on WhatsApp" href={whatsappHref(selectedReservation.phone)} rel="noreferrer" target="_blank"><MessageCircle size={15} />Chat on WhatsApp <ArrowRight size={14} /></a></Button></div></aside> : <EmptyDetail />}</div></div>;
}
