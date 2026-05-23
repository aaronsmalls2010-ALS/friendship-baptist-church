"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Heart, Video, HandHeart, LogIn, LogOut, User } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useScrollPosition } from "@/hooks/use-scroll-position";
import { useAuth } from "@/hooks/use-auth";
import { PUBLIC_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function PublicHeader() {
  const { isScrolled } = useScrollPosition();
  const { user, isAuthenticated, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const firstName = user?.user_metadata?.first_name || "Member";

  return (
    <>
      <motion.header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled
            ? "bg-white/[0.97] dark:bg-warm-950/[0.97] backdrop-blur-lg shadow-md border-b border-warm-200/60 dark:border-warm-800/60"
            : "bg-transparent"
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <nav className="container-wide" aria-label="Main navigation">
          <div
            className={cn(
              "flex items-center justify-between transition-all duration-300",
              isScrolled ? "h-16" : "h-20 lg:h-24"
            )}
          >
            {/* Logo */}
            <Logo
              variant={isScrolled ? "icon" : "wordmark"}
              size={isScrolled ? "sm" : "md"}
            />

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {PUBLIC_NAV.map((item) => (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() =>
                    item.children && setActiveDropdown(item.label)
                  }
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      isScrolled
                        ? "text-warm-900 hover:text-purple-700 hover:bg-purple-50/80"
                        : "text-white/90 hover:text-white hover:bg-white/10",
                      item.label === "Give" &&
                        "bg-gold-400 text-warm-900 hover:bg-gold-300 hover:text-warm-900 font-semibold"
                    )}
                  >
                    {item.label}
                    {item.children && (
                      <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                    )}
                  </Link>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {item.children && activeDropdown === item.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full left-0 mt-1 w-56 py-2 rounded-xl bg-white shadow-lg shadow-purple-900/10 border border-warm-200"
                      >
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="block px-4 py-2.5 text-sm text-warm-700 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {/* Member Login / User Greeting */}
              <div
                className={cn(
                  "ml-2 pl-2 border-l transition-colors flex items-center gap-2",
                  isScrolled
                    ? "border-warm-300"
                    : "border-white/20"
                )}
              >
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/portal"
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isScrolled
                          ? "text-purple-800 hover:bg-purple-50/80"
                          : "text-white/80 hover:text-white hover:bg-white/10"
                      )}
                    >
                      <User className="h-4 w-4" />
                      Hi, {firstName}
                    </Link>
                    <button
                      onClick={signOut}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors",
                        isScrolled
                          ? "text-warm-500 hover:text-red-600 hover:bg-red-50/80"
                          : "text-white/60 hover:text-white hover:bg-white/10"
                      )}
                      title="Sign out"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth/login"
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isScrolled
                        ? "text-purple-800 hover:bg-purple-50/80"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <LogIn className="h-4 w-4" />
                    Member Login
                  </Link>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={cn(
                "lg:hidden p-2 rounded-lg transition-colors",
                isScrolled
                  ? "text-warm-900 hover:bg-warm-100"
                  : "text-white hover:bg-white/10"
              )}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Navigation */}
      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isAuthenticated={isAuthenticated}
        firstName={firstName}
        onSignOut={signOut}
      />

      {/* Mobile Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/[0.97] dark:bg-warm-950/[0.97] backdrop-blur-lg border-t border-warm-200 dark:border-warm-800">
        <div className="flex items-center justify-around py-2">
          <Link
            href="/media?tab=live"
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs font-medium text-warm-600 hover:text-purple-700"
          >
            <Video className="h-5 w-5" />
            Watch Live
          </Link>
          <Link
            href="/give"
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs font-semibold text-gold-600"
          >
            <Heart className="h-5 w-5" />
            Give
          </Link>
          <Link
            href="/prayer"
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs font-medium text-warm-600 hover:text-purple-700"
          >
            <HandHeart className="h-5 w-5" />
            Prayer
          </Link>
        </div>
      </div>
    </>
  );
}

function MobileNav({
  open,
  onClose,
  isAuthenticated,
  firstName,
  onSignOut,
}: {
  open: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  firstName: string;
  onSignOut: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed inset-0 z-50 lg:hidden bg-white dark:bg-warm-950 overflow-y-auto"
        >
          <div className="flex justify-between items-center px-4 h-16 border-b border-warm-200">
            <Logo variant="icon" size="sm" />
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-warm-600 hover:bg-warm-100"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="p-4 space-y-1" aria-label="Mobile navigation">
            {PUBLIC_NAV.map((item) => (
              <div key={item.label}>
                {item.children ? (
                  <>
                    <button
                      onClick={() =>
                        setExpanded(
                          expanded === item.label ? null : item.label
                        )
                      }
                      className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-left text-warm-800 dark:text-warm-200 font-medium hover:bg-warm-50 dark:hover:bg-warm-900"
                      aria-expanded={expanded === item.label}
                    >
                      {item.label}
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          expanded === item.label && "rotate-180"
                        )}
                      />
                    </button>
                    <AnimatePresence>
                      {expanded === item.label && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-4 py-1 space-y-1">
                            {item.children.map((child) => (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={onClose}
                                className="block px-4 py-2.5 rounded-lg text-sm text-warm-600 dark:text-warm-400 hover:text-purple-700 hover:bg-purple-50"
                              >
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "block px-4 py-3 rounded-lg font-medium hover:bg-warm-50 dark:hover:bg-warm-900",
                      item.label === "Give"
                        ? "bg-gold-50 text-gold-700 font-semibold"
                        : "text-warm-800 dark:text-warm-200"
                    )}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}

            {/* Member Login / User Greeting */}
            <div className="mt-4 pt-4 border-t border-warm-200 space-y-2">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/portal"
                    onClick={onClose}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-purple-700 bg-purple-50 hover:bg-purple-100"
                  >
                    <User className="h-5 w-5" />
                    Hi, {firstName}
                  </Link>
                  <button
                    onClick={() => {
                      onClose();
                      onSignOut();
                    }}
                    className="flex items-center gap-2 w-full px-4 py-3 rounded-lg font-medium text-warm-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={onClose}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-purple-700 bg-purple-50 hover:bg-purple-100"
                >
                  <LogIn className="h-5 w-5" />
                  Member Login
                </Link>
              )}
            </div>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
