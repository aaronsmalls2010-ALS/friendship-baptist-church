"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  Check,
  X,
  Trash2,
  CheckCheck,
  ImageOff,
  User,
  CalendarDays,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { GalleryLightbox } from "@/components/gallery/gallery-lightbox";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { GalleryPhoto, GalleryPhotoStatus } from "@/types";

const TABS: { key: GalleryPhotoStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default function AdminPhotosPage() {
  const [tab, setTab] = useState<GalleryPhotoStatus>("pending");
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<"reject" | "delete" | null>(null);
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async (status: GalleryPhotoStatus) => {
    setLoading(true);
    const res = await fetch(`/api/admin/photos?status=${status}`);
    const data = res.ok ? await res.json() : { photos: [] };
    setPhotos(data.photos ?? []);
    setSelected(new Set());
    setConfirm(null);
    setNote("");
    setLoading(false);
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected((prev) =>
      prev.size === photos.length ? new Set() : new Set(photos.map((p) => p.id))
    );
  }

  async function act(action: "approve" | "reject" | "delete", ids: string[]) {
    if (ids.length === 0) return;
    setBusy(true);
    const res = await fetch("/api/admin/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, action, note: action === "reject" ? note : undefined }),
    });
    setBusy(false);
    if (res.ok) {
      const verb = action === "approve" ? "approved" : action === "reject" ? "rejected" : "deleted";
      setToast(`${ids.length} photo${ids.length === 1 ? "" : "s"} ${verb}.`);
      setTimeout(() => setToast(null), 2500);
      await load(tab);
    } else {
      setToast("Action failed. Please try again.");
      setTimeout(() => setToast(null), 2500);
      setBusy(false);
    }
  }

  const selectedIds = Array.from(selected);
  const allSelected = photos.length > 0 && selected.size === photos.length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Photo Gallery"
        description="Review member-submitted photos. Nothing appears publicly until you approve it."
      />

      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800 shadow-lg">
          {toast}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium transition-colors",
              tab === t.key
                ? "text-purple-700 dark:text-purple-300"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
            )}
          >
            {t.label}
            {tab === t.key && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-purple-600" />
            )}
          </button>
        ))}
      </div>

      {/* Action bar */}
      {photos.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={selectAll}
            className="text-sm font-medium text-purple-700 hover:underline dark:text-purple-300"
          >
            {allSelected ? "Clear selection" : "Select all"}
          </button>
          <span className="text-sm text-slate-500">{selected.size} selected</span>

          {selected.size > 0 && confirm === null && (
            <div className="ml-auto flex flex-wrap gap-2">
              {tab !== "approved" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => act("approve", selectedIds)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
                >
                  <CheckCheck className="h-4 w-4" /> Approve
                </button>
              )}
              {tab !== "rejected" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirm("reject")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
                >
                  <X className="h-4 w-4" /> Reject
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirm("delete")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          )}
        </div>
      )}

      {/* Confirm strip */}
      {confirm && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
          <p className="mb-3 text-sm font-medium text-slate-800 dark:text-slate-200">
            {confirm === "delete"
              ? `Permanently delete ${selected.size} photo${selected.size === 1 ? "" : "s"}? This can't be undone.`
              : `Reject ${selected.size} photo${selected.size === 1 ? "" : "s"}? They won't be shown publicly.`}
          </p>
          {confirm === "reject" && (
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              placeholder="Optional note (internal)"
              className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-visible:border-purple-400 focus-visible:ring-1 focus-visible:ring-purple-400 dark:border-slate-700 dark:bg-slate-800"
            />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => act(confirm, selectedIds)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60",
                confirm === "delete" ? "bg-red-600 hover:bg-red-700" : "bg-amber-500 hover:bg-amber-600"
              )}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Confirm {confirm}
            </button>
            <button
              type="button"
              onClick={() => setConfirm(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : photos.length === 0 ? (
        <div className="py-20 text-center">
          <ImageOff className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-slate-500">No {tab} photos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, i) => {
            const isSel = selected.has(photo.id);
            return (
              <div
                key={photo.id}
                className={cn(
                  "group relative overflow-hidden rounded-xl border-2 bg-slate-100 transition-colors dark:bg-slate-800",
                  isSel ? "border-purple-500" : "border-transparent"
                )}
              >
                <button
                  type="button"
                  onClick={() => setPreview(i)}
                  className="block aspect-square w-full"
                  aria-label={`Preview photo by ${photo.uploader_name}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.thumb_url}
                    alt={photo.caption || `Photo by ${photo.uploader_name}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>

                {/* Select checkbox */}
                <button
                  type="button"
                  onClick={() => toggle(photo.id)}
                  aria-pressed={isSel}
                  aria-label={isSel ? "Deselect" : "Select"}
                  className={cn(
                    "absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-md border-2 transition-colors",
                    isSel
                      ? "border-purple-500 bg-purple-600 text-white"
                      : "border-white/80 bg-black/30 text-transparent hover:text-white/70"
                  )}
                >
                  <Check className="h-4 w-4" />
                </button>

                {/* Meta + quick actions */}
                <div className="p-2">
                  <div className="flex items-center gap-1 truncate text-xs font-medium text-slate-700 dark:text-slate-200">
                    <User className="h-3 w-3 shrink-0" />
                    <span className="truncate">{photo.uploader_name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <CalendarDays className="h-2.5 w-2.5" />
                    {formatDate(photo.created_at)}
                  </div>
                  {photo.caption && (
                    <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">{photo.caption}</p>
                  )}
                  {tab === "pending" && (
                    <div className="mt-2 flex gap-1.5">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => act("approve", [photo.id])}
                        className="flex flex-1 items-center justify-center gap-1 rounded-md bg-green-600 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setSelected(new Set([photo.id]));
                          setConfirm("reject");
                        }}
                        className="flex items-center justify-center rounded-md bg-amber-500 px-2 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
                        aria-label="Reject"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  {photo.review_note && tab === "rejected" && (
                    <p className="mt-1 line-clamp-2 text-[10px] italic text-amber-600">
                      {photo.review_note}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {preview !== null && (
        <GalleryLightbox
          photos={photos}
          index={preview}
          onClose={() => setPreview(null)}
          onIndexChange={setPreview}
        />
      )}
    </div>
  );
}
