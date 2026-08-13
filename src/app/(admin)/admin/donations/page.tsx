"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTable } from "@/components/admin/data-table";
import { FormDialog } from "@/components/admin/form-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import {
  Download,
  DollarSign,
  TrendingUp,
  Users,
  Loader2,
  CheckCircle,
  XCircle,
  Ban,
  RotateCcw,
  ExternalLink,
  CreditCard,
  Banknote,
} from "lucide-react";

const STRIPE_DASHBOARD = "https://dashboard.stripe.com/payments";

function MethodBadge({ method }: { method: string | null }) {
  if (method === "stripe")
    return (
      <Badge className="gap-1 border-transparent bg-indigo-100 text-indigo-700">
        <CreditCard className="h-3 w-3" /> Online
      </Badge>
    );
  if (method === "check")
    return <Badge variant="outline" className="gap-1 text-warm-600"><Banknote className="h-3 w-3" /> Check</Badge>;
  if (method === "cash")
    return <Badge variant="outline" className="gap-1 text-warm-600"><Banknote className="h-3 w-3" /> Cash</Badge>;
  return <Badge variant="outline" className="text-warm-500">{method ? method[0].toUpperCase() + method.slice(1) : "—"}</Badge>;
}

interface DonationType { id: string; name: string; slug: string; }
interface Donation {
  id: string;
  amount: number;
  donation_type: string;
  donation_type_id: string | null;
  campaign: string | null;
  date: string;
  created_at: string;
  is_recurring: boolean;
  archived_at: string | null;
  profile_id: string | null;
  method: string | null;
  stripe_payment_id: string | null;
  note: string | null;
  refunded_amount: number | null;
  refund_status: "none" | "partial" | "full" | null;
  refunded_at: string | null;
  metadata: Record<string, unknown> | null;
  profiles: { first_name: string; last_name: string } | null;
  donation_types: { name: string; slug: string } | null;
}

type Toast = { message: string; type: "success" | "error" } | null;
type Row = Record<string, unknown>;

export default function DonationManagementPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [donationTypes, setDonationTypes] = useState<DonationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast>(null);

  // Filters
  const [filterDonor, setFilterDonor] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterRecurring, setFilterRecurring] = useState("all");

  // Record gift dialog
  const [recordOpen, setRecordOpen] = useState(false);
  const [rAmount, setRAmount] = useState("");
  const [rTypeId, setRTypeId] = useState("");
  const [rDonor, setRDonor] = useState("");
  const [rCampaign, setRCampaign] = useState("");
  const [rDate, setRDate] = useState(new Date().toISOString().split("T")[0]);
  const [rMethod, setRMethod] = useState("cash");
  const [rCheck, setRCheck] = useState("");
  const [rNote, setRNote] = useState("");
  const [rSaving, setRSaving] = useState(false);

  // Void dialog
  const [voidTarget, setVoidTarget] = useState<Donation | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [voidSaving, setVoidSaving] = useState(false);

  // Refund dialog
  const [refundTarget, setRefundTarget] = useState<Donation | null>(null);
  const [refundFull, setRefundFull] = useState(true);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundSaving, setRefundSaving] = useState(false);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterDonor)   params.set("donor", filterDonor);
    if (filterFrom)    params.set("from", filterFrom);
    if (filterTo)      params.set("to", filterTo);
    if (filterType !== "all") params.set("type", filterType);
    if (filterRecurring !== "all") params.set("recurring", filterRecurring);

    const [donRes, typeRes] = await Promise.all([
      fetch(`/api/admin/donations?${params}`),
      fetch("/api/admin/donation-types"),
    ]);
    if (donRes.ok) setDonations((await donRes.json()).donations ?? []);
    if (typeRes.ok) setDonationTypes((await typeRes.json()).types ?? []);
    setLoading(false);
  }, [filterDonor, filterFrom, filterTo, filterType, filterRecurring]);

  useEffect(() => { loadData(); }, [loadData]);

  // Stats
  const totalDonations = donations.reduce((s, d) => s + d.amount, 0);
  const totalRefunded = donations.reduce((s, d) => s + (d.refunded_amount ?? 0), 0);
  const netDonations = totalDonations - totalRefunded;
  const averageGift = donations.length > 0 ? Math.round(totalDonations / donations.length) : 0;
  const recurringCount = donations.filter((d) => d.is_recurring).length;

  async function handleRecord(e: React.FormEvent) {
    e.preventDefault();
    setRSaving(true);
    const res = await fetch("/api/admin/donations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parseFloat(rAmount),
        donation_type_id: rTypeId || null,
        campaign: rCampaign || null,
        date: rDate,
        method: rMethod,
        check_number: rCheck || null,
        note: rNote || null,
      }),
    });
    setRSaving(false);
    if (res.ok) {
      showToast("Gift recorded");
      setRecordOpen(false);
      setRAmount(""); setRTypeId(""); setRDonor(""); setRCampaign("");
      setRDate(new Date().toISOString().split("T")[0]); setRMethod("cash"); setRCheck(""); setRNote("");
      loadData();
    } else {
      const json = await res.json();
      showToast(json.error ?? "Failed to record gift", "error");
    }
  }

  async function handleVoid() {
    if (!voidTarget) return;
    setVoidSaving(true);
    const res = await fetch(`/api/admin/donations/${voidTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ void: true, reason: voidReason }),
    });
    setVoidSaving(false);
    if (res.ok) {
      showToast("Donation voided");
      setVoidTarget(null); setVoidReason("");
      loadData();
    } else {
      const json = await res.json();
      showToast(json.error ?? "Failed to void", "error");
    }
  }

  function openRefund(d: Donation) {
    const remaining = d.amount - (d.refunded_amount ?? 0);
    setRefundTarget(d);
    setRefundFull(true);
    setRefundAmount(remaining.toFixed(2));
    setRefundReason("");
  }

  async function handleRefund(e: React.FormEvent) {
    e.preventDefault();
    if (!refundTarget) return;
    setRefundSaving(true);
    const res = await fetch(`/api/admin/donations/${refundTarget.id}/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: refundReason,
        ...(refundFull ? {} : { amount: parseFloat(refundAmount) }),
      }),
    });
    setRefundSaving(false);
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.ok) {
      showToast(json.refund_status === "full" ? "Gift fully refunded" : "Partial refund issued");
      setRefundTarget(null);
      setRefundReason("");
      loadData();
    } else {
      showToast(json.error ?? "Refund failed", "error");
    }
  }

  function handleExport() {
    const params = new URLSearchParams();
    if (filterFrom) params.set("from", filterFrom);
    if (filterTo)   params.set("to", filterTo);
    if (filterType !== "all") params.set("type", filterType);
    window.location.href = `/api/admin/donations/export?${params}`;
  }

  const columns = [
    {
      key: "donor",
      label: "Donor",
      render: (row: Row) => {
        const d = row as unknown as Donation;
        const p = d.profiles;
        return p ? `${p.first_name} ${p.last_name}` : "Anonymous";
      },
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (row: Row) => {
        const d = row as unknown as Donation;
        const gross = `$${d.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
        const refunded = d.refunded_amount ?? 0;
        const feeCents = Number(d.metadata?.fee_covered_cents) || 0;
        return (
          <div>
            <div className="flex items-center gap-2">
              <span className={refunded > 0 && d.refund_status === "full" ? "text-warm-400 line-through" : ""}>{gross}</span>
              {refunded > 0 && (
                <Badge className="border-transparent bg-amber-100 text-amber-700">
                  {d.refund_status === "full" ? "Refunded" : `−$${refunded.toFixed(2)}`}
                </Badge>
              )}
            </div>
            {feeCents > 0 && (
              <div className="text-[11px] text-warm-400">
                donor covered ${(feeCents / 100).toFixed(2)} fee
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "type",
      label: "Type",
      render: (row: Row) => {
        const d = row as unknown as Donation;
        return d.donation_types?.name ?? d.donation_type?.split("_").map((w: string) => w[0].toUpperCase() + w.slice(1)).join(" ") ?? "—";
      },
    },
    {
      key: "campaign",
      label: "Campaign",
      render: (row: Row) => (row as unknown as Donation).campaign ?? "—",
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (row: Row) => {
        const d = row as unknown as Donation;
        return formatDate(d.date ?? d.created_at);
      },
    },
    {
      key: "method",
      label: "Method",
      render: (row: Row) => {
        const d = row as unknown as Donation;
        return (
          <div className="flex items-center gap-1.5">
            <MethodBadge method={d.method} />
            {d.method === "stripe" && d.stripe_payment_id && (
              <a
                href={`${STRIPE_DASHBOARD}/${d.stripe_payment_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-500 hover:text-indigo-700"
                title="View in Stripe"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "",
      render: (row: Row) => {
        const d = row as unknown as Donation;
        const canRefund =
          d.method === "stripe" && !!d.stripe_payment_id && d.refund_status !== "full" && !d.archived_at;
        return (
          <div className="flex gap-1">
            {canRefund && (
              <Button variant="ghost" size="sm" onClick={() => openRefund(d)}
                aria-label="Refund gift" title="Refund this gift through Stripe (full or partial)"
                className="text-amber-600 hover:text-amber-700">
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setVoidTarget(d)}
              aria-label="Void donation" title="Void — remove from reports, kept for audit"
              className="text-red-500 hover:text-red-700">
              <Ban className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div role="alert"
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}>
          {toast.type === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
          {toast.message}
        </div>
      )}

      <AdminPageHeader
        title="Donations"
        description="View and manage giving records"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <FormDialog title="Record Gift" triggerLabel="Record Gift" open={recordOpen} onOpenChange={setRecordOpen}>
              <form onSubmit={handleRecord} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rAmount">Amount *</Label>
                    <Input id="rAmount" type="number" min="0.01" step="0.01" required
                      value={rAmount} onChange={(e) => setRAmount(e.target.value)} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rDate">Date *</Label>
                    <Input id="rDate" type="date" required value={rDate} onChange={(e) => setRDate(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rType">Donation Type *</Label>
                  <Select value={rTypeId} onValueChange={setRTypeId} required>
                    <SelectTrigger id="rType"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {donationTypes.filter(t => (t as unknown as { is_active: boolean }).is_active !== false).map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rMethod">Method</Label>
                    <Select value={rMethod} onValueChange={setRMethod}>
                      <SelectTrigger id="rMethod"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {rMethod === "check" && (
                    <div className="space-y-2">
                      <Label htmlFor="rCheck">Check #</Label>
                      <Input id="rCheck" value={rCheck} onChange={(e) => setRCheck(e.target.value)} placeholder="Optional" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rCampaign">Campaign</Label>
                  <Input id="rCampaign" value={rCampaign} onChange={(e) => setRCampaign(e.target.value)} placeholder="Optional" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rNote">Note</Label>
                  <Textarea id="rNote" value={rNote} onChange={(e) => setRNote(e.target.value)} rows={2} placeholder="Optional" />
                </div>
                <Button type="submit" disabled={rSaving || !rAmount || !rTypeId}
                  className="w-full bg-purple-700 hover:bg-purple-600 text-white">
                  {rSaving ? "Saving…" : "Record Gift"}
                </Button>
              </form>
            </FormDialog>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end rounded-xl border border-warm-100 dark:border-warm-800 bg-white dark:bg-warm-950 p-4">
        <div className="space-y-1">
          <Label htmlFor="fDonor">Donor</Label>
          <Input id="fDonor" className="w-44" placeholder="Search name…"
            value={filterDonor} onChange={(e) => setFilterDonor(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="fFrom">From</Label>
          <Input id="fFrom" type="date" className="w-36"
            value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="fTo">To</Label>
          <Input id="fTo" type="date" className="w-36"
            value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="fType">Type</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger id="fType" className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {donationTypes.map((t) => <SelectItem key={t.id} value={t.slug}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="fRec">Recurring</Label>
          <Select value={filterRecurring} onValueChange={setFilterRecurring}>
            <SelectTrigger id="fRec" className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Recurring</SelectItem>
              <SelectItem value="false">One-time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: DollarSign, color: "purple", label: totalRefunded > 0 ? "Net Donations" : "Total Donations", value: `$${netDonations.toLocaleString("en-US")}` },
          { icon: TrendingUp, color: "gold", label: "Average Gift", value: `$${averageGift.toLocaleString("en-US")}` },
          { icon: Users, color: "peach", label: "Recurring Donors", value: String(recurringCount) },
        ].map(({ icon: Icon, color, label, value }) => (
          <div key={label} className="rounded-xl border border-warm-100 dark:border-warm-800 bg-white dark:bg-warm-950 p-6">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-${color}-100 dark:bg-${color}-900`}>
                <Icon className={`h-5 w-5 text-${color}-700 dark:text-${color}-300`} />
              </div>
              <div>
                <p className="text-sm text-warm-500 dark:text-warm-400">{label}</p>
                <p className="text-2xl font-bold text-warm-900 dark:text-warm-50">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <DataTable
        data={donations as unknown as Record<string, unknown>[]}
        columns={columns}
        searchable={false}
      />

      {/* Void confirmation */}
      <Dialog open={!!voidTarget} onOpenChange={(o) => { if (!o) { setVoidTarget(null); setVoidReason(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Void Donation</DialogTitle>
            <DialogDescription>
              This soft-deletes the donation — removed from reports but preserved for audit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="voidReason">Reason *</Label>
            <Textarea id="voidReason" rows={2}
              value={voidReason} onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Why is this being voided?" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setVoidTarget(null); setVoidReason(""); }}>
              Cancel
            </Button>
            <Button disabled={voidSaving || !voidReason.trim()} onClick={handleVoid}
              className="bg-red-600 hover:bg-red-700 text-white">
              {voidSaving ? "Voiding…" : "Void Donation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund dialog */}
      <Dialog open={!!refundTarget} onOpenChange={(o) => { if (!o) { setRefundTarget(null); setRefundReason(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Refund Gift</DialogTitle>
            <DialogDescription>
              This refunds the donor through Stripe. A reason is required and the action is audited.
            </DialogDescription>
          </DialogHeader>
          {refundTarget && (() => {
            const remaining = refundTarget.amount - (refundTarget.refunded_amount ?? 0);
            return (
              <form onSubmit={handleRefund} className="space-y-4 pt-2">
                <div className="rounded-lg bg-warm-50 p-3 text-sm text-warm-600 dark:bg-warm-800/50 dark:text-warm-300">
                  {refundTarget.profiles
                    ? `${refundTarget.profiles.first_name} ${refundTarget.profiles.last_name}`
                    : "Anonymous"}{" "}
                  · ${refundTarget.amount.toFixed(2)} gift
                  {(refundTarget.refunded_amount ?? 0) > 0 && (
                    <> · ${remaining.toFixed(2)} left to refund</>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Refund amount</Label>
                  <div className="flex gap-2">
                    <Button type="button" variant={refundFull ? "default" : "outline"}
                      className={refundFull ? "bg-purple-700 text-white" : ""}
                      onClick={() => { setRefundFull(true); setRefundAmount(remaining.toFixed(2)); }}>
                      Full (${remaining.toFixed(2)})
                    </Button>
                    <Button type="button" variant={!refundFull ? "default" : "outline"}
                      className={!refundFull ? "bg-purple-700 text-white" : ""}
                      onClick={() => setRefundFull(false)}>
                      Partial
                    </Button>
                  </div>
                  {!refundFull && (
                    <Input type="number" min="0.01" max={remaining} step="0.01" required
                      value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder="Amount to refund" />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="refundReason">Reason *</Label>
                  <Textarea id="refundReason" rows={2} required
                    value={refundReason} onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Why is this being refunded?" />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => { setRefundTarget(null); setRefundReason(""); }}>
                    Cancel
                  </Button>
                  <Button type="submit"
                    disabled={refundSaving || !refundReason.trim() || (!refundFull && !(parseFloat(refundAmount) > 0))}
                    className="bg-amber-600 hover:bg-amber-700 text-white">
                    {refundSaving ? "Refunding…" : "Issue Refund"}
                  </Button>
                </DialogFooter>
              </form>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
