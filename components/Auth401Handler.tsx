/**
 * Registers a global 401 handler with the API layer.
 * When any authenticated request returns 401 (e.g. invalid/expired token),
 * triggers logout and redirects to login.
 */

import { useRouter } from "expo-router";
import { useEffect } from "react";
import { setOnUnauthorized } from "../utils/authEvents";
import { useAuth } from "../contexts/AuthContext";

export function Auth401Handler() {
  const { logout, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleUnauthorized = async () => {
      await logout();
      router.replace("/login");
    };

    setOnUnauthorized(handleUnauthorized);
    return () => setOnUnauthorized(null);
  }, [logout, isAuthenticated, router]);

  return null;
}
