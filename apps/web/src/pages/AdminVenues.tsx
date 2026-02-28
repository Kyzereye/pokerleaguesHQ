import { useState, useEffect, useRef } from "react";
import { useAuth } from "../auth/context";
import { api } from "../api/client";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  isZipValid,
  US_STATES,
  type AddressParts,
} from "../utils/venueAddress";
import styles from "./AdminVenues.module.css";

type VenueRow = {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
};

const emptyParts: AddressParts = { street: "", city: "", state: "", zip: "" };

export default function AdminVenues() {
  const { user } = useAuth();
  const [venues, setVenues] = useState<VenueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", ...emptyParts });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [venueToDelete, setVenueToDelete] = useState<string | null>(null);
  const [nameFilter, setNameFilter] = useState("");
  const [adding, setAdding] = useState(false);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState(emptyParts);
  const editDialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    api("/venues")
      .then((data: { venues: VenueRow[] }) => {
        if (!cancelled) setVenues(data.venues ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load venues");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!editingId) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancelEdit();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [editingId]);

  if (user?.role !== "admin") {
    return (
      <div className="forbidden">
        <p>You don't have permission to view this page.</p>
      </div>
    );
  }

  function startEdit(v: VenueRow) {
    setEditingId(v.id);
    setEditForm({ name: v.name, street: v.street, city: v.city, state: v.state, zip: v.zip });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function setNewZip(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 5);
    setNewAddress((a) => ({ ...a, zip: digits }));
  }

  function setEditZip(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 5);
    setEditForm((f) => ({ ...f, zip: digits }));
  }

  async function saveEdit() {
    if (!editingId) return;
    if (!editForm.street.trim() || !editForm.city.trim() || !editForm.state || !isZipValid(editForm.zip)) return;
    setSaving(true);
    setError("");
    try {
      const data = await api(`/venues/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editForm.name.trim(),
          street: editForm.street.trim(),
          city: editForm.city.trim(),
          state: editForm.state.trim(),
          zip: editForm.zip.trim(),
        }),
      }) as { venue: VenueRow };
      setVenues((prev) => prev.map((v) => (v.id === editingId ? { ...v, ...data.venue } : v)));
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteVenue() {
    if (!venueToDelete) return;
    setDeletingId(venueToDelete);
    setError("");
    try {
      await api(`/venues/${venueToDelete}`, { method: "DELETE" });
      setVenues((prev) => prev.filter((v) => v.id !== venueToDelete));
      if (editingId === venueToDelete) setEditingId(null);
      setVenueToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (!isZipValid(newAddress.zip)) return;
    setAdding(true);
    setError("");
    try {
      const data = await api("/venues", {
        method: "POST",
        body: JSON.stringify({
          name,
          street: newAddress.street.trim(),
          city: newAddress.city.trim(),
          state: newAddress.state.trim(),
          zip: newAddress.zip.trim(),
        }),
      }) as { venue: VenueRow };
      setVenues((prev) => [...prev, data.venue].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      setNewAddress(emptyParts);
      setAddFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Add failed");
    } finally {
      setAdding(false);
    }
  }

  const nameFilterLower = nameFilter.trim().toLowerCase();
  const filteredVenues = nameFilterLower
    ? venues.filter((v) => v.name.toLowerCase().includes(nameFilterLower))
    : venues;

  const addValid =
    newName.trim() &&
    newAddress.street.trim() &&
    newAddress.city.trim() &&
    newAddress.state &&
    isZipValid(newAddress.zip);
  const editValid =
    editForm.name.trim() &&
    editForm.street.trim() &&
    editForm.city.trim() &&
    editForm.state &&
    isZipValid(editForm.zip);

  if (loading) return <p className="muted">Loading venues…</p>;

  return (
    <div className="page">
      <div className={styles.pageHeader}>
        <h1>Manage Venues</h1>
        {!addFormOpen && (
          <button type="button" className="btn btn-primary" onClick={() => setAddFormOpen(true)}>
            Add venue
          </button>
        )}
      </div>
      <p className="muted">Add, Edit, and Delete venues.</p>
      {error && <p className="error">{error}</p>}

      {addFormOpen && (
        <section className="section" style={{ marginBottom: "var(--space-lg)" }}>
          <div className={styles.addFormCard}>
            <h2>New venue</h2>
            <form className={styles.addForm} onSubmit={handleAdd}>
              <div className={styles.formRow}>
                <label htmlFor="new-venue-name">Name</label>
                <input
                  id="new-venue-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Main Street Tavern"
                  required
                />
              </div>
              <div className={styles.addFormGrid}>
                <div className={styles.formRow}>
                  <label htmlFor="new-venue-street">Street</label>
                  <input
                    id="new-venue-street"
                    type="text"
                    value={newAddress.street}
                    onChange={(e) => setNewAddress((a) => ({ ...a, street: e.target.value }))}
                    placeholder="Street address"
                    required
                  />
                </div>
                <div className={styles.formRow}>
                  <label htmlFor="new-venue-city">City</label>
                  <input
                    id="new-venue-city"
                    type="text"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress((a) => ({ ...a, city: e.target.value }))}
                    placeholder="City"
                    required
                  />
                </div>
                <div className={styles.formRow}>
                  <label htmlFor="new-venue-state">State</label>
                  <select
                    id="new-venue-state"
                    className={styles.select}
                    value={newAddress.state}
                    onChange={(e) => setNewAddress((a) => ({ ...a, state: e.target.value }))}
                    required
                  >
                    <option value="">State</option>
                    {US_STATES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formRow}>
                  <label htmlFor="new-venue-zip">ZIP (5 digits)</label>
                  <input
                    id="new-venue-zip"
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    pattern="[0-9]{5}"
                    value={newAddress.zip}
                    onChange={(e) => setNewZip(e.target.value)}
                    placeholder="12345"
                    required
                    title="5 digits only"
                  />
                </div>
              </div>
              <div className={styles.addFormActions}>
                <button type="submit" className="btn btn-primary" disabled={adding || !addValid}>
                  {adding ? "Adding…" : "Add venue"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setAddFormOpen(false);
                    setNewName("");
                    setNewAddress(emptyParts);
                  }}
                  disabled={adding}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      <section className="section" style={{ marginBottom: "var(--space-md)" }}>
        <label htmlFor="venue-name-filter" className={styles.filterLabel}>
          Search by name
        </label>
        <input
          id="venue-name-filter"
          type="search"
          className="input"
          placeholder="Filter venues by name…"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          style={{ maxWidth: "320px" }}
        />
      </section>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Street</th>
              <th>City</th>
              <th>State</th>
              <th>ZIP</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {filteredVenues.map((v) => (
              <tr key={v.id}>
                <td>{v.name}</td>
                <td>{v.street || "—"}</td>
                <td>{v.city || "—"}</td>
                <td>{v.state || "—"}</td>
                <td>{v.zip || "—"}</td>
                <td>
                  <button type="button" className="btn-sm" onClick={() => startEdit(v)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-sm"
                    onClick={() => setVenueToDelete(v.id)}
                    disabled={deletingId === v.id}
                  >
                    {deletingId === v.id ? "Deleting…" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {venues.length === 0 && <p className="muted">No venues yet. Add one above.</p>}
      {venues.length > 0 && filteredVenues.length === 0 && (
        <p className="muted">No venues match &quot;{nameFilter.trim()}&quot;.</p>
      )}

      {editingId !== null && (
        <div
          className="dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-venue-dialog-title"
          onClick={(e) => e.target === e.currentTarget && cancelEdit()}
        >
          <div ref={editDialogRef} className="dialog" onClick={(e) => e.stopPropagation()}>
            <h2 id="edit-venue-dialog-title" className="dialog__title">
              Edit venue
            </h2>
            <div className="dialog__body" style={{ color: "var(--color-text)" }}>
              <form
                className={styles.editDialogForm}
                onSubmit={(e) => {
                  e.preventDefault();
                  saveEdit();
                }}
              >
                <div className={styles.formRow}>
                  <label htmlFor="edit-venue-name">Name</label>
                  <input
                    id="edit-venue-name"
                    type="text"
                    className="input"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className={styles.formRow}>
                  <label htmlFor="edit-venue-street">Street</label>
                  <input
                    id="edit-venue-street"
                    type="text"
                    className="input"
                    value={editForm.street}
                    onChange={(e) => setEditForm((f) => ({ ...f, street: e.target.value }))}
                  />
                </div>
                <div className={styles.formRow}>
                  <label htmlFor="edit-venue-city">City</label>
                  <input
                    id="edit-venue-city"
                    type="text"
                    className="input"
                    value={editForm.city}
                    onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
                  />
                </div>
                <div className={styles.formRow}>
                  <label htmlFor="edit-venue-state">State</label>
                  <select
                    id="edit-venue-state"
                    className="input select"
                    value={editForm.state}
                    onChange={(e) => setEditForm((f) => ({ ...f, state: e.target.value }))}
                  >
                    <option value="">State</option>
                    {US_STATES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formRow}>
                  <label htmlFor="edit-venue-zip">ZIP (5 digits)</label>
                  <input
                    id="edit-venue-zip"
                    type="text"
                    className="input"
                    inputMode="numeric"
                    maxLength={5}
                    value={editForm.zip}
                    onChange={(e) => setEditZip(e.target.value)}
                  />
                </div>
                <div className="dialog__actions" style={{ marginBottom: 0, paddingBottom: 0 }}>
                  <button type="button" className="btn btn-secondary" onClick={cancelEdit} disabled={saving}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving || !editValid}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-inline" aria-hidden />
                        Saving…
                      </>
                    ) : (
                      "Save"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={venueToDelete !== null}
        onClose={() => setVenueToDelete(null)}
        onConfirm={confirmDeleteVenue}
        title="Delete venue?"
        confirmLabel="Yes, delete"
        variant="danger"
        loading={deletingId !== null}
      >
        {venueToDelete && (
          <>
            Are you sure you want to delete{" "}
            <strong>{venues.find((v) => v.id === venueToDelete)?.name ?? "this venue"}</strong>? Any games at this
            venue will also be removed.
          </>
        )}
      </ConfirmDialog>
    </div>
  );
}
