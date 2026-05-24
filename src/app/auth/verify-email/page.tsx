"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";

type VerifyState = "loading" | "success" | "already_verified" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerifyState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function verifyEmail() {
      const token = searchParams.get("token");

      if (!token) {
        setState("error");
        setErrorMessage(
          "Invalid verification link. The link may be malformed or incomplete."
        );
        return;
      }

      try {
        const response = await fetch(
          `/api/auth/verify-email?token=${encodeURIComponent(token)}`
        );
        const data = await response.json();

        if (!response.ok) {
          setState("error");
          setErrorMessage(
            data.error || "Verification failed. Please try again."
          );
          return;
        }

        if (data.alreadyVerified) {
          setState("already_verified");
          return;
        }

        setState("success");
      } catch {
        setState("error");
        setErrorMessage(
          "An unexpected error occurred during verification. Please try again."
        );
      }
    }

    verifyEmail();
  }, [searchParams]);

  return (
    <>
      {/* Loading State */}
      {state === "loading" && (
        <div className="mt-8 flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
          <h1 className="mt-4 text-center font-heading text-fluid-xl font-bold text-warm-900">
            Verifying Your Email...
          </h1>
          <p className="mt-2 text-center text-warm-500">
            Please wait while we verify your email address.
          </p>
        </div>
      )}

      {/* Success State */}
      {state === "success" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="mt-8 flex flex-col items-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 0.3,
              delay: 0.15,
              type: "spring",
              stiffness: 200,
            }}
          >
            <CheckCircle className="h-16 w-16 text-green-500" />
          </motion.div>
          <h1 className="mt-4 text-center font-heading text-fluid-xl font-bold text-warm-900">
            Email Verified!
          </h1>
          <p className="mt-2 text-center text-warm-500">
            Your email address has been verified successfully.
          </p>

          {/* Pending Approval Notice */}
          <div className="mt-6 w-full rounded-xl bg-amber-50 border border-amber-200 p-4">
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-900">
                  Pending Admin Approval
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  Your account is now awaiting approval from a church
                  administrator. You will receive an email notification once
                  your account has been approved and is ready to use.
                </p>
              </div>
            </div>
          </div>

          <Link href="/" className="mt-6 w-full">
            <Button className="w-full bg-purple-700 text-white hover:bg-purple-800">
              Return to Website
            </Button>
          </Link>
        </motion.div>
      )}

      {/* Already Verified State */}
      {state === "already_verified" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="mt-8 flex flex-col items-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 0.3,
              delay: 0.15,
              type: "spring",
              stiffness: 200,
            }}
          >
            <CheckCircle className="h-16 w-16 text-green-500" />
          </motion.div>
          <h1 className="mt-4 text-center font-heading text-fluid-xl font-bold text-warm-900">
            Already Verified
          </h1>
          <p className="mt-2 text-center text-warm-500">
            Your email address has already been verified. If your account has
            been approved, you can sign in below.
          </p>
          <Link href="/auth/login" className="mt-6 w-full">
            <Button className="w-full bg-purple-700 text-white hover:bg-purple-800">
              Go to Sign In
            </Button>
          </Link>
        </motion.div>
      )}

      {/* Error State */}
      {state === "error" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="mt-8 flex flex-col items-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 0.3,
              delay: 0.15,
              type: "spring",
              stiffness: 200,
            }}
          >
            <XCircle className="h-16 w-16 text-red-500" />
          </motion.div>
          <h1 className="mt-4 text-center font-heading text-fluid-xl font-bold text-warm-900">
            Verification Failed
          </h1>
          <p className="mt-2 text-center text-warm-500">{errorMessage}</p>
          <Link href="/contact" className="mt-6 w-full">
            <Button className="w-full bg-purple-700 text-white hover:bg-purple-800">
              Contact the Church Office
            </Button>
          </Link>
        </motion.div>
      )}
    </>
  );
}

function VerifyEmailFallback() {
  return (
    <div className="mt-8 flex flex-col items-center">
      <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      <h1 className="mt-4 text-center font-heading text-fluid-xl font-bold text-warm-900">
        Loading...
      </h1>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-950 via-purple-900 to-purple-800">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      }
    >
      <VerifyEmailPageContent />
    </Suspense>
  );
}

function VerifyEmailPageContent() {
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

          <VerifyEmailContent />
        </div>

        {/* Below card text */}
        <p className="mt-6 text-center text-sm text-white/60">
          Need help?{" "}
          <Link
            href="/contact"
            className="text-gold-300 hover:text-gold-200 hover:underline"
          >
            Contact the church office
          </Link>
        </p>
      </div>
    </div>
  );
}
