"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/motion/fade-in";
import { Download, Users, Church, MapPin, DollarSign, AlertTriangle, Loader2 } from "lucide-react";

interface Member { id: string; first_name: string; last_name: string; email: string; phone?: string; role: string; status?: string; created_at: string; }
interface Ministry { id: string; name: string; description?: string; ministry_members?: { count: number }[]; }
interface Ward { id: string; name: string; profiles?: { id: string; first_name: string; last_name: string; role: string }[]; }
interface Donation { id: string; amount: number; donation_type: string; created_at: string; profiles?: { first_name: string; last_name: string } | null; donation_types?: { name: string } | null; }
interface LapsedGiver { id: string; first_name: string; last_name: string; email: string; phone?: string; }

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);
}

export default function ReportsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [lapsed, setLapsed] = useState<LapsedGiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFinance, setIsFinance] = useState(false);

  // Filters
  const [giveFrom, setGiveFrom] = useState("");
  const [giveTo, setGiveTo] = useState("");
  const [selectedMinistry, setSelectedMinistry] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const [memRes, minRes, wardRes, donRes, lapsedRes] = await Promise.allSettled([
      fetch("/api/admin/reports?type=members"),
      fetch("/api/admin/reports?type=ministries"),
      fetch("/api/admin/reports?type=wards"),
      fetch("/api/admin/reports?type=giving"),
      fetch("/api/admin/reports?type=lapsed"),
    ]);

    if (memRes.status === "fulfilled" && memRes.value.ok) setMembers((await memRes.value.json()).members ?? []);
    if (minRes.status === "fulfilled" && minRes.value.ok) setMinistries((await minRes.value.json()).ministries ?? []);
    if (wardRes.status === "fulfilled" && wardRes.value.ok) setWards((await wardRes.value.json()).wards ?? []);
    if (donRes.status === "fulfilled") {
      if (donRes.value.ok) { setDonations((await donRes.value.json()).donations ?? []); setIsFinance(true); }
    }
    if (lapsedRes.status === "fulfilled" && lapsedRes.value.ok) setLapsed((await lapsedRes.value.json()).lapsed ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function exportCsv(type: string, extra = "") {
    const params = new URLSearchParams({ type, format: "csv" });
    if (type === "giving") { if (giveFrom) params.set("from", giveFrom); if (giveTo) params.set("to", giveTo); }
    if (extra) params.append("extra", extra);
    window.location.href = `/api/admin/reports?${params}`;
  }

  function exportRoster() {
    const params = new URLSearchParams({ format: "csv" });
    if (selectedMinistry !== "all") params.set("ministry_id", selectedMinistry);
    window.location.href = `/api/admin/reports/ministry-roster?${params}`;
  }

  const totalGiving = donations.reduce((s, d) => s + d.amount, 0);
  const avgGift = donations.length ? totalGiving / donations.length : 0;

  if (loading) return (
    <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Reports" description="Church activity reports with CSV export" />

      <FadeIn>
        <Tabs defaultValue="members" className="space-y-6">
          <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-warm-100 dark:bg-warm-800">
            <TabsTrigger value="members"><Users className="mr-1.5 h-4 w-4" />Members</TabsTrigger>
            <TabsTrigger value="ministries"><Church className="mr-1.5 h-4 w-4" />Ministries</TabsTrigger>
            <TabsTrigger value="wards"><MapPin className="mr-1.5 h-4 w-4" />Wards</TabsTrigger>
            {isFinance && <TabsTrigger value="giving"><DollarSign className="mr-1.5 h-4 w-4" />Giving</TabsTrigger>}
            {isFinance && <TabsTrigger value="lapsed"><AlertTriangle className="mr-1.5 h-4 w-4" />Lapsed Givers</TabsTrigger>}
          </TabsList>

          {/* Members */}
          <TabsContent value="members" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-warm-500">{members.length} members total</p>
              <Button variant="outline" size="sm" onClick={() => exportCsv("members")}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </div>
            <div className="rounded-xl border border-warm-100 dark:border-warm-800 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-warm-50 dark:bg-warm-900">
                    <TableHead>Name</TableHead><TableHead>Email</TableHead>
                    <TableHead>Role</TableHead><TableHead>Status</TableHead>
                    <TableHead>Since</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.first_name} {m.last_name}</TableCell>
                      <TableCell className="text-warm-500">{m.email}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{m.role?.replace("_", " ")}</Badge></TableCell>
                      <TableCell><Badge variant={m.status === "active" ? "default" : "secondary"} className="capitalize">{m.status ?? "active"}</Badge></TableCell>
                      <TableCell className="text-warm-500">{String(m.created_at).split("T")[0]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Ministries */}
          <TabsContent value="ministries" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-warm-500">{ministries.length} ministries</p>
              <div className="flex gap-2 items-center">
                <Select value={selectedMinistry} onValueChange={setSelectedMinistry}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="All ministries" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All ministries</SelectItem>
                    {ministries.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={exportRoster}>
                  <Download className="mr-2 h-4 w-4" /> Export Roster
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ministries.map((m) => (
                <Card key={m.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{m.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-warm-500">{m.description ?? "No description"}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Wards */}
          <TabsContent value="wards" className="space-y-4">
            <p className="text-sm text-warm-500">{wards.length} wards</p>
            <div className="space-y-4">
              {wards.map((ward) => {
                const profiles = ward.profiles as { id: string; first_name: string; last_name: string; role: string }[] | null ?? [];
                return (
                  <Card key={ward.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        {ward.name}
                        <Badge variant="secondary">{profiles.length} members</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {profiles.slice(0, 9).map((p) => (
                          <div key={p.id} className="text-sm text-warm-700 dark:text-warm-300">
                            {p.first_name} {p.last_name}
                          </div>
                        ))}
                        {profiles.length > 9 && <div className="text-xs text-warm-400">+{profiles.length - 9} more</div>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Giving */}
          {isFinance && (
            <TabsContent value="giving" className="space-y-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="space-y-1">
                  <Label htmlFor="gFrom">From</Label>
                  <Input id="gFrom" type="date" className="w-36" value={giveFrom} onChange={(e) => setGiveFrom(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="gTo">To</Label>
                  <Input id="gTo" type="date" className="w-36" value={giveTo} onChange={(e) => setGiveTo(e.target.value)} />
                </div>
                <Button variant="outline" size="sm" onClick={() => exportCsv("giving")}>
                  <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Total Giving", value: formatCurrency(totalGiving) },
                  { label: "Average Gift", value: formatCurrency(avgGift) },
                  { label: "Donations", value: String(donations.length) },
                ].map(({ label, value }) => (
                  <Card key={label}>
                    <CardContent className="pt-4">
                      <p className="text-sm text-warm-500">{label}</p>
                      <p className="text-2xl font-bold text-warm-900 dark:text-warm-50">{value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="rounded-xl border border-warm-100 dark:border-warm-800 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-warm-50 dark:bg-warm-900">
                      <TableHead>Date</TableHead><TableHead>Donor</TableHead>
                      <TableHead>Type</TableHead><TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donations.slice(0, 50).map((d) => {
                      const p = d.profiles as { first_name: string; last_name: string } | null;
                      const t = d.donation_types as { name: string } | null;
                      return (
                        <TableRow key={d.id}>
                          <TableCell className="text-warm-500">{String(d.created_at).split("T")[0]}</TableCell>
                          <TableCell>{p ? `${p.first_name} ${p.last_name}` : "Anonymous"}</TableCell>
                          <TableCell><Badge variant="outline">{t?.name ?? d.donation_type}</Badge></TableCell>
                          <TableCell className="font-medium">{formatCurrency(d.amount)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}

          {/* Lapsed Givers */}
          {isFinance && (
            <TabsContent value="lapsed" className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-warm-900 dark:text-warm-50">At-Risk Givers</p>
                  <p className="text-sm text-warm-500">Gave in the past 12 months but nothing in the last 90 days</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => exportCsv("lapsed")}>
                  <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
              </div>
              {lapsed.length === 0 ? (
                <p className="text-center py-8 text-warm-400">No lapsed givers found.</p>
              ) : (
                <div className="rounded-xl border border-warm-100 dark:border-warm-800 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-warm-50 dark:bg-warm-900">
                        <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lapsed.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">{m.first_name} {m.last_name}</TableCell>
                          <TableCell className="text-warm-500">{m.email}</TableCell>
                          <TableCell className="text-warm-500">{m.phone ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </FadeIn>
    </div>
  );
}
