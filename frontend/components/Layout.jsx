import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";

export default function Layout({ children }) {
  const { user } = useAuth();

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("habit_token");
    } catch (e) {
      console.error("Logout error:", e);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto p-4 flex flex-wrap justify-between items-center">
          {/* Left: Logo + nav */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-xl font-bold">
              Habit Tracker
            </Link>

            <nav className="inline-block space-x-4">
              <Link href="/public">Public</Link>
              {user && (
                <>
                  <Link href="/habits">My Habits</Link>
                  <Link href="/habits/new">New</Link>
                  <Link href="/profile">Profile</Link>
                </>
              )}
            </nav>
          </div>

          {/* Right: Auth buttons */}
          <div className="flex items-center space-x-3 mt-3 sm:mt-0">
            {user ? (
              <>
                <span className="text-sm text-gray-700">
                  Hi, {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 border rounded hover:bg-gray-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-3 py-1 border rounded hover:bg-gray-100"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-3 py-1 border rounded hover:bg-gray-100"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-5xl mx-auto p-4">{children}</main>
    </div>
  );
}
