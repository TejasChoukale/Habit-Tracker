import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";

export default function PublicHabits() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadPublicHabits() {
    setLoading(true);
    try {
      const res = await apiGet("/habits/public", { auth: false });
      setHabits(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error("Error loading public habits:", e);
      alert("Failed to load public habits.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPublicHabits();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">🌍 Public Habits</h2>

      {loading && <div>Loading public habits...</div>}

      {!loading && habits.length === 0 && (
        <div className="text-gray-600">No public habits yet.</div>
      )}

      <ul className="space-y-3 mt-4">
        {habits.map((h) => (
          <li key={h.id} className="p-4 border rounded shadow-sm bg-white">
            <div className="font-semibold text-lg">{h.name}</div>
            {h.description && (
              <div className="text-sm text-gray-700 mt-1">
                {h.description}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-2">
              By: {h.user_id || "Anonymous"} •{" "}
              {h.created_at
                ? new Date(h.created_at).toLocaleString()
                : "No date"}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
