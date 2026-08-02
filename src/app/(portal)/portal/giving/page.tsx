"use client";

import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";
import { CTAButton } from "@/components/shared/cta-button";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, HandHeart, Loader2, Target, CheckCircle, XCircle } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  goal_amount: number | null;
  total_received: number;
}

function formatDonationType(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function currency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function pct(part: number, whole: number | null): number {
  if (!whole || whole <= 0) return 0;
  return Math.min(100, Math.round((part / whole) * 100));
}

export default function GivingHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [sortedDonations, setSortedDonations] = useState<any[]>([]);
  const [yearToDate, setYearToDate] = useState(0);
  const [thisMonth, setThisMonth] = useState(0);
  const [lastGift, setLastGift] = useState<any>(null);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pledgeTarget, setPledgeTarget] = useState<Campaign | null>(null);
  const [pledgeAmount, setPledgeAmount] = useState("");
  const [pledgeNote, setPledgeNote] = useState("");
  const [pledgeSaving, setPledgeSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function loadCampaigns() {
    try {
      const res = await fetch("/api/portal/campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
    }
  }

  function openPledge(campaign: Campaign) {
    setPledgeTarget(campaign);
    setPledgeAmount("");
    setPledgeNote("");
  }

  async function submitPledge(e: React.FormEvent) {
    e.preventDefault();
    if (!pledgeTarget) return;
    const amount = Number(pledgeAmount);
    if (!amount || amount <= 0) {
      showToast("Enter a valid pledge amount", "error");
      return;
    }
    setPledgeSaving(true);
    try {
      const res = await fetch("/api/portal/pledges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: pledgeTarget.id,
          amount,
          note: pledgeNote.trim() || null,
        }),
      });
      if (res.ok) {
        showToast("Thank you! Your pledge has been recorded.");
        setPledgeTarget(null);
      } else {
        const json = await res.json().catch(() => ({}));
        showToast(json.error ?? "Failed to record pledge", "error");
      }
    } catch {
      showToast("Failed to record pledge", "error");
    } finally {
      setPledgeSaving(false);
    }
  }

  useEffect(() => {
    async function fetchGiving() {
      try {
        const res = await fetch("/api/portal/giving");
        if (res.ok) {
          const data = await res.json();
          const donations = data.donations || [];

          // Sort donations by date descending
          const sorted = [...donations].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setSortedDonations(sorted);

          // Compute YTD total
          const ytd = donations.reduce((sum: number, d: any) => sum + d.amount, 0);
          setYearToDate(ytd);

          // Compute this month total
          const now = new Date();
          const monthTotal = donations
            .filter((d: any) => {
              const date = new Date(d.date);
              return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            })
            .reduce((sum: number, d: any) => sum + d.amount, 0);
          setThisMonth(monthTotal);

          // Last gift
          setLastGift(sorted[0] || null);
        }
      } catch (error) {
        console.error("Failed to fetch giving data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchGiving();
    loadCampaigns();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-fluid-3xl font-bold text-warm-900">
              Giving History
            </h1>
            <p className="text-warm-500 mt-1">
              View your donation history and manage recurring gifts
            </p>
          </div>
          <CTAButton href="/give" variant="primary" size="md" icon={<HandHeart className="h-5 w-5" />}>
            Quick Give
          </CTAButton>
        </div>
      </FadeIn>

      {/* Summary Cards */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-sm text-warm-500">Year-to-Date</p>
            <p className="text-fluid-2xl font-bold text-purple-700 mt-1">
              ${yearToDate.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-sm text-warm-500">This Month</p>
            <p className="text-fluid-2xl font-bold text-purple-700 mt-1">
              ${thisMonth.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-sm text-warm-500">Last Gift</p>
            <p className="text-fluid-2xl font-bold text-purple-700 mt-1">
              ${lastGift ? lastGift.amount.toLocaleString() : 0}
            </p>
            {lastGift && (
              <p className="text-xs text-warm-400 mt-1">
                {formatDate(lastGift.date)}
              </p>
            )}
          </div>
        </div>
      </FadeIn>

      {/* Active Campaigns */}
      {campaigns.length > 0 && (
        <FadeIn delay={0.15}>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-700" />
              <h2 className="font-heading text-lg font-semibold text-warm-900">
                Active Campaigns
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {campaigns.map((c) => {
                const progress = pct(c.total_received, c.goal_amount);
                return (
                  <div key={c.id} className="bg-white rounded-xl p-6 shadow-sm flex flex-col">
                    <h3 className="font-heading text-base font-semibold text-warm-900">
                      {c.name}
                    </h3>
                    {c.description && (
                      <p className="mt-1 text-sm text-warm-500">{c.description}</p>
                    )}

                    {/* Thermometer */}
                    <div className="mt-4">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xl font-bold text-purple-700">
                          {currency(c.total_received)}
                        </span>
                        {c.goal_amount != null && (
                          <span className="text-sm text-warm-400">
                            of {currency(c.goal_amount)} goal
                          </span>
                        )}
                      </div>
                      <div
                        className="mt-2 h-3 w-full overflow-hidden rounded-full bg-warm-100"
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${c.name} progress`}
                      >
                        <div
                          className="h-full rounded-full bg-purple-600 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      {c.goal_amount != null && (
                        <p className="mt-1 text-xs text-warm-400">{progress}% funded</p>
                      )}
                    </div>

                    <Button
                      className="mt-4 w-full bg-purple-700 hover:bg-purple-600 text-white"
                      onClick={() => openPledge(c)}
                    >
                      <HandHeart className="mr-2 h-4 w-4" />
                      Make a pledge
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Giving History Table */}
      <FadeIn delay={0.2}>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-warm-100">
            <h2 className="font-heading text-lg font-semibold text-warm-900">
              Donation History
            </h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Recurring</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedDonations.map((donation, index) => (
                <TableRow
                  key={donation.id}
                  className={index % 2 === 1 ? "bg-warm-50/50" : ""}
                >
                  <TableCell className="text-warm-700">
                    {formatDate(donation.date)}
                  </TableCell>
                  <TableCell className="font-semibold text-warm-900">
                    ${donation.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-warm-700">
                    {formatDonationType(donation.donation_type)}
                  </TableCell>
                  <TableCell className="text-warm-500">
                    {donation.campaign || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={donation.is_recurring ? "default" : "secondary"}
                      className={
                        donation.is_recurring
                          ? "bg-purple-100 text-purple-700 hover:bg-purple-100"
                          : "bg-warm-100 text-warm-500 hover:bg-warm-100"
                      }
                    >
                      {donation.is_recurring ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </FadeIn>

      {/* Download Statement */}
      <FadeIn delay={0.3}>
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-warm-500">Download your year-end contribution statement for tax purposes</p>
          <div className="flex items-center gap-2">
            {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map((yr) => (
              <Button key={yr} variant="outline" className="gap-2"
                onClick={() => window.open(`/api/portal/giving/statement?year=${yr}`, "_blank")}>
                <Download className="h-4 w-4" />
                {yr} Statement
              </Button>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Pledge Dialog */}
      <Dialog open={pledgeTarget !== null} onOpenChange={(open) => !open && setPledgeTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              Pledge to {pledgeTarget?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submitPledge} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="pledgeAmount">Pledge Amount ($) *</Label>
              <Input
                id="pledgeAmount"
                type="number"
                min="1"
                step="0.01"
                value={pledgeAmount}
                onChange={(e) => setPledgeAmount(e.target.value)}
                placeholder="e.g. 250"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pledgeNote">Note (optional)</Label>
              <Textarea
                id="pledgeNote"
                value={pledgeNote}
                onChange={(e) => setPledgeNote(e.target.value)}
                placeholder="Anything you'd like the church to know"
                rows={3}
              />
            </div>
            <p className="text-xs text-warm-500">
              A pledge is a commitment to give. You can fulfill it through your normal giving.
            </p>
            <Button
              type="submit"
              disabled={pledgeSaving}
              className="w-full bg-purple-700 hover:bg-purple-600 text-white"
            >
              {pledgeSaving ? "Submitting…" : "Submit Pledge"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {toast && (
        <div
          role="alert"
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}
