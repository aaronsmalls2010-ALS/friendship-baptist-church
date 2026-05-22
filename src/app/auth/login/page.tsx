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
import { createClient } from "@/lib/supabase/client";
import {
  Mail,
  Lock,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";

const MAX_FAILED_ATTEMPTS = 5;

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const [error, setError] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Check for error params from callback
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "auth_callback_error") {
      setError("There was a problem signing you in. Please try again.");
    }
  }, [searchParams]);

  function getAuthErrorMessage(errorMessage: string): string {
    if (errorMessage.includes("Invalid login credentials")) {
      return "Invalid email or password. Please try again.";
    }
    if (errorMessage.includes("Email not confirmed")) {
      return "Your email has not been verified. Please check your inbox for a verification link.";
    }
    if (
      errorMessage.includes("rate limit") ||
      errorMessage.includes("too many")
    ) {
      return "Too many login attempts. Please try again later.";
    }
    return errorMessage || "Something went wrong. Please try again.";
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setMagicLinkSent(false);

    // Check lockout
    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      setError(
        "Too many failed attempts. Please wait a few minutes before trying again, or use a magic link to sign in."
      );
      return;
    }

    // Validate with Zod
    const result = loginSchema.safeParse({ email, password });
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
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: result.data.email,
        password: result.data.password,
      });

      if (authError) {
        setFailedAttempts((prev) => prev + 1);
        setError(getAuthErrorMessage(authError.message));
        return;
      }

      // Success — always call get-role to ensure metadata is synced,
      // then refresh the session so the JWT contains the updated role
      let role: string | undefined;

      try {
        const roleRes = await fetch("/api/auth/get-role");
        if (roleRes.ok) {
          const roleData = await roleRes.json();
          role = roleData.role;
        }
      } catch {
        // Fall through — try user metadata as fallback
      }

      // If get-role didn't return a role, check user metadata directly
      if (!role) {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        role =
          authUser?.user_metadata?.role || authUser?.app_metadata?.role;
      }

      // Refresh the session so the JWT cookie has the updated role metadata.
      // Without this, the middleware reads the stale pre-sync JWT and
      // redirects admin users away from /admin.
      await supabase.auth.refreshSession();

      if (role === "admin" || role === "super_admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/portal";
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMagicLink() {
    setError("");
    setFieldErrors({});

    if (!email) {
      setFieldErrors({ email: "Please enter your email address first." });
      return;
    }

    // Basic email validation
    const emailResult = loginSchema.shape.email.safeParse(email);
    if (!emailResult.success) {
      setFieldErrors({ email: "Please enter a valid email address." });
      return;
    }

    setIsMagicLinkLoading(true);

    try {
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
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
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email)
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.email;
                    return next;
                  });
              }}
              className="pl-10"
              aria-invalid={!!fieldErrors.email}
            />
          </div>
          {fieldErrors.email && (
            <p className="text-xs text-red-600">{fieldErrors.email}</p>
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

        {/* Below card text */}
        <p className="mt-6 text-center text-sm text-white/60">
          New here?{" "}
          <Link
            href="/auth/register"
            className="text-gold-300 hover:text-gold-200 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
