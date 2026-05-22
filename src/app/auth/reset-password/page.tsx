"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSuccess } from "@/components/shared/form-success";
import { Mail } from "lucide-react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    console.log("Password reset requested for:", email);
    // Simulate brief loading
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
    }, 800);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-950 via-purple-900 to-purple-800">
      <div className="mx-4 w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          {/* Logo */}
          <div className="mx-auto flex justify-center">
            <Logo variant="icon" size="md" asLink={false} />
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
