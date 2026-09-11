import { saveSettings } from "@/actions/admin-settings";
import { SettingsView } from "@/components/admin/settings-view";
import { emptyCafeSettings, getCafeSettings } from "@/db/settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getCafeSettings();
  return <SettingsView data={settings ?? emptyCafeSettings} saveSettingsAction={saveSettings} />;
}
