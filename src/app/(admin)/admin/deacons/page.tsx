"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTable } from "@/components/admin/data-table";
import { FormDialog } from "@/components/admin/form-dialog";
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
import { MOCK_DEACONS, MOCK_WARDS, MOCK_PROFILES } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import type { Deacon } from "@/types";

export default function DeaconManagementPage() {
  const columns = [
    {
      key: "first_name",
      label: "Name",
      render: (item: Deacon) => (
        <span>
          {item.title && (
            <span className="text-xs text-gold-600 font-medium">{item.title} — </span>
          )}
          {item.first_name} {item.last_name}
        </span>
      ),
    },
    {
      key: "ward_name",
      label: "Ward",
      render: (item: Deacon) => <span>{item.ward_name ?? "—"}</span>,
    },
    {
      key: "phone",
      label: "Phone",
      render: (item: Deacon) => <span>{item.phone ?? "—"}</span>,
    },
    {
      key: "ordained_date",
      label: "Ordained",
      render: (item: Deacon) => (
        <span>{item.ordained_date ? formatDate(item.ordained_date) : "—"}</span>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      render: (item: Deacon) => (
        <Badge variant={item.is_active ? "default" : "secondary"}>
          {item.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Deacons"
        description="Manage deacon assignments"
        action={
          <FormDialog title="Assign Deacon" triggerLabel="Assign Deacon">
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="member">Member</Label>
                <Select>
                  <SelectTrigger id="member">
                    <SelectValue placeholder="Select a member" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_PROFILES.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.first_name} {profile.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ward">Ward</Label>
                <Select>
                  <SelectTrigger id="ward">
                    <SelectValue placeholder="Select a ward" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_WARDS.map((ward) => (
                      <SelectItem key={ward.id} value={ward.id}>
                        {ward.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ordained_date">Ordained Date</Label>
                <Input id="ordained_date" type="date" />
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
        data={MOCK_DEACONS as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Parameters<typeof DataTable>[0]["columns"]}
        searchable
        searchKeys={["first_name", "last_name", "ward_name"]}
      />
    </div>
  );
}
