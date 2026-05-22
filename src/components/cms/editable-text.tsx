"use client";

import { useState, useRef, useEffect, type ElementType } from "react";
import { Pencil, Check, X } from "lucide-react";
import { useCMS } from "@/lib/cms/cms-provider";
import { cn } from "@/lib/utils";

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
  multiline = false,
}: EditableTextProps) {
  const { isEditMode, isSuperAdmin, getContent, updateContent } = useCMS();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const displayText = getContent(id, fallback);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Not in edit mode or not super admin — zero overhead render
  if (!isEditMode || !isSuperAdmin) {
    return <Tag className={className}>{displayText}</Tag>;
  }

  const handleEdit = () => {
    setEditValue(displayText);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateContent(id, editValue);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue("");
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel();
    }
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Enter" && e.metaKey && multiline) {
      e.preventDefault();
      handleSave();
    }
  };

  if (isEditing) {
    return (
      <div className="relative">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={4}
            className={cn(
              "w-full rounded-lg border border-purple-300 bg-white px-3 py-2 text-warm-900 shadow-lg outline-none ring-2 ring-purple-400 focus:ring-purple-500",
              className
            )}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-full rounded-lg border border-purple-300 bg-white px-3 py-2 text-warm-900 shadow-lg outline-none ring-2 ring-purple-400 focus:ring-purple-500",
              className
            )}
          />
        )}
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-purple-600 disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            {isSaving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-warm-200 px-3 py-1.5 text-xs font-medium text-warm-700 transition-colors hover:bg-warm-300 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      <Tag
        className={cn(
          "ring-2 ring-dashed ring-purple-400/50 rounded transition-all",
          className
        )}
      >
        {displayText}
      </Tag>
      <button
        onClick={handleEdit}
        className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-purple-600 text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100"
        aria-label={`Edit ${id}`}
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
