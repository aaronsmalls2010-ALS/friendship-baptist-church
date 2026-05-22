import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: ReactNode;
  subtitle?: ReactNode;
  centered?: boolean;
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  centered = true,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn(centered && "text-center", "mb-10 lg:mb-14", className)}>
      <h2 className="text-fluid-3xl font-bold text-warm-900 dark:text-warm-50">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-fluid-base text-warm-600 dark:text-warm-400 max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
      <div
        className={cn(
          "mt-4 h-1 w-16 rounded-full bg-gradient-purple",
          centered && "mx-auto"
        )}
      />
    </div>
  );
}
