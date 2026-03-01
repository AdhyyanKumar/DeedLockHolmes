import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { type AuthUser, getCurrentUser, logoutUser } from "../api/authApi";

interface AuthContextValue {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((nextUser) => {
        if (active) {
          setUserState(nextUser);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  function setUser(nextUser: AuthUser | null) {
    setUserState(nextUser);
  }

  async function logout() {
    try {
      await logoutUser();
    } catch {
      // Clear local auth state even if backend logout call fails.
    } finally {
      setUserState(null);
    }
  }

  const value = useMemo(
    () => ({
      user,
      setUser,
      logout,
      isAuthenticated: Boolean(user),
      isLoading,
    }),
    [isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
