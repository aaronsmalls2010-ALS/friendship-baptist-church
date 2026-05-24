"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Download, DollarSign, TrendingUp, Users, Loader2 } from "lucide-react";
import type { Donation } from "@/types";

type Row = Record<string, unknown>;

function formatDonationType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function DonationManagementPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Data fetching ─────────────────────────────────────────────────
  async function loadData() {
    try {
      const res = await fetch("/api/admin/donations");
      const data = await res.json();
      setDonations(data.donations ?? []);
    } catch (err) {
      console.error("Failed to load donations:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // ── Computed stats ────────────────────────────────────────────────
  const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
  const averageGift = donations.length > 0 ? Math.round(totalDonations / donations.length) : 0;
  const recurringDonors = donations.filter((d) => d.is_recurring).length;

  // ── Column definitions ────────────────────────────────────────────
  const columns = [
    {
      key: "donor_name",
      label: "Donor",
      render: (row: Row) => {
        const item = row as unknown as Donation;
        return (item as unknown as { donor_name?: string }).donor_name || "Anonymous";
      },
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (row: Row) => {
        const item = row as unknown as Donation;
        return `$${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
      },
    },
    {
      key: "donation_type",
      label: "Type",
      render: (row: Row) =>
        formatDonationType((row as unknown as Donation).donation_type),
    },
    {
      key: "campaign",
      label: "Campaign",
      render: (row: Row) => (row as unknown as Donation).campaign || "—",
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (row: Row) => formatDate((row as unknown as Donation).date),
    },
    {
      key: "is_recurring",
      label: "Recurring",
      render: (row: Row) => {
        const item = row as unknown as Donation;
        return item.is_recurring ? (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-transparent">
            Recurring
          </Badge>
        ) : (
          <Badge variant="outline" className="text-warm-500">
            One-time
          </Badge>
        );
      },
    },
  ];

  // ── Loading state ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Donations"
        description="View and manage giving records"
      />

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-warm-100 dark:border-warm-800 bg-white dark:bg-warm-950 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
              <DollarSign className="h-5 w-5 text-purple-700 dark:text-purple-300" />
            </div>
            <div>
              <p className="text-sm text-warm-500 dark:text-warm-400">
                Total Donations
              </p>
              <p className="text-2xl font-bold text-warm-900 dark:text-warm-50">
                ${totalDonations.toLocaleString("en-US")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-warm-100 dark:border-warm-800 bg-white dark:bg-warm-950 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-100 dark:bg-gold-900">
              <TrendingUp className="h-5 w-5 text-gold-700 dark:text-gold-300" />
            </div>
            <div>
              <p className="text-sm text-warm-500 dark:text-warm-400">
                Average Gift
              </p>
              <p className="text-2xl font-bold text-warm-900 dark:text-warm-50">
                ${averageGift.toLocaleString("en-US")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-warm-100 dark:border-warm-800 bg-white dark:bg-warm-950 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-peach-100 dark:bg-peach-900">
              <Users className="h-5 w-5 text-peach-700 dark:text-peach-300" />
            </div>
            <div>
              <p className="text-sm text-warm-500 dark:text-warm-400">
                Recurring Donors
              </p>
              <p className="text-2xl font-bold text-warm-900 dark:text-warm-50">
                {recurringDonors}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Donations Table */}
      <DataTable
        data={donations as unknown as Record<string, unknown>[]}
        columns={columns}
        searchable
        searchKeys={["donation_type"]}
      />

      {/* Export Button */}
      <Button variant="outline" disabled>
        <Download className="mr-2 h-4 w-4" />
        Export Report
      </Button>
    </div>
  );
}
