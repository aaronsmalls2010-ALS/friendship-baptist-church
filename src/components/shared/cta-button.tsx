"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface CTAButtonProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "gold" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  icon?: ReactNode;
}

const variantClasses = {
  primary:
    "bg-purple-700 text-white hover:bg-purple-600 shadow-lg shadow-purple-900/20",
  secondary:
    "bg-peach-400 text-warm-900 hover:bg-peach-300 shadow-lg shadow-peach-900/10",
  gold: "bg-gold-400 text-warm-900 hover:bg-gold-300 shadow-lg shadow-gold-900/10 font-semibold",
  outline:
    "bg-transparent border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50",
};

const sizeClasses = {
  sm: "px-4 py-2 text-sm rounded-lg",
  md: "px-6 py-3 text-base rounded-xl",
  lg: "px-8 py-4 text-lg rounded-xl",
};

export function CTAButton({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  icon,
}: CTAButtonProps) {
  return (
    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
      <Link
        href={href}
        className={cn(
          "inline-flex items-center gap-2 font-medium transition-all duration-200",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
      >
        {icon}
        {children}
      </Link>
    </motion.div>
  );
}
