export interface SiteContent {
  id: string; // e.g. "home.hero.title"
  content: string; // Text content or image URL
  content_type: "text" | "richtext" | "image";
  page: string; // e.g. "home", "about", "pastor"
  section: string; // e.g. "hero", "welcome", "footer"
  label: string; // Human-readable label for admin UI: "Hero Title"
  updated_at: string;
  updated_by?: string;
}

export interface CMSContextType {
  content: Map<string, string>;
  isEditMode: boolean;
  isSuperAdmin: boolean;
  toggleEditMode: () => void;
  updateContent: (id: string, value: string) => Promise<void>;
  getContent: (id: string, fallback: string) => string;
}
