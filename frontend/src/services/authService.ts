import {
  onIdTokenChanged,
  signInAnonymously,
  signOut,
  type User,
} from "firebase/auth";

import { firebaseAuth } from "./firebaseConfig";
import type { UserRole } from "../types/domain";

function normalizeRole(value: unknown): UserRole {
  return value === "staff" || value === "volunteer" ? value : "fan";
}

/** Starts an anonymous Firebase Auth session for fan-facing API calls. */
export async function signInAsGuest(): Promise<User> {
  const credential = await signInAnonymously(firebaseAuth);
  return credential.user;
}

/** Signs out the current Firebase Auth user. */
export async function signOutCurrentUser(): Promise<void> {
  await signOut(firebaseAuth);
}

/** Reads the current role claim from a Firebase user token. */
export async function readRoleClaim(user: User): Promise<UserRole> {
  const tokenResult = await user.getIdTokenResult();
  return normalizeRole(tokenResult.claims.role);
}

/** Subscribes to Firebase Auth token changes. */
export function subscribeToAuthState(
  callback: (user: User | null) => void,
): () => void {
  return onIdTokenChanged(firebaseAuth, callback);
}
