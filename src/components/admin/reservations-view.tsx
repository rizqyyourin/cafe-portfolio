"use client";

import { ArrowUpRight, CalendarDays, Check, CircleCheck, MessageCircle, Pencil, RefreshCw, RotateCcw, Search, UserRound, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { AdminReservationActionState } from "@/actions/admin-reservations";
import { Button } from "@/components/ui/button";
import type { AdminReservation, ReservationDateFilter, ReservationListRequest, ReservationListStatus, ReservationPageData, ReservationPageResult } from "@/db/reservations";

export type { AdminReservation, ReservationPageData };
export type ReservationAction = (formData: FormData) => Promise<AdminReservationActionState>;

export type ReservationListAction = (request: ReservationListRequest) => Promise<ReservationPageResult>;
type StatusFilter = ReservationListStatus;
type DateFilter = ReservationDateFilter;

const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatListDate(date: string, time: string, today: string) {
  if (date === today) return `Today, ${time}`;
  const [, month, day] = date.split("-");
  return `${Number(day)} ${shortMonths[Number(month) - 1] ?? month}, ${time}`;
}

function formatDetailDateTime(date: string, time: string, today: string) {
  const [, month, day] = date.split("-");
  const dateLabel = `${Number(day)} ${shortMonths[Number(month) - 1] ?? month}`.toUpperCase();
  return `${date === today ? "TODAY · " : ""}${dateLabel} · ${time}`;
}

function reservationReference(id: string, status: AdminReservation["status"]) {
  const reference = id.startsWith("reservation-")
    ? (id.split("-").pop() ?? id).padStart(4, "0")
    : id.replace(/[^a-z0-9]/gi, "").slice(-8).toUpperCase();
  return `${status === "PENDING" ? "Request" : "Reservation"} #${reference}`;
}

function statusClass(status: AdminReservation["status"]) {
  if (status === "CONFIRMED") return "bg-[#dfeada] text-[#557154]";
  if (status === "CANCELLED") return "bg-[#f4dedd] text-[#954b48]";
  if (status === "COMPLETED") return "bg-[#e6e2dc] text-[#70685e]";
  return "bg-[#f5e7bd] text-[#8c7540]";
}

function detailStatusClass(status: AdminReservation["status"]) {
  if (status === "CONFIRMED") return "bg-[#356950] text-[#b9e1bd]";
  if (status === "CANCELLED") return "bg-[#754943] text-[#f0aaa0]";
  if (status === "COMPLETED") return "bg-[#5b564f] text-[#e5ded5]";
  return "bg-[#625c4d] text-[#e8d9a7]";
}

function detailStatusLabel(status: AdminReservation["status"]) {
  if (status === "PENDING") return "Pending confirmation";
  return status[0] + status.slice(1).toLowerCase();
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

function ReservationDetail({ reservation, today, actionState, isSubmitting, onStatus }: {
  reservation: AdminReservation;
  today: string;
  actionState?: AdminReservationActionState;
  isSubmitting: boolean;
  onStatus: (status: AdminReservation["status"]) => void;
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const primaryAction = reservation.status === "PENDING"
    ? { label: isSubmitting ? "Confirming reservation…" : "Confirm reservation", Icon: Check }
    : reservation.status === "CONFIRMED"
      ? { label: "Edit reservation", Icon: Pencil }
      : reservation.status === "CANCELLED"
        ? { label: "Restore reservation", Icon: RotateCcw }
        : { label: "Reservation completed", Icon: Check };
  const secondaryLabel = reservation.status === "PENDING"
    ? "Chat on WhatsApp"
    : reservation.status === "CONFIRMED"
      ? "Message guest"
      : "View message";

  function handlePrimaryAction() {
    if (reservation.status === "PENDING") {
      onStatus("CONFIRMED");
      return;
    }

    if (reservation.status === "CONFIRMED") {
      setIsEditOpen(true);
      return;
    }

    if (reservation.status === "CANCELLED") {
      onStatus("PENDING");
    }
  }

  return <><aside aria-label="Selected request" className="min-h-[31rem] rounded-md bg-[#2c2926] p-7 text-[#fffaf3] sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#b9a16a]">Reservation detail</p><p className="mt-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[#847c72]">{reservationReference(reservation.id, reservation.status)}</p></div><span aria-hidden="true" className="mt-0.5 text-3xl font-light leading-none text-[#f2ede5]">×</span></div><div className="mt-6"><span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.14em] ${detailStatusClass(reservation.status)}`}><span aria-hidden="true" className="size-2 rounded-full bg-current" />{detailStatusLabel(reservation.status)}</span></div><h2 className="display mt-8 text-4xl font-medium leading-[0.98] tracking-[-0.05em] sm:text-5xl">{reservation.name}</h2><p className="mt-5 text-base text-[#d4ccc0]">WhatsApp <span className="mx-2 text-[#b9a16a]">•</span> {reservation.phone}</p><dl className="mt-6 grid gap-4 border-t border-[#5c554d] pt-5"><div className="flex items-center justify-between gap-4"><dt className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[#91877d]">Date &amp; time</dt><dd className="text-right text-sm font-medium uppercase text-[#f2ede5]">{formatDetailDateTime(reservation.reservationDate, reservation.reservationTime, today)}</dd></div><div className="flex items-center justify-between gap-4"><dt className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[#91877d]">Party size</dt><dd className="text-right text-sm font-medium text-[#f2ede5]">{reservation.guestCount} guests</dd></div></dl>{reservation.specialRequest ? <div className="mt-6 rounded-md bg-[#312e2a] p-5"><p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#b9a16a]">Guest note</p><p className="mt-3 text-base leading-7 text-[#eee7dd]">{reservation.specialRequest}</p></div> : null}<div className="mt-6 grid gap-3"><ActionFeedback state={actionState} /><Button className="w-full rounded-[4px] border-0 bg-[#8d7540] px-4 py-4 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#fffaf3] hover:bg-[#a18950]" disabled={reservation.status === "COMPLETED" || isSubmitting} onClick={handlePrimaryAction} type="button"><primaryAction.Icon size={17} />{primaryAction.label}</Button><Button asChild className="w-full rounded-[4px] border-[#cdbb7f] px-4 py-4 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#fffaf3] hover:bg-[#4a4139]" variant="outline"><a aria-label={secondaryLabel} href={whatsappHref(reservation.phone)} rel="noreferrer" target="_blank"><MessageCircle size={18} />{secondaryLabel}<ArrowUpRight size={15} /></a></Button></div></aside>{isEditOpen ? <ReservationStatusModal isSubmitting={isSubmitting} onClose={() => setIsEditOpen(false)} onStatus={async (status) => { await onStatus(status); setIsEditOpen(false); }} reservation={reservation} /> : null}</>;
}

function ReservationStatusModal({ reservation, isSubmitting, onClose, onStatus }: {
  reservation: AdminReservation;
  isSubmitting: boolean;
  onClose: () => void;
  onStatus: (status: AdminReservation["status"]) => Promise<void>;
}) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#1e1b18]/70 p-5"><section aria-labelledby="edit-reservation-title" aria-modal="true" className="w-full max-w-md rounded-md bg-[#fffdf9] p-6 text-[#1e1b18] shadow-2xl sm:p-8" role="dialog"><div className="flex items-start justify-between gap-5"><div><p className="eyebrow">Reservation action</p><h2 className="display mt-3 text-3xl font-medium" id="edit-reservation-title">Edit reservation</h2></div><button aria-label="Close edit reservation" className="text-2xl leading-none text-[#70685e] hover:text-[#1e1b18]" disabled={isSubmitting} onClick={onClose} type="button">×</button></div><p className="mt-4 text-sm leading-6 text-muted-foreground">Choose the next status for {reservation.name}.</p><div className="mt-6 grid gap-3"><Button className="w-full rounded-md" disabled={isSubmitting} onClick={() => onStatus("COMPLETED")} type="button"><Check size={16} />Mark reservation completed</Button><Button className="w-full rounded-md border-[#954b48] text-[#954b48] hover:bg-[#fff0ef] hover:text-[#954b48]" disabled={isSubmitting} onClick={() => onStatus("CANCELLED")} type="button" variant="outline">Cancel reservation</Button></div></section></div>;
}

function EmptyDetail() {
  return <aside aria-label="Selected request" className="flex min-h-[31rem] items-center justify-center rounded-md bg-[#2c2926] p-8 text-center text-[#fffaf3]"><div><RefreshCw className="mx-auto size-9 text-[#b9a16a]" /><h2 className="display mt-5 text-3xl font-medium">Nothing selected.</h2><p className="mt-3 text-sm text-[#d4ccc0]">Select a request to see its details.</p></div></aside>;
}
export function ReservationsView({ data, updateReservationStatusAction, loadReservationsPageAction }: {
  data: ReservationPageData;
  updateReservationStatusAction: ReservationAction;
  loadReservationsPageAction?: ReservationListAction;
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [yearFilter, setYearFilter] = useState(data.today.slice(0, 4));
  const [searchQuery, setSearchQuery] = useState("");
  const [reservations, setReservations] = useState(data.reservations);
  const [hasMore, setHasMore] = useState(data.hasMore);
  const [nextOffset, setNextOffset] = useState<number | null>(data.nextOffset);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const [retryRequest, setRetryRequest] = useState<{ request: ReservationListRequest; replace: boolean }>();
  const [selectedId, setSelectedId] = useState(data.reservations[0]?.id);
  const [actionState, setActionState] = useState<AdminReservationActionState>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadingPageRef = useRef(false);
  const years = [...new Set([data.today.slice(0, 4), ...reservations.map((item) => item.reservationDate.slice(0, 4))])].sort().reverse();

  const loadReservationPage = useCallback(async (request: ReservationListRequest, replace: boolean) => {
    if (!loadReservationsPageAction || isLoadingPageRef.current) return;

    isLoadingPageRef.current = true;
    setIsLoadingPage(true);
    setLoadError(undefined);
    setRetryRequest({ request, replace });

    try {
      const result = await loadReservationsPageAction(request);
      setReservations((current) => replace ? result.reservations : [...current, ...result.reservations]);
      setHasMore(result.hasMore);
      setNextOffset(result.nextOffset);
      setRetryRequest(undefined);
      if (replace) setSelectedId(result.reservations[0]?.id);
    } catch {
      setLoadError("We could not load more reservations. Please try again.");
    } finally {
      isLoadingPageRef.current = false;
      setIsLoadingPage(false);
    }
  }, [loadReservationsPageAction]);

  const loadMore = useCallback(() => {
    if (nextOffset === null) return;
    void loadReservationPage({
      offset: nextOffset,
      status: statusFilter,
      dateFilter,
      year: yearFilter,
      query: searchQuery,
    }, false);
  }, [dateFilter, loadReservationPage, nextOffset, searchQuery, statusFilter, yearFilter]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!loadReservationsPageAction || !hasMore || !sentinel || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMore();
    }, { rootMargin: "320px" });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore, loadReservationsPageAction]);

  const filteredReservations = useMemo(() => reservations.filter((item) => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matchesQuery = normalizedQuery.length === 0
      || item.name.toLowerCase().includes(normalizedQuery)
      || item.phone.toLowerCase().includes(normalizedQuery)
      || (item.email?.toLowerCase().includes(normalizedQuery) ?? false)
      || (item.specialRequest?.toLowerCase().includes(normalizedQuery) ?? false);
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesDate = dateFilter === "all"
      || (dateFilter === "today" && item.reservationDate === data.today)
      || (dateFilter === "week" && item.reservationDate >= data.weekStart && item.reservationDate <= data.weekEnd)
      || (dateFilter === "month" && item.reservationDate.slice(0, 7) === data.today.slice(0, 7))
      || (dateFilter === "year" && item.reservationDate.slice(0, 4) === yearFilter);
    return matchesQuery && matchesStatus && matchesDate;
  }), [data.today, data.weekEnd, data.weekStart, dateFilter, reservations, searchQuery, statusFilter, yearFilter]);

  const selectedReservation = filteredReservations.find((item) => item.id === selectedId) ?? filteredReservations[0];
  const hasFilters = statusFilter !== "all" || dateFilter !== "all" || searchQuery.trim().length > 0;

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
      if (result.success) {
        setReservations((current) => current.map((item) => item.id === selectedReservation.id ? { ...item, status } : item));
        router.refresh();
      }
    } catch {
      setActionState({ success: false, message: "Something went wrong while updating the reservation." });
    } finally {
      setIsSubmitting(false);
    }
  }

  function reloadFirstPage(nextStatus: StatusFilter, nextDateFilter: DateFilter, nextYear: string, nextQuery = searchQuery) {
    if (!loadReservationsPageAction) return;
    void loadReservationPage({
      offset: 0,
      status: nextStatus,
      dateFilter: nextDateFilter,
      year: nextYear,
      query: nextQuery.trim(),
    }, true);
  }

  function clearFilters() {
    const defaultYear = data.today.slice(0, 4);
    setStatusFilter("all");
    setDateFilter("all");
    setYearFilter(defaultYear);
    setSearchQuery("");
    setActionState(undefined);
    reloadFirstPage("all", "all", defaultYear, "");
  }

  return <div className="space-y-9">
    <header>
      <p className="eyebrow flex items-center gap-3">Operations <span aria-hidden="true">/</span> Reservations</p>
      <h1 className="display mt-5 text-5xl font-medium tracking-[-0.055em] sm:text-6xl">Table requests</h1>
      <p className="mt-2 text-base text-muted-foreground">{data.pendingCount} pending confirmations need your attention</p>
    </header>
    <section aria-label="Reservation filters" className="flex flex-wrap gap-3">
      <label className="reservation-search relative flex min-h-14 min-w-full items-center rounded-md border border-[#ded2c2] bg-[#fffdf9] text-sm transition-colors focus-within:border-[#8b4a2b] sm:min-w-72 sm:flex-1 xl:max-w-md">
        <Search aria-hidden="true" className="ml-5 shrink-0 text-[#70685e]" size={17} />
        <span className="sr-only">Search reservations</span>
        <input aria-label="Search reservations" className="reservation-search-input h-14 w-full appearance-none rounded-none border-0 bg-transparent px-3 text-sm outline-none focus:outline-none focus:ring-0 placeholder:text-[#8d857b]" onChange={(event) => {
          const nextQuery = event.target.value;
          setSearchQuery(nextQuery);
          setActionState(undefined);
          reloadFirstPage(statusFilter, dateFilter, yearFilter, nextQuery);
        }} placeholder="Search name, WhatsApp, email..." type="search" value={searchQuery} />
      </label>
      <label className="sr-only" htmlFor="reservation-status-filter">Reservation status</label>
      <select aria-label="Reservation status" className="reservation-filter min-h-14 min-w-36 rounded-md border-0 bg-[#e8deca] px-5 text-sm outline-none focus:ring-2 focus:ring-[#8b4a2b]" id="reservation-status-filter" onChange={(event) => {
        const nextStatus = event.target.value as StatusFilter;
        setStatusFilter(nextStatus);
        setActionState(undefined);
        reloadFirstPage(nextStatus, dateFilter, yearFilter);
      }} value={statusFilter}>
        <option value="all">All status</option>
        <option value="PENDING">Pending</option>
        <option value="CONFIRMED">Confirmed</option>
        <option value="CANCELLED">Cancelled</option>
        <option value="COMPLETED">Completed</option>
      </select>
      <select aria-label="Reservation period" className="reservation-filter min-h-14 min-w-36 rounded-md border-0 bg-[#e8deca] px-5 text-sm outline-none focus:ring-2 focus:ring-[#8b4a2b]" onChange={(event) => {
        const nextDateFilter = event.target.value as DateFilter;
        setDateFilter(nextDateFilter);
        setActionState(undefined);
        reloadFirstPage(statusFilter, nextDateFilter, yearFilter);
      }} value={dateFilter}>
        <option value="all">All dates</option>
        <option value="today">Today</option>
        <option value="week">This week</option>
        <option value="month">This month</option>
        <option value="year">Year</option>
      </select>
      {dateFilter === "year" ? <select aria-label="Reservation year" className="reservation-filter min-h-14 min-w-36 rounded-md border-0 bg-[#e8deca] px-5 text-sm outline-none focus:ring-2 focus:ring-[#8b4a2b]" onChange={(event) => {
        const nextYear = event.target.value;
        setYearFilter(nextYear);
        setActionState(undefined);
        reloadFirstPage(statusFilter, dateFilter, nextYear);
      }} value={yearFilter}>
        {years.map((year) => <option key={year} value={year}>{year}</option>)}
      </select> : null}
      {hasFilters ? <Button onClick={clearFilters} type="button" variant="ghost">Clear filters</Button> : null}
    </section>
    <p className="eyebrow">Latest requests</p>
    <div className="grid items-start gap-8 xl:grid-cols-[1.45fr_0.75fr]">
      <section aria-label="Reservation requests" className="max-h-[42rem] min-h-[32rem] overflow-auto rounded-md border bg-[#fffdf9] p-4 sm:p-7">
        <div className="grid min-w-[44rem] grid-cols-[1.4fr_1.2fr_0.55fr_0.85fr] gap-4 bg-[#f4f0e7] px-5 py-4 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          <span className="flex items-center gap-2"><UserRound aria-hidden="true" size={15} className="shrink-0" />Customer</span>
          <span className="flex items-center gap-2"><CalendarDays aria-hidden="true" size={15} className="shrink-0" />Date &amp; time</span>
          <span className="flex items-center gap-2"><Users aria-hidden="true" size={15} className="shrink-0" />Guests</span>
          <span className="flex items-center gap-2"><CircleCheck aria-hidden="true" size={15} className="shrink-0" />Status</span>
        </div>
        <div className="min-w-[44rem]">
          {filteredReservations.length === 0 ? <div className="grid min-h-[24rem] place-items-center p-8 text-center">
            <div>
              <h2 className="display text-2xl font-medium">{reservations.length === 0 ? "No table requests yet." : "No table requests match these filters."}</h2>
              <p className="mt-3 text-sm text-muted-foreground">{reservations.length === 0 ? "Requests from the public reservation form will appear here." : "Try another search, status, or date range."}</p>
              {hasFilters ? <Button className="mt-5" onClick={clearFilters} type="button" variant="outline">Clear filters</Button> : null}
            </div>
          </div> : <div>
            {filteredReservations.map((item) => <button aria-pressed={selectedReservation?.id === item.id} aria-label={`Open request from ${item.name}`} className={`grid w-full grid-cols-[1.4fr_1.2fr_0.55fr_0.85fr] items-center gap-4 border-b px-5 py-5 text-left transition-colors last:border-b-0 ${selectedReservation?.id === item.id ? "bg-[#fdf8ec]" : "hover:bg-[#faf7f0]"}`} key={item.id} onClick={() => {
              setSelectedId(item.id);
              setActionState(undefined);
            }} type="button">
              <span className="font-semibold">{item.name}</span>
              <span className="text-sm text-muted-foreground">{formatListDate(item.reservationDate, item.reservationTime, data.today)}</span>
              <span className="text-sm text-muted-foreground">{item.guestCount}</span>
              <span className={`w-fit rounded-full px-3 py-1 text-[0.68rem] font-semibold tracking-[0.14em] ${statusClass(item.status)}`}>{item.status}</span>
            </button>)}
          </div>}
          <div aria-live="polite" className="grid min-h-16 place-items-center gap-2 px-5 py-4 text-center text-xs text-muted-foreground" ref={loadMoreRef}>
            {loadError ? <div className="flex flex-wrap items-center justify-center gap-2">
              <p role="alert">{loadError}</p>
              {retryRequest ? <Button className="px-3 py-2 text-xs" onClick={() => void loadReservationPage(retryRequest.request, retryRequest.replace)} type="button" variant="ghost">Try again</Button> : null}
            </div> : isLoadingPage ? "Loading more reservations…" : hasMore ? "Scroll to load more reservations" : "No more reservations."}
          </div>
        </div>
      </section>
      {selectedReservation ? <ReservationDetail actionState={actionState} isSubmitting={isSubmitting} onStatus={handleStatus} reservation={selectedReservation} today={data.today} /> : <EmptyDetail />}
    </div>
  </div>;
}
