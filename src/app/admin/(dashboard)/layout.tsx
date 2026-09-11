import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { LogoutButton } from "@/components/admin/logout-button";
import { requireAdminSession } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAdminSession();

  return <div className="min-h-screen bg-[#f7f4ee] lg:flex"><AdminSidebar userEmail={session.user.email} userName={session.user.name} /><div className="min-w-0 flex-1"><header className="flex min-h-16 items-center justify-between border-b bg-[#fffdf9] px-5 lg:hidden"><p className="truncate text-sm text-muted-foreground">{session.user.email}</p><LogoutButton /></header><main className="px-5 py-8 sm:px-8 lg:px-14 lg:py-12 xl:px-20">{children}</main></div></div>;
}
