"use client";

import { type ReactNode } from "react";
import { CMSProvider } from "@/lib/cms/cms-provider";

interface CMSWrapperProps {
  children: ReactNode;
}

export function CMSWrapper({ children }: CMSWrapperProps) {
  return (
    <CMSProvider>
      {children}
    </CMSProvider>
  );
}
