"use client";

import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth-context";
import { Dashboard } from "@/components/dashboard";
import { RemindersDashboard } from "@/components/ui/reminders-dashboard";
import OnboardingFeed from "@/components/onboarding";
import { EmailVerificationGate } from "@/components/email-verification-gate";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // If loading, show spinner
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If not logged in, show onboarding which guides user to sign up
  if (!user) {
    return (
      <div className="py-8 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <OnboardingFeed
              onContinue={() => router.push("/register")}
              onCancel={() => router.push("/")}
            />
          </div>
        </div>
      </div>
    );
  }

  const isPasswordProviderUser = user.providerData.some(
    (provider) => provider.providerId === "password"
  );

  if (isPasswordProviderUser && !user.emailVerified) {
    return <EmailVerificationGate title="Verify your email to access dashboard" />;
  }

  // User is logged in, show dashboard and reminders in one place
  return (
    <>
      <Dashboard />
      <RemindersDashboard />
    </>
  );
}