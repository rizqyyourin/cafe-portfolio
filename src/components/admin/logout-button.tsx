"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function LogoutButton({ className, label = "Sign out" }: { className?: string; label?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut() {
    setError(undefined);
    setIsPending(true);

    try {
      const result = await authClient.signOut();
      if (result.error) {
        setError(result.error.message ?? "We could not sign you out. Please try again.");
        return;
      }

      router.push("/auth/login");
    } catch {
      setError("We could not connect to the sign-out service. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return <div className="flex items-center gap-3"><Button className={className} disabled={isPending} onClick={handleSignOut} size="sm" variant="ghost"><LogOut size={15} />{isPending ? "Signing out…" : label}</Button>{error ? <p className="text-xs text-red-700" role="alert">{error}</p> : null}</div>;
}
