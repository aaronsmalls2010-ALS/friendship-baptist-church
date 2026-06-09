"use client";

import { useCMS } from "@/lib/cms/cms-provider";

interface EditableTextProps {
  id: string;
  fallback: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "blockquote";
  className?: string;
  multiline?: boolean;
}

export function EditableText({
  id,
  fallback,
  as: Tag = "p",
  className,
}: EditableTextProps) {
  const { getContent } = useCMS();
  const displayText = getContent(id, fallback);

  return <Tag className={className}>{displayText}</Tag>;
}
