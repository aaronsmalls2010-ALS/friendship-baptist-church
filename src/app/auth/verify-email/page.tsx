"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

type VerifyState = "loading" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerifyState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function verifyEmail() {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (!tokenHash || type !== "email") {
        setState("error");
        setErrorMessage(
          "Invalid verification link. The link may be malformed or incomplete."
        );
        return;
      }

      try {
        const supabase = createClient();
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "email",
        });

        if (error) {
          setState("error");
          if (
            error.message.includes("expired") ||
            error.message.includes("invalid")
          ) {
            setErrorMessage(
              "This verification link has expired or is no longer valid. Please request a new one."
            );
          } else {
            setErrorMessage(
              error.message || "Verification failed. Please try again."
            );
          }
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

  function handleResendVerification() {
    window.location.href = "/auth/login";
  }

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
            Your account has been verified. You can now sign in.
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
          <Button
            onClick={handleResendVerification}
            className="mt-6 w-full bg-purple-700 text-white hover:bg-purple-800"
          >
            Resend Verification Email
          </Button>
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-950 via-purple-900 to-purple-800">
      <div className="mx-4 w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          {/* Logo */}
          <div className="mx-auto flex justify-center">
            <Logo variant="icon" size="md" asLink={false} />
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
