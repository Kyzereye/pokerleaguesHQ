import { useState, useEffect } from "react";
import { useAuth } from "../auth/context";
import { api } from "../api/client";
import styles from "./AdminUsers.module.css";

type UserRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  emailVerifiedAt: string | null;
  createdAt: string;
};

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", role: "member" as string, status: "active" as string });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api("/auth/users", { method: "GET" })
      .then((data: { users: UserRow[] }) => {
        if (!cancelled) setUsers(data.users);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load users");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (user?.role !== "admin") {
    return (
      <div className="forbidden">
        <p>You don't have permission to view this page.</p>
      </div>
    );
  }

  function startEdit(u: UserRow) {
    setEditingId(u.id);
    setEditForm({ firstName: u.firstName, lastName: u.lastName, role: u.role, status: u.status });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    try {
      const data = await api(`/auth/users/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify(editForm),
      });
      setUsers((prev) => prev.map((u) => (u.id === editingId ? { ...u, ...data.user, status: editForm.status, emailVerifiedAt: u.emailVerifiedAt, createdAt: u.createdAt } : u)));
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser(userId: string) {
    if (!window.confirm("Delete this user? This cannot be undone.")) return;
    setDeletingId(userId);
    try {
      await api(`/auth/users/${userId}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      if (editingId === userId) setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <p className="muted">Loading users…</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className={styles.admin}>
      <h1>Manage users</h1>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Email</th>
              <th>First name</th>
              <th>Last name</th>
              <th>Role</th>
              <th>Status</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                {editingId === u.id ? (
                  <>
                    <td>
                      <input
                        className="input"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                      />
                    </td>
                    <td>
                      <input
                        className="input"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                      />
                    </td>
                    <td>
                      <select
                        className="select"
                        value={editForm.role}
                        onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                      >
                        <option value="member">member</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td>
                      <select
                        className="select"
                        value={editForm.status}
                        onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                      >
                        <option value="active">active</option>
                        <option value="inactive">inactive</option>
                      </select>
                    </td>
                    <td>
                      <form
                        onSubmit={(e) => { e.preventDefault(); saveEdit(); }}
                        style={{ display: "inline" }}
                      >
                        <button type="submit" className="btn-sm" disabled={saving}>Submit</button>
                      </form>
                      <button type="button" className="btn-sm" onClick={cancelEdit} disabled={saving}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{u.firstName}</td>
                    <td>{u.lastName}</td>
                    <td>{u.role}</td>
                    <td>{u.status}</td>
                    <td>
                      <button type="button" className="btn-sm" onClick={() => startEdit(u)}>Edit</button>
                      <button type="button" className="btn-sm" onClick={() => deleteUser(u.id)} disabled={deletingId === u.id}>{deletingId === u.id ? "Deleting…" : "Delete"}</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
