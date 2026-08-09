"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, ImagePlus, Loader2, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import type { GalleryAlbum } from "@/types";

const MAX_FILES = 10;

type Picked = {
  key: string;
  file: File;
  preview: string | null; // objectURL for non-HEIC; null → placeholder tile
  isHeic: boolean;
};

function isHeic(file: File): boolean {
  const t = file.type.toLowerCase();
  const n = file.name.toLowerCase();
  return t === "image/heic" || t === "image/heif" || n.endsWith(".heic") || n.endsWith(".heif");
}

/** Reject if a step takes too long, so a stuck conversion can't freeze the batch. */
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out`)), ms)
    ),
  ]);
}

/** Convert (HEIC→JPEG if needed) then compress a file for upload, to save space. */
async function prepareForUpload(file: File): Promise<File> {
  let working: Blob = file;
  let name = file.name;

  if (isHeic(file)) {
    const heic2any = (await import("heic2any")).default;
    const out = await withTimeout(
      heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 }),
      60000,
      "Photo conversion"
    );
    working = Array.isArray(out) ? out[0] : out;
    name = name.replace(/\.(heic|heif)$/i, ".jpg");
  }

  const asFile = new File([working], name, { type: working.type || "image/jpeg" });

  const imageCompression = (await import("browser-image-compression")).default;
  // useWebWorker:false — a strict CSP blocks the library's CDN-loaded worker,
  // which would otherwise hang forever. Main-thread compression is reliable.
  // ONE pass (maxIteration:1) at the resolution the server keeps anyway
  // (1800px) — the iterative size-target loop was the main slowdown.
  return withTimeout(
    imageCompression(asFile, {
      maxWidthOrHeight: 1800,
      initialQuality: 0.72,
      maxIteration: 1,
      useWebWorker: false,
      fileType: "image/jpeg",
    }),
    45000,
    "Photo compression"
  );
}

interface GalleryUploaderProps {
  albums: GalleryAlbum[];
  onClose: () => void;
  onUploaded: () => void;
}

export function GalleryUploader({ albums, onClose, onUploaded }: GalleryUploaderProps) {
  const prefersReducedMotion = useReducedMotion();
  const [picked, setPicked] = useState<Picked[]>([]);
  const [caption, setCaption] = useState("");
  const [albumId, setAlbumId] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [busy, onClose]);

  // Revoke object URLs on unmount to avoid leaks.
  useEffect(() => {
    return () => picked.forEach((p) => p.preview && URL.revokeObjectURL(p.preview));
  }, [picked]);

  const addFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    setError(null);
    setPicked((prev) => {
      const room = MAX_FILES - prev.length;
      const incoming = Array.from(list).slice(0, Math.max(0, room));
      if (Array.from(list).length > room) {
        setError(`You can upload up to ${MAX_FILES} photos at a time.`);
      }
      const mapped: Picked[] = incoming.map((file, i) => {
        const heic = isHeic(file);
        return {
          key: `${Date.now()}-${i}-${file.name}`,
          file,
          preview: heic ? null : URL.createObjectURL(file),
          isHeic: heic,
        };
      });
      return [...prev, ...mapped];
    });
  }, []);

  function removeAt(key: string) {
    setPicked((prev) => {
      const target = prev.find((p) => p.key === key);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((p) => p.key !== key);
    });
  }

  async function submit() {
    if (picked.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      for (let i = 0; i < picked.length; i++) {
        const p = picked[i];
        setProgress(`Preparing photo ${i + 1} of ${picked.length}…`);
        try {
          const prepared = await prepareForUpload(p.file);
          form.append("files", prepared, prepared.name);
        } catch {
          // If client-side conversion/compression hiccups, still upload the
          // original when it's already a web-safe image (the server re-encodes
          // it anyway). Only HEIC truly depends on the client conversion.
          if (!p.isHeic && p.file.type.startsWith("image/")) {
            form.append("files", p.file, p.file.name);
          }
        }
      }
      if (!form.has("files")) {
        setError("We couldn't read those photos. Please try different ones.");
        setBusy(false);
        setProgress(null);
        return;
      }
      if (caption.trim()) form.append("caption", caption.trim());
      if (albumId) form.append("albumId", albumId);

      setProgress("Uploading…");
      const res = await fetch("/api/gallery/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Upload failed. Please try again.");
        setBusy(false);
        setProgress(null);
        return;
      }
      setProgress(null);
      setDone(data.uploaded as number);
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Add photos">
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => !busy && onClose()}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[94dvh] w-full max-w-2xl flex-col rounded-t-3xl bg-white shadow-2xl sm:inset-x-4 sm:bottom-6 sm:rounded-3xl dark:bg-warm-900"
        initial={{ y: prefersReducedMotion ? 0 : "100%" }}
        animate={{ y: 0 }}
        exit={{ y: prefersReducedMotion ? 0 : "100%" }}
        transition={{ type: "tween", duration: prefersReducedMotion ? 0 : 0.3, ease: "easeOut" }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-warm-100 px-5 py-4 dark:border-warm-800">
          <h2 className="font-heading text-lg font-bold text-warm-900 dark:text-warm-50">
            Add Photos
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => !busy && onClose()}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-full text-warm-500 transition-colors hover:bg-warm-100 hover:text-warm-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 dark:hover:bg-warm-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {done !== null ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-heading text-xl font-bold text-warm-900 dark:text-warm-50">
                Thank you!
              </h3>
              <p className="mt-2 max-w-sm text-warm-600 dark:text-warm-300">
                {done} photo{done === 1 ? "" : "s"} sent for review. A church admin will approve
                {done === 1 ? " it" : " them"} before {done === 1 ? "it appears" : "they appear"} in
                the gallery.
              </p>
              <button
                type="button"
                onClick={() => {
                  onUploaded();
                  onClose();
                }}
                className="mt-6 rounded-xl bg-purple-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-600"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <p className="mb-3 text-sm text-warm-500 dark:text-warm-400">
                Share up to {MAX_FILES} photos from any phone or camera (JPG, PNG, HEIC and more).
                Please only upload photos you have permission to share. Every photo is reviewed by a
                church admin before it&apos;s shown publicly.
              </p>

              {/* Picker */}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={picked.length >= MAX_FILES}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/60 py-8 text-purple-700 transition-colors hover:border-purple-300 hover:bg-purple-50 disabled:opacity-50 dark:border-purple-800 dark:bg-purple-950/20 dark:text-purple-300"
              >
                <ImagePlus className="h-8 w-8" />
                <span className="text-sm font-semibold">
                  {picked.length === 0 ? "Choose photos" : "Add more"}
                </span>
                <span className="text-xs text-purple-500/80">
                  {picked.length}/{MAX_FILES} selected · JPG, PNG, HEIC &amp; more
                </span>
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                className="hidden"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />

              {/* Previews */}
              {picked.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {picked.map((p) => (
                    <div
                      key={p.key}
                      className="group relative aspect-square overflow-hidden rounded-xl bg-warm-100 dark:bg-warm-800"
                    >
                      {p.preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.preview} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center text-[10px] text-warm-500">
                          <CheckCircle2 className="mb-1 h-5 w-5 text-green-500" />
                          Ready
                        </div>
                      )}
                      {!busy && (
                        <button
                          type="button"
                          onClick={() => removeAt(p.key)}
                          aria-label="Remove photo"
                          className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Details */}
              {picked.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label htmlFor="gallery-caption" className="mb-1 block text-sm font-medium text-warm-700 dark:text-warm-300">
                      Caption <span className="font-normal text-warm-400">(optional)</span>
                    </label>
                    <input
                      id="gallery-caption"
                      type="text"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      maxLength={300}
                      placeholder="e.g. Sunday worship, June 2026"
                      className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-900 outline-none focus-visible:border-purple-400 focus-visible:ring-1 focus-visible:ring-purple-400 dark:border-warm-700 dark:bg-warm-800 dark:text-warm-50"
                    />
                  </div>
                  {albums.length > 0 && (
                    <div>
                      <label htmlFor="gallery-album" className="mb-1 block text-sm font-medium text-warm-700 dark:text-warm-300">
                        Album <span className="font-normal text-warm-400">(optional)</span>
                      </label>
                      <select
                        id="gallery-album"
                        value={albumId}
                        onChange={(e) => setAlbumId(e.target.value)}
                        className="w-full rounded-xl border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-900 outline-none focus-visible:border-purple-400 focus-visible:ring-1 focus-visible:ring-purple-400 dark:border-warm-700 dark:bg-warm-800 dark:text-warm-50"
                      >
                        <option value="">No album</option>
                        {albums.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {done === null && (
          <div className="shrink-0 border-t border-warm-100 px-5 py-4 dark:border-warm-800">
            <button
              type="button"
              onClick={submit}
              disabled={picked.length === 0 || busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-700 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-purple-600 disabled:cursor-not-allowed disabled:bg-warm-300"
            >
              {busy ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {progress ?? "Working…"}
                </>
              ) : (
                <>
                  Submit {picked.length > 0 ? `${picked.length} photo${picked.length === 1 ? "" : "s"}` : "photos"}
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
