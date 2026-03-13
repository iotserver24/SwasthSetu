"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getMe } from "@/services/api";

interface Hospital {
  hospitalId: string;
  name: string;
  email: string;
  city?: string;
  type?: string;
}

interface AuthContextValue {
  hospital: Hospital | null;
  token: string | null;
  loading: boolean;
  login: (token: string, hospital: Hospital) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  hospital: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

const PUBLIC_PATHS = ["/login", "/register"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback((newToken: string, hospitalData: Hospital) => {
    localStorage.setItem("ss_token", newToken);
    setToken(newToken);
    setHospital(hospitalData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("ss_token");
    setToken(null);
    setHospital(null);
    router.push("/login");
  }, [router]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    async function init() {
      const stored = localStorage.getItem("ss_token");
      if (!stored) {
        setLoading(false);
        if (!PUBLIC_PATHS.includes(pathname)) router.replace("/login");
        return;
      }
      try {
        const me = await getMe() as Hospital;
        setToken(stored);
        setHospital(me);
      } catch {
        localStorage.removeItem("ss_token");
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Guard: redirect unauthenticated users away from protected pages
  useEffect(() => {
    if (loading) return;
    const isPublic = PUBLIC_PATHS.includes(pathname);
    if (!hospital && !isPublic) router.replace("/login");
    if (hospital && isPublic) router.replace("/doctor");
  }, [loading, hospital, pathname, router]);

  return (
    <AuthContext.Provider value={{ hospital, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
