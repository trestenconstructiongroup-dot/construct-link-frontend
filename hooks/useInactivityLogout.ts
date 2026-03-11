/**
 * Inactivity-based logout: signs the user out after a period of no activity.
 * Tracks mouse, keyboard, touch, and scroll events (web).
 * Resets the timer on any tracked activity.
 */

import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useAuth } from "../contexts/AuthContext";

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const ACTIVITY_THROTTLE_MS = 1000; // Reset timer at most once per second

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
] as const;

export interface UseInactivityLogoutOptions {
  /** Inactivity timeout in milliseconds. Default 15 minutes. */
  timeoutMs?: number;
  /** Whether the hook is active. Default true when authenticated. */
  enabled?: boolean;
}

export function useInactivityLogout(options: UseInactivityLogoutOptions = {}) {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    enabled = true,
  } = options;

  const { logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isHandlingRef = useRef(false);

  const resetTimer = useCallback(() => {
    if (!enabled || !isAuthenticated) return;

    lastActivityRef.current = Date.now();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    timeoutRef.current = setTimeout(async () => {
      if (isHandlingRef.current) return;
      isHandlingRef.current = true;

      try {
        await logout();
        router.replace("/login");
      } finally {
        isHandlingRef.current = false;
      }
    }, timeoutMs);
  }, [enabled, isAuthenticated, logout, router, timeoutMs]);

  const handleActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastActivityRef.current < ACTIVITY_THROTTLE_MS) return;
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!enabled || !isAuthenticated || Platform.OS !== "web") return;

    if (typeof document === "undefined" || typeof window === "undefined") return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        resetTimer();
      }
    };

    resetTimer();

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [enabled, isAuthenticated, handleActivity, resetTimer]);
}
