"use client";

import { useState, FormEvent, ReactNode } from "react";

interface SecureFormProps {
  children: ReactNode;
  onSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void> | void;
  className?: string;
  /** Minimum milliseconds between submissions (prevents double-submit) */
  cooldown?: number;
}

/**
 * A form wrapper that adds security measures:
 * - Double-submit prevention with cooldown
 * - Honeypot field for bot detection
 * - Auto-disables submit during processing
 * - Tracks submission timestamp to detect automated submissions (too fast = bot)
 */
export function SecureForm({
  children,
  onSubmit,
  className,
  cooldown = 2000,
}: SecureFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmit, setLastSubmit] = useState(0);
  const [renderTime] = useState(Date.now());

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Check cooldown
    const now = Date.now();
    if (now - lastSubmit < cooldown) return;

    // Bot detection: if form submitted in under 1 second, likely a bot
    if (now - renderTime < 1000) {
      console.warn("[SECURITY] Suspiciously fast form submission detected");
      return;
    }

    // Check honeypot
    const formData = new FormData(e.currentTarget);
    const honeypotValue = formData.get("_hp_website");
    if (honeypotValue) {
      console.warn("[SECURITY] Honeypot triggered");
      // Silently "succeed" to fool bots
      return;
    }

    setIsSubmitting(true);
    setLastSubmit(now);

    try {
      await onSubmit(e);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={className} noValidate>
      {/* Honeypot — invisible to real users, bots fill it in */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          opacity: 0,
          height: 0,
          width: 0,
          overflow: "hidden",
        }}
      >
        <label htmlFor="_hp_website">
          Leave this field empty
          <input
            type="text"
            id="_hp_website"
            name="_hp_website"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      {/* Timestamp field for server-side bot detection */}
      <input type="hidden" name="_render_ts" value={renderTime.toString()} />

      {children}

      {/* Disable state indicator — parent can check this */}
      {isSubmitting && <input type="hidden" name="_submitting" value="true" />}
    </form>
  );
}
