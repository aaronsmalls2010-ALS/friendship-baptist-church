"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search,
  Loader2,
  KeyRound,
  LogIn,
  LogOut,
  ShieldCheck,
  X,
} from "lucide-react";

interface ChildLite {
  id: string;
  first_name: string;
  last_name: string;
  grade: string | null;
  allergies: string | null;
  guardian_name: string | null;
}

interface CheckedInChild {
  id: string; // attendance_records id
  child_id: string;
  security_code: string;
  checked_in_at: string | null;
  children: { first_name: string; last_name: string; grade: string | null; allergies: string | null } | null;
}

/**
 * Child check-in / pickup board for a single attendance session.
 * - Search all children and check them in (reveals a pickup security code).
 * - See who's currently checked in with their codes.
 * - Check a child out by entering the matching security code (verified server-side).
 */
export function ChildCheckInPanel({ sessionId }: { sessionId: string }) {
  const [children, setChildren] = useState<ChildLite[]>([]);
  const [checkedIn, setCheckedIn] = useState<CheckedInChild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Inline checkout verification: which child is being checked out + entry.
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [checkoutCode, setCheckoutCode] = useState("");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [cRes, kRes] = await Promise.all([
          fetch("/api/admin/children"),
          fetch(`/api/admin/attendance/${sessionId}/checkin`),
        ]);
        if (!cRes.ok || !kRes.ok) throw new Error("load failed");
        const cData = await cRes.json();
        const kData = await kRes.json();
        if (!active) return;
        setChildren(cData.children ?? []);
        setCheckedIn(kData.children ?? []);
      } catch (err) {
        console.error("Failed to load child check-in data:", err);
        if (active) setError("We couldn't load the children list. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [sessionId]);

  const checkedInIds = useMemo(
    () => new Set(checkedIn.map((c) => c.child_id)),
    [checkedIn]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return children.filter((c) => {
      if (checkedInIds.has(c.id)) return false; // hide already-checked-in
      if (!term) return true;
      return `${c.first_name} ${c.last_name} ${c.guardian_name ?? ""}`
        .toLowerCase()
        .includes(term);
    });
  }, [children, checkedInIds, search]);

  async function handleCheckIn(child: ChildLite) {
    setBusyId(child.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/attendance/${sessionId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ child_id: child.id }),
      });
      if (!res.ok) throw new Error("check-in failed");
      const data = await res.json();
      setCheckedIn((prev) => [...prev, data.record as CheckedInChild]);
      setSearch("");
    } catch (err) {
      console.error("Child check-in failed:", err);
      setError("We couldn't check that child in. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  function beginCheckout(childId: string) {
    setCheckoutId(childId);
    setCheckoutCode("");
    setCheckoutError(null);
  }

  function cancelCheckout() {
    setCheckoutId(null);
    setCheckoutCode("");
    setCheckoutError(null);
  }

  async function confirmCheckout(childId: string) {
    if (!checkoutCode.trim()) {
      setCheckoutError("Enter the security code.");
      return;
    }
    setBusyId(childId);
    setCheckoutError(null);
    try {
      const res = await fetch(`/api/admin/attendance/${sessionId}/checkin`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ child_id: childId, security_code: checkoutCode.trim() }),
      });
      if (res.status === 403) {
        setCheckoutError("That code doesn't match. Please try again.");
        return;
      }
      if (!res.ok) throw new Error("checkout failed");
      setCheckedIn((prev) => prev.filter((c) => c.child_id !== childId));
      cancelCheckout();
    } catch (err) {
      console.error("Child checkout failed:", err);
      setCheckoutError("We couldn't check that child out. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Currently checked in */}
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-warm-700 dark:text-warm-200">
          <ShieldCheck className="h-4 w-4 text-purple-600" />
          Checked in
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            {checkedIn.length}
          </span>
        </div>

        {checkedIn.length === 0 ? (
          <p className="rounded-lg border border-dashed border-warm-200 py-6 text-center text-sm text-warm-400 dark:border-warm-800">
            No children checked in yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {checkedIn.map((c) => {
              const name = c.children
                ? `${c.children.first_name} ${c.children.last_name}`
                : "Child";
              const isCheckingOut = checkoutId === c.child_id;
              return (
                <li
                  key={c.id}
                  className="rounded-lg border border-warm-100 bg-warm-50/60 p-3 dark:border-warm-800 dark:bg-warm-800/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-warm-900 dark:text-warm-50">
                        {name}
                      </p>
                      {c.children?.allergies && (
                        <p className="truncate text-xs text-red-600 dark:text-red-400">
                          Allergies: {c.children.allergies}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-purple-700 px-2.5 py-1 font-mono text-sm font-bold tracking-widest text-white">
                        <KeyRound className="h-3.5 w-3.5" />
                        {c.security_code}
                      </span>
                      {!isCheckingOut && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => beginCheckout(c.child_id)}
                        >
                          <LogOut className="mr-1.5 h-3.5 w-3.5" />
                          Check out
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Inline pickup verification */}
                  {isCheckingOut && (
                    <div className="mt-3 rounded-lg border border-purple-200 bg-white p-3 dark:border-purple-900/40 dark:bg-warm-900">
                      <Label
                        htmlFor={`checkout-${c.child_id}`}
                        className="text-xs text-warm-600 dark:text-warm-300"
                      >
                        Enter the guardian&rsquo;s security code to release {name}
                      </Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input
                          id={`checkout-${c.child_id}`}
                          value={checkoutCode}
                          onChange={(e) => setCheckoutCode(e.target.value.toUpperCase())}
                          placeholder="e.g. AB2C"
                          maxLength={4}
                          autoComplete="off"
                          className="h-9 w-28 font-mono uppercase tracking-widest"
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="h-9 bg-purple-700 hover:bg-purple-600 text-white"
                          disabled={busyId === c.child_id}
                          onClick={() => confirmCheckout(c.child_id)}
                        >
                          {busyId === c.child_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Confirm pickup"
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0"
                          onClick={cancelCheckout}
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {checkoutError && (
                        <p role="alert" className="mt-2 text-xs text-red-600">
                          {checkoutError}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Add a child */}
      <div>
        <div className="mb-2 text-sm font-medium text-warm-700 dark:text-warm-200">
          Check in a child
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
          <Input
            placeholder="Search children by name or guardian…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-warm-100 dark:border-warm-800">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-warm-400">
              {children.length === 0
                ? "No children on file yet."
                : "No children match your search."}
            </p>
          ) : (
            <ul className="divide-y divide-warm-100 dark:divide-warm-800">
              {filtered.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-warm-800 dark:text-warm-100">
                      {c.first_name} {c.last_name}
                      {c.grade && (
                        <span className="ml-2 text-xs text-warm-400">{c.grade}</span>
                      )}
                    </p>
                    {c.guardian_name && (
                      <p className="truncate text-xs text-warm-400">
                        Guardian: {c.guardian_name}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 shrink-0"
                    disabled={busyId === c.id}
                    onClick={() => handleCheckIn(c)}
                  >
                    {busyId === c.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <LogIn className="mr-1.5 h-3.5 w-3.5" />
                        Check in
                      </>
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
