"use client";

import { useState, useMemo } from "react";
import { PageHero } from "@/components/shared/page-hero";
import { FadeIn } from "@/components/motion/fade-in";
import {
  SlideUpContainer,
  SlideUpItem,
} from "@/components/motion/slide-up";
import { CTAButton } from "@/components/shared/cta-button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MOCK_SERMONS,
  MOCK_MUSIC_TRACKS,
  MOCK_TESTIMONIES,
} from "@/lib/mock-data";
import { useMusicPlayer } from "@/providers/music-provider";
import { formatDuration, formatDate } from "@/lib/utils";
import {
  Search,
  Play,
  Clock,
  BookOpen,
  Camera,
  Quote,
  Music,
  ListPlus,
  Mic2,
  Image as ImageIcon,
  MessageCircleHeart,
} from "lucide-react";

// ─── Sermons Tab ─────────────────────────────────────────────────────
function SermonsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  const allTopics = useMemo(() => {
    const topics = new Set<string>();
    MOCK_SERMONS.forEach((s) => s.topics.forEach((t) => topics.add(t)));
    return Array.from(topics).sort();
  }, []);

  const filteredSermons = useMemo(() => {
    return MOCK_SERMONS.filter((sermon) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        sermon.title.toLowerCase().includes(term) ||
        sermon.speaker.toLowerCase().includes(term) ||
        (sermon.scripture && sermon.scripture.toLowerCase().includes(term));

      const matchesTopic =
        !activeTopic || sermon.topics.includes(activeTopic);

      return matchesSearch && matchesTopic;
    });
  }, [searchTerm, activeTopic]);

  return (
    <div className="space-y-8">
      {/* Search */}
      <FadeIn>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
          <Input
            type="text"
            placeholder="Search sermons by title, speaker, or scripture..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-xl border-warm-200 bg-white focus-visible:ring-purple-500"
          />
        </div>
      </FadeIn>

      {/* Topic Filters */}
      <FadeIn delay={0.1}>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTopic(null)}
            className="focus:outline-none"
          >
            <Badge
              variant={activeTopic === null ? "default" : "outline"}
              className={
                activeTopic === null
                  ? "bg-purple-700 text-white cursor-pointer"
                  : "cursor-pointer hover:bg-warm-100"
              }
            >
              All Topics
            </Badge>
          </button>
          {allTopics.map((topic) => (
            <button
              key={topic}
              onClick={() =>
                setActiveTopic(activeTopic === topic ? null : topic)
              }
              className="focus:outline-none"
            >
              <Badge
                variant={activeTopic === topic ? "default" : "outline"}
                className={
                  activeTopic === topic
                    ? "bg-purple-700 text-white cursor-pointer"
                    : "cursor-pointer hover:bg-warm-100"
                }
              >
                {topic}
              </Badge>
            </button>
          ))}
        </div>
      </FadeIn>

      {/* Sermon Cards */}
      {filteredSermons.length === 0 ? (
        <FadeIn>
          <div className="rounded-xl border border-warm-200 bg-warm-50 p-12 text-center">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-warm-300" />
            <p className="text-warm-500">
              No sermons match your search. Try a different term or topic.
            </p>
          </div>
        </FadeIn>
      ) : (
        <SlideUpContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSermons.map((sermon) => (
            <SlideUpItem key={sermon.id}>
              <div className="group rounded-xl border border-warm-200 bg-white p-6 transition-all duration-300 hover:shadow-card-hover">
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="font-heading text-lg font-bold text-warm-900 leading-tight">
                    {sermon.title}
                  </h3>
                  <button
                    aria-label={`Play sermon: ${sermon.title}`}
                    className="ml-3 mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 transition-colors hover:bg-purple-700 hover:text-white"
                  >
                    <Play className="h-4 w-4 fill-current" />
                  </button>
                </div>

                <p className="text-sm font-medium text-warm-700">
                  {sermon.speaker}
                </p>
                <p className="mt-1 text-sm text-warm-500">
                  {formatDate(sermon.date)}
                </p>

                {sermon.scripture && (
                  <p className="mt-2 text-sm font-medium text-purple-700">
                    {sermon.scripture}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {sermon.topics.map((topic) => (
                    <Badge
                      key={topic}
                      variant="secondary"
                      className="bg-warm-100 text-warm-600 text-xs"
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>

                {sermon.duration && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-warm-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDuration(sermon.duration)}</span>
                  </div>
                )}
              </div>
            </SlideUpItem>
          ))}
        </SlideUpContainer>
      )}
    </div>
  );
}

// ─── Music Tab ───────────────────────────────────────────────────────
function MusicTab() {
  const { play, addToQueue, setQueue } = useMusicPlayer();

  const handlePlayAll = () => {
    setQueue(MOCK_MUSIC_TRACKS);
    play(MOCK_MUSIC_TRACKS[0]);
  };

  return (
    <div className="space-y-6">
      {/* Play All Button */}
      <FadeIn>
        <button
          onClick={handlePlayAll}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-6 py-3 font-medium text-white shadow-lg shadow-purple-900/20 transition-all hover:bg-purple-600"
        >
          <Play className="h-4 w-4 fill-current" />
          Play All
        </button>
      </FadeIn>

      {/* Track List */}
      <SlideUpContainer className="space-y-3">
        {MOCK_MUSIC_TRACKS.map((track) => (
          <SlideUpItem key={track.id}>
            <div className="group flex flex-col gap-4 rounded-xl border border-warm-200 bg-white p-4 transition-all duration-300 hover:shadow-card-hover sm:flex-row sm:items-center">
              {/* Play Button */}
              <button
                onClick={() => play(track)}
                aria-label={`Play ${track.title}`}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 transition-colors hover:bg-purple-700 hover:text-white"
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
                  {track.album && (
                    <span className="text-warm-300"> &middot; {track.album}</span>
                  )}
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
                <button
                  onClick={() => addToQueue(track)}
                  aria-label={`Add ${track.title} to queue`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-warm-200 px-3 py-1.5 text-xs font-medium text-warm-600 transition-colors hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
                >
                  <ListPlus className="h-3.5 w-3.5" />
                  Queue
                </button>
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
            Photo gallery coming soon. Check back for images from our worship
            services and events.
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
function TestimoniesTab() {
  const approvedTestimonies = MOCK_TESTIMONIES.filter((t) => t.is_approved);

  return (
    <div className="space-y-10">
      <SlideUpContainer className="grid gap-6 sm:grid-cols-2">
        {approvedTestimonies.map((testimony) => (
          <SlideUpItem key={testimony.id}>
            <div className="relative rounded-xl border border-warm-200 bg-white p-6 transition-all duration-300 hover:shadow-card-hover">
              {/* Decorative quote */}
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
              Has God been working in your life?
            </h3>
            <p className="mt-1 text-warm-500">
              We would love to hear your testimony and share it with the church
              family.
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
  return (
    <>
      <PageHero
        title="Media Center"
        subtitle="Sermons, music, and testimonies to feed your spirit"
        breadcrumbs={[{ label: "Media" }]}
      />

      <section className="section-padding">
        <div className="container-wide">
          <FadeIn>
            <Tabs defaultValue="sermons" className="w-full">
              <TabsList className="mb-8 flex w-full flex-wrap gap-1 bg-warm-100 p-1.5 rounded-xl h-auto">
                <TabsTrigger
                  value="sermons"
                  className="flex-1 gap-2 rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-purple-700 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  <Mic2 className="h-4 w-4" />
                  Sermons
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

              <TabsContent value="sermons">
                <SermonsTab />
              </TabsContent>

              <TabsContent value="music">
                <MusicTab />
              </TabsContent>

              <TabsContent value="gallery">
                <GalleryTab />
              </TabsContent>

              <TabsContent value="testimonies">
                <TestimoniesTab />
              </TabsContent>
            </Tabs>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
