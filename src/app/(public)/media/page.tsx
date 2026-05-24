"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHero } from "@/components/shared/page-hero";
import { FadeIn } from "@/components/motion/fade-in";
import {
  SlideUpContainer,
  SlideUpItem,
} from "@/components/motion/slide-up";
import { CTAButton } from "@/components/shared/cta-button";
import { EditableText } from "@/components/cms/editable-text";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useMusicPlayer } from "@/providers/music-provider";
import { formatDuration, formatDate } from "@/lib/utils";
import {
  Search,
  Play,
  BookOpen,
  Camera,
  Quote,
  Music,
  ListPlus,
  Video,
  Star,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  MessageCircleHeart,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import type { WorshipService, MusicTrack, Testimony } from "@/types";

// ─── Services Tab (real worship service archive) ────────────────────
function ServicesTab({ services }: { services: WorshipService[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeYear, setActiveYear] = useState<string | null>(null);
  const [expandedService, setExpandedService] = useState<string | null>(null);

  const years = useMemo(() => {
    const yrs = new Set<string>();
    services.forEach((ws) => yrs.add(ws.date.slice(0, 4)));
    return Array.from(yrs).sort().reverse();
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter((ws) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        ws.title.toLowerCase().includes(term) ||
        ws.speaker.toLowerCase().includes(term) ||
        ws.date.includes(term) ||
        ws.scripture?.toLowerCase().includes(term) ||
        ws.sermon_title?.toLowerCase().includes(term) ||
        ws.description?.toLowerCase().includes(term) ||
        ws.videos.some((v) => v.description?.toLowerCase().includes(term));

      const matchesYear = !activeYear || ws.date.startsWith(activeYear);

      return matchesSearch && matchesYear;
    });
  }, [searchTerm, activeYear, services]);

  const serviceCount = filteredServices.length;

  return (
    <div className="space-y-8">
      {/* Search + Info */}
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
            <Input
              type="text"
              placeholder="Search by title, speaker, scripture, or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl border-warm-200 bg-white focus-visible:ring-purple-500"
            />
          </div>
          <p className="text-sm text-warm-500">
            {serviceCount} worship service{serviceCount !== 1 ? "s" : ""} archived
          </p>
        </div>
      </FadeIn>

      {/* Year Filters */}
      <FadeIn delay={0.1}>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActiveYear(null)} className="focus:outline-none">
            <Badge
              variant={activeYear === null ? "default" : "outline"}
              className={activeYear === null ? "bg-purple-700 text-white cursor-pointer" : "cursor-pointer hover:bg-warm-100"}
            >
              All Years
            </Badge>
          </button>
          {years.map((year) => (
            <button
              key={year}
              onClick={() => setActiveYear(activeYear === year ? null : year)}
              className="focus:outline-none"
            >
              <Badge
                variant={activeYear === year ? "default" : "outline"}
                className={activeYear === year ? "bg-purple-700 text-white cursor-pointer" : "cursor-pointer hover:bg-warm-100"}
              >
                {year}
              </Badge>
            </button>
          ))}
        </div>
      </FadeIn>

      {/* Service Cards */}
      {filteredServices.length === 0 ? (
        <FadeIn>
          <div className="rounded-xl border border-warm-200 bg-warm-50 p-12 text-center">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-warm-300" />
            <p className="text-warm-500">No services match your search.</p>
          </div>
        </FadeIn>
      ) : (
        <SlideUpContainer className="space-y-4">
          {filteredServices.map((service) => {
            const isExpanded = expandedService === service.id;
            const sermonVideo = service.videos.find((v) => v.type === "sermon");
            const hasYouTube = service.videos.some((v) => v.youtube_id);

            return (
              <SlideUpItem key={service.id}>
                <div className="overflow-hidden rounded-xl border border-warm-200 bg-white transition-all duration-300 hover:shadow-card-hover">
                  {/* Service Header */}
                  <button
                    onClick={() => setExpandedService(isExpanded ? null : service.id)}
                    className="flex w-full items-center gap-4 p-5 text-left focus:outline-none"
                  >
                    {/* Date Badge */}
                    <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-purple-100">
                      <span className="text-xs font-semibold uppercase text-purple-600">
                        {new Date(service.date + "T12:00:00").toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="text-lg font-bold text-purple-900 leading-tight">
                        {new Date(service.date + "T12:00:00").getDate()}
                      </span>
                    </div>

                    {/* Service Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-heading text-lg font-bold text-warm-900">
                          {service.title}
                        </h3>
                        {service.is_special && (
                          <Badge className="bg-gold-100 text-gold-700 border-gold-200 hover:bg-gold-100 text-xs">
                            <Star className="mr-1 h-3 w-3" />
                            Special
                          </Badge>
                        )}
                        {service.scripture && (
                          <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 text-xs">
                            <BookOpen className="mr-1 h-3 w-3" />
                            {service.scripture}
                          </Badge>
                        )}
                      </div>
                      {service.sermon_title && service.sermon_title !== service.title && (
                        <p className="mt-0.5 text-sm font-medium text-purple-700 italic">
                          &ldquo;{service.sermon_title}&rdquo;
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-4 text-sm text-warm-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {service.speaker}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(service.date)}
                        </span>
                        {service.description && (
                          <span className="text-warm-400">&mdash; {service.description}</span>
                        )}
                      </div>
                    </div>

                    {/* Video Count + Expand Arrow */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex items-center gap-1.5 text-sm text-warm-400">
                        <Video className="h-4 w-4" />
                        <span>{service.videos.length}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-warm-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-warm-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-warm-100 bg-warm-50/50 p-5">
                      {/* Service description & special notes */}
                      {service.special_notes && (
                        <div className="mb-4 flex items-start gap-2 rounded-lg bg-purple-50 border border-purple-100 p-3">
                          <Star className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-400" />
                          <p className="text-sm text-purple-700">{service.special_notes}</p>
                        </div>
                      )}

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {service.videos.map((video, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg border border-warm-200 bg-white p-4 transition-all hover:border-purple-200"
                          >
                            {video.youtube_id ? (
                              /* YouTube Embed */
                              <div className="mb-3 aspect-video overflow-hidden rounded-lg">
                                <iframe
                                  src={`https://www.youtube.com/embed/${video.youtube_id}`}
                                  title={video.label}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  className="h-full w-full"
                                  loading="lazy"
                                />
                              </div>
                            ) : (
                              /* Coming Soon Placeholder */
                              <div className="mb-3 flex aspect-video flex-col items-center justify-center rounded-lg bg-warm-100">
                                <Video className="mb-2 h-8 w-8 text-warm-300" />
                                <p className="text-xs text-warm-400">Coming to YouTube</p>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className={
                                  video.type === "sermon"
                                    ? "bg-purple-100 text-purple-700 text-xs"
                                    : video.type === "prayer"
                                    ? "bg-blue-100 text-blue-700 text-xs"
                                    : video.type === "scripture"
                                    ? "bg-green-100 text-green-700 text-xs"
                                    : "bg-gold-100 text-gold-700 text-xs"
                                }
                              >
                                {video.type === "sermon" ? "Sermon" :
                                 video.type === "prayer" ? "Prayer" :
                                 video.type === "scripture" ? "Scripture" : "Special"}
                              </Badge>
                              <span className="text-sm font-medium text-warm-700">{video.label}</span>
                            </div>
                            {video.description && (
                              <p className="mt-2 text-xs text-warm-500 italic">{video.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </SlideUpItem>
            );
          })}
        </SlideUpContainer>
      )}
    </div>
  );
}

// ─── Music Tab ───────────────────────────────────────────────────────
function MusicTab({ tracks }: { tracks: MusicTrack[] }) {
  const { play, addToQueue, setQueue } = useMusicPlayer();

  const playableTracks = tracks.filter((t) => t.audio_url);

  const handlePlayAll = () => {
    if (playableTracks.length > 0) {
      setQueue(playableTracks);
      play(playableTracks[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <FadeIn>
        <div className="flex flex-col gap-4 rounded-xl bg-purple-50 border border-purple-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-heading font-bold text-purple-900">Worship Music Collection</h3>
            <p className="mt-1 text-sm text-purple-700">
              {tracks.length} gospel and worship tracks from our church music library.
              Tracks will be available for streaming once uploaded.
            </p>
          </div>
          {playableTracks.length > 0 && (
            <button
              onClick={handlePlayAll}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-6 py-3 font-medium text-white shadow-lg shadow-purple-900/20 transition-all hover:bg-purple-600 flex-shrink-0"
            >
              <Play className="h-4 w-4 fill-current" />
              Play All
            </button>
          )}
        </div>
      </FadeIn>

      {/* Track List */}
      <SlideUpContainer className="space-y-3">
        {tracks.map((track) => (
          <SlideUpItem key={track.id}>
            <div className="group flex flex-col gap-4 rounded-xl border border-warm-200 bg-white p-4 transition-all duration-300 hover:shadow-card-hover sm:flex-row sm:items-center">
              {/* Play Button */}
              <button
                onClick={() => track.audio_url ? play(track) : undefined}
                aria-label={`Play ${track.title}`}
                className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
                  track.audio_url
                    ? "bg-purple-100 text-purple-700 hover:bg-purple-700 hover:text-white"
                    : "bg-warm-100 text-warm-300 cursor-default"
                }`}
              >
                <Play className="h-4 w-4 fill-current" />
              </button>

              {/* Track Info */}
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-heading font-bold text-warm-900">
                  {track.title}
                </h3>
                <p className="mt-0.5 truncate text-sm text-warm-500">
                  {track.artist}
                </p>
              </div>

              {/* Meta & Actions */}
              <div className="flex items-center gap-3 sm:flex-shrink-0">
                <Badge
                  variant="secondary"
                  className="bg-warm-100 text-warm-600 capitalize text-xs"
                >
                  {track.track_type}
                </Badge>
                <span className="text-sm text-warm-400">
                  {formatDuration(track.duration)}
                </span>
                {track.audio_url && (
                  <button
                    onClick={() => addToQueue(track)}
                    aria-label={`Add ${track.title} to queue`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-warm-200 px-3 py-1.5 text-xs font-medium text-warm-600 transition-colors hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
                  >
                    <ListPlus className="h-3.5 w-3.5" />
                    Queue
                  </button>
                )}
              </div>
            </div>
          </SlideUpItem>
        ))}
      </SlideUpContainer>
    </div>
  );
}

// ─── Gallery Tab ─────────────────────────────────────────────────────
function GalleryTab() {
  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="rounded-xl border border-warm-200 bg-warm-50 p-6 text-center">
          <ImageIcon className="mx-auto mb-2 h-8 w-8 text-warm-400" />
          <p className="text-warm-600">
            <EditableText id="media.gallery.placeholder" fallback="Photo gallery coming soon. Check back for images from our worship services and events." as="span" multiline />
          </p>
        </div>
      </FadeIn>

      <SlideUpContainer className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <SlideUpItem key={i}>
            <div className="flex aspect-square flex-col items-center justify-center rounded-xl bg-warm-100 text-warm-400 transition-colors hover:bg-warm-150">
              <Camera className="mb-3 h-10 w-10" />
              <p className="text-sm font-medium">Photo Coming Soon</p>
            </div>
          </SlideUpItem>
        ))}
      </SlideUpContainer>
    </div>
  );
}

// ─── Testimonies Tab ─────────────────────────────────────────────────
function TestimoniesTab({ testimonies }: { testimonies: Testimony[] }) {
  const approvedTestimonies = testimonies.filter((t) => t.is_approved);

  return (
    <div className="space-y-10">
      <SlideUpContainer className="grid gap-6 sm:grid-cols-2">
        {approvedTestimonies.map((testimony) => (
          <SlideUpItem key={testimony.id}>
            <div className="relative rounded-xl border border-warm-200 bg-white p-6 transition-all duration-300 hover:shadow-card-hover">
              <Quote className="absolute right-5 top-5 h-8 w-8 text-purple-100" />
              <h3 className="font-heading text-lg font-bold text-warm-900">
                {testimony.author_name}
              </h3>
              <p className="mt-1 text-sm text-warm-400">
                {formatDate(testimony.date)}
              </p>
              <p className="mt-4 line-clamp-4 text-warm-600 leading-relaxed">
                {testimony.content}
              </p>
            </div>
          </SlideUpItem>
        ))}
      </SlideUpContainer>

      <FadeIn>
        <div className="flex flex-col items-center gap-4 rounded-xl bg-warm-50 p-8 text-center">
          <MessageCircleHeart className="h-10 w-10 text-purple-400" />
          <div>
            <h3 className="font-heading text-lg font-bold text-warm-900">
              <EditableText id="media.testimonies.cta.heading" fallback="Has God been working in your life?" as="span" />
            </h3>
            <p className="mt-1 text-warm-500">
              <EditableText id="media.testimonies.cta.description" fallback="We would love to hear your testimony and share it with the church family." as="span" multiline />
            </p>
          </div>
          <CTAButton href="/contact" variant="primary">
            Share Your Testimony
          </CTAButton>
        </div>
      </FadeIn>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────
export default function MediaPage() {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<WorshipService[]>([]);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [sermonsRes, musicRes, testimoniesRes] = await Promise.all([
          fetch("/api/public/sermons"),
          fetch("/api/public/music"),
          fetch("/api/public/testimonies"),
        ]);
        const sermonsData = await sermonsRes.json();
        const musicData = await musicRes.json();
        const testimoniesData = await testimoniesRes.json();
        setServices(sermonsData.sermons ?? []);
        setTracks(musicData.music ?? musicData.tracks ?? []);
        setTestimonies(testimoniesData.testimonies ?? []);
      } catch (err) {
        console.error("Failed to load media:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <>
        <PageHero
          title={<EditableText id="media.hero.title" fallback="Media Center" as="span" />}
          subtitle={<EditableText id="media.hero.subtitle" fallback="Worship services, music, and testimonies to feed your spirit" as="span" />}
          breadcrumbs={[{ label: "Media" }]}
        />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHero
        title={<EditableText id="media.hero.title" fallback="Media Center" as="span" />}
        subtitle={<EditableText id="media.hero.subtitle" fallback="Worship services, music, and testimonies to feed your spirit" as="span" />}
        breadcrumbs={[{ label: "Media" }]}
      />

      <section className="section-padding">
        <div className="container-wide">
          <FadeIn>
            <Tabs defaultValue="services" className="w-full">
              <TabsList className="mb-8 flex w-full flex-wrap gap-1 bg-warm-100 p-1.5 rounded-xl h-auto">
                <TabsTrigger
                  value="services"
                  className="flex-1 gap-2 rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-purple-700 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  <Video className="h-4 w-4" />
                  Services
                </TabsTrigger>
                <TabsTrigger
                  value="music"
                  className="flex-1 gap-2 rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-purple-700 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  <Music className="h-4 w-4" />
                  Music
                </TabsTrigger>
                <TabsTrigger
                  value="gallery"
                  className="flex-1 gap-2 rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-purple-700 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  <Camera className="h-4 w-4" />
                  Gallery
                </TabsTrigger>
                <TabsTrigger
                  value="testimonies"
                  className="flex-1 gap-2 rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-purple-700 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  <Quote className="h-4 w-4" />
                  Testimonies
                </TabsTrigger>
              </TabsList>

              <TabsContent value="services">
                <ServicesTab services={services} />
              </TabsContent>

              <TabsContent value="music">
                <MusicTab tracks={tracks} />
              </TabsContent>

              <TabsContent value="gallery">
                <GalleryTab />
              </TabsContent>

              <TabsContent value="testimonies">
                <TestimoniesTab testimonies={testimonies} />
              </TabsContent>
            </Tabs>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
