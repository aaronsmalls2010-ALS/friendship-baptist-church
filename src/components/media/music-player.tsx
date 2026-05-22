"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Music,
  List,
} from "lucide-react";
import { useMusicPlayer } from "@/providers/music-provider";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function MusicPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    queue,
    isExpanded,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    setExpanded,
    play,
  } = useMusicPlayer();

  if (!currentTrack && queue.length === 0) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 lg:bottom-0 mb-[calc(env(safe-area-inset-bottom,0px))] lg:mb-0">
      {/* Expanded Player */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute bottom-full left-0 right-0 bg-purple-950 text-white p-6 rounded-t-2xl shadow-2xl"
          >
            <div className="container-narrow">
              {/* Track Info */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 bg-purple-800 rounded-xl flex items-center justify-center">
                  <Music className="h-10 w-10 text-purple-300" />
                </div>
                <h3 className="text-lg font-semibold">
                  {currentTrack?.title ?? "Select a track"}
                </h3>
                <p className="text-purple-300 text-sm">
                  {currentTrack?.artist}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div
                  className="relative h-1.5 bg-purple-800 rounded-full cursor-pointer group"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = (e.clientX - rect.left) / rect.width;
                    seek(pct * duration);
                  }}
                >
                  <div
                    className="absolute left-0 top-0 h-full bg-gold-400 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ left: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-purple-400">
                  <span>{formatDuration(currentTime)}</span>
                  <span>{formatDuration(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={previous}
                  className="p-2 text-purple-300 hover:text-white transition-colors"
                  aria-label="Previous track"
                >
                  <SkipBack className="h-5 w-5" />
                </button>
                <button
                  onClick={togglePlay}
                  className="p-4 bg-gold-400 text-purple-950 rounded-full hover:bg-gold-300 transition-colors"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 ml-0.5" />
                  )}
                </button>
                <button
                  onClick={next}
                  className="p-2 text-purple-300 hover:text-white transition-colors"
                  aria-label="Next track"
                >
                  <SkipForward className="h-5 w-5" />
                </button>
              </div>

              {/* Volume */}
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
                  className="text-purple-400 hover:text-white"
                  aria-label={volume > 0 ? "Mute" : "Unmute"}
                >
                  {volume > 0 ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-24 accent-gold-400"
                  aria-label="Volume"
                />
              </div>

              {/* Queue */}
              {queue.length > 1 && (
                <div className="mt-6">
                  <h4 className="flex items-center gap-2 text-sm font-medium text-purple-300 mb-2">
                    <List className="h-4 w-4" /> Queue
                  </h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {queue.map((track) => (
                      <button
                        key={track.id}
                        onClick={() => play(track)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                          track.id === currentTrack?.id
                            ? "bg-purple-800 text-gold-400"
                            : "text-purple-300 hover:bg-purple-900 hover:text-white"
                        )}
                      >
                        <span className="font-medium">{track.title}</span>
                        <span className="text-purple-500 ml-2">
                          {track.artist}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini Player */}
      <div className="glass border-t border-warm-200 dark:border-warm-800 hidden lg:block">
        <div className="container-wide py-2 flex items-center gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-3 min-w-0 w-60">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center shrink-0">
              <Music className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {currentTrack?.title ?? "Worship Music"}
              </p>
              <p className="text-xs text-warm-500 truncate">
                {currentTrack?.artist ?? "Select a track to play"}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={previous}
              className="p-1.5 text-warm-500 hover:text-purple-700 transition-colors"
              aria-label="Previous"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              onClick={togglePlay}
              className="p-2 bg-purple-700 text-white rounded-full hover:bg-purple-600 transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </button>
            <button
              onClick={next}
              className="p-1.5 text-warm-500 hover:text-purple-700 transition-colors"
              aria-label="Next"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs text-warm-500 w-10 text-right">
              {formatDuration(currentTime)}
            </span>
            <div
              className="flex-1 h-1 bg-warm-200 dark:bg-warm-700 rounded-full cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                seek(pct * duration);
              }}
            >
              <div
                className="h-full bg-purple-600 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-warm-500 w-10">
              {formatDuration(duration)}
            </span>
          </div>

          {/* Volume + Expand */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
              className="p-1.5 text-warm-500 hover:text-purple-700"
              aria-label={volume > 0 ? "Mute" : "Unmute"}
            >
              {volume > 0 ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => setExpanded(!isExpanded)}
              className="p-1.5 text-warm-500 hover:text-purple-700"
              aria-label={isExpanded ? "Collapse player" : "Expand player"}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
