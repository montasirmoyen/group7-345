"use client";

import { useEffect, useState } from "react";
import { Loader2, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";

type EmailVerificationGateProps = {
  title?: string;
};

export function EmailVerificationGate({
  title = "Verify your email to continue",
}: EmailVerificationGateProps) {
  const { user, resendEmailVerification, refreshUser, signOut } = useAuth();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!user || user.emailVerified) {
      return;
    }

    const key = `verification-auto-sent:${user.uid}`;
    if (sessionStorage.getItem(key) === "1") {
      return;
    }

    const autoSendVerification = async () => {
      setError("");
      setIsResending(true);
      try {
        await resendEmailVerification();
        sessionStorage.setItem(key, "1");
        setMessage("Verification email sent. Check your inbox and spam folder.");
      } catch {
        setError("Could not send verification email automatically. Please click resend.");
      } finally {
        setIsResending(false);
      }
    };

    void autoSendVerification();
  }, [user, resendEmailVerification]);

  const handleResend = async () => {
    setError("");
    setMessage("");
    setIsResending(true);

    try {
      await resendEmailVerification();
      setMessage("Verification email sent. Check your inbox and spam folder.");
    } catch {
      setError("Could not send verification email right now. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleVerificationCheck = async () => {
    setError("");
    setMessage("");
    setIsChecking(true);

    try {
      const isVerified = await refreshUser();
      if (!isVerified) {
        setMessage("Your email is still not verified. Please click the link in your inbox.");
      }
    } catch {
      setError("Unable to refresh verification status. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <MailCheck className="size-5" />
            {title}
          </CardTitle>
          <CardDescription>
            We sent a verification link to <strong>{user?.email}</strong>. Verify your email before
            accessing protected pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {message && (
            <div className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleResend} disabled={isResending || isChecking}>
              {isResending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Resend verification email"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleVerificationCheck}
              disabled={isResending || isChecking}
            >
              {isChecking ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Checking...
                </>
              ) : (
                "I've verified my email"
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => signOut()}
              disabled={isResending || isChecking}
            >
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
