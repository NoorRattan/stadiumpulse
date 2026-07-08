import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";

import {
  bootstrapUserProfile,
  readRoleClaim,
  signInAsGuest,
  signOutCurrentUser,
  subscribeToAuthState,
} from "../services/authService";
import type { UserProfile, UserRole } from "../types/domain";

/** Auth context value exposed to route guards and navigation. */
export interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole;
  loading: boolean;
  signInGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

/** React context for Firebase auth state and UX-only role claims. */
export const AuthContext = createContext<AuthContextValue | null>(null);

/** Provides Firebase Auth state to the frontend route tree. */
export function AuthProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>("fan");
  const [loading, setLoading] = useState(true);
  const bootstrappedUid = useRef<string | null>(null);

  const refreshRole = useCallback(async (): Promise<void> => {
    if (!user) {
      setRole("fan");
      return;
    }
    setRole(await readRoleClaim(user));
  }, [user]);

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeToAuthState((nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        bootstrappedUid.current = null;
        setProfile(null);
        setRole("fan");
        setLoading(false);
        return;
      }

      setLoading(true);
      void (async () => {
        try {
          if (bootstrappedUid.current !== nextUser.uid) {
            const nextProfile = await bootstrapUserProfile();
            if (!active) {
              return;
            }
            bootstrappedUid.current = nextUser.uid;
            setProfile(nextProfile);
            setRole(nextProfile.role);
          }
        } catch {
          if (active) {
            bootstrappedUid.current = null;
            setProfile(null);
            setRole("fan");
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      })();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      role,
      loading,
      signInGuest: async () => {
        await signInAsGuest();
      },
      signOut: signOutCurrentUser,
      refreshRole,
    }),
    [loading, profile, refreshRole, role, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
