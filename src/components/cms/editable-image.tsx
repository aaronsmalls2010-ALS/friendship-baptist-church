"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Upload, X, Check, Link } from "lucide-react";
import { useCMS } from "@/lib/cms/cms-provider";
import { cn } from "@/lib/utils";

interface EditableImageProps {
  id: string;
  fallback: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export function EditableImage({
  id,
  fallback,
  alt,
  fill,
  width,
  height,
  className,
  sizes,
  priority,
}: EditableImageProps) {
  const { isEditMode, isSuperAdmin, getContent, updateContent } = useCMS();
  const [isEditing, setIsEditing] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageSrc = getContent(id, fallback);

  // Build shared image props
  const imageProps = {
    src: imageSrc,
    alt,
    className,
    sizes,
    priority,
    ...(fill ? { fill: true as const } : { width, height }),
  };

  // Not in edit mode — render normal Image with zero overhead
  if (!isEditMode || !isSuperAdmin) {
    return <Image {...imageProps} />;
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/cms/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      await updateContent(id, data.url);
      setIsEditing(false);
    } catch (error) {
      console.error("Image upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSave = async () => {
    if (!urlValue.trim()) return;
    setIsSaving(true);
    try {
      await updateContent(id, urlValue.trim());
      setIsEditing(false);
      setUrlValue("");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setUrlValue("");
  };

  return (
    <div className="group relative">
      <Image {...imageProps} />

      {/* Camera overlay button */}
      {!isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30"
          aria-label={`Edit image ${id}`}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            <Camera className="h-5 w-5" />
          </span>
        </button>
      )}

      {/* Edit popover */}
      {isEditing && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 rounded-xl border border-warm-200 bg-white p-4 shadow-xl">
          {/* Current preview */}
          <div className="mb-3">
            <p className="mb-1.5 text-xs font-medium text-warm-500">
              Current Image
            </p>
            <div className="relative h-20 w-32 overflow-hidden rounded-lg bg-warm-100">
              <Image
                src={imageSrc}
                alt="Current"
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
          </div>

          {/* Upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-purple-300 bg-purple-50 px-4 py-2.5 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-100 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? "Uploading…" : "Upload New Image"}
          </button>

          {/* Divider */}
          <div className="mb-3 flex items-center gap-2">
            <div className="h-px flex-1 bg-warm-200" />
            <span className="text-xs text-warm-400">or</span>
            <div className="h-px flex-1 bg-warm-200" />
          </div>

          {/* URL input */}
          <div className="mb-3">
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-warm-500">
              <Link className="h-3 w-3" />
              Paste Image URL
            </label>
            <input
              type="url"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full rounded-lg border border-warm-300 bg-white px-3 py-2 text-sm text-warm-900 outline-none ring-purple-400 placeholder:text-warm-400 focus:ring-2"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUrlSave();
                if (e.key === "Escape") handleCancel();
              }}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleUrlSave}
              disabled={!urlValue.trim() || isSaving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-purple-600 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              {isSaving ? "Saving…" : "Save URL"}
            </button>
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 rounded-lg bg-warm-200 px-3 py-1.5 text-xs font-medium text-warm-700 transition-colors hover:bg-warm-300"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
