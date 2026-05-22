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
import { MOCK_EVENTS } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import type { Event } from "@/types";

export default function EventManagementPage() {
  const columns = [
    {
      key: "title",
      label: "Title",
      sortable: true,
    },
    {
      key: "start_date",
      label: "Date",
      sortable: true,
      render: (item: Event) => formatDate(item.start_date),
    },
    {
      key: "location",
      label: "Location",
      render: (item: Event) => item.location ?? "—",
    },
    {
      key: "rsvp_enabled",
      label: "RSVP",
      render: (item: Event) => (
        <Badge variant={item.rsvp_enabled ? "default" : "secondary"}>
          {item.rsvp_enabled ? "Enabled" : "Disabled"}
        </Badge>
      ),
    },
    {
      key: "is_published",
      label: "Published",
      render: (item: Event) => (
        <Badge variant={item.is_published ? "default" : "secondary"}>
          {item.is_published ? "Published" : "Draft"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Events"
        description="Manage church events"
        action={
          <FormDialog title="Create Event" triggerLabel="Create Event">
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Event title" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Event description" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input id="start_date" type="datetime-local" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input id="end_date" type="datetime-local" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="Event location" />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="rsvp_enabled" />
                <Label htmlFor="rsvp_enabled">Enable RSVP</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="is_published" />
                <Label htmlFor="is_published">Published</Label>
              </div>

              <Button
                type="button"
                className="w-full bg-purple-700 hover:bg-purple-600 text-white"
              >
                Save Event
              </Button>
            </form>
          </FormDialog>
        }
      />

      <DataTable
        data={MOCK_EVENTS as unknown as Record<string, unknown>[]}
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        searchable
        searchKeys={["title", "location"]}
      />
    </div>
  );
}
