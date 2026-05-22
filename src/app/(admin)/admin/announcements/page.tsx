"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTable } from "@/components/admin/data-table";
import { FormDialog } from "@/components/admin/form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_ANNOUNCEMENTS } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import type { Announcement } from "@/types";

export default function AnnouncementManagementPage() {
  const columns = [
    {
      key: "title",
      label: "Title",
      sortable: true,
    },
    {
      key: "start_date",
      label: "Start Date",
      render: (item: Announcement) => formatDate(item.start_date),
    },
    {
      key: "end_date",
      label: "End Date",
      render: (item: Announcement) =>
        item.end_date ? formatDate(item.end_date) : "—",
    },
    {
      key: "is_pinned",
      label: "Pinned",
      render: (item: Announcement) => (
        <Badge variant={item.is_pinned ? "default" : "secondary"}>
          {item.is_pinned ? "Pinned" : "No"}
        </Badge>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (item: Announcement) =>
        item.category ? (
          <Badge variant="outline" className="capitalize">
            {item.category}
          </Badge>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Announcements"
        description="Manage church announcements"
        action={
          <FormDialog
            title="Create Announcement"
            triggerLabel="Create Announcement"
          >
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Announcement title" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Body</Label>
                <Textarea id="body" placeholder="Announcement body" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input id="start_date" type="date" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input id="end_date" type="date" />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="is_pinned" />
                <Label htmlFor="is_pinned">Pinned</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="church">Church</SelectItem>
                    <SelectItem value="youth">Youth</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="ministry">Ministry</SelectItem>
                    <SelectItem value="outreach">Outreach</SelectItem>
                  </SelectContent>
                </Select>
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
        data={MOCK_ANNOUNCEMENTS as unknown as Record<string, unknown>[]}
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        searchable
        searchKeys={["title", "body"]}
      />
    </div>
  );
}
