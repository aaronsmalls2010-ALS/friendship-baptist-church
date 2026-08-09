"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  List,
  BookOpen,
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
  Loader2,
  Archive,
} from "lucide-react";
import { MOCK_MUSIC_TRACKS } from "@/lib/mock-data";
import type { WorshipService, MusicTrack, Testimony } from "@/types";

const VALID_TABS = ["services", "music", "testimonies", "archives"] as const;
type MediaTab = (typeof VALID_TABS)[number];

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
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    play,
    pause,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    addToQueue,
    setQueue,
  } = useMusicPlayer();
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [showQueue, setShowQueue] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const playableTracks = tracks.filter((t) => t.audio_url);
  const trackTypes = ["all", ...Array.from(new Set(tracks.map((t) => t.track_type))).sort()];

  const filteredTracks = activeFilter === "all"
    ? tracks
    : tracks.filter((t) => t.track_type === activeFilter);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const currentIndex = currentTrack
    ? playableTracks.findIndex((t) => t.id === currentTrack.id)
    : -1;

  const handlePlayAll = () => {
    const toPlay = activeFilter === "all" ? playableTracks : playableTracks.filter((t) => t.track_type === activeFilter);
    if (toPlay.length > 0) {
      setQueue(toPlay);
      play(toPlay[0]);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(pct * duration);
  };

  const totalDuration = filteredTracks.reduce((sum, t) => sum + t.duration, 0);
  const totalHours = Math.floor(totalDuration / 3600);
  const totalMins = Math.floor((totalDuration % 3600) / 60);

  return (
    <div className="space-y-6">
      {/* ── Hero Player ─────────────────────────────────────────────── */}
      <FadeIn>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 p-6 sm:p-8 shadow-2xl">
          {/* Ambient glow effects */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-gold-500/10 blur-3xl" />
          {currentTrack && isPlaying && (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-purple-500/5 via-transparent to-transparent animate-pulse" style={{ animationDuration: "3s" }} />
          )}

          <div className="relative z-10">
            {/* Top bar: collection info + play all */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-heading font-bold text-white tracking-wide">
                  Worship Music
                </h3>
                <p className="text-sm text-purple-300/80 mt-0.5">
                  {filteredTracks.length} tracks
                  {totalHours > 0 ? ` · ${totalHours}h ${totalMins}m` : ` · ${totalMins} min`}
                </p>
              </div>
              {playableTracks.length > 0 && (
                <button
                  onClick={handlePlayAll}
                  className="group flex items-center gap-2 rounded-full bg-gold-400 px-5 py-2.5 text-sm font-semibold text-purple-950 shadow-lg shadow-gold-500/25 transition-all hover:bg-gold-300 hover:shadow-gold-400/40 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Play className="h-4 w-4 fill-current transition-transform group-hover:scale-110" />
                  Play All
                </button>
              )}
            </div>

            {/* Now Playing display */}
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
              {/* Album art / visualizer */}
              <div className="relative flex-shrink-0">
                <div className={`relative h-28 w-28 sm:h-36 sm:w-36 rounded-2xl bg-gradient-to-br from-purple-700 to-purple-800 flex items-center justify-center shadow-2xl shadow-purple-950/50 border border-purple-600/30 ${currentTrack && isPlaying ? "" : ""}`}>
                  {currentTrack && isPlaying ? (
                    <div className="flex items-end gap-1 h-12">
                      {[0.6, 1, 0.4, 0.8, 0.5, 0.9, 0.3].map((h, i) => (
                        <div
                          key={i}
                          className="w-1.5 rounded-full bg-gradient-to-t from-gold-400 to-gold-300"
                          style={{
                            height: `${h * 100}%`,
                            animation: `musicBar 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <Music className="h-12 w-12 text-purple-400/60" />
                  )}
                  {/* Track number badge */}
                  {currentTrack && (
                    <div className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-gold-400 text-purple-950 flex items-center justify-center text-xs font-bold shadow-lg">
                      {currentIndex + 1}
                    </div>
                  )}
                </div>
              </div>

              {/* Track info */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                {currentTrack ? (
                  <>
                    <p className="text-xs font-medium uppercase tracking-widest text-gold-400/80 mb-1">
                      Now Playing
                    </p>
                    <h4 className="text-xl sm:text-2xl font-heading font-bold text-white leading-tight truncate">
                      {currentTrack.title}
                    </h4>
                    <p className="text-base text-purple-200/80 mt-1 truncate">
                      {currentTrack.artist}
                    </p>
                    <div className="flex items-center gap-3 mt-2 justify-center sm:justify-start">
                      {currentTrack.album && (
                        <span className="text-xs text-purple-400/70">{currentTrack.album}</span>
                      )}
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-800/60 px-2.5 py-0.5 text-xs font-medium text-purple-200 capitalize border border-purple-700/40">
                        {currentTrack.track_type}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-medium uppercase tracking-widest text-purple-400/60 mb-1">
                      Ready to Play
                    </p>
                    <h4 className="text-xl font-heading font-bold text-purple-300">
                      Select a Track
                    </h4>
                    <p className="text-sm text-purple-400/60 mt-1">
                      Choose from {playableTracks.length} worship and gospel tracks
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-5">
              <div
                ref={progressRef}
                className="group relative h-2 bg-purple-800/60 rounded-full cursor-pointer overflow-hidden"
                onClick={handleSeek}
              >
                {/* Buffer/glow track */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-gold-400 via-gold-300 to-gold-400 transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
                {/* Glow on the leading edge */}
                {currentTrack && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-gold-300 shadow-lg shadow-gold-400/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ left: `calc(${progress}% - 8px)` }}
                  />
                )}
              </div>
              <div className="flex justify-between mt-1.5 text-xs font-mono text-purple-400/70 tabular-nums">
                <span>{formatDuration(currentTime)}</span>
                <span>{currentTrack ? `-${formatDuration(Math.max(0, duration - currentTime))}` : formatDuration(0)}</span>
              </div>
            </div>

            {/* Transport controls */}
            <div className="flex items-center justify-center gap-4 sm:gap-6">
              {/* Shuffle placeholder - visual only for now */}
              <button
                className="p-2 text-purple-400/50 hover:text-purple-200 transition-colors"
                aria-label="Shuffle"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                </svg>
              </button>

              <button
                onClick={previous}
                className="p-2.5 text-purple-200 hover:text-white transition-all hover:scale-110 active:scale-95"
                aria-label="Previous track"
              >
                <SkipBack className="h-5 w-5 fill-current" />
              </button>

              <button
                onClick={togglePlay}
                className="relative p-4 rounded-full bg-gradient-to-br from-gold-400 to-gold-500 text-purple-950 shadow-xl shadow-gold-500/30 transition-all hover:shadow-gold-400/50 hover:scale-105 active:scale-95"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="h-7 w-7" />
                ) : (
                  <Play className="h-7 w-7 ml-0.5" />
                )}
                {/* Pulse ring when playing */}
                {isPlaying && (
                  <span className="absolute inset-0 rounded-full border-2 border-gold-400/40 animate-ping" style={{ animationDuration: "2s" }} />
                )}
              </button>

              <button
                onClick={next}
                className="p-2.5 text-purple-200 hover:text-white transition-all hover:scale-110 active:scale-95"
                aria-label="Next track"
              >
                <SkipForward className="h-5 w-5 fill-current" />
              </button>

              {/* Repeat placeholder */}
              <button
                className="p-2 text-purple-400/50 hover:text-purple-200 transition-colors"
                aria-label="Repeat"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m17 2 4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
              </button>
            </div>

            {/* Volume + Queue toggle row */}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-purple-800/40">
              {/* Volume control */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
                  className="p-1 text-purple-300/70 hover:text-white transition-colors"
                  aria-label={volume > 0 ? "Mute" : "Unmute"}
                >
                  {volume > 0 ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                </button>
                <div className="relative w-24 group">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-1.5 appearance-none bg-purple-800/60 rounded-full outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold-400 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:shadow-gold-500/30 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                    aria-label="Volume"
                  />
                </div>
                <span className="text-xs font-mono text-purple-400/60 w-8 tabular-nums">
                  {Math.round(volume * 100)}%
                </span>
              </div>

              {/* Queue toggle */}
              <button
                onClick={() => setShowQueue(!showQueue)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  showQueue
                    ? "bg-gold-400/20 text-gold-300 border border-gold-400/30"
                    : "text-purple-300/60 hover:text-purple-100 border border-purple-700/30 hover:border-purple-600/50"
                }`}
              >
                <List className="h-3.5 w-3.5" />
                Queue
              </button>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* CSS for music bars animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes musicBar {
          0% { height: 20%; }
          100% { height: 100%; }
        }
      `}} />

      {/* ── Queue Panel (collapsible) ───────────────────────────────── */}
      {showQueue && playableTracks.length > 0 && (
        <FadeIn>
          <div className="rounded-xl bg-purple-950/90 border border-purple-800/40 p-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-purple-200 flex items-center gap-2">
                <List className="h-4 w-4 text-gold-400" />
                Up Next
              </h4>
              <span className="text-xs text-purple-400">{playableTracks.length} tracks</span>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
              {playableTracks.map((track, idx) => {
                const isCurrent = track.id === currentTrack?.id;
                return (
                  <button
                    key={track.id}
                    onClick={() => play(track)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-all ${
                      isCurrent
                        ? "bg-purple-800/60 border border-purple-600/30"
                        : "hover:bg-purple-800/30"
                    }`}
                  >
                    <span className={`w-6 text-center text-xs font-mono ${isCurrent ? "text-gold-400" : "text-purple-500"}`}>
                      {isCurrent && isPlaying ? "▶" : idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isCurrent ? "text-gold-300" : "text-purple-100"}`}>
                        {track.title}
                      </p>
                      <p className="text-xs text-purple-400 truncate">{track.artist}</p>
                    </div>
                    <span className="text-xs font-mono text-purple-500 tabular-nums flex-shrink-0">
                      {formatDuration(track.duration)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </FadeIn>
      )}

      {/* ── Genre Filters ───────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {trackTypes.map((type) => (
          <button
            key={type}
            onClick={() => setActiveFilter(type)}
            className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-all ${
              activeFilter === type
                ? "bg-purple-700 text-white shadow-md"
                : "bg-warm-100 text-warm-700 hover:bg-warm-200 dark:bg-warm-800 dark:text-warm-300"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* ── Track Listing ───────────────────────────────────────────── */}
      <SlideUpContainer className="space-y-2">
        {filteredTracks.map((track, idx) => {
          const isCurrent = track.id === currentTrack?.id;
          const isCurrentPlaying = isCurrent && isPlaying;

          return (
            <SlideUpItem key={track.id}>
              <div
                className={`group flex items-center gap-4 rounded-xl p-4 transition-all duration-200 cursor-pointer ${
                  isCurrent
                    ? "bg-purple-50 border-2 border-purple-200 shadow-sm dark:bg-purple-950/30 dark:border-purple-800"
                    : "bg-white border border-warm-100 hover:border-purple-200 hover:shadow-card-hover dark:bg-warm-900 dark:border-warm-800"
                }`}
                onClick={() => {
                  if (track.audio_url) {
                    if (isCurrent) {
                      togglePlay();
                    } else {
                      play(track);
                    }
                  }
                }}
              >
                {/* Track number / play indicator */}
                <div className="w-8 flex-shrink-0 text-center">
                  {isCurrentPlaying ? (
                    <div className="flex items-end justify-center gap-0.5 h-4 mx-auto">
                      {[0.5, 1, 0.6].map((h, i) => (
                        <div
                          key={i}
                          className="w-1 rounded-full bg-purple-600"
                          style={{
                            height: `${h * 100}%`,
                            animation: `musicBar 0.6s ease-in-out ${i * 0.15}s infinite alternate`,
                          }}
                        />
                      ))}
                    </div>
                  ) : isCurrent ? (
                    <Pause className="h-4 w-4 mx-auto text-purple-600" />
                  ) : (
                    <span className="text-sm font-mono text-warm-400 group-hover:hidden">{idx + 1}</span>
                  )}
                  {!isCurrent && track.audio_url && (
                    <Play className="h-4 w-4 mx-auto text-purple-600 hidden group-hover:block fill-current" />
                  )}
                </div>

                {/* Track info */}
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-semibold truncate ${isCurrent ? "text-purple-700 dark:text-purple-300" : "text-warm-900 dark:text-warm-50"}`}>
                    {track.title}
                  </h3>
                  <p className="text-xs text-warm-500 truncate mt-0.5">{track.artist}</p>
                </div>

                {/* Type badge */}
                <Badge
                  variant="secondary"
                  className={`hidden sm:inline-flex text-xs capitalize ${
                    isCurrent
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-200"
                      : "bg-warm-100 text-warm-500"
                  }`}
                >
                  {track.track_type}
                </Badge>

                {/* Duration */}
                <span className={`text-xs font-mono tabular-nums flex-shrink-0 ${isCurrent ? "text-purple-600 dark:text-purple-300" : "text-warm-400"}`}>
                  {formatDuration(track.duration)}
                </span>

                {/* Queue action */}
                {track.audio_url && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToQueue(track);
                    }}
                    aria-label={`Add ${track.title} to queue`}
                    className="flex-shrink-0 p-1.5 rounded-lg text-warm-400 opacity-0 group-hover:opacity-100 hover:bg-purple-100 hover:text-purple-600 transition-all dark:hover:bg-purple-900/30"
                  >
                    <ListPlus className="h-4 w-4" />
                  </button>
                )}
              </div>
            </SlideUpItem>
          );
        })}
      </SlideUpContainer>
    </div>
  );
}

// ─── Gallery Tab ─────────────────────────────────────────────────────
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

// ─── Archives Tab (services older than 1 year) ─────────────────────
function ArchivesTab({ services }: { services: WorshipService[] }) {
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
      {/* Header */}
      <FadeIn>
        <div className="rounded-xl bg-warm-50 border border-warm-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Archive className="h-5 w-5 text-warm-500" />
            <h3 className="font-heading font-bold text-warm-800">Sermon Archives</h3>
          </div>
          <p className="text-sm text-warm-500">
            Worship services and sermons from more than one year ago. Browse our rich history of faithful preaching and worship.
          </p>
        </div>
      </FadeIn>

      {/* Search + Info */}
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
            <Input
              type="text"
              placeholder="Search archives by title, speaker, scripture..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl border-warm-200 bg-white focus-visible:ring-purple-500"
            />
          </div>
          <p className="text-sm text-warm-500">
            {serviceCount} archived service{serviceCount !== 1 ? "s" : ""}
          </p>
        </div>
      </FadeIn>

      {/* Year Filters */}
      {years.length > 0 && (
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
      )}

      {/* Service Cards */}
      {filteredServices.length === 0 ? (
        <FadeIn>
          <div className="rounded-xl border border-warm-200 bg-warm-50 p-12 text-center">
            <Archive className="mx-auto mb-3 h-10 w-10 text-warm-300" />
            <p className="text-warm-500">
              {services.length === 0
                ? "No archived services yet. Services older than one year will appear here automatically."
                : "No archived services match your search."}
            </p>
          </div>
        </FadeIn>
      ) : (
        <SlideUpContainer className="space-y-4">
          {filteredServices.map((service) => {
            const isExpanded = expandedService === service.id;

            return (
              <SlideUpItem key={service.id}>
                <div className="overflow-hidden rounded-xl border border-warm-200 bg-white transition-all duration-300 hover:shadow-card-hover">
                  <button
                    onClick={() => setExpandedService(isExpanded ? null : service.id)}
                    className="flex w-full items-center gap-4 p-5 text-left focus:outline-none"
                  >
                    <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-warm-100">
                      <span className="text-xs font-semibold uppercase text-warm-500">
                        {new Date(service.date + "T12:00:00").toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="text-lg font-bold text-warm-700 leading-tight">
                        {new Date(service.date + "T12:00:00").getDate()}
                      </span>
                    </div>
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
                      </div>
                    </div>
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

                  {isExpanded && (
                    <div className="border-t border-warm-100 bg-warm-50/50 p-5">
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

// ─── Main Page (wrapped in Suspense for useSearchParams) ────────────
export default function MediaPage() {
  return (
    <Suspense
      fallback={
        <>
          <PageHero
            title="Media Center"
            subtitle="Worship services, music, and testimonies to feed your spirit"
            breadcrumbs={[{ label: "Media" }]}
          />
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        </>
      }
    >
      <MediaPageInner />
    </Suspense>
  );
}

function MediaPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allServices, setAllServices] = useState<WorshipService[]>([]);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);

  // Read initial tab from URL ?tab= parameter
  const tabParam = searchParams.get("tab");
  const initialTab: MediaTab =
    tabParam && VALID_TABS.includes(tabParam as MediaTab)
      ? (tabParam as MediaTab)
      : "services";
  const [activeTab, setActiveTab] = useState<MediaTab>(initialTab);

  // Update tab when URL changes (e.g. back/forward navigation)
  useEffect(() => {
    const newTab = searchParams.get("tab");
    if (newTab && VALID_TABS.includes(newTab as MediaTab)) {
      setActiveTab(newTab as MediaTab);
    }
  }, [searchParams]);

  // Update URL when tab changes via click
  function handleTabChange(value: string) {
    const tab = value as MediaTab;
    setActiveTab(tab);
    // Update URL without full navigation
    const url = tab === "services" ? "/media" : `/media?tab=${tab}`;
    router.replace(url, { scroll: false });
  }

  // Split services into recent (< 1 year) and archived (>= 1 year)
  const oneYearAgo = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const recentServices = useMemo(
    () => allServices.filter((s) => s.date >= oneYearAgo),
    [allServices, oneYearAgo]
  );

  const archivedServices = useMemo(
    () => allServices.filter((s) => s.date < oneYearAgo),
    [allServices, oneYearAgo]
  );

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
        setAllServices(sermonsData.sermons ?? []);
        const apiTracks = musicData.music ?? musicData.tracks ?? [];
        setTracks(apiTracks.length > 0 ? apiTracks : MOCK_MUSIC_TRACKS);
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
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
                  value="testimonies"
                  className="flex-1 gap-2 rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-purple-700 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  <Quote className="h-4 w-4" />
                  Testimonies
                </TabsTrigger>
                <TabsTrigger
                  value="archives"
                  className="flex-1 gap-2 rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-purple-700 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  <Archive className="h-4 w-4" />
                  Archives
                </TabsTrigger>
              </TabsList>

              <TabsContent value="services">
                <ServicesTab services={recentServices} />
              </TabsContent>

              <TabsContent value="music">
                <MusicTab tracks={tracks} />
              </TabsContent>

              <TabsContent value="testimonies">
                <TestimoniesTab testimonies={testimonies} />
              </TabsContent>

              <TabsContent value="archives">
                <ArchivesTab services={archivedServices} />
              </TabsContent>
            </Tabs>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
