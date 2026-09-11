import { updateAdminReservationStatus } from "@/actions/admin-reservations";
import { ReservationsView } from "@/components/admin/reservations-view";
import { getReservationPageData } from "@/db/reservations";

export const dynamic = "force-dynamic";

export default async function AdminReservationsPage() {
  const data = await getReservationPageData();
  return <ReservationsView data={data} updateReservationStatusAction={updateAdminReservationStatus} />;
}
