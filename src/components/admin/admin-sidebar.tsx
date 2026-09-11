"use client";

import Link from "next/link";
import { CalendarDays, Coffee, Image, LayoutDashboard, MessageSquareQuote, Settings, Tags } from "lucide-react";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/admin/logout-button";

const adminNav = [
  ["Overview", "/admin", LayoutDashboard],
  ["Menu", "/admin/menu", Coffee],
  ["Categories", "/admin/categories", Tags],
  ["Gallery", "/admin/gallery", Image],
  ["Reservations", "/admin/reservations", CalendarDays],
  ["Testimonials", "/admin/testimonials", MessageSquareQuote],
  ["Settings", "/admin/settings", Settings],
] as const;

export function AdminSidebar({ userName, userEmail }: { userName: string; userEmail: string }) {
  const pathname = usePathname();

  return <aside className="flex min-h-16 shrink-0 flex-col bg-[#2c2926] px-5 py-5 text-[#fffaf3] lg:sticky lg:top-0 lg:h-screen lg:w-[17.5rem] lg:px-8 lg:py-10"><Link className="shrink-0" href="/admin"><span className="display block text-4xl font-semibold tracking-[-0.06em]">KŌHI</span><span className="mt-1 block text-[0.65rem] font-semibold uppercase tracking-[0.23em] text-[#b9a16a]">Content studio</span></Link><nav aria-label="CMS navigation" className="mt-9 flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">{adminNav.map(([label, href, Icon]) => { const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href); return <Link aria-current={isActive ? "page" : undefined} className={`flex shrink-0 items-center gap-4 rounded-md px-4 py-3 text-sm font-semibold transition-colors ${isActive ? "bg-[#806b3c] text-[#fffaf3]" : "text-[#ded6ca] hover:bg-white/10"}`} href={href} key={href}><Icon size={18} strokeWidth={1.8} />{label}</Link>; })}</nav><div className="mt-auto hidden border-t border-white/10 pt-8 lg:block"><p className="font-semibold">{userName}</p><div className="mt-2 flex items-center gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#b9a16a]"><span>Owner</span><span aria-hidden="true">•</span><LogoutButton className="!min-h-0 !px-0 !py-0 !text-[0.65rem] !font-semibold !uppercase !tracking-[0.18em] !text-[#b9a16a] hover:!bg-transparent hover:!text-[#fffaf3]" label="Log out" /></div><p className="mt-3 truncate text-xs text-[#a9a096]">{userEmail}</p></div></aside>;
}
