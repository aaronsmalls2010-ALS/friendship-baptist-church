"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    console.log("Login attempt:", { email });
    // Simulate brief loading
    setTimeout(() => {
      setIsLoading(false);
      alert("Authentication is not connected yet. This is a preview of the login page.");
    }, 800);
  }

  function handleMagicLink() {
    if (!email) {
      alert("Please enter your email address first.");
      return;
    }
    console.log("Magic link requested for:", email);
    alert("Magic link authentication is not connected yet.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-950 via-purple-900 to-purple-800">
      <div className="mx-4 w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          {/* Logo */}
          <div className="mx-auto flex justify-center">
            <Logo variant="full" size="lg" asLink={false} />
          </div>

          {/* Title */}
          <h1 className="mt-6 text-center font-heading text-fluid-xl font-bold text-warm-900">
            Welcome Back
          </h1>
          <p className="mt-2 text-center text-warm-500">
            Sign in to your member portal
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

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
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
              disabled={isLoading}
              className="w-full bg-purple-700 text-white hover:bg-purple-800"
            >
              {isLoading ? "Signing in..." : "Sign In"}
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
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Sign in with Magic Link
            </Button>
          </form>
        </div>

        {/* Below card text */}
        <p className="mt-6 text-center text-sm text-white/60">
          New here? Contact the church office at{" "}
          <a href="tel:+18435240634" className="underline hover:text-white/80">
            (843) 524-0634
          </a>
        </p>
      </div>
    </div>
  );
}
