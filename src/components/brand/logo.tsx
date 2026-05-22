"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "full" | "icon" | "wordmark";
  size?: "sm" | "md" | "lg";
  className?: string;
  asLink?: boolean;
  darkBg?: boolean;
}

const sizes = {
  sm: { full: { w: 160, h: 45 }, icon: { w: 40, h: 40 }, wordmark: { w: 140, h: 50 } },
  md: { full: { w: 240, h: 68 }, icon: { w: 56, h: 56 }, wordmark: { w: 200, h: 70 } },
  lg: { full: { w: 360, h: 102 }, icon: { w: 80, h: 80 }, wordmark: { w: 280, h: 98 } },
};

const sources = {
  full: { light: "/images/logos/fbc-logo-light.png", dark: "/images/logos/fbc-logo-dark.png" },
  icon: { light: "/images/logos/fbc-icon.png", dark: "/images/logos/fbc-icon.png" },
  wordmark: { light: "/images/logos/fbc-wordmark-color.png", dark: "/images/logos/fbc-wordmark-color.png" },
};

export function Logo({
  variant = "full",
  size = "md",
  className,
  asLink = true,
  darkBg = false,
}: LogoProps) {
  const dims = sizes[size][variant];
  const src = darkBg ? sources[variant].dark : sources[variant].light;

  const image = (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn("relative inline-block", className)}
    >
      <Image
        src={src}
        alt="The Friendship Baptist Church — The Church That Christ Built"
        width={dims.w}
        height={dims.h}
        priority
        className="h-auto w-auto object-contain"
        style={{ maxWidth: dims.w, maxHeight: dims.h }}
      />
    </motion.div>
  );

  if (asLink) {
    return (
      <Link href="/" aria-label="Return to homepage">
        {image}
      </Link>
    );
  }

  return image;
}
