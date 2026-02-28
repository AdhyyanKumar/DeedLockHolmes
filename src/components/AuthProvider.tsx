import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";
import { type MockUser, getStoredUser, logoutMock } from "../api/authApi";

interface AuthContextValue {
  user: MockUser | null;
  setUser: (user: MockUser | null) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUserState] = useState<MockUser | null>(() => getStoredUser());

  function setUser(nextUser: MockUser | null) {
    setUserState(nextUser);
  }

  function logout() {
    logoutMock();
    setUserState(null);
  }

  const value = useMemo(
    () => ({
      user,
      setUser,
      logout,
      isAuthenticated: Boolean(user),
    }),
    [user],
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
