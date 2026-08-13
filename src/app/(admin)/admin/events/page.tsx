"use client";

import { useEffect, useState, type ChangeEvent } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, toEasternInputValue, fromEasternInputValue } from "@/lib/utils";
import { RecurrenceBuilder } from "@/components/admin/recurrence-builder";
import type { Event } from "@/types";
import { Pencil, Trash2, Plus, Loader2, ImagePlus, X } from "lucide-react";

// Only top-of-the-hour and half-hour times, 12:00 AM … 11:30 PM.
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  const value = `${String(h).padStart(2, "0")}:${m}`;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const ampm = h < 12 ? "AM" : "PM";
  return { value, label: `${h12}:${m} ${ampm}` };
});
// datetime-local strings are "YYYY-MM-DDTHH:mm"; split/recombine the parts.
const datePart = (v: string) => (v ? v.split("T")[0] : "");
const timePart = (v: string) => (v && v.includes("T") ? v.split("T")[1].slice(0, 5) : "");
const combineDT = (day: string, time: string) => (day ? `${day}T${time || "09:00"}` : "");

export default function EventManagementPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

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
  const [formCapacity, setFormCapacity] = useState("");
  const [formAllowWaitlist, setFormAllowWaitlist] = useState(false);
  const [formIsPublished, setFormIsPublished] = useState(false);
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formRecurrence, setFormRecurrence] = useState("none");
  const [formRecurrenceEnd, setFormRecurrenceEnd] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState("");

  // ── Data fetching ─────────────────────────────────────────────────
  async function loadData() {
    try {
      const res = await fetch("/api/admin/events");
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // ── Form helpers ──────────────────────────────────────────────────
  function resetForm() {
    setFormTitle("");
    setFormDescription("");
    setFormStartDate("");
    setFormEndDate("");
    setFormLocation("");
    setFormRsvpEnabled(false);
    setFormCapacity("");
    setFormAllowWaitlist(false);
    setFormIsPublished(false);
    setFormImageUrl("");
    setFormRecurrence("none");
    setFormRecurrenceEnd("");
    setImageError("");
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
    setFormStartDate(event.start_date ? toEasternInputValue(event.start_date) : "");
    setFormEndDate(event.end_date ? toEasternInputValue(event.end_date) : "");
    setFormLocation(event.location ?? "");
    setFormRsvpEnabled(event.rsvp_enabled);
    setFormCapacity(event.capacity != null ? String(event.capacity) : "");
    setFormAllowWaitlist(event.allow_waitlist ?? false);
    setFormIsPublished(event.is_published);
    setFormImageUrl(event.image_url ?? "");
    setFormRecurrence(event.recurrence || "none");
    setFormRecurrenceEnd(event.recurrence_end ?? "");
    setImageError("");
    setFormOpen(true);
  }

  async function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Allow re-selecting the same file later.
    e.target.value = "";
    if (!file) return;

    setImageError("");
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setFormImageUrl(data.url);
      } else {
        setImageError(data.error ?? "Upload failed. Please try again.");
      }
    } catch {
      setImageError("Upload failed. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSave() {
    if (saving) return; // guard against double-submit (was creating duplicate events)
    setSaving(true);
    const payload = {
      title: formTitle,
      description: formDescription,
      start_date: fromEasternInputValue(formStartDate),
      end_date: formEndDate ? fromEasternInputValue(formEndDate) : undefined,
      location: formLocation || undefined,
      rsvp_enabled: formRsvpEnabled,
      capacity: formCapacity.trim() === "" ? null : Number(formCapacity),
      allow_waitlist: formAllowWaitlist,
      is_published: formIsPublished,
      image_url: formImageUrl || null,
      recurrence: formRecurrence,
      recurrence_end:
        formRecurrence !== "none" && formRecurrenceEnd ? formRecurrenceEnd : null,
    };

    try {
      if (editingEvent) {
        const res = await fetch("/api/admin/events", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingEvent.id, ...payload }),
        });
        if (res.ok) loadData();
      } else {
        const res = await fetch("/api/admin/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) loadData();
      }
      setFormOpen(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  function openDeleteDialog(event: Event) {
    setDeletingEvent(event);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (deletingEvent) {
      const res = await fetch("/api/admin/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletingEvent.id }),
      });
      if (res.ok) {
        loadData();
      }
    }
    setDeleteOpen(false);
    setDeletingEvent(null);
  }

  // ── Column definitions ────────────────────────────────────────────
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
      key: "going_count",
      label: "Registered",
      render: (item: Event) => {
        if (!item.rsvp_enabled) return <span className="text-warm-400">—</span>;
        const going = item.going_count ?? 0;
        const cap = item.capacity;
        const full = cap != null && going >= cap;
        return (
          <div className="flex flex-col gap-0.5">
            <span className={full ? "font-medium text-red-600" : "text-warm-700"}>
              {going}
              {cap != null ? ` / ${cap}` : ""}
            </span>
            {(item.waitlist_count ?? 0) > 0 && (
              <span className="text-xs text-amber-600">
                {item.waitlist_count} waitlisted
              </span>
            )}
          </div>
        );
      },
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

  // ── Loading state ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

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
              <Label>Event Image</Label>
              {formImageUrl ? (
                <div className="flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formImageUrl}
                    alt="Event preview"
                    className="h-20 w-20 rounded-md border border-warm-200 object-cover"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormImageUrl("")}
                    className="text-warm-600"
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="event_image"
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-warm-300 bg-warm-50/50 px-4 py-3 text-sm text-warm-600 transition-colors hover:border-purple-400 hover:text-purple-700"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading…
                      </>
                    ) : (
                      <>
                        <ImagePlus className="h-4 w-4" />
                        Upload an image
                      </>
                    )}
                  </label>
                  <input
                    id="event_image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    className="sr-only"
                    disabled={uploadingImage}
                    onChange={handleImageChange}
                  />
                  <p className="mt-1 text-xs text-warm-500">
                    JPEG, PNG, WebP, GIF, or AVIF. Max 8 MB.
                  </p>
                </div>
              )}
              {imageError && (
                <p role="alert" className="text-xs text-red-600">
                  {imageError}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start_day">Start Date</Label>
                <Input
                  id="start_day"
                  type="date"
                  value={datePart(formStartDate)}
                  onChange={(e) => setFormStartDate(combineDT(e.target.value, timePart(formStartDate)))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Select
                  value={timePart(formStartDate) || undefined}
                  onValueChange={(v) => setFormStartDate(combineDT(datePart(formStartDate), v))}
                >
                  <SelectTrigger id="start_time"><SelectValue placeholder="Select time" /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {TIME_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="end_day">End Date</Label>
                <Input
                  id="end_day"
                  type="date"
                  value={datePart(formEndDate)}
                  onChange={(e) => setFormEndDate(e.target.value ? combineDT(e.target.value, timePart(formEndDate)) : "")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Select
                  value={timePart(formEndDate) || undefined}
                  onValueChange={(v) => setFormEndDate(combineDT(datePart(formEndDate), v))}
                >
                  <SelectTrigger id="end_time"><SelectValue placeholder="Select time" /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {TIME_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <RecurrenceBuilder value={formRecurrence} onChange={setFormRecurrence} />

            {formRecurrence !== "none" && (
              <div className="space-y-2">
                <Label htmlFor="recurrence_end">Repeat until (optional)</Label>
                <Input
                  id="recurrence_end"
                  type="date"
                  value={formRecurrenceEnd}
                  onChange={(e) => setFormRecurrenceEnd(e.target.value)}
                />
                <p className="text-xs text-slate-500">Leave blank to repeat indefinitely.</p>
              </div>
            )}

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

            {formRsvpEnabled && (
              <div className="space-y-4 rounded-lg border border-warm-200 bg-warm-50/50 p-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min={1}
                    placeholder="Leave blank for unlimited"
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(e.target.value)}
                  />
                  <p className="text-xs text-warm-500">
                    Maximum confirmed RSVPs. Leave blank for no limit.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allow_waitlist"
                    checked={formAllowWaitlist}
                    onCheckedChange={(checked) =>
                      setFormAllowWaitlist(checked === true)
                    }
                  />
                  <Label htmlFor="allow_waitlist">
                    Allow waitlist when full
                  </Label>
                </div>
              </div>
            )}

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
              disabled={saving || uploadingImage}
              className="w-full bg-purple-700 hover:bg-purple-600 text-white"
            >
              {saving ? "Saving…" : editingEvent ? "Update Event" : "Save Event"}
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
