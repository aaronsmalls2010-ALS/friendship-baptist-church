"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { MusicTrack } from "@/types";

interface MusicContextValue {
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: MusicTrack[];
  isExpanded: boolean;
  play: (track?: MusicTrack) => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  addToQueue: (track: MusicTrack) => void;
  setQueue: (tracks: MusicTrack[]) => void;
  setExpanded: (expanded: boolean) => void;
}

const MusicContext = createContext<MusicContextValue | null>(null);

export function useMusicPlayer() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusicPlayer must be used within a MusicProvider");
  }
  return context;
}

const SEED_TRACKS: MusicTrack[] = [
  {
    id: "seed-1",
    title: "Oh Lord I Want You To Help Me",
    artist: "Shirley Caesar",
    album: "Gospel Classics",
    audio_url: "/music/Shirley Caesar 1975 Oh Lord I Want You To Help Me.mp3",
    duration: 276,
    track_type: "gospel",
    created_at: "1975-01-01",
  },
];

export function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [queue, setQueueState] = useState<MusicTrack[]>(SEED_TRACKS);
  const [isExpanded, setExpanded] = useState(false);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
    });

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const play = useCallback(
    (track?: MusicTrack) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (track && track.id !== currentTrack?.id) {
        audio.src = track.audio_url;
        setCurrentTrack(track);
      }

      audio.play().then(() => setIsPlaying(true));
    },
    [currentTrack]
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else if (currentTrack) {
      play();
    } else if (queue.length > 0) {
      play(queue[0]);
    }
  }, [isPlaying, currentTrack, queue, play, pause]);

  const next = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    const nextTrack = queue[(currentIndex + 1) % queue.length];
    play(nextTrack);
  }, [currentTrack, queue, play]);

  const previous = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack || queue.length === 0) return;

    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    const prevTrack =
      queue[(currentIndex - 1 + queue.length) % queue.length];
    play(prevTrack);
  }, [currentTrack, queue, play]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  }, []);

  const addToQueue = useCallback((track: MusicTrack) => {
    setQueueState((prev) => [...prev, track]);
  }, []);

  const setQueue = useCallback((tracks: MusicTrack[]) => {
    setQueueState(tracks);
  }, []);

  return (
    <MusicContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        queue,
        isExpanded,
        play,
        pause,
        togglePlay,
        next,
        previous,
        seek,
        setVolume,
        addToQueue,
        setQueue,
        setExpanded,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}
