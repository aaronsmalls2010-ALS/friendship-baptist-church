"use client";

import { Pencil, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCMS } from "@/lib/cms/cms-provider";

export function EditModeToggle() {
  const { isEditMode, isSuperAdmin, toggleEditMode } = useCMS();

  if (!isSuperAdmin) return null;

  return (
    <>
      {/* Top banner when edit mode is active */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ y: -48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -48, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 top-0 z-50 flex items-center justify-center bg-purple-700 px-4 py-2 text-sm font-medium text-white shadow-md"
          >
            <span>
              You are in edit mode — click any highlighted content to edit
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating toggle button */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence mode="wait">
          {isEditMode ? (
            <motion.button
              key="exit-edit"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={toggleEditMode}
              className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg transition-colors hover:bg-green-500"
              aria-label="Exit Edit Mode"
              title="Exit Edit Mode"
            >
              {/* Pulsing ring */}
              <span className="absolute inset-0 animate-ping rounded-full bg-green-400 opacity-20" />
              <span className="absolute inset-0 animate-pulse rounded-full bg-green-400 opacity-10" />
              <Eye className="relative h-6 w-6" />
            </motion.button>
          ) : (
            <motion.button
              key="enter-edit"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={toggleEditMode}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-700 text-white shadow-lg transition-colors hover:bg-purple-600"
              aria-label="Edit Page"
              title="Edit Page"
            >
              <Pencil className="h-6 w-6" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
