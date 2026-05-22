"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSuccess } from "@/components/shared/form-success";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";
import { signUpSchema, type SignUpFormData } from "@/lib/validations/auth";
import {
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState<SignUpFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false as unknown as true,
    honeypot: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function updateField(field: keyof SignUpFormData, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError("");
    setFieldErrors({});

    // Validate with Zod
    const result = signUpSchema.safeParse(formData);
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
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: result.data.email,
          password: result.data.password,
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          phone: result.data.phone || "",
          honeypot: result.data.honeypot || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSuccess(true);
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-950 via-purple-900 to-purple-800 py-8">
      <div className="mx-4 w-full max-w-lg">
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

          {success ? (
            <div className="mt-6">
              <FormSuccess
                title="Account Created!"
                message="Welcome to the Friendship Baptist Church family! Your account is ready. You can now sign in and explore your member portal."
                actionLabel="Go to Login"
                actionHref="/auth/login"
              />
            </div>
          ) : (
            <>
              {/* Title */}
              <h1 className="mt-6 text-center font-heading text-fluid-xl font-bold text-warm-900">
                Create Your Account
              </h1>
              <p className="mt-2 text-center text-warm-500">
                Join our church family online
              </p>

              {/* Server error */}
              {serverError && (
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{serverError}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {/* Honeypot - hidden from real users */}
                <div
                  className="absolute opacity-0"
                  style={{ position: "absolute", left: "-9999px" }}
                  aria-hidden="true"
                >
                  <label htmlFor="website">Website</label>
                  <input
                    type="text"
                    id="website"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={formData.honeypot}
                    onChange={(e) => updateField("honeypot", e.target.value)}
                  />
                </div>

                {/* First + Last Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => updateField("firstName", e.target.value)}
                      aria-invalid={!!fieldErrors.firstName}
                    />
                    {fieldErrors.firstName && (
                      <p className="text-xs text-red-600">
                        {fieldErrors.firstName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Smith"
                      value={formData.lastName}
                      onChange={(e) => updateField("lastName", e.target.value)}
                      aria-invalid={!!fieldErrors.lastName}
                    />
                    {fieldErrors.lastName && (
                      <p className="text-xs text-red-600">
                        {fieldErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="pl-10"
                      aria-invalid={!!fieldErrors.email}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-xs text-red-600">{fieldErrors.email}</p>
                  )}
                </div>

                {/* Phone (optional) */}
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone{" "}
                    <span className="text-warm-400">(optional)</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(843) 555-0123"
                      value={formData.phone || ""}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      className="pl-10 pr-10"
                      aria-invalid={!!fieldErrors.password}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600"
                      tabIndex={-1}
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
                  {fieldErrors.password && (
                    <p className="text-xs text-red-600">
                      {fieldErrors.password}
                    </p>
                  )}
                  <PasswordStrengthMeter password={formData.password} />
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        updateField("confirmPassword", e.target.value)
                      }
                      className="pl-10 pr-10"
                      aria-invalid={!!fieldErrors.confirmPassword}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600"
                      tabIndex={-1}
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-xs text-red-600">
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Terms checkbox */}
                <div className="space-y-1">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="acceptTerms"
                      checked={formData.acceptTerms === true}
                      onCheckedChange={(checked) =>
                        updateField("acceptTerms", checked === true)
                      }
                      className="mt-0.5"
                    />
                    <label
                      htmlFor="acceptTerms"
                      className="text-sm leading-snug text-warm-600"
                    >
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        className="text-purple-600 hover:text-purple-700 hover:underline"
                        target="_blank"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="text-purple-600 hover:text-purple-700 hover:underline"
                        target="_blank"
                      >
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                  {fieldErrors.acceptTerms && (
                    <p className="text-xs text-red-600">
                      {fieldErrors.acceptTerms}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-purple-700 text-white hover:bg-purple-800"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </>
          )}
        </div>

        {/* Below card text */}
        <p className="mt-6 text-center text-sm text-white/60">
          Already have an account?{" "}
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
