"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SCRIPTURES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ScriptureRotatorProps {
  interval?: number;
  className?: string;
}

export function ScriptureRotator({
  interval = 8000,
  className,
}: ScriptureRotatorProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SCRIPTURES.length);
    }, interval);
    return () => clearInterval(timer);
  }, [interval]);

  const scripture = SCRIPTURES[index];

  return (
    <div
      className={cn("text-center overflow-hidden", className)}
      role="region"
      aria-label="Scripture of the moment"
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
        >
          <p className="scripture-text mb-2">
            &ldquo;{scripture.text}&rdquo;
          </p>
          <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
            — {scripture.reference}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
