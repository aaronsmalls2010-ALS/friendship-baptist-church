"use client";

import Image from "next/image";
import { useCMS } from "@/lib/cms/cms-provider";

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
  const { getContent } = useCMS();
  const imageSrc = getContent(id, fallback);

  const imageProps = {
    src: imageSrc,
    alt,
    className,
    sizes,
    priority,
    ...(fill ? { fill: true as const } : { width, height }),
  };

  return <Image {...imageProps} />;
}
