"use client";

import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTable } from "@/components/admin/data-table";
import { FormDialog } from "@/components/admin/form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MOCK_MINISTRIES, MOCK_MINISTRY_MEMBERS } from "@/lib/mock-data";
import { FadeIn } from "@/components/motion/fade-in";
import { Eye } from "lucide-react";

// Map ministries to plain objects for DataTable compatibility
const ministriesData = MOCK_MINISTRIES.map((m) => {
  const ministryMembers = MOCK_MINISTRY_MEMBERS.filter(
    (mm) => mm.ministry_id === m.id
  );
  const approvedCount = ministryMembers.filter(
    (mm) => mm.status === "approved"
  ).length;
  const pendingCount = ministryMembers.filter(
    (mm) => mm.status === "pending"
  ).length;
  const manager = ministryMembers.find((mm) => mm.role === "manager");

  return {
    id: m.id,
    name: m.name,
    description: m.description,
    schedule: m.schedule ?? "",
    is_active: m.is_active,
    member_count: approvedCount,
    pending_count: pendingCount,
    manager_name: manager?.profile_name ?? "—",
  };
});

type MinistryRow = (typeof ministriesData)[number];

const columns = [
  {
    key: "name",
    label: "Name",
    sortable: true,
    render: (item: MinistryRow) => (
      <span className="font-medium text-warm-900 dark:text-warm-50">
        {item.name}
      </span>
    ),
  },
  {
    key: "description",
    label: "Description",
    render: (item: MinistryRow) => (
      <span className="text-sm text-warm-500 line-clamp-1 max-w-xs">
        {item.description}
      </span>
    ),
  },
  {
    key: "schedule",
    label: "Schedule",
    render: (item: MinistryRow) => (
      <span className="text-sm text-warm-600 dark:text-warm-300">
        {item.schedule}
      </span>
    ),
  },
  {
    key: "is_active",
    label: "Status",
    render: (item: MinistryRow) =>
      item.is_active ? (
        <Badge
          variant="outline"
          className="border-0 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
        >
          Active
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="border-0 bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
        >
          Inactive
        </Badge>
      ),
  },
  {
    key: "member_count",
    label: "Members",
    render: (item: MinistryRow) => (
      <span className="text-sm text-warm-600 dark:text-warm-300">
        {item.member_count}
      </span>
    ),
  },
  {
    key: "manager_name",
    label: "Manager",
    render: (item: MinistryRow) => (
      <span className="text-sm font-medium text-warm-700 dark:text-warm-200">
        {item.manager_name}
      </span>
    ),
  },
  {
    key: "pending_count",
    label: "Pending",
    render: (item: MinistryRow) =>
      item.pending_count > 0 ? (
        <Badge
          variant="outline"
          className="border-0 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
        >
          {item.pending_count} pending
        </Badge>
      ) : (
        <span className="text-sm text-warm-400">0</span>
      ),
  },
  {
    key: "actions",
    label: "View",
    render: (item: MinistryRow) => (
      <Link href={`/admin/ministries/${item.id}`}>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Eye className="h-3.5 w-3.5" />
          View
        </Button>
      </Link>
    ),
  },
];

export default function MinistryManagementPage() {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Ministries"
        description="Manage church ministries"
        action={
          <FormDialog title="Add Ministry" triggerLabel="Add Ministry">
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ministry_name">Name</Label>
                <Input id="ministry_name" placeholder="Ministry name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ministry_description">Description</Label>
                <Textarea
                  id="ministry_description"
                  placeholder="Describe this ministry..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ministry_schedule">Schedule</Label>
                <Input
                  id="ministry_schedule"
                  placeholder="e.g. Meets every Thursday at 7:00 PM"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-warm-200 p-3 dark:border-warm-700">
                <div>
                  <Label htmlFor="ministry_active" className="text-sm font-medium">
                    Active
                  </Label>
                  <p className="text-xs text-warm-500">
                    Ministry is visible to members
                  </p>
                </div>
                <Switch id="ministry_active" defaultChecked />
              </div>
              <Button
                type="submit"
                className="w-full bg-purple-700 hover:bg-purple-600 text-white"
              >
                Save Ministry
              </Button>
            </form>
          </FormDialog>
        }
      />

      <FadeIn>
        <DataTable
          data={ministriesData as unknown as Record<string, unknown>[]}
          columns={columns as Parameters<typeof DataTable>[0]["columns"]}
          searchable
          searchKeys={["name"]}
          pageSize={10}
        />
      </FadeIn>
    </div>
  );
}
