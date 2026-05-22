"use client";

import { type ReactNode } from "react";
import { CMSProvider } from "@/lib/cms/cms-provider";
import { EditModeToggle } from "@/components/cms/edit-mode-toggle";

interface CMSWrapperProps {
  children: ReactNode;
}

export function CMSWrapper({ children }: CMSWrapperProps) {
  return (
    <CMSProvider>
      {children}
      <EditModeToggle />
    </CMSProvider>
  );
}
