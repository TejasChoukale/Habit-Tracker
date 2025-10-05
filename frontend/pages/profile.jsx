import { useEffect, useState } from "react";
import { apiGet, apiPut } from "../lib/api";
import ProtectedRoute from "../components/ProtectedRoute";

export default function ProfilePage() {
  const [profile, setProfile] = useState({ username: "", avatar_url: "", bio: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ load profile when page opens
  async function loadProfile() {
    setLoading(true);
    try {
      const res = await apiGet("/profiles/me");
      if (res) {
        setProfile({
          username: res.username || "",
          avatar_url: res.avatar_url || "",
          bio: res.bio || "",
        });
      }
    } catch (e) {
      // 👇 Handle first-time users (no profile yet)
      if (e.status === 404) {
        try {
          await apiPut("/profiles/me", { username: "", avatar_url: "", bio: "" });
          return loadProfile(); // reload after creating empty profile
        } catch (createErr) {
          console.error("Auto-create profile failed:", createErr);
        }
      } else {
        console.error("Profile load error:", e);
        alert("Error loading profile: " + (e?.body?.detail || e.message));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        username: profile.username,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
      };
      await apiPut("/profiles/me", body);
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Save failed: " + (err?.body?.detail || err?.message));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedRoute>
      <div>
        <h2 className="text-2xl font-semibold mb-4">My Profile</h2>
        {loading && <div>Loading profile...</div>}
        {!loading && (
          <form onSubmit={handleSave} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium">Username</label>
              <input
                value={profile.username}
                onChange={(e) =>
                  setProfile({ ...profile, username: e.target.value })
                }
                className="w-full border rounded p-2"
                placeholder="Your username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Avatar URL</label>
              <input
                value={profile.avatar_url}
                onChange={(e) =>
                  setProfile({ ...profile, avatar_url: e.target.value })
                }
                className="w-full border rounded p-2"
                placeholder="Link to your avatar"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Bio</label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="w-full border rounded p-2"
                rows={3}
                placeholder="Write a short bio..."
              />
            </div>

            <button
              disabled={saving}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        )}
      </div>
    </ProtectedRoute>
  );
}
