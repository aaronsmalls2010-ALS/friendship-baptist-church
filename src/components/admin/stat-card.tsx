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
          "rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-150 hover:shadow-md dark:border-slate-800 dark:bg-slate-900",
          className
        )}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {label}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-slate-900 dark:text-slate-50">
              {value}
            </p>
            {trend && (
              <p
                className={cn(
                  "mt-1 text-xs font-medium tabular-nums",
                  trendUp ? "text-green-600" : "text-slate-400"
                )}
              >
                {trend}
              </p>
            )}
          </div>
          <div className="rounded-lg bg-purple-50 p-2.5 dark:bg-purple-900/30">
            <Icon className="h-5 w-5 text-purple-600 dark:text-purple-300" />
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
