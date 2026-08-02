"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Printer, Users, DollarSign } from "lucide-react";

interface DonorSummary {
  profile_id: string;
  name: string;
  email: string | null;
  total: number;
  count: number;
}

function currency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

export default function StatementsPage() {
  const [year, setYear] = useState<number>(CURRENT_YEAR);
  const [donors, setDonors] = useState<DonorSummary[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/statements?year=${year}`);
    if (res.ok) {
      const json = await res.json();
      setDonors(json.donors ?? []);
      setGrandTotal(json.grandTotal ?? 0);
    } else {
      setDonors([]);
      setGrandTotal(0);
    }
    setLoading(false);
  }, [year]);

  useEffect(() => {
    load();
  }, [load]);

  function viewStatement(profileId: string) {
    window.open(
      `/api/admin/statements?year=${year}&profile_id=${profileId}&format=print`,
      "_blank"
    );
  }

  function printAll() {
    window.open(`/api/admin/statements?year=${year}&format=print`, "_blank");
  }

  const columns = [
    { key: "name", label: "Donor", sortable: true },
    {
      key: "email",
      label: "Email",
      render: (d: DonorSummary) => (
        <span className="text-sm text-warm-500">{d.email ?? "—"}</span>
      ),
    },
    {
      key: "count",
      label: "Gifts",
      sortable: true,
      render: (d: DonorSummary) => (
        <span className="text-warm-700 dark:text-warm-300">{d.count}</span>
      ),
    },
    {
      key: "total",
      label: "Annual Total",
      sortable: true,
      render: (d: DonorSummary) => (
        <span className="font-semibold text-warm-900 dark:text-warm-50">
          {currency(d.total)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (d: DonorSummary) => (
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => viewStatement(d.profile_id)}
        >
          <FileText className="h-4 w-4" />
          View statement
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Year-End Statements"
        description="Generate annual contribution statements for tax purposes"
        action={
          <div className="flex items-center gap-3">
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-[120px]" aria-label="Statement year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="gap-2 bg-purple-700 hover:bg-purple-600 text-white"
              onClick={printAll}
              disabled={donors.length === 0}
            >
              <Printer className="h-4 w-4" />
              Print all
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-warm-100 dark:border-warm-800 bg-white dark:bg-warm-900 p-5">
          <div className="flex items-center gap-2 text-warm-500">
            <Users className="h-4 w-4" />
            <span className="text-sm">Donors ({year})</span>
          </div>
          <p className="mt-1 text-fluid-2xl font-bold text-warm-900 dark:text-warm-50">
            {donors.length}
          </p>
        </div>
        <div className="rounded-xl border border-warm-100 dark:border-warm-800 bg-white dark:bg-warm-900 p-5">
          <div className="flex items-center gap-2 text-warm-500">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">Total Contributions ({year})</span>
          </div>
          <p className="mt-1 text-fluid-2xl font-bold text-purple-700">
            {currency(grandTotal)}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-warm-500">Loading…</div>
      ) : (
        <DataTable
          data={donors as unknown as Record<string, unknown>[]}
          columns={columns as Parameters<typeof DataTable>[0]["columns"]}
          searchable
          searchKeys={["name", "email"]}
        />
      )}
    </div>
  );
}
