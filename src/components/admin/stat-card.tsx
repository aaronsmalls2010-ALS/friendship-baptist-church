"use client";

import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendUp,
  className,
}: StatCardProps) {
  return (
    <FadeIn>
      <div
        className={cn(
          "rounded-xl border border-warm-100 bg-white p-6 dark:border-warm-800 dark:bg-warm-900",
          className
        )}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-warm-500">{label}</p>
            <p className="mt-1 text-fluid-2xl font-bold text-warm-900 dark:text-warm-50">
              {value}
            </p>
            {trend && (
              <p
                className={cn(
                  "mt-1 text-xs font-medium",
                  trendUp ? "text-green-600" : "text-warm-400"
                )}
              >
                {trend}
              </p>
            )}
          </div>
          <div className="rounded-lg bg-purple-50 p-2.5 dark:bg-purple-900/30">
            <Icon className="h-5 w-5 text-purple-600" />
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
