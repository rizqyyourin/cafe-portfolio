"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AdminDashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section aria-labelledby="dashboard-error-title" className="mx-auto max-w-xl rounded-md border border-[#d49b96] bg-[#fff2f1] p-8 text-center" role="alert"><span className="mx-auto grid size-12 place-items-center rounded-full bg-[#f4dedd] text-[#954b48]"><AlertTriangle size={22} /></span><h1 className="display mt-5 text-3xl font-semibold" id="dashboard-error-title">Dashboard unavailable</h1><p className="mt-3 text-sm leading-6 text-[#8d3d39]">We could not load the latest cafe data. Nothing was changed. Please try again.</p><Button className="mt-6" onClick={reset} type="button"><RefreshCw size={16} />Try again</Button></section>;
}
