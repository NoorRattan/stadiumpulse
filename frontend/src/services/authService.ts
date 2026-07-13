import { jwtDecode } from "jwt-decode";
import type { Session, User } from "@supabase/supabase-js";

import { apiRequest } from "./apiClient";
import { supabase } from "./supabaseConfig";
import type { UserProfileResponse } from "../types/api";
import type { UserRole } from "../types/domain";

interface RoleClaims {
  user_role?: unknown;
}

interface PasswordSignupResponse {
  uid: string;
  email: string;
}

function normalizeRole(value: unknown): UserRole {
  return value === "staff" || value === "volunteer" ? value : "fan";
}

/** Starts an anonymous Supabase Auth session for fan-facing API calls. */
export async function signInAsGuest(): Promise<User> {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    throw error;
  }
  if (!data.user) {
    throw new Error("Anonymous sign-in did not return a user.");
  }
  return data.user;
}

/** Creates or reads the backend profile for the current Supabase user. */
export async function bootstrapUserProfile(): Promise<UserProfileResponse> {
  return apiRequest<UserProfileResponse, Record<string, never>>(
    "/api/auth/bootstrap",
    {
      method: "POST",
      body: {},
    },
  );
}

/** Creates a confirmed email/password account through the backend admin flow. */
export async function createPasswordAccount(
  email: string,
  password: string,
): Promise<PasswordSignupResponse> {
  return apiRequest<
    PasswordSignupResponse,
    { email: string; password: string }
  >("/api/auth/signup", {
    method: "POST",
    body: { email, password },
  });
}

/** Signs out the current Supabase Auth user. */
export async function signOutCurrentUser(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

/** Reads the custom access-token hook's `user_role` claim from the JWT. */
export function readRoleClaim(session: Session | null): UserRole {
  if (!session?.access_token) {
    return "fan";
  }
  return normalizeRole(jwtDecode<RoleClaims>(session.access_token).user_role);
}

/** Subscribes to Supabase Auth session changes. */
export function subscribeToAuthState(
  callback: (session: Session | null) => void,
): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  void supabase.auth.getSession().then(({ data: sessionData }) => {
    callback(sessionData.session);
  });
  return () => data.subscription.unsubscribe();
}
