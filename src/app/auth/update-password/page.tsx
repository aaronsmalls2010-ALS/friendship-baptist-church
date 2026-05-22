"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSuccess } from "@/components/shared/form-success";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const PASSWORD_REQUIREMENTS = [
  { label: "At least 12 characters", test: (p: string) => p.length >= 12 },
  { label: "Contains uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Contains lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Contains a number", test: (p: string) => /[0-9]/.test(p) },
  {
    label: "Contains special character",
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
  },
];

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const allRequirementsMet = PASSWORD_REQUIREMENTS.every((req) =>
    req.test(password)
  );
  const passwordsMatch = password === confirmPassword && password.length > 0;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!allRequirementsMet) {
      setError("Password does not meet all requirements.");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-950 via-purple-900 to-purple-800">
      <div className="mx-4 w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <div className="mx-auto flex justify-center">
            <Logo variant="icon" size="md" asLink={false} />
          </div>

          {submitted ? (
            <div className="mt-6">
              <FormSuccess
                message="Your password has been updated successfully. You can now sign in with your new password."
                actionLabel="Sign In"
                actionHref="/auth/login"
              />
            </div>
          ) : (
            <>
              <div className="mt-6 flex items-center justify-center gap-2 text-purple-700">
                <ShieldCheck className="h-5 w-5" />
                <h1 className="text-center font-heading text-fluid-xl font-bold text-warm-900">
                  Set New Password
                </h1>
              </div>
              <p className="mt-2 text-center text-warm-500">
                Choose a strong password to protect your account
              </p>

              {error && (
                <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 pr-10"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Password requirements checklist */}
                  {password.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {PASSWORD_REQUIREMENTS.map((req) => {
                        const met = req.test(password);
                        return (
                          <li
                            key={req.label}
                            className={`flex items-center gap-2 text-xs ${
                              met ? "text-green-600" : "text-warm-400"
                            }`}
                          >
                            <span
                              className={`inline-block h-1.5 w-1.5 rounded-full ${
                                met ? "bg-green-500" : "bg-warm-300"
                              }`}
                            />
                            {req.label}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="pl-10"
                      autoComplete="new-password"
                    />
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-xs text-red-500">
                      Passwords do not match
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !allRequirementsMet || !passwordsMatch}
                  className="w-full bg-purple-700 text-white hover:bg-purple-800 disabled:opacity-50"
                >
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </>
          )}
        </div>

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
