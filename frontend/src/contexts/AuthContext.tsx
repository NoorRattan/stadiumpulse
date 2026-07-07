import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";

import {
  readRoleClaim,
  signInAsGuest,
  signOutCurrentUser,
  subscribeToAuthState,
} from "../services/authService";
import type { UserRole } from "../types/domain";

/** Auth context value exposed to route guards and navigation. */
export interface AuthContextValue {
  user: User | null;
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
  const [role, setRole] = useState<UserRole>("fan");
  const [loading, setLoading] = useState(true);

  const refreshRole = useCallback(async (): Promise<void> => {
    if (!user) {
      setRole("fan");
      return;
    }
    setRole(await readRoleClaim(user));
  }, [user]);

  useEffect(() => {
    return subscribeToAuthState((nextUser) => {
      setUser(nextUser);
      setLoading(false);
      if (nextUser) {
        void readRoleClaim(nextUser).then(setRole);
      } else {
        setRole("fan");
      }
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      loading,
      signInGuest: async () => {
        await signInAsGuest();
      },
      signOut: signOutCurrentUser,
      refreshRole,
    }),
    [loading, refreshRole, role, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
