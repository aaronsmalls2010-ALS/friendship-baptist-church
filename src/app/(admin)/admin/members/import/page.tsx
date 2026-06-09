"use client";

import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Upload, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PreviewRow {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  role?: string;
  duplicate: boolean;
}

type Toast = { message: string; type: "success" | "error" } | null;

const EXAMPLE_CSV = `first_name,last_name,email,phone,role
John,Smith,john@example.com,8435551234,member
Jane,Doe,jane@example.com,8435555678,deacon`;

export default function MemberImportPage() {
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [imported, setImported] = useState<{ imported: number; skipped: number } | null>(null);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  }

  async function handlePreview() {
    if (!csv.trim()) return;
    setLoading(true);
    const res = await fetch("/api/admin/members/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv, preview: true }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setPreview(data.preview ?? []);
    } else {
      const data = await res.json();
      showToast(data.error ?? "Failed to parse CSV", "error");
    }
  }

  async function handleImport() {
    setLoading(true);
    const res = await fetch("/api/admin/members/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setImported({ imported: data.imported, skipped: data.skipped });
      setPreview(null);
      setCsv("");
      showToast(`Imported ${data.imported} members. ${data.skipped} skipped (duplicates).`);
    } else {
      const data = await res.json();
      showToast(data.error ?? "Import failed", "error");
    }
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div role="alert" className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg border ${
          toast.type === "success" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"
        }`}>
          {toast.type === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
          {toast.message}
        </div>
      )}

      <AdminPageHeader
        title="Import Members"
        description="Bulk import members from a CSV file"
        action={<Link href="/admin/members"><Button variant="outline" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Back to Members</Button></Link>}
      />

      {imported && (
        <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 p-4">
          <p className="font-medium text-green-800 dark:text-green-300">
            Import complete: {imported.imported} added, {imported.skipped} skipped
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="csvInput">CSV Data</Label>
          <p className="text-xs text-warm-500">
            Required columns: <code className="font-mono">first_name, last_name</code>. Optional: <code className="font-mono">email, phone, role</code>
          </p>
          <Textarea
            id="csvInput"
            value={csv}
            onChange={(e) => { setCsv(e.target.value); setPreview(null); }}
            placeholder={EXAMPLE_CSV}
            rows={8}
            className="font-mono text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePreview} disabled={!csv.trim() || loading} variant="outline">
            Preview ({loading ? "…" : "validate"})
          </Button>
          {preview && (
            <Button onClick={handleImport} disabled={loading}
              className="bg-purple-700 hover:bg-purple-600 text-white">
              <Upload className="mr-2 h-4 w-4" />
              Import {preview.filter((r) => !r.duplicate).length} Members
            </Button>
          )}
        </div>
      </div>

      {preview && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-warm-700 dark:text-warm-300">
            Preview — {preview.length} rows, {preview.filter((r) => r.duplicate).length} duplicates will be skipped
          </p>
          <div className="rounded-xl border border-warm-100 dark:border-warm-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-warm-50 dark:bg-warm-900">
                  <TableHead>Name</TableHead><TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((row, i) => (
                  <TableRow key={i} className={row.duplicate ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{row.first_name} {row.last_name}</TableCell>
                    <TableCell className="text-warm-500">{row.email ?? "—"}</TableCell>
                    <TableCell className="text-warm-500">{row.phone ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline">{row.role ?? "member"}</Badge></TableCell>
                    <TableCell>
                      {row.duplicate
                        ? <Badge variant="secondary">Duplicate — skip</Badge>
                        : <Badge className="bg-green-100 text-green-700 border-transparent">New</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
