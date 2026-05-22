"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/hooks/use-auth";
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
  const { role } = useAuth();
  const isSuperAdmin = role === "super_admin";

  const [content, setContent] = useState<Map<string, string>>(new Map());
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch all site content on mount
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

  const toggleEditMode = useCallback(() => {
    if (!isSuperAdmin) return;
    setIsEditMode((prev) => !prev);
  }, [isSuperAdmin]);

  const updateContent = useCallback(
    async (id: string, value: string) => {
      if (!isSuperAdmin) return;

      try {
        const response = await fetch("/api/cms", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, content: value }),
        });

        if (!response.ok) {
          throw new Error("Failed to update content");
        }

        setContent((prev) => {
          const next = new Map(prev);
          next.set(id, value);
          return next;
        });
      } catch (err) {
        console.error("Failed to update CMS content:", err);
        throw err;
      }
    },
    [isSuperAdmin]
  );

  const getContent = useCallback(
    (id: string, fallback: string) => {
      return content.get(id) ?? fallback;
    },
    [content]
  );

  const value = useMemo<CMSContextType>(
    () => ({
      content,
      isEditMode,
      isSuperAdmin,
      toggleEditMode,
      updateContent,
      getContent,
    }),
    [content, isEditMode, isSuperAdmin, toggleEditMode, updateContent, getContent]
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
