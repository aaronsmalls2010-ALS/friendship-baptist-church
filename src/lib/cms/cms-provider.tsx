"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CMSContextType, SiteContent } from "@/lib/cms/types";

const CMSContext = createContext<CMSContextType>({
  content: new Map(),
  isEditMode: false,
  isSuperAdmin: false,
  toggleEditMode: () => {},
  updateContent: async () => {},
  getContent: (_id: string, fallback: string) => fallback,
});

export function CMSProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    async function fetchContent() {
      try {
        const response = await fetch("/api/cms");
        if (!response.ok) return;
        const data: SiteContent[] = await response.json();
        const map = new Map<string, string>();
        for (const item of data) {
          map.set(item.id, item.content);
        }
        setContent(map);
      } catch (err) {
        console.error("Failed to fetch CMS content:", err);
      }
    }

    fetchContent();
  }, []);

  const getContent = useCallback(
    (id: string, fallback: string) => {
      return content.get(id) ?? fallback;
    },
    [content]
  );

  const value = useMemo<CMSContextType>(
    () => ({
      content,
      isEditMode: false,
      isSuperAdmin: false,
      toggleEditMode: () => {},
      updateContent: async () => {},
      getContent,
    }),
    [content, getContent]
  );

  return <CMSContext.Provider value={value}>{children}</CMSContext.Provider>;
}

export function useCMS() {
  const context = useContext(CMSContext);
  if (!context) {
    throw new Error("useCMS must be used within a CMSProvider");
  }
  return context;
}
