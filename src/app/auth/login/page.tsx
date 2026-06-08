"use client";

import { Suspense, useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { loginSchema } from "@/lib/validations/auth";
import { looksLikeEmail } from "@/lib/phone";
import { createClient } from "@/lib/supabase/client";
import {
  AtSign,
  Lock,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle,
  ArrowLeft,
  UserPlus,
} from "lucide-react";

const MAX_FAILED_ATTEMPTS = 5;

function LoginForm() {
  const searchParams = useSearchParams();
  // Prefill the email after a member verifies (the verify page passes it along).
  const [identifier, setIdentifier] = useState(
    () => searchParams.get("email") ?? ""
  );
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const [error, setError] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendNotice, setResendNotice] = useState("");

  // Check for error params from callback
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "auth_callback_error") {
      setError("There was a problem signing you in. Please try again.");
    }
  }, [searchParams]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setMagicLinkSent(false);
    setNeedsVerification(false);
    setResendNotice("");

    // Check lockout
    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      setError(
        "Too many failed attempts. Please wait a few minutes before trying again, or use a magic link to sign in."
      );
      return;
    }

    // Validate with Zod
    const result = loginSchema.safeParse({ identifier, password });
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!errors[field]) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      // All logins go through the server route. It accepts an email OR a phone
      // identifier, resolves a phone to the account's email server-side, signs
      // in, enforces the verification gate, and sets the session cookies.
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: result.data.identifier,
          password: result.data.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Unverified accounts get a dedicated path: offer to resend the link
        // instead of counting it as a failed password attempt.
        if (data.code === "NOT_VERIFIED") {
          setNeedsVerification(true);
          setError(
            data.error ||
              "Please verify your account first. Check your email for your verification link."
          );
          return;
        }
        setFailedAttempts((prev) => prev + 1);
        setError(
          data.error || "Invalid login. Please check your details and try again."
        );
        return;
      }

      // Success — the server set the session cookies. Use a full-page
      // navigation so middleware and the session re-read cleanly from cookies.
      const role = data.user?.role;
      if (role === "admin" || role === "super_admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/portal/profile";
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendVerification() {
    setResendNotice("");

    if (!looksLikeEmail(identifier)) {
      setFieldErrors({
        identifier:
          "Enter the email address you registered with to resend your verification link.",
      });
      return;
    }

    setIsResending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.toLowerCase() }),
      });
      const data = await response.json().catch(() => ({}));
      // Response is intentionally generic (no account enumeration).
      setResendNotice(
        data.message ||
          "If an unverified account exists for that email, a new verification link is on its way."
      );
    } catch {
      setResendNotice(
        "We couldn't request a new link just now. Please try again in a moment."
      );
    } finally {
      setIsResending(false);
    }
  }

  async function handleMagicLink() {
    setError("");
    setFieldErrors({});

    if (!identifier) {
      setFieldErrors({ identifier: "Enter your email address first." });
      return;
    }

    // Magic links are email-only.
    if (!looksLikeEmail(identifier)) {
      setFieldErrors({
        identifier:
          "Magic links are sent by email. Enter your email address, or sign in with your password.",
      });
      return;
    }

    setIsMagicLinkLoading(true);

    try {
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: identifier.toLowerCase(),
      });

      if (otpError) {
        setError(
          otpError.message || "Failed to send magic link. Please try again."
        );
        return;
      }

      setMagicLinkSent(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsMagicLinkLoading(false);
    }
  }

  const isLockedOut = failedAttempts >= MAX_FAILED_ATTEMPTS;

  return (
    <>
      {/* Title */}
      <h1 className="mt-6 text-center font-heading text-fluid-xl font-bold text-warm-900">
        Welcome Back
      </h1>
      <p className="mt-2 text-center text-warm-500">
        Sign in to your member portal
      </p>

      {/* Magic link success */}
      {magicLinkSent && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Magic link sent! Check your email for a sign-in link.</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Unverified account — offer to resend the verification link */}
      {needsVerification && (
        <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Haven&apos;t received your verification email? Enter your email
              above and resend it.
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-3 w-full border-amber-300 text-amber-800 hover:bg-amber-100"
            onClick={handleResendVerification}
            disabled={isResending}
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Resend verification email
              </>
            )}
          </Button>
          {resendNotice && (
            <p className="mt-2 text-xs text-amber-700">{resendNotice}</p>
          )}
        </div>
      )}

      {/* Lockout warning */}
      {isLockedOut && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Account temporarily locked due to multiple failed attempts. Try
            using a magic link or wait a few minutes.
          </span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="identifier">Email or Phone</Label>
          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
            <Input
              id="identifier"
              type="text"
              inputMode="email"
              autoComplete="username"
              placeholder="you@example.com or (843) 555-0123"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (fieldErrors.identifier)
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.identifier;
                    return next;
                  });
              }}
              className="pl-10"
              aria-invalid={!!fieldErrors.identifier}
            />
          </div>
          {fieldErrors.identifier && (
            <p className="text-xs text-red-600">{fieldErrors.identifier}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password)
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.password;
                    return next;
                  });
              }}
              className="pl-10"
              aria-invalid={!!fieldErrors.password}
            />
          </div>
          {fieldErrors.password && (
            <p className="text-xs text-red-600">{fieldErrors.password}</p>
          )}
        </div>

        <div className="flex justify-end">
          <Link
            href="/auth/reset-password"
            className="text-sm text-purple-600 hover:text-purple-700 hover:underline"
          >
            Forgot your password?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={isLoading || isLockedOut}
          className="w-full bg-purple-700 text-white hover:bg-purple-800"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>

        {/* Separator */}
        <div className="relative flex items-center py-2">
          <Separator className="flex-1" />
          <span className="mx-4 text-sm text-warm-400">or</span>
          <Separator className="flex-1" />
        </div>

        {/* Magic Link */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleMagicLink}
          disabled={isMagicLinkLoading}
        >
          {isMagicLinkLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Sign in with Magic Link
            </>
          )}
        </Button>
      </form>

      {/* New member? Register */}
      <div className="mt-6 rounded-xl border border-warm-200 bg-warm-50 p-4 text-center">
        <p className="text-sm text-warm-600">New to Friendship Baptist Church?</p>
        <Link href="/auth/register" className="mt-3 block">
          <Button
            type="button"
            variant="outline"
            className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Create an Account
          </Button>
        </Link>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-950 via-purple-900 to-purple-800">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-950 via-purple-900 to-purple-800 py-8">
      <div className="mx-4 w-full max-w-md">
        {/* Back to website */}
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to website
        </Link>

        {/* Card */}
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          {/* Logo */}
          <div className="mx-auto flex justify-center">
            <Logo variant="full" size="lg" />
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
