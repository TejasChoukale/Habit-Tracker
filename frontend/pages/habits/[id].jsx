import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { apiGet, apiPut } from "../../lib/api";

export default function EditHabit() {
  const router = useRouter();
  const { id } = router.query;

  const [habit, setHabit] = useState({ name: "", description: "", is_public: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ check login and load habit
  useEffect(() => {
    const token = localStorage.getItem("habit_token");
    if (!token) {
      alert("Please log in first");
      router.push("/auth/login");
    } else if (id) {
      loadHabit();
    }
  }, [id]);

  async function loadHabit() {
    setLoading(true);
    try {
      const habits = await apiGet("/habits");
      const found = habits.find((h) => String(h.id) === String(id));
      if (found) setHabit(found);
      else alert("Habit not found");
    } catch (e) {
      alert("Failed to load habit: " + (e?.body?.detail || e?.message));
    } finally {
      setLoading(false);
    }
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: habit.name,
        description: habit.description,
        is_public: habit.is_public,
      };
      await apiPut(`/habits/${id}`, payload);
      alert("Habit updated successfully!");
      router.push("/habits");
    } catch (err) {
      alert("Save failed: " + (err?.body?.detail || err?.message));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Edit Habit</h2>
      <form onSubmit={save} className="space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            value={habit.name}
            onChange={(e) => setHabit({ ...habit, name: e.target.value })}
            className="w-full border rounded p-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            value={habit.description}
            onChange={(e) =>
              setHabit({ ...habit, description: e.target.value })
            }
            className="w-full border rounded p-2"
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            id="is_public"
            type="checkbox"
            checked={habit.is_public}
            onChange={(e) =>
              setHabit({ ...habit, is_public: e.target.checked })
            }
          />
          <label htmlFor="is_public">Public</label>
        </div>

        <button
          disabled={saving}
          className="px-4 py-2 border rounded"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
