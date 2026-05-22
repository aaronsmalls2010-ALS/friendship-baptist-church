import { cn } from "@/lib/utils";

interface TaglineProps {
  className?: string;
  variant?: "default" | "light" | "gold";
}

export function Tagline({ className, variant = "default" }: TaglineProps) {
  const colorClasses = {
    default: "text-purple-700 dark:text-purple-300",
    light: "text-white/90",
    gold: "text-gold-400",
  };

  return (
    <p
      className={cn(
        "font-scripture italic text-fluid-sm tracking-wide",
        colorClasses[variant],
        className
      )}
    >
      The Church That Christ Built
    </p>
  );
}
