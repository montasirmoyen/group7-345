"use client";

import { useState } from "react";

import { Dashboard } from "@/components/dashboard";
import OnboardingFeed from "@/components/onboarding";

export default function OnboardingFeedPage() {
  const [isOnboardingDone, setIsOnboardingDone] = useState(false);

  if (isOnboardingDone) {
    return <Dashboard />;
  }

  return (
    <div className="py-8 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <OnboardingFeed onContinue={() => setIsOnboardingDone(true)} />
        </div>
      </div>
    </div>
  );
}