import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Navigate } from "react-router-dom";
import type { UserResponse } from "shared";
import { api } from "../lib/api";

interface AuthContextValue {
  user: UserResponse | null;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<UserResponse>("/api/auth/me")
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("token");
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(token: string) {
    localStorage.setItem("token", token);
    const me = await api.get<UserResponse>("/api/auth/me");
    setUser(me);
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
