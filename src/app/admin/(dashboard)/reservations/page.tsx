import { getAdminReservationsPage, updateAdminReservationStatus } from "@/actions/admin-reservations";
import { ReservationsView } from "@/components/admin/reservations-view";
import { getReservationPageData } from "@/db/reservations";

export const dynamic = "force-dynamic";

export default async function AdminReservationsPage() {
  const data = await getReservationPageData();
  const reservationListKey = data.reservations.map((item) => `${item.id}:${item.status}`).join("|");
  return <ReservationsView data={data} key={reservationListKey} loadReservationsPageAction={getAdminReservationsPage} updateReservationStatusAction={updateAdminReservationStatus} />;
}
