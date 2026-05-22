"use client";

import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CTAButton } from "@/components/shared/cta-button";

interface FormSuccessProps {
  title?: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  onReset?: () => void;
  className?: string;
}

export function FormSuccess({
  title = "Thank You!",
  message,
  actionLabel,
  actionHref,
  onReset,
  className,
}: FormSuccessProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "flex flex-col items-center rounded-2xl bg-purple-50 p-8 text-center dark:bg-purple-950/30 lg:p-12",
        className
      )}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.15, type: "spring", stiffness: 200 }}
      >
        <CheckCircle className="h-16 w-16 text-purple-600" />
      </motion.div>

      <h3 className="mt-5 font-heading text-fluid-2xl font-bold text-warm-900 dark:text-warm-50">
        {title}
      </h3>

      <p className="mt-3 max-w-md text-warm-600 dark:text-warm-400">
        {message}
      </p>

      <div className="mt-6 flex gap-3">
        {actionLabel && actionHref && (
          <CTAButton href={actionHref} variant="primary" size="sm">
            {actionLabel}
          </CTAButton>
        )}
        {onReset && (
          <button
            onClick={onReset}
            className="rounded-lg px-4 py-2 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-100 dark:text-purple-300 dark:hover:bg-purple-900/30"
          >
            Submit Another
          </button>
        )}
      </div>
    </motion.div>
  );
}
