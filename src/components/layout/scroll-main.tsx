"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * The scrolling content pane for the admin / portal shells. It owns its own
 * scroll (so the sidebar never scrolls with it) and resets to the top on every
 * route change — giving natural "new page opens at the top" behavior while the
 * fixed sidebar stays perfectly still.
 */
export function ScrollMain({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    ref.current?.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return (
    <main ref={ref} className={className}>
      {children}
    </main>
  );
}
