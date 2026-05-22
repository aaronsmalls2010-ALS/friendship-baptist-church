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
import { MOCK_PROFILES } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { FadeIn } from "@/components/motion/fade-in";

// Map profiles to plain objects for DataTable compatibility
const membersData = MOCK_PROFILES.map((p) => ({
  id: p.id,
  first_name: p.first_name,
  last_name: p.last_name,
  name: `${p.first_name} ${p.last_name}`,
  email: p.email,
  role: p.role,
  phone: p.phone ?? "",
  created_at: p.created_at,
}));

const roleBadgeColors: Record<string, string> = {
  member: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  deacon: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  minister: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  admin: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  super_admin: "bg-red-200 text-red-900 dark:bg-red-900/60 dark:text-red-200",
};

type MemberRow = (typeof membersData)[number];

const columns = [
  {
    key: "name",
    label: "Name",
    sortable: true,
    render: (item: MemberRow) => (
      <span className="font-medium text-warm-900 dark:text-warm-50">
        {item.first_name} {item.last_name}
      </span>
    ),
  },
  {
    key: "email",
    label: "Email",
  },
  {
    key: "role",
    label: "Role",
    sortable: true,
    render: (item: MemberRow) => {
      const roleLabels: Record<string, string> = {
        member: "Member",
        deacon: "Deacon",
        minister: "Minister",
        admin: "Admin",
        super_admin: "Super Admin",
      };
      return (
        <Badge
          variant="outline"
          className={`border-0 ${roleBadgeColors[item.role] ?? ""}`}
        >
          {roleLabels[item.role] ?? item.role}
        </Badge>
      );
    },
  },
  {
    key: "phone",
    label: "Phone",
  },
  {
    key: "created_at",
    label: "Member Since",
    render: (item: MemberRow) => (
      <span className="text-sm text-warm-500">
        {formatDate(item.created_at)}
      </span>
    ),
  },
];

export default function MemberManagementPage() {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Members"
        description="Manage church membership"
        action={
          <FormDialog title="Add New Member" triggerLabel="Add Member">
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input id="first_name" placeholder="First name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="last_name" placeholder="Last name" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" placeholder="(843) 555-0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="deacon">Deacon</SelectItem>
                    <SelectItem value="minister">Minister</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="Street address" />
              </div>
              <Button
                type="submit"
                className="w-full bg-purple-700 hover:bg-purple-600 text-white"
              >
                Save Member
              </Button>
            </form>
          </FormDialog>
        }
      />

      <FadeIn>
        <DataTable
          data={membersData as unknown as Record<string, unknown>[]}
          columns={columns as Parameters<typeof DataTable>[0]["columns"]}
          searchable
          searchKeys={["first_name", "last_name", "email"]}
          pageSize={10}
        />
      </FadeIn>
    </div>
  );
}
