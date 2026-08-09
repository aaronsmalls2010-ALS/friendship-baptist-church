"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Camera, ImagePlus, Loader2, User, CalendarDays } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { EditableText } from "@/components/cms/editable-text";
import { GalleryUploader } from "@/components/gallery/gallery-uploader";
import { GalleryLightbox } from "@/components/gallery/gallery-lightbox";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { GalleryAlbum, GalleryPhoto } from "@/types";

type AlbumChip = GalleryAlbum & { count: number };

export default function GalleryPage() {
  const prefersReducedMotion = useReducedMotion();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [albums, setAlbums] = useState<AlbumChip[]>([]);
  const [uploaderAlbums, setUploaderAlbums] = useState<GalleryAlbum[]>([]);
  const [activeAlbum, setActiveAlbum] = useState<string>(""); // slug; "" = All
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);

  const load = useCallback(async (album: string, offset: number) => {
    const qs = new URLSearchParams();
    if (album) qs.set("album", album);
    if (offset) qs.set("offset", String(offset));
    const res = await fetch(`/api/gallery?${qs.toString()}`);
    return res.ok ? res.json() : { photos: [], albums: [], hasMore: false };
  }, []);

  // Initial load + auth + uploader album options.
  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => active && setAuthed(!!data.user));
      fetch("/api/gallery/albums")
        .then((r) => (r.ok ? r.json() : { albums: [] }))
        .then((d) => active && setUploaderAlbums(d.albums ?? []));

      const data = await load("", 0);
      if (!active) return;
      setPhotos(data.photos ?? []);
      setAlbums(data.albums ?? []);
      setHasMore(!!data.hasMore);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [load]);

  async function selectAlbum(slug: string) {
    if (slug === activeAlbum) return;
    setActiveAlbum(slug);
    setLoading(true);
    setLightbox(null);
    const data = await load(slug, 0);
    setPhotos(data.photos ?? []);
    setHasMore(!!data.hasMore);
    setLoading(false);
  }

  async function loadMore() {
    setLoadingMore(true);
    const data = await load(activeAlbum, photos.length);
    setPhotos((prev) => [...prev, ...(data.photos ?? [])]);
    setHasMore(!!data.hasMore);
    setLoadingMore(false);
  }

  function handleAdd() {
    if (authed) setUploaderOpen(true);
  }

  const revealProps = (i: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24, scale: 0.98 },
          whileInView: { opacity: 1, y: 0, scale: 1 },
          viewport: { once: true, margin: "0px 0px -60px 0px" },
          transition: { duration: 0.5, delay: Math.min((i % 8) * 0.05, 0.4), ease: "easeOut" },
        };

  return (
    <>
      <PageHero
        title={<EditableText id="gallery.hero.title" fallback="Photo Gallery" as="span" />}
        subtitle={
          <EditableText
            id="gallery.hero.subtitle"
            fallback="Moments of worship, fellowship, and family life at Friendship"
            as="span"
          />
        }
        breadcrumbs={[{ label: "Photos" }]}
      />

      <section className="section-padding">
        <div className="container-wide">
          {/* Album filter chips */}
          {albums.length > 0 && (
            <div className="mb-8 flex flex-wrap justify-center gap-2">
              <FilterChip label="All" active={activeAlbum === ""} onClick={() => selectAlbum("")} />
              {albums.map((a) => (
                <FilterChip
                  key={a.id}
                  label={`${a.name} (${a.count})`}
                  active={activeAlbum === a.slug}
                  onClick={() => selectAlbum(a.slug)}
                />
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : photos.length === 0 ? (
            <div className="mx-auto max-w-md py-16 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-900/30">
                <Camera className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="mb-3 font-heading text-fluid-xl font-bold text-warm-900 dark:text-warm-50">
                No photos yet
              </h2>
              <p className="mb-6 text-warm-600 dark:text-warm-400">
                Be the first to share a moment from our church family.
              </p>
              <AddButton authed={authed} onAdd={handleAdd} inline />
            </div>
          ) : (
            <>
              {/* Masonry */}
              <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [column-fill:_balance]">
                {photos.map((photo, i) => (
                  <motion.button
                    type="button"
                    key={photo.id}
                    {...revealProps(i)}
                    onClick={() => setLightbox(i)}
                    className="group mb-3 block w-full break-inside-avoid overflow-hidden rounded-xl bg-warm-100 shadow-sm transition-shadow duration-300 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 dark:bg-warm-800"
                    aria-label={`View photo by ${photo.uploader_name}`}
                  >
                    <div className="relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.thumb_url}
                        alt={photo.caption || `Photo by ${photo.uploader_name}`}
                        loading="lazy"
                        width={photo.width ?? undefined}
                        height={photo.height ?? undefined}
                        className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        style={
                          photo.width && photo.height
                            ? { aspectRatio: `${photo.width} / ${photo.height}` }
                            : undefined
                        }
                      />
                      {/* Hover overlay: attribution */}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-white">
                          <User className="h-3 w-3" />
                          {photo.uploader_name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-white/80">
                          <CalendarDays className="h-2.5 w-2.5" />
                          {formatDate(photo.approved_at || photo.created_at)}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {hasMore && (
                <div className="mt-10 text-center">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-white px-6 py-3 text-sm font-semibold text-purple-700 transition-colors hover:bg-purple-50 disabled:opacity-60 dark:border-purple-800 dark:bg-warm-900 dark:text-purple-300"
                  >
                    {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Load more photos
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Floating Add Photos button */}
      {!loading && photos.length > 0 && <AddButton authed={authed} onAdd={handleAdd} />}

      {uploaderOpen && (
        <GalleryUploader
          albums={uploaderAlbums}
          onClose={() => setUploaderOpen(false)}
          onUploaded={() => setUploaderOpen(false)}
        />
      )}

      {lightbox !== null && (
        <GalleryLightbox
          photos={photos}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onIndexChange={setLightbox}
        />
      )}
    </>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 " +
        (active
          ? "bg-purple-700 text-white"
          : "bg-warm-100 text-warm-700 hover:bg-purple-100 hover:text-purple-800 dark:bg-warm-800 dark:text-warm-300")
      }
    >
      {label}
    </button>
  );
}

function AddButton({
  authed,
  onAdd,
  inline,
}: {
  authed: boolean | null;
  onAdd: () => void;
  inline?: boolean;
}) {
  const base =
    "inline-flex items-center gap-2 rounded-full bg-gold-400 px-5 py-3 text-sm font-bold text-purple-950 shadow-xl ring-1 ring-black/10 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";
  const floating =
    "fixed bottom-6 right-4 z-40 sm:bottom-8 sm:right-8";

  // Logged out → send them to log in first (upload requires a member account).
  if (!authed) {
    return (
      <Link href="/auth/login?redirect=/gallery" className={inline ? base : `${base} ${floating}`}>
        <ImagePlus className="h-5 w-5" />
        Add Photos
      </Link>
    );
  }
  return (
    <button type="button" onClick={onAdd} className={inline ? base : `${base} ${floating}`}>
      <ImagePlus className="h-5 w-5" />
      Add Photos
    </button>
  );
}
