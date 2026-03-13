/**
 * Inactivity-based logout: signs the user out after a period of no activity.
 * Tracks mouse, keyboard, touch, and scroll events (web).
 * Persists last-active timestamp so the timeout survives tab closes and reloads.
 */

import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import {
  setLastActiveTime,
  getLastActiveTimeSync,
  SESSION_TIMEOUT_MS,
} from "../utils/tokenStorage";

const ACTIVITY_THROTTLE_MS = 1_000; // Persist timestamp at most once per second

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
] as const;

export interface UseInactivityLogoutOptions {
  /** Inactivity timeout in milliseconds. Defaults to SESSION_TIMEOUT_MS (4 hours). */
  timeoutMs?: number;
  /** Whether the hook is active. Default true when authenticated. */
  enabled?: boolean;
}

export function useInactivityLogout(options: UseInactivityLogoutOptions = {}) {
  const { timeoutMs = SESSION_TIMEOUT_MS, enabled = true } = options;

  const { logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isHandlingRef = useRef(false);

  const handleLogout = useCallback(async () => {
    if (isHandlingRef.current) return;
    isHandlingRef.current = true;
    try {
      await logout();
      router.replace("/login");
    } finally {
      isHandlingRef.current = false;
    }
  }, [logout, router]);

  /**
   * Schedules the logout timer for `delay` ms from now.
   * Pass a custom delay to resume a partially-elapsed window (e.g. on tab return).
   */
  const resetTimer = useCallback(
    (delay: number = timeoutMs) => {
      if (!enabled || !isAuthenticated) return;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      timeoutRef.current = setTimeout(handleLogout, Math.max(delay, 0));
    },
    [enabled, isAuthenticated, handleLogout, timeoutMs]
  );

  /** Called on every user interaction — throttled to avoid excessive writes. */
  const handleActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastActivityRef.current < ACTIVITY_THROTTLE_MS) return;
    lastActivityRef.current = now;
    setLastActiveTime(); // persist so the timestamp survives page reloads
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!enabled || !isAuthenticated || Platform.OS !== "web") return;
    if (typeof document === "undefined" || typeof window === "undefined") return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Stamp the moment the tab was hidden so we can measure elapsed time on return.
        setLastActiveTime();
        return;
      }

      // Tab became visible again — check how long it was away.
      const lastActive = getLastActiveTimeSync();
      const elapsed = lastActive !== null ? Date.now() - lastActive : 0;

      if (elapsed >= timeoutMs) {
        // User was gone longer than the timeout — log out immediately.
        handleLogout();
      } else {
        // Resume the remaining portion of the inactivity window.
        resetTimer(timeoutMs - elapsed);
      }
    };

    // Stamp and start the timer on mount / when auth state changes.
    setLastActiveTime();
    lastActivityRef.current = Date.now();
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
  }, [enabled, isAuthenticated, handleActivity, handleLogout, resetTimer, timeoutMs]);
}
