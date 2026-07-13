import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { readCookie, logout as doLogout, type SessionUser } from "./auth";

type Ctx = {
  user: SessionUser | null;
  loading: boolean;
  setUser: (u: SessionUser | null) => void;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(readCookie());
    setLoading(false);
  }, []);

  return (
    <AuthCtx.Provider
      value={{
        user,
        loading,
        setUser,
        signOut: async () => {
          await doLogout(user?.username);
          setUser(null);
        },
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}
