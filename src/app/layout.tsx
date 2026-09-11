import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Playfair_Display } from "next/font/google";

import "./globals.css";
import { getPublicCafeSettings } from "@/db/settings";
import { siteConfig } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });
const playfairDisplay = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" });

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicCafeSettings();
  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: `${settings.cafeName} | Specialty coffee`, template: `%s | ${settings.cafeName}` },
    description: settings.description,
    openGraph: { type: "website", locale: "id_ID", siteName: settings.cafeName },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} ${plexMono.variable} ${playfairDisplay.variable} antialiased`}>{children}</body>
    </html>
  );
}
