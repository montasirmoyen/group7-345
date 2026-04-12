"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { RemindersPanel } from "@/components/reminders";
import { useAuth } from "@/lib/auth-context";

export default function RemindersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  return <RemindersPanel />;
}
