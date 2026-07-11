import { useContext } from "react";

import { AuthContext, type AuthContextValue } from "../contexts/AuthContext";

/** Reads the current Supabase Auth state from AuthContext. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
