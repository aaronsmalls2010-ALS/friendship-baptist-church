"use client";

import { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { MOCK_SERMONS, MOCK_MUSIC_TRACKS } from "@/lib/mock-data";
import { formatDate, formatDuration } from "@/lib/utils";
import type { Sermon, MusicTrack } from "@/types";

type Row = Record<string, unknown>;

export default function MediaManagementPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const sermonColumns = [
    { key: "title", label: "Title", sortable: true },
    { key: "speaker", label: "Speaker" },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (row: Row) => formatDate((row as unknown as Sermon).date),
    },
    { key: "scripture", label: "Scripture" },
    {
      key: "duration",
      label: "Duration",
      render: (row: Row) => {
        const item = row as unknown as Sermon;
        return item.duration ? formatDuration(item.duration) : "—";
      },
    },
    {
      key: "topics",
      label: "Topics",
      render: (row: Row) => {
        const item = row as unknown as Sermon;
        return (
          <div className="flex flex-wrap gap-1">
            {item.topics.map((topic) => (
              <Badge
                key={topic}
                variant="secondary"
                className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
              >
                {topic}
              </Badge>
            ))}
          </div>
        );
      },
    },
  ];

  const musicColumns = [
    { key: "title", label: "Title" },
    { key: "artist", label: "Artist" },
    {
      key: "album",
      label: "Album",
      render: (row: Row) => (row as unknown as MusicTrack).album || "—",
    },
    {
      key: "track_type",
      label: "Type",
      render: (row: Row) => (
        <Badge variant="outline" className="capitalize">
          {(row as unknown as MusicTrack).track_type}
        </Badge>
      ),
    },
    {
      key: "duration",
      label: "Duration",
      render: (row: Row) =>
        formatDuration((row as unknown as MusicTrack).duration),
    },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Media"
        description="Manage sermons, music, and media content"
        action={
          <FormDialog
            title="Upload Media"
            triggerLabel="Upload Media"
            open={dialogOpen}
            onOpenChange={setDialogOpen}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="media-title">Title</Label>
                <Input id="media-title" placeholder="Enter title" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="media-type">Type</Label>
                <Select>
                  <SelectTrigger id="media-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sermon">Sermon</SelectItem>
                    <SelectItem value="music">Music</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="media-speaker">Speaker / Artist</Label>
                <Input
                  id="media-speaker"
                  placeholder="Enter speaker or artist"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="media-date">Date</Label>
                <Input id="media-date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="media-file">File</Label>
                <Input
                  id="media-file"
                  disabled
                  placeholder="Select a file..."
                />
                <p className="text-xs text-warm-400">
                  File upload coming soon
                </p>
              </div>
              <Button
                className="w-full bg-purple-700 hover:bg-purple-600 text-white"
                onClick={() => setDialogOpen(false)}
              >
                Save
              </Button>
            </div>
          </FormDialog>
        }
      />

      <div className="space-y-6">
        <h2 className="font-heading text-xl font-semibold text-warm-900 dark:text-warm-50">
          Sermons
        </h2>
        <DataTable
          data={MOCK_SERMONS as unknown as Record<string, unknown>[]}
          columns={sermonColumns}
          searchable
          searchKeys={["title", "speaker"]}
        />
      </div>

      <Separator />

      <div className="space-y-6">
        <h2 className="font-heading text-xl font-semibold text-warm-900 dark:text-warm-50">
          Music Tracks
        </h2>
        <DataTable
          data={MOCK_MUSIC_TRACKS as unknown as Record<string, unknown>[]}
          columns={musicColumns}
          searchable
          searchKeys={["title", "artist"]}
        />
      </div>
    </div>
  );
}
