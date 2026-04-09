"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/lib/auth-context";
import { DocumentManager } from "@/components/document-manager";
import { EmailVerificationGate } from "@/components/email-verification-gate";
import { Loader2 } from "lucide-react";

export default function DocumentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isPasswordProviderUser = user.providerData.some(
    (provider) => provider.providerId === "password"
  );

  if (isPasswordProviderUser && !user.emailVerified) {
    return <EmailVerificationGate title="Verify your email to access documents" />;
  }

  return <DocumentManager />;
}
