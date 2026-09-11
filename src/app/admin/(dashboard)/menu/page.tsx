import { createMenuItem, deleteMenuItem, updateMenuItem } from "@/actions/admin-menu";
import { MenuView } from "@/components/admin/menu-view";
import { getMenuPageData } from "@/db/menu";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const data = await getMenuPageData();
  return <MenuView createMenuItemAction={createMenuItem} data={data} deleteMenuItemAction={deleteMenuItem} updateMenuItemAction={updateMenuItem} />;
}
