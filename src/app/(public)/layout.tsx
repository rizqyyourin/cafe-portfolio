import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicMotion } from "@/components/layout/public-motion";
import { getPublicCafeSettings } from "@/db/settings";
import { LocalBusinessStructuredData } from "./structured-data";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getPublicCafeSettings();

  return (
    <PublicMotion>
      <LocalBusinessStructuredData settings={settings} />
      <a className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-3" href="#main-content">Skip to content</a>
      <PublicHeader cafeName={settings.cafeName} />
      <main id="main-content">{children}</main>
      <PublicFooter settings={settings} />
    </PublicMotion>
  );
}
