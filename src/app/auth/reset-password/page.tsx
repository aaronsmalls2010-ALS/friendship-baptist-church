"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSuccess } from "@/components/shared/form-success";
import { Mail, ArrowLeft, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await response.json().catch(() => ({}));

      // 400 = bad email format; everything else returns a generic success
      // message (the endpoint never reveals whether an account exists).
      if (response.status === 400) {
        setError(data.error || "Please enter a valid email address.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  }

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
            <Logo variant="icon" size="md" />
          </div>

          {submitted ? (
            <div className="mt-6">
              <FormSuccess
                message={`Check your email! We've sent a password reset link to ${email}.`}
                actionLabel="Back to Login"
                actionHref="/auth/login"
              />
            </div>
          ) : (
            <>
              {/* Title */}
              <h1 className="mt-6 text-center font-heading text-fluid-xl font-bold text-warm-900">
                Reset Your Password
              </h1>
              <p className="mt-2 text-center text-warm-500">
                Enter your email and we&apos;ll send you a reset link
              </p>

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
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
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-purple-700 text-white hover:bg-purple-800"
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            </>
          )}
        </div>

        {/* Below card text */}
        <p className="mt-6 text-center text-sm text-white/60">
          Remember your password?{" "}
          <Link
            href="/auth/login"
            className="text-gold-300 hover:text-gold-200 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
