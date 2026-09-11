"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ChevronDown, LoaderCircle } from "lucide-react";
import { DayPicker } from "@daypicker/react";

import { createReservation, type ReservationActionState } from "@/actions/reservation";
import styles from "./reservation-form.module.css";

const initialState: ReservationActionState = { success: false };

function FieldError({ errors, name }: { errors?: Record<string, string[]>; name: string }) {
  const error = errors?.[name]?.[0];
  return error ? <p className={styles.error}>{error}</p> : null;
}

function Field({
  children,
  errors,
  htmlFor,
  label,
  name,
  required = false,
}: {
  children: React.ReactNode;
  errors?: Record<string, string[]>;
  label: string;
  name: string;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={htmlFor ?? name}>
        {label}
        {required ? <span className={styles.required}>*</span> : null}
      </label>
      {children}
      <FieldError errors={errors} name={name} />
    </div>
  );
}

function SelectField({ children }: { children: React.ReactNode }) {
  return (
    <span className={styles.control}>
      {children}
      <ChevronDown aria-hidden="true" className={styles.chevron} size={16} strokeWidth={1.7} />
    </span>
  );
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return undefined;
  }

  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : undefined;
}

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateValue(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : "Select date";
}

function getTimeOptions(defaultTime: string) {
  const options = Array.from({ length: 29 }, (_, index) => {
    const minutes = 8 * 60 + index * 30;
    const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
    const minute = String(minutes % 60).padStart(2, "0");
    return `${hour}:${minute}`;
  });

  if (/^\d{2}:\d{2}$/.test(defaultTime) && !options.includes(defaultTime)) {
    return [...options, defaultTime].sort();
  }

  return options;
}

function ReservationDatePicker({ value, defaultDate, onChange }: { value: string; defaultDate: string; onChange: (value: string) => void }) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const today = parseDateValue(defaultDate) ?? new Date();
  const selectedDate = parseDateValue(value);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(selectedDate ?? today);

  useEffect(() => {
    if (!open) {
      return;
    }

    const closeOnOutsideInteraction = (event: PointerEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideInteraction);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideInteraction);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      return;
    }

    onChange(toDateValue(date));
    setMonth(date);
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className={styles.datePicker} ref={pickerRef}>
      <input name="reservationDate" readOnly type="hidden" value={value} />
      <button
        aria-controls="reservation-date-calendar"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={value ? `Choose reservation date, ${formatDateValue(value)}` : "Choose reservation date"}
        className={`${styles.input} ${styles.pickerTrigger}`}
        id="reservationDate"
        onClick={() => setOpen((isOpen) => !isOpen)}
        ref={triggerRef}
        type="button"
      >
        <span>{formatDateValue(value)}</span>
        <ChevronDown aria-hidden="true" size={16} strokeWidth={1.7} />
      </button>
      {open ? (
        <div aria-label="Reservation date calendar" className={styles.datePopover} id="reservation-date-calendar" role="dialog">
          <DayPicker
            disabled={{ before: today }}
            mode="single"
            month={month}
            onMonthChange={setMonth}
            onSelect={handleSelect}
            selected={selectedDate}
            startMonth={today}
          />
        </div>
      ) : null}
    </div>
  );
}

export function ReservationForm({ defaultDate = "", defaultTime = "" }: { defaultDate?: string; defaultTime?: string }) {
  const [state, formAction, isPending] = useActionState(createReservation, initialState);
  const [reservationDate, setReservationDate] = useState(defaultDate);
  const [reservationTime, setReservationTime] = useState(defaultTime);
  const timeOptions = getTimeOptions(defaultTime);

  if (state.success) {
    return <div className={styles.success} role="status"><p>Reservation request received!</p><p>{state.message}</p></div>;
  }

  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.formHeader}>
        <h2 id="reservation-form-title">Request a table</h2>
        <p>Fields marked * are required.</p>
        {state.message ? <p className={styles.formError} role="alert">{state.message}</p> : null}
      </div>

      <Field errors={state.errors} label="Name" name="name" required>
        <input className={styles.input} id="name" name="name" placeholder="Enter your name" required />
      </Field>
      <Field errors={state.errors} label="WhatsApp" name="phone" required>
        <input className={styles.input} id="phone" inputMode="tel" name="phone" placeholder="Enter your phone number" required />
      </Field>

      <div className={styles.detailsGrid}>
        <Field errors={state.errors} htmlFor="reservationDate" label="Date" name="reservationDate" required>
          <ReservationDatePicker defaultDate={defaultDate} onChange={setReservationDate} value={reservationDate} />
        </Field>
        <Field errors={state.errors} label="Time" name="reservationTime" required>
          <SelectField>
            <select className={styles.input} id="reservationTime" name="reservationTime" onChange={(event) => setReservationTime(event.target.value)} required value={reservationTime}>
              <option disabled value="">Select time</option>
              {timeOptions.map((time) => <option key={time} value={time}>{time}</option>)}
            </select>
          </SelectField>
        </Field>
        <Field errors={state.errors} label="Guests" name="guestCount" required>
          <SelectField>
            <select className={styles.input} id="guestCount" defaultValue="" name="guestCount" required>
              <option disabled value="">Select guests</option>
              {Array.from({ length: 20 }, (_, index) => {
                const count = index + 1;
                return <option key={count} value={count}>{count} {count === 1 ? "guest" : "guests"}</option>;
              })}
            </select>
          </SelectField>
        </Field>
      </div>

      <Field errors={state.errors} label="Special request" name="specialRequest">
        <textarea className={styles.textarea} id="specialRequest" name="specialRequest" placeholder="Add any special request" />
      </Field>

      <div className={styles.submitArea}>
        <button className={styles.submit} disabled={isPending} type="submit">
          {isPending ? <><LoaderCircle className={styles.spinner} size={16} />Sending request...</> : <>Request reservation <span aria-hidden="true">→</span></>}
        </button>
        <p className={styles.helper}>We&apos;ll contact you through WhatsApp to confirm your booking.</p>
      </div>
    </form>
  );
}
