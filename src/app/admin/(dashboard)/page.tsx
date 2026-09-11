import { createMenuItem, updateAdminReservationStatus } from "@/actions/admin-dashboard";
import { DashboardView } from "@/components/admin/dashboard-view";
import { getDashboardData } from "@/db/dashboard";
import { requireAdminSession } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

function jakartaDate(value: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
}

function galleryUpdatedLabel(updatedAt: Date | null) {
  if (!updatedAt) return "no images yet";

  const today = jakartaDate(new Date());
  const updated = jakartaDate(updatedAt);
  if (updated === today) return "updated today";

  const todayUtc = Date.parse(`${today}T00:00:00Z`);
  const updatedUtc = Date.parse(`${updated}T00:00:00Z`);
  const daysAgo = Math.round((todayUtc - updatedUtc) / 86_400_000);
  if (daysAgo === 1) return "last updated yesterday";
  if (daysAgo > 1 && daysAgo < 7) return `updated ${daysAgo} days ago`;

  return `updated ${new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" }).format(updatedAt)}`;
}

export default async function AdminDashboardPage() {
  const session = await requireAdminSession();
  const dashboard = await getDashboardData();
  const firstName = session.user.name.trim().split(/\s+/)[0] || session.user.name;

  return <DashboardView data={{
    greetingName: firstName,
    dateLabel: new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", timeZone: "Asia/Jakarta", weekday: "long" }).format(new Date()),
    stats: { ...dashboard.stats, galleryUpdatedLabel: galleryUpdatedLabel(dashboard.stats.galleryUpdatedAt) },
    categories: dashboard.categories,
    reservations: dashboard.reservations,
    pendingReservations: dashboard.pendingReservations,
  }} createMenuItemAction={createMenuItem} updateReservationStatusAction={updateAdminReservationStatus} />;
}
