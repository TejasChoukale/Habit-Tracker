import { useState, useEffect } from "react";
import { apiPost } from "../../lib/api";
import { useRouter } from "next/router";

export default function NewHabit() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ✅ check login
  useEffect(() => {
    const token = localStorage.getItem("habit_token");
    if (!token) {
      alert("Please log in first");
      router.push("/auth/login");
    }
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) return alert("Please enter a name");

    setLoading(true);
    try {
      const payload = { name, description, is_public: isPublic };
      const res = await apiPost("/habits", payload);
      alert("Habit created successfully!");
      router.push("/habits");
    } catch (err) {
      alert("Failed: " + (err?.body?.detail || err?.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Create New Habit</h2>
      <form onSubmit={submit} className="space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded p-2"
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            id="is_public"
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          <label htmlFor="is_public">Make this habit public</label>
        </div>

        <button
          disabled={loading}
          className="px-4 py-2 border rounded"
        >
          {loading ? "Creating..." : "Create Habit"}
        </button>
      </form>
    </div>
  );
}
