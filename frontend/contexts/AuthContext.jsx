// contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const s = data?.session;
      setUser(s?.user ?? null);
      setToken(s?.access_token ?? null);
      if (s?.access_token) localStorage.setItem("habit_token", s.access_token);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      const t = session?.access_token ?? null;
      setToken(t);
      if (t) localStorage.setItem("habit_token", t);
      else localStorage.removeItem("habit_token");
    });
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  return <AuthContext.Provider value={{ user, token }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
