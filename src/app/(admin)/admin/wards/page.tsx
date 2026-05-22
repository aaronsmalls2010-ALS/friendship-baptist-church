"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTable } from "@/components/admin/data-table";
import { FormDialog } from "@/components/admin/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MOCK_WARDS, MOCK_DEACONS } from "@/lib/mock-data";
import type { Ward } from "@/types";

export default function WardManagementPage() {
  const deaconMap = new Map(
    MOCK_DEACONS.map((d) => [d.id, `${d.first_name} ${d.last_name}`])
  );

  const columns = [
    {
      key: "name",
      label: "Name",
    },
    {
      key: "description",
      label: "Description",
      render: (item: Ward) => item.description ?? "—",
    },
    {
      key: "deacon_id",
      label: "Deacon",
      render: (item: Ward) =>
        item.deacon_id ? deaconMap.get(item.deacon_id) ?? "—" : "—",
    },
    {
      key: "families_count",
      label: "Families",
      render: (item: Ward) => item.families_count ?? 0,
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Wards"
        description="Manage ward assignments"
        action={
          <FormDialog title="Create Ward" triggerLabel="Create Ward">
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Ward name" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Ward description" />
              </div>

              <Button
                type="button"
                className="w-full bg-purple-700 hover:bg-purple-600 text-white"
              >
                Save
              </Button>
            </form>
          </FormDialog>
        }
      />

      <DataTable
        data={MOCK_WARDS as unknown as Record<string, unknown>[]}
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        searchable
        searchKeys={["name"]}
      />
    </div>
  );
}
