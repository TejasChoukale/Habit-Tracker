import { useEffect, useState } from "react";
import { apiGet, apiDelete } from "../../lib/api";
import Link from "next/link";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function MyHabits() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await apiGet("/habits");
      setHabits(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error("Error loading habits:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id) {
    if (!confirm("Delete this habit?")) return;
    try {
      await apiDelete(`/habits/${id}`);
      setHabits(habits.filter((h) => h.id !== id));
    } catch (e) {
      alert("Delete failed: " + (e?.body?.detail || e?.message || JSON.stringify(e)));
    }
  }

  return (
    <ProtectedRoute>
      <div>
        <h2 className="text-2xl font-semibold mb-4">My Habits</h2>
        {loading && <div>Loading...</div>}
        {!loading && habits.length === 0 && <div>No habits yet.</div>}

        <ul className="space-y-3 mt-3">
          {habits.map((h) => (
            <li
              key={h.id}
              className="p-3 border rounded flex justify-between items-center"
            >
              <div>
                <div className="font-semibold">{h.name}</div>
                <div className="text-sm text-gray-600">{h.description}</div>
                <div className="text-xs text-gray-500">
                  Created: {new Date(h.created_at).toLocaleString()}
                </div>
              </div>
              <div className="space-x-2">
                <Link href={`/habits/${h.id}`} className="px-3 py-1 border rounded">
                  Edit
                </Link>
                <button
                  onClick={() => remove(h.id)}
                  className="px-3 py-1 border rounded"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </ProtectedRoute>
  );
}
