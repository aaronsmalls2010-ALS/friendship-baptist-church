"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { FadeIn } from "@/components/motion/fade-in";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Mail,
  KeyRound,
  Download,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

type Toast = { type: "success" | "error"; message: string } | null;

/** Mirror of the server-side password policy (reset-password/confirm). */
function passwordProblem(pw: string): string | null {
  if (pw.length < 12) return "Password must be at least 12 characters.";
  if (!/[A-Z]/.test(pw)) return "Password must contain an uppercase letter.";
  if (!/[a-z]/.test(pw)) return "Password must contain a lowercase letter.";
  if (!/[0-9]/.test(pw)) return "Password must contain a number.";
  if (!/[^A-Za-z0-9]/.test(pw)) return "Password must contain a special character.";
  return null;
}

export default function AccountSettingsPage() {
  const [toast, setToast] = useState<Toast>(null);

  // Current account email (for display / prefill)
  const [currentEmail, setCurrentEmail] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);

  // Email change
  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Data export
  const [exporting, setExporting] = useState(false);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
  }

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setCurrentEmail(data.user?.email ?? "");
      setLoadingUser(false);
    });
  }, []);

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    const email = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast("error", "Enter a valid email address.");
      return;
    }
    if (email === currentEmail.toLowerCase()) {
      showToast("error", "That is already your email address.");
      return;
    }
    setSavingEmail(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw new Error(error.message);
      showToast(
        "success",
        "Check your inbox — we sent a confirmation link to your new email address. Your email changes once you confirm it."
      );
      setNewEmail("");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Could not update email.");
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    const problem = passwordProblem(newPassword);
    if (problem) {
      showToast("error", problem);
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("error", "Passwords do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
      showToast("success", "Your password has been updated.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/portal/account/export");
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `friendship-baptist-my-data-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast("success", "Your data download has started.");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Could not export your data.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <FadeIn>
      <div className="space-y-6 px-4 py-6 max-w-2xl mx-auto">
        {toast && (
          <div
            role="alert"
            className={`fixed top-4 right-4 z-50 flex max-w-sm items-start gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg border ${
              toast.type === "success"
                ? "bg-green-50 text-green-800 border-green-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        <div>
          <h1 className="font-heading text-2xl font-bold text-warm-900 dark:text-warm-50 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-purple-500" /> Account &amp; Security
          </h1>
          <p className="text-warm-500 mt-1">
            Manage your sign-in email, password, and a copy of your data.
          </p>
        </div>

        {/* ── Change email ─────────────────────────────────────────── */}
        <Card className="p-6">
          <form onSubmit={handleChangeEmail} className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-purple-700" />
              <h2 className="font-heading text-lg font-bold text-warm-800 dark:text-warm-100">
                Email Address
              </h2>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentEmail">Current email</Label>
              <Input
                id="currentEmail"
                type="email"
                value={loadingUser ? "" : currentEmail}
                placeholder={loadingUser ? "Loading…" : ""}
                disabled
                className="bg-warm-50 text-warm-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newEmail">New email</Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
              <p className="text-xs text-warm-400">
                We&apos;ll email a confirmation link to the new address. Your email
                only changes after you click it.
              </p>
            </div>
            <Button
              type="submit"
              disabled={savingEmail || !newEmail.trim()}
              className="bg-purple-700 hover:bg-purple-600 text-white"
            >
              {savingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update email
            </Button>
          </form>
        </Card>

        {/* ── Change password ──────────────────────────────────────── */}
        <Card className="p-6">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-purple-700" />
              <h2 className="font-heading text-lg font-bold text-warm-800 dark:text-warm-100">
                Password
              </h2>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              <p className="text-xs text-warm-400">
                At least 12 characters with upper &amp; lowercase letters, a number,
                and a special character.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <Button
              type="submit"
              disabled={savingPassword || !newPassword || !confirmPassword}
              className="bg-purple-700 hover:bg-purple-600 text-white"
            >
              {savingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update password
            </Button>
          </form>
        </Card>

        {/* ── Download my data ─────────────────────────────────────── */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-purple-700" />
              <h2 className="font-heading text-lg font-bold text-warm-800 dark:text-warm-100">
                Download My Data
              </h2>
            </div>
            <p className="text-sm text-warm-500">
              Export a JSON copy of your profile, giving history, and event RSVPs.
              Only your own account data is included.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download my data (JSON)
            </Button>
          </div>
        </Card>
      </div>
    </FadeIn>
  );
}
