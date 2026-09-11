import type { Metadata } from "next";

import { PageIntro } from "@/components/layout/page-intro";

export const metadata: Metadata = { title: "Privacy Policy", robots: { index: false, follow: true } };

export default function PrivacyPage() {
  return <><PageIntro eyebrow="Legal" title="Privacy Policy">A concise cafe-specific privacy policy will be finalized before launch, covering reservation details, enquiry data, and analytics providers.</PageIntro><section className="shell max-w-3xl py-16 text-sm leading-7 text-muted-foreground" data-reveal><p>This scaffold does not collect customer data until the reservation form is enabled. Do not publish this placeholder as the final legal copy.</p></section></>;
}
