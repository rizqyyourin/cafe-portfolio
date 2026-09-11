import { siteConfig } from "@/lib/site";
import type { CafeSettings } from "@/db/settings";

export function LocalBusinessStructuredData({ settings }: { settings?: CafeSettings }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    name: settings?.cafeName || siteConfig.name,
    description: settings?.description || siteConfig.description,
    url: siteConfig.url,
    telephone: settings?.phone,
    email: settings?.email,
    address: { "@type": "PostalAddress", streetAddress: settings?.address || "Jl. Cikajang No. 17", addressLocality: "Jakarta Selatan", addressCountry: "ID" },
    openingHours: settings?.openingHours ? Object.values(settings.openingHours).filter((hours) => hours !== "Closed").join(", ") : "Mo-Su 08:00-22:00",
  };
  return <script dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} type="application/ld+json" />;
}
