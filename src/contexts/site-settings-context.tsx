"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

interface SiteSettingsContextValue {
  watchLiveEnabled: boolean;
  toggleWatchLive: (enabled: boolean) => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  watchLiveEnabled: true,
  toggleWatchLive: async () => {},
});

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [watchLiveEnabled, setWatchLiveEnabled] = useState(true);

  // Fetch the current setting on mount
  useEffect(() => {
    async function fetchSetting() {
      try {
        const res = await fetch("/api/admin/settings/watch-live");
        if (res.ok) {
          const data = await res.json();
          setWatchLiveEnabled(data.enabled);
        }
      } catch {
        // Default to true if fetch fails
        setWatchLiveEnabled(true);
      }
    }
    fetchSetting();
  }, []);

  const toggleWatchLive = useCallback(async (enabled: boolean) => {
    try {
      const res = await fetch("/api/admin/settings/watch-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (res.ok) {
        const data = await res.json();
        setWatchLiveEnabled(data.enabled);
      }
    } catch {
      // Silently fail — the UI will remain in its current state
    }
  }, []);

  return (
    <SiteSettingsContext.Provider value={{ watchLiveEnabled, toggleWatchLive }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
