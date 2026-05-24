"use client";

import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Pencil, Trash2, Plus } from "lucide-react";

type Row = Record<string, unknown>;

export default function MediaManagementPage() {
  const [sermons, setSermons] = useState<Sermon[]>([...MOCK_SERMONS]);
  const [tracks, setTracks] = useState<MusicTrack[]>([...MOCK_MUSIC_TRACKS]);

  // Sermon form state
  const [sermonFormOpen, setSermonFormOpen] = useState(false);
  const [editingSermon, setEditingSermon] = useState<Sermon | null>(null);
  const [sermonTitle, setSermonTitle] = useState("");
  const [sermonSpeaker, setSermonSpeaker] = useState("");
  const [sermonDate, setSermonDate] = useState("");
  const [sermonScripture, setSermonScripture] = useState("");
  const [sermonTopics, setSermonTopics] = useState("");

  // Sermon delete state
  const [sermonDeleteOpen, setSermonDeleteOpen] = useState(false);
  const [deletingSermon, setDeletingSermon] = useState<Sermon | null>(null);

  // Music form state
  const [musicFormOpen, setMusicFormOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<MusicTrack | null>(null);
  const [musicTitle, setMusicTitle] = useState("");
  const [musicArtist, setMusicArtist] = useState("");
  const [musicAlbum, setMusicAlbum] = useState("");
  const [musicType, setMusicType] = useState<MusicTrack["track_type"]>("gospel");
  const [musicDuration, setMusicDuration] = useState("");

  // Music delete state
  const [musicDeleteOpen, setMusicDeleteOpen] = useState(false);
  const [deletingTrack, setDeletingTrack] = useState<MusicTrack | null>(null);

  // ── Sermon CRUD ─────────────────────────────────────────────────────

  function resetSermonForm() {
    setSermonTitle("");
    setSermonSpeaker("");
    setSermonDate("");
    setSermonScripture("");
    setSermonTopics("");
    setEditingSermon(null);
  }

  function openCreateSermonDialog() {
    resetSermonForm();
    setSermonFormOpen(true);
  }

  function openEditSermonDialog(sermon: Sermon) {
    setEditingSermon(sermon);
    setSermonTitle(sermon.title);
    setSermonSpeaker(sermon.speaker);
    setSermonDate(sermon.date);
    setSermonScripture(sermon.scripture ?? "");
    setSermonTopics(sermon.topics.join(", "));
    setSermonFormOpen(true);
  }

  function handleSaveSermon() {
    const topics = sermonTopics
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingSermon) {
      setSermons((prev) =>
        prev.map((s) =>
          s.id === editingSermon.id
            ? {
                ...s,
                title: sermonTitle,
                speaker: sermonSpeaker,
                date: sermonDate,
                scripture: sermonScripture || undefined,
                topics,
              }
            : s
        )
      );
    } else {
      const newSermon: Sermon = {
        id: `s${Date.now()}`,
        title: sermonTitle,
        speaker: sermonSpeaker,
        date: sermonDate,
        scripture: sermonScripture || undefined,
        topics,
        created_at: new Date().toISOString(),
      };
      setSermons((prev) => [...prev, newSermon]);
    }
    setSermonFormOpen(false);
    resetSermonForm();
  }

  function handleDeleteSermon() {
    if (deletingSermon) {
      setSermons((prev) => prev.filter((s) => s.id !== deletingSermon.id));
    }
    setSermonDeleteOpen(false);
    setDeletingSermon(null);
  }

  // ── Music CRUD ──────────────────────────────────────────────────────

  function resetMusicForm() {
    setMusicTitle("");
    setMusicArtist("");
    setMusicAlbum("");
    setMusicType("gospel");
    setMusicDuration("");
    setEditingTrack(null);
  }

  function openCreateMusicDialog() {
    resetMusicForm();
    setMusicFormOpen(true);
  }

  function openEditMusicDialog(track: MusicTrack) {
    setEditingTrack(track);
    setMusicTitle(track.title);
    setMusicArtist(track.artist);
    setMusicAlbum(track.album ?? "");
    setMusicType(track.track_type);
    setMusicDuration(String(track.duration));
    setMusicFormOpen(true);
  }

  function handleSaveMusic() {
    if (editingTrack) {
      setTracks((prev) =>
        prev.map((t) =>
          t.id === editingTrack.id
            ? {
                ...t,
                title: musicTitle,
                artist: musicArtist,
                album: musicAlbum || undefined,
                track_type: musicType,
                duration: Number(musicDuration) || t.duration,
              }
            : t
        )
      );
    } else {
      const newTrack: MusicTrack = {
        id: `mt${Date.now()}`,
        title: musicTitle,
        artist: musicArtist,
        album: musicAlbum || undefined,
        audio_url: "",
        duration: Number(musicDuration) || 0,
        track_type: musicType,
        created_at: new Date().toISOString(),
      };
      setTracks((prev) => [...prev, newTrack]);
    }
    setMusicFormOpen(false);
    resetMusicForm();
  }

  function handleDeleteMusic() {
    if (deletingTrack) {
      setTracks((prev) => prev.filter((t) => t.id !== deletingTrack.id));
    }
    setMusicDeleteOpen(false);
    setDeletingTrack(null);
  }

  // ── Column Definitions ──────────────────────────────────────────────

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
    {
      key: "actions",
      label: "Actions",
      render: (row: Row) => {
        const item = row as unknown as Sermon;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                openEditSermonDialog(item);
              }}
              className="h-8 w-8 p-0 text-warm-500 hover:text-purple-700 hover:bg-purple-50"
              title="Edit sermon"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDeletingSermon(item);
                setSermonDeleteOpen(true);
              }}
              className="h-8 w-8 p-0 text-warm-500 hover:text-red-600 hover:bg-red-50"
              title="Delete sermon"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
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
    {
      key: "actions",
      label: "Actions",
      render: (row: Row) => {
        const item = row as unknown as MusicTrack;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                openEditMusicDialog(item);
              }}
              className="h-8 w-8 p-0 text-warm-500 hover:text-purple-700 hover:bg-purple-50"
              title="Edit track"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDeletingTrack(item);
                setMusicDeleteOpen(true);
              }}
              className="h-8 w-8 p-0 text-warm-500 hover:text-red-600 hover:bg-red-50"
              title="Delete track"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Media"
        description="Manage sermons, music, and media content"
      />

      {/* ── Sermons Section ─────────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold text-warm-900 dark:text-warm-50">
            Sermons
          </h2>
          <Button
            onClick={openCreateSermonDialog}
            className="bg-purple-700 hover:bg-purple-600 text-white"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Sermon
          </Button>
        </div>
        <DataTable
          data={sermons as unknown as Record<string, unknown>[]}
          columns={sermonColumns}
          searchable
          searchKeys={["title", "speaker"]}
        />
      </div>

      <Separator />

      {/* ── Music Section ───────────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold text-warm-900 dark:text-warm-50">
            Music Tracks
          </h2>
          <Button
            onClick={openCreateMusicDialog}
            className="bg-purple-700 hover:bg-purple-600 text-white"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Track
          </Button>
        </div>
        <DataTable
          data={tracks as unknown as Record<string, unknown>[]}
          columns={musicColumns}
          searchable
          searchKeys={["title", "artist"]}
        />
      </div>

      {/* ── Sermon Form Dialog ──────────────────────────────────────── */}
      <Dialog
        open={sermonFormOpen}
        onOpenChange={(open) => {
          setSermonFormOpen(open);
          if (!open) resetSermonForm();
        }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              {editingSermon ? "Edit Sermon" : "Add Sermon"}
            </DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveSermon();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="sermon-title">Title</Label>
              <Input
                id="sermon-title"
                placeholder="Sermon title"
                value={sermonTitle}
                onChange={(e) => setSermonTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sermon-speaker">Speaker</Label>
              <Input
                id="sermon-speaker"
                placeholder="Speaker name"
                value={sermonSpeaker}
                onChange={(e) => setSermonSpeaker(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sermon-date">Date</Label>
              <Input
                id="sermon-date"
                type="date"
                value={sermonDate}
                onChange={(e) => setSermonDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sermon-scripture">Scripture</Label>
              <Input
                id="sermon-scripture"
                placeholder="e.g. John 3:16"
                value={sermonScripture}
                onChange={(e) => setSermonScripture(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sermon-topics">Topics (comma-separated)</Label>
              <Input
                id="sermon-topics"
                placeholder="Faith, Hope, Love"
                value={sermonTopics}
                onChange={(e) => setSermonTopics(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-purple-700 hover:bg-purple-600 text-white"
            >
              {editingSermon ? "Update Sermon" : "Save Sermon"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Sermon Delete Dialog ────────────────────────────────────── */}
      <Dialog open={sermonDeleteOpen} onOpenChange={setSermonDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              Delete Sermon
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this sermon?
            </DialogDescription>
          </DialogHeader>
          {deletingSermon && (
            <p className="text-sm text-warm-600">
              <span className="font-medium">{deletingSermon.title}</span> will
              be permanently removed.
            </p>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setSermonDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSermon}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Music Form Dialog ───────────────────────────────────────── */}
      <Dialog
        open={musicFormOpen}
        onOpenChange={(open) => {
          setMusicFormOpen(open);
          if (!open) resetMusicForm();
        }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              {editingTrack ? "Edit Track" : "Add Track"}
            </DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveMusic();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="music-title">Title</Label>
              <Input
                id="music-title"
                placeholder="Track title"
                value={musicTitle}
                onChange={(e) => setMusicTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="music-artist">Artist</Label>
              <Input
                id="music-artist"
                placeholder="Artist name"
                value={musicArtist}
                onChange={(e) => setMusicArtist(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="music-album">Album (optional)</Label>
              <Input
                id="music-album"
                placeholder="Album name"
                value={musicAlbum}
                onChange={(e) => setMusicAlbum(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="music-type">Type</Label>
              <Select
                value={musicType}
                onValueChange={(val) =>
                  setMusicType(val as MusicTrack["track_type"])
                }
              >
                <SelectTrigger id="music-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="worship">Worship</SelectItem>
                  <SelectItem value="hymn">Hymn</SelectItem>
                  <SelectItem value="choir">Choir</SelectItem>
                  <SelectItem value="gospel">Gospel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="music-duration">Duration (seconds)</Label>
              <Input
                id="music-duration"
                type="number"
                placeholder="300"
                value={musicDuration}
                onChange={(e) => setMusicDuration(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-purple-700 hover:bg-purple-600 text-white"
            >
              {editingTrack ? "Update Track" : "Save Track"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Music Delete Dialog ─────────────────────────────────────── */}
      <Dialog open={musicDeleteOpen} onOpenChange={setMusicDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              Delete Track
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this music track?
            </DialogDescription>
          </DialogHeader>
          {deletingTrack && (
            <p className="text-sm text-warm-600">
              <span className="font-medium">{deletingTrack.title}</span> by{" "}
              {deletingTrack.artist} will be permanently removed.
            </p>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setMusicDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMusic}
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
