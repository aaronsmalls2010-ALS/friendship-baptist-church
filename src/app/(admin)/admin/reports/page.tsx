"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FadeIn } from "@/components/motion/fade-in";
import {
  MOCK_PROFILES,
  MOCK_MINISTRIES,
  MOCK_MINISTRY_MEMBERS,
  MOCK_WARDS,
  MOCK_DEACONS,
  MOCK_DONATIONS,
} from "@/lib/mock-data";
import {
  Printer,
  Users,
  Church,
  MapPin,
  DollarSign,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

function getDeaconNameForWard(wardId: string): string {
  const ward = MOCK_WARDS.find((w) => w.id === wardId);
  const matched = MOCK_DEACONS.filter((d) => {
    if (d.ward_id === wardId) return true;
    if (d.ward_name && ward) return d.ward_name.includes(ward.name);
    return false;
  });
  if (matched.length === 0) return "Unassigned";
  return matched
    .map((d) => {
      const prefix = d.title ? `${d.title} ` : "";
      return `${prefix}${d.first_name} ${d.last_name}`;
    })
    .join(", ");
}

// ── Member Report Data ───────────────────────────────────────────────

function getMemberReportData() {
  return MOCK_PROFILES.map((p) => {
    const donations = MOCK_DONATIONS.filter((d) => d.profile_id === p.id);
    const givingTotal = donations.reduce((sum, d) => sum + d.amount, 0);

    const ministryMemberships = MOCK_MINISTRY_MEMBERS.filter(
      (mm) => mm.profile_id === p.id && mm.status === "approved"
    );
    const ministryNames = ministryMemberships
      .map((mm) => mm.ministry_name)
      .filter(Boolean);

    const wardName =
      p.ward_id
        ? MOCK_WARDS.find((w) => w.id === p.ward_id)?.name ?? "—"
        : "Unassigned";

    return {
      id: p.id,
      name: `${p.first_name} ${p.last_name}`,
      email: p.email,
      role: p.role,
      givingTotal,
      ministryCount: ministryMemberships.length,
      ministryNames,
      wardName,
    };
  });
}

// ── Ministry Report Data ─────────────────────────────────────────────

function getMinistryReportData() {
  return MOCK_MINISTRIES.map((m) => {
    const members = MOCK_MINISTRY_MEMBERS.filter(
      (mm) => mm.ministry_id === m.id
    );
    const approvedCount = members.filter((mm) => mm.status === "approved").length;
    const pendingCount = members.filter((mm) => mm.status === "pending").length;
    const deniedCount = members.filter((mm) => mm.status === "denied").length;

    const leader = MOCK_PROFILES.find((p) => p.id === m.leader_id);
    const leaderName = leader
      ? `${leader.first_name} ${leader.last_name}`
      : "—";

    return {
      id: m.id,
      name: m.name,
      leaderName,
      isActive: m.is_active,
      totalMembers: members.length,
      approvedCount,
      pendingCount,
      deniedCount,
      schedule: m.schedule ?? "—",
    };
  });
}

// ── Ward Report Data ─────────────────────────────────────────────────

function getWardReportData() {
  return MOCK_WARDS.map((w) => {
    const deaconName = getDeaconNameForWard(w.id);
    const members = MOCK_PROFILES.filter((p) => p.ward_id === w.id);

    return {
      id: w.id,
      name: w.name,
      description: w.description ?? "—",
      deaconName,
      familiesCount: w.families_count ?? 0,
      memberCount: members.length,
      members,
    };
  });
}

// ── Page Component ───────────────────────────────────────────────────

export default function ReportsPage() {
  const memberData = getMemberReportData();
  const ministryData = getMinistryReportData();
  const wardData = getWardReportData();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Reports"
        description="Generate and view reports by member, ministry, or ward"
        action={
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
        }
      />

      <FadeIn>
        <Tabs defaultValue="members" className="space-y-4">
          <TabsList className="bg-warm-100 dark:bg-warm-800">
            <TabsTrigger
              value="members"
              className="data-[state=active]:bg-purple-700 data-[state=active]:text-white"
            >
              <Users className="h-4 w-4 mr-1.5" />
              By Member
            </TabsTrigger>
            <TabsTrigger
              value="ministries"
              className="data-[state=active]:bg-purple-700 data-[state=active]:text-white"
            >
              <Church className="h-4 w-4 mr-1.5" />
              By Ministry
            </TabsTrigger>
            <TabsTrigger
              value="wards"
              className="data-[state=active]:bg-purple-700 data-[state=active]:text-white"
            >
              <MapPin className="h-4 w-4 mr-1.5" />
              By Ward
            </TabsTrigger>
          </TabsList>

          {/* ── Member Report Tab ──────────────────────────────────── */}
          <TabsContent value="members">
            <div className="rounded-xl border border-warm-100 dark:border-warm-800 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-warm-50 dark:bg-warm-900">
                    <TableHead className="font-medium">Name</TableHead>
                    <TableHead className="font-medium">Email</TableHead>
                    <TableHead className="font-medium">Role</TableHead>
                    <TableHead className="font-medium">Ward</TableHead>
                    <TableHead className="font-medium">Ministries</TableHead>
                    <TableHead className="font-medium text-right">
                      <span className="inline-flex items-center">
                        <DollarSign className="h-3.5 w-3.5 mr-0.5" />
                        Giving Total
                      </span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberData.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <span className="font-medium text-warm-900 dark:text-warm-50">
                          {member.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-warm-600 dark:text-warm-400 text-sm">
                        {member.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-0 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 capitalize"
                        >
                          {member.role.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-warm-600 dark:text-warm-400">
                        {member.wardName}
                      </TableCell>
                      <TableCell>
                        {member.ministryNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {member.ministryNames.map((name) => (
                              <Badge
                                key={name}
                                variant="outline"
                                className="border-0 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-xs"
                              >
                                {name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-warm-400">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {member.givingTotal > 0 ? (
                          <span className="text-green-700 dark:text-green-400">
                            {formatCurrency(member.givingTotal)}
                          </span>
                        ) : (
                          <span className="text-warm-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-3 text-sm text-warm-500">
              Total members: {memberData.length} | Total giving:{" "}
              <span className="font-medium text-green-700 dark:text-green-400">
                {formatCurrency(
                  memberData.reduce((sum, m) => sum + m.givingTotal, 0)
                )}
              </span>
            </div>
          </TabsContent>

          {/* ── Ministry Report Tab ────────────────────────────────── */}
          <TabsContent value="ministries">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ministryData.map((ministry) => (
                <div
                  key={ministry.id}
                  className="rounded-xl border border-warm-100 dark:border-warm-800 bg-white dark:bg-warm-900 p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-heading font-semibold text-warm-900 dark:text-warm-50">
                      {ministry.name}
                    </h3>
                    <Badge
                      variant="outline"
                      className={`border-0 text-xs ${
                        ministry.isActive
                          ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-warm-100 text-warm-500"
                      }`}
                    >
                      {ministry.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <p className="text-sm text-warm-500">
                    Leader: <span className="text-warm-700 dark:text-warm-300">{ministry.leaderName}</span>
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-lg font-bold text-purple-700 dark:text-purple-400">
                        {ministry.totalMembers}
                      </p>
                      <p className="text-xs text-warm-500">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-700 dark:text-green-400">
                        {ministry.approvedCount}
                      </p>
                      <p className="text-xs text-warm-500">Approved</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                        {ministry.pendingCount}
                      </p>
                      <p className="text-xs text-warm-500">Pending</p>
                    </div>
                    {ministry.deniedCount > 0 && (
                      <div className="text-center">
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                          {ministry.deniedCount}
                        </p>
                        <p className="text-xs text-warm-500">Denied</p>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-warm-400">{ministry.schedule}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 text-sm text-warm-500">
              Total ministries: {ministryData.length} | Total approved members:{" "}
              {ministryData.reduce((sum, m) => sum + m.approvedCount, 0)}
            </div>
          </TabsContent>

          {/* ── Ward Report Tab ────────────────────────────────────── */}
          <TabsContent value="wards">
            <div className="space-y-4">
              {wardData.map((ward) => (
                <div
                  key={ward.id}
                  className="rounded-xl border border-warm-100 dark:border-warm-800 bg-white dark:bg-warm-900 p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="font-heading font-semibold text-warm-900 dark:text-warm-50">
                        {ward.name}
                      </h3>
                      <p className="text-sm text-warm-500">{ward.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className="border-0 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                      >
                        {ward.familiesCount} families
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-0 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      >
                        <Users className="h-3 w-3 mr-1" />
                        {ward.memberCount} members
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-warm-600 dark:text-warm-400">
                    Deacon:{" "}
                    <span className="font-medium text-purple-700 dark:text-purple-400">
                      {ward.deaconName}
                    </span>
                  </p>

                  {ward.members.length > 0 && (
                    <div className="border-t border-warm-100 dark:border-warm-800 pt-3">
                      <p className="text-xs font-semibold text-warm-500 uppercase mb-2">
                        Assigned Members
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {ward.members.map((m) => (
                          <Badge
                            key={m.id}
                            variant="outline"
                            className="border-warm-200 dark:border-warm-700 text-warm-700 dark:text-warm-300"
                          >
                            {m.first_name} {m.last_name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 text-sm text-warm-500">
              Total wards: {wardData.length} | Total families:{" "}
              {wardData.reduce((sum, w) => sum + w.familiesCount, 0)}
            </div>
          </TabsContent>
        </Tabs>
      </FadeIn>
    </div>
  );
}
