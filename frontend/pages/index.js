// pages/index.jsx
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Welcome to Habit Tracker</h1>
      <p className="mb-4">
        Login or register to create habits (public/private), edit your habits, and view public habits.
      </p>

      <div className="space-x-2">
        <Link href="/auth/login" className="px-4 py-2 border rounded">Login</Link>
        <Link href="/auth/signup" className="px-4 py-2 border rounded">Sign up</Link>
        <Link href="/public" className="px-4 py-2 border rounded">Public Habits</Link>
      </div>
    </div>
  );
}
