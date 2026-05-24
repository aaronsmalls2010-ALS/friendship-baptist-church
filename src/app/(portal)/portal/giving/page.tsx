"use client";

import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";
import { CTAButton } from "@/components/shared/cta-button";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, HandHeart, Loader2 } from "lucide-react";

function formatDonationType(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function GivingHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [sortedDonations, setSortedDonations] = useState<any[]>([]);
  const [yearToDate, setYearToDate] = useState(0);
  const [thisMonth, setThisMonth] = useState(0);
  const [lastGift, setLastGift] = useState<any>(null);

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
        <div className="flex justify-center">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Download Giving Statement
          </Button>
        </div>
      </FadeIn>
    </div>
  );
}
