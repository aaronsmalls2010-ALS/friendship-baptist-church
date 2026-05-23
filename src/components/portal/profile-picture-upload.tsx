"use client";

import { useState, useCallback, useRef } from "react";
import Cropper, { type Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, ZoomIn, ZoomOut, RotateCw, Upload, X, Loader2 } from "lucide-react";

interface ProfilePictureUploadProps {
  currentPhotoUrl?: string;
  initials: string;
  onSave: (croppedImageDataUrl: string) => void;
}

// Canvas helper: crop image and return data URL
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<string> {
  const image = new Image();
  image.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  const size = Math.min(pixelCrop.width, pixelCrop.height, 512);
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not available");

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size
  );

  return canvas.toDataURL("image/jpeg", 0.9);
}

export function ProfilePictureUpload({
  currentPhotoUrl,
  initials,
  onSave,
}: ProfilePictureUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) return;

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setIsOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setSaving(true);
    try {
      const croppedDataUrl = await getCroppedImg(imageSrc, croppedAreaPixels);
      onSave(croppedDataUrl);
      setIsOpen(false);
      setImageSrc(null);
    } catch {
      // Silently fail crop — user can retry
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setImageSrc(null);
  };

  return (
    <>
      {/* Profile Picture Display + Upload Trigger */}
      <div className="relative group">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-peach-100 ring-4 ring-white shadow-lg overflow-hidden sm:h-28 sm:w-28">
          {currentPhotoUrl ? (
            <img
              src={currentPhotoUrl}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-heading text-2xl font-bold text-purple-400 sm:text-3xl">
              {initials}
            </span>
          )}
        </div>

        {/* Camera overlay on hover */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-all duration-300 group-hover:bg-black/40"
          aria-label="Upload profile picture"
        >
          <Camera className="h-6 w-6 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="mt-2 text-xs text-purple-600 hover:text-purple-800 transition-colors"
      >
        Change Photo
      </button>

      {/* Crop Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Adjust Your Photo
            </DialogTitle>
          </DialogHeader>

          {imageSrc && (
            <div className="space-y-4">
              {/* Crop Area */}
              <div className="relative h-72 w-full overflow-hidden rounded-xl bg-warm-100 sm:h-80">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              {/* Controls */}
              <div className="space-y-3">
                {/* Zoom */}
                <div className="flex items-center gap-3">
                  <ZoomOut className="h-4 w-4 flex-shrink-0 text-warm-400" />
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 accent-purple-600"
                    aria-label="Zoom"
                  />
                  <ZoomIn className="h-4 w-4 flex-shrink-0 text-warm-400" />
                </div>

                {/* Rotate */}
                <div className="flex items-center justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="gap-2 text-xs"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    Rotate
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-warm-100 pt-4">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2 bg-purple-700 hover:bg-purple-600"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {saving ? "Saving..." : "Save Photo"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
