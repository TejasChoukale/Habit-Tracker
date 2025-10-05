// components/ProtectedRoute.jsx
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // wait a bit for AuthContext to load
    if (user === null && !token) {
      const stored = localStorage.getItem("habit_token");
      if (!stored) router.push("/auth/login");
    }
  }, [user, token]);

  // show nothing until auth ready
  if (!user && !token) return <div className="p-4">Checking auth...</div>;

  return <>{children}</>;
}
