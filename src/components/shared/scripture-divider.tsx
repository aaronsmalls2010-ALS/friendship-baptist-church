"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScriptureDividerProps {
  text: string;
  reference: string;
  className?: string;
  variant?: "purple" | "warm" | "gold";
}

const variantClasses = {
  purple: "bg-purple-700",
  warm: "bg-gradient-warm",
  gold: "bg-gradient-gold",
};

const textColor = {
  purple: "text-white",
  warm: "text-white",
  gold: "text-warm-900",
};

const refColor = {
  purple: "text-purple-200",
  warm: "text-peach-200",
  gold: "text-warm-700",
};

export function ScriptureDivider({
  text,
  reference,
  className,
  variant = "purple",
}: ScriptureDividerProps) {
  return (
    <section
      className={cn(
        "py-14 lg:py-20",
        variantClasses[variant],
        className
      )}
    >
      <div className="container-narrow text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p
            className={cn(
              "font-scripture text-fluid-xl italic leading-relaxed",
              textColor[variant]
            )}
          >
            &ldquo;{text}&rdquo;
          </p>
          <p
            className={cn(
              "mt-4 text-sm font-medium tracking-wide uppercase",
              refColor[variant]
            )}
          >
            &mdash; {reference}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
