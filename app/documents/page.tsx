"use client";

import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth-context";
import { DocumentManager } from "@/components/document-manager";
import { Loader2 } from "lucide-react";

export default function DocumentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return <DocumentManager />;
}
