"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: string;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    role: "member",
  });

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    async function getInitialSession() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setState({
          user,
          isLoading: false,
          isAuthenticated: !!user,
          role:
            user?.user_metadata?.role ||
            user?.app_metadata?.role ||
            "member",
        });
      } catch {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          role: "member",
        });
      }
    }

    getInitialSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setState({
        user,
        isLoading: false,
        isAuthenticated: !!user,
        role:
          user?.user_metadata?.role ||
          user?.app_metadata?.role ||
          "member",
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          role: "member",
        });
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Sign out error:", err);
    }
  }, []);

  return {
    ...state,
    signOut,
    isAdmin: state.role === "admin" || state.role === "super_admin",
    isMember: state.isAuthenticated,
  };
}
