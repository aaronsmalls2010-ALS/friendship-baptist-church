"use client";

import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MOCK_EVENTS } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import type { Event } from "@/types";
import { Pencil, Trash2, Plus } from "lucide-react";

export default function EventManagementPage() {
  const [events, setEvents] = useState<Event[]>([...MOCK_EVENTS]);

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Delete confirmation dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);

  // Form field state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formRsvpEnabled, setFormRsvpEnabled] = useState(false);
  const [formIsPublished, setFormIsPublished] = useState(false);

  function resetForm() {
    setFormTitle("");
    setFormDescription("");
    setFormStartDate("");
    setFormEndDate("");
    setFormLocation("");
    setFormRsvpEnabled(false);
    setFormIsPublished(false);
    setEditingEvent(null);
  }

  function openCreateDialog() {
    resetForm();
    setFormOpen(true);
  }

  function openEditDialog(event: Event) {
    setEditingEvent(event);
    setFormTitle(event.title);
    setFormDescription(event.description);
    setFormStartDate(event.start_date ? event.start_date.slice(0, 16) : "");
    setFormEndDate(event.end_date ? event.end_date.slice(0, 16) : "");
    setFormLocation(event.location ?? "");
    setFormRsvpEnabled(event.rsvp_enabled);
    setFormIsPublished(event.is_published);
    setFormOpen(true);
  }

  function handleSave() {
    if (editingEvent) {
      // Update existing event
      setEvents((prev) =>
        prev.map((e) =>
          e.id === editingEvent.id
            ? {
                ...e,
                title: formTitle,
                description: formDescription,
                start_date: formStartDate,
                end_date: formEndDate || undefined,
                location: formLocation || undefined,
                rsvp_enabled: formRsvpEnabled,
                is_published: formIsPublished,
              }
            : e
        )
      );
    } else {
      // Create new event
      const newEvent: Event = {
        id: `e${Date.now()}`,
        title: formTitle,
        description: formDescription,
        start_date: formStartDate,
        end_date: formEndDate || undefined,
        location: formLocation || undefined,
        ministry_id: undefined,
        image_url: undefined,
        rsvp_enabled: formRsvpEnabled,
        is_published: formIsPublished,
        created_at: new Date().toISOString(),
      };
      setEvents((prev) => [...prev, newEvent]);
    }
    setFormOpen(false);
    resetForm();
  }

  function openDeleteDialog(event: Event) {
    setDeletingEvent(event);
    setDeleteOpen(true);
  }

  function handleDelete() {
    if (deletingEvent) {
      setEvents((prev) => prev.filter((e) => e.id !== deletingEvent.id));
    }
    setDeleteOpen(false);
    setDeletingEvent(null);
  }

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
    {
      key: "actions",
      label: "Actions",
      render: (item: Event) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openEditDialog(item);
            }}
            className="h-8 w-8 p-0 text-warm-500 hover:text-purple-700 hover:bg-purple-50"
            title="Edit event"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openDeleteDialog(item);
            }}
            className="h-8 w-8 p-0 text-warm-500 hover:text-red-600 hover:bg-red-50"
            title="Delete event"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Events"
        description="Manage church events"
        action={
          <Button
            onClick={openCreateDialog}
            className="bg-purple-700 hover:bg-purple-600 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        }
      />

      <DataTable
        data={events as unknown as Record<string, unknown>[]}
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        searchable
        searchKeys={["title", "location"]}
      />

      {/* Create / Edit Event Dialog */}
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              {editingEvent ? "Edit Event" : "Create Event"}
            </DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Event title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Event description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="datetime-local"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="datetime-local"
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Event location"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="rsvp_enabled"
                checked={formRsvpEnabled}
                onCheckedChange={(checked) =>
                  setFormRsvpEnabled(checked === true)
                }
              />
              <Label htmlFor="rsvp_enabled">Enable RSVP</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_published"
                checked={formIsPublished}
                onCheckedChange={(checked) =>
                  setFormIsPublished(checked === true)
                }
              />
              <Label htmlFor="is_published">Published</Label>
            </div>

            <Button
              type="submit"
              className="w-full bg-purple-700 hover:bg-purple-600 text-white"
            >
              {editingEvent ? "Update Event" : "Save Event"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              Delete Event
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event?
            </DialogDescription>
          </DialogHeader>
          {deletingEvent && (
            <p className="text-sm text-warm-600">
              <span className="font-medium">{deletingEvent.title}</span> will be
              permanently removed.
            </p>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
