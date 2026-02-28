import { useState, useEffect, useRef } from "react";
import { useAuth } from "../auth/context";
import { api } from "../api/client";
import ConfirmDialog from "../components/ConfirmDialog";
import { formatTimeForDisplay, displayTimeTo24Hour } from "../utils/formatTime";
import styles from "./AdminGames.module.css";

type VenueOption = { id: string; name: string };

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type GameRow = {
  id: string;
  venueId: string;
  gameDay: string;
  gameTime: string;
  notes?: string;
  venueName: string;
  venueAddress?: string;
};

export default function AdminGames() {
  const { user } = useAuth();
  const [games, setGames] = useState<GameRow[]>([]);
  const [venues, setVenues] = useState<VenueOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ venueId: "", gameDay: "", gameTime: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [gameToDelete, setGameToDelete] = useState<string | null>(null);
  const [venueFilter, setVenueFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [adding, setAdding] = useState(false);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [newGame, setNewGame] = useState({ venueId: "", gameDay: "", gameTime: "19:00", notes: "" });
  const editDialogRef = useRef<HTMLDivElement>(null);

  function loadGames() {
    return api("/games").then((data: { games: GameRow[] }) => setGames(data.games ?? []));
  }

  function loadVenues() {
    return api("/venues").then((data: { venues: VenueOption[] }) => setVenues(data.venues ?? []));
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadGames(), loadVenues()])
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
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

  function startEdit(g: GameRow) {
    setEditingId(g.id);
    const timeForInput = /^\d{1,2}:\d{2}$/.test(g.gameTime) ? g.gameTime : displayTimeTo24Hour(g.gameTime);
    setEditForm({
      venueId: g.venueId,
      gameDay: g.gameDay,
      gameTime: timeForInput.length === 5 ? timeForInput : `${timeForInput.slice(0, 5)}`,
      notes: g.notes ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit() {
    if (!editingId) return;
    if (!editForm.venueId || !editForm.gameDay.trim() || !editForm.gameTime.trim()) return;
    setSaving(true);
    setError("");
    try {
      const data = await api(`/games/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify({
          venueId: editForm.venueId,
          gameDay: editForm.gameDay,
          gameTime: editForm.gameTime,
          notes: editForm.notes.trim() || undefined,
        }),
      }) as { game: GameRow };
      setGames((prev) => prev.map((g) => (g.id === editingId ? { ...g, ...data.game } : g)));
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteGame() {
    if (!gameToDelete) return;
    setDeletingId(gameToDelete);
    setError("");
    try {
      await api(`/games/${gameToDelete}`, { method: "DELETE" });
      setGames((prev) => prev.filter((g) => g.id !== gameToDelete));
      if (editingId === gameToDelete) setEditingId(null);
      setGameToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newGame.venueId || !newGame.gameDate.trim() || !newGame.gameTime.trim()) return;
    setAdding(true);
    setError("");
    try {
      const data = await api("/games", {
        method: "POST",
        body: JSON.stringify({
          venueId: newGame.venueId,
          gameDay: newGame.gameDay,
          gameTime: newGame.gameTime,
          notes: newGame.notes.trim() || undefined,
        }),
      }) as { game: GameRow };
      setGames((prev) => [...prev, data.game].sort((a, b) => a.gameDate.localeCompare(b.gameDate) || a.gameTime.localeCompare(b.gameTime)));
      setNewGame({ venueId: "", gameDate: "", gameTime: "19:00", notes: "" });
      setAddFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Add failed");
    } finally {
      setAdding(false);
    }
  }

  const dayFilterNorm = dayFilter.trim();
  const filteredGames = games.filter((g) => {
    if (venueFilter && g.venueId !== venueFilter) return false;
    if (dayFilterNorm && g.gameDay !== dayFilterNorm) return false;
    return true;
  });

  const addValid = newGame.venueId && newGame.gameDay.trim() && newGame.gameTime.trim();
  const editValid = editForm.venueId && editForm.gameDay.trim() && editForm.gameTime.trim();

  if (loading) return <p className="muted">Loading games…</p>;

  return (
    <div className="page">
      <div className={styles.pageHeader}>
        <h1>Manage Games</h1>
        {!addFormOpen && (
          <button type="button" className="btn btn-primary" onClick={() => setAddFormOpen(true)}>
            Add game
          </button>
        )}
      </div>
      <p className="muted">Add, edit, and delete games.</p>
      {error && <p className="error">{error}</p>}

      {addFormOpen && (
        <section className="section" style={{ marginBottom: "var(--space-lg)" }}>
          <div className={styles.addFormCard}>
            <h2>New game</h2>
            <form className={styles.addForm} onSubmit={handleAdd}>
              <div className={styles.formRow}>
                <label htmlFor="new-game-venue">Venue</label>
                <select
                  id="new-game-venue"
                  className={styles.select}
                  value={newGame.venueId}
                  onChange={(e) => setNewGame((f) => ({ ...f, venueId: e.target.value }))}
                  required
                >
                  <option value="">Select venue</option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.addFormGrid}>
                <div className={styles.formRow}>
                  <label htmlFor="new-game-date">Date</label>
                  <input
                    id="new-game-date"
                    type="date"
                    value={newGame.gameDate}
                    onChange={(e) => setNewGame((f) => ({ ...f, gameDate: e.target.value }))}
                    required
                  />
                </div>
                <div className={styles.formRow}>
                  <label htmlFor="new-game-time">Time</label>
                  <input
                    id="new-game-time"
                    type="time"
                    value={newGame.gameTime}
                    onChange={(e) => setNewGame((f) => ({ ...f, gameTime: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <label htmlFor="new-game-notes">Notes (optional)</label>
                <input
                  id="new-game-notes"
                  type="text"
                  value={newGame.notes}
                  onChange={(e) => setNewGame((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. Quarterly tournament"
                />
              </div>
              <div className={styles.addFormActions}>
                <button type="submit" className="btn btn-primary" disabled={adding || !addValid}>
                  {adding ? "Adding…" : "Add game"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setAddFormOpen(false);
                    setNewGame({ venueId: "", gameDay: "", gameTime: "19:00", notes: "" });
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
        <div className={styles.filterRow}>
          <div className={styles.formRow}>
            <label htmlFor="game-venue-filter" className={styles.filterLabel}>
              Venue
            </label>
            <select
              id="game-venue-filter"
              className="input select"
              value={venueFilter}
              onChange={(e) => setVenueFilter(e.target.value)}
              style={{ minWidth: "200px" }}
            >
              <option value="">All venues</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formRow}>
            <label htmlFor="game-day-filter" className={styles.filterLabel}>
              Day
            </label>
            <select
              id="game-day-filter"
              className="input select"
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              style={{ minWidth: "140px" }}
            >
              <option value="">All days</option>
              {DAYS_OF_WEEK.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Venue</th>
              <th>Notes</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {filteredGames.map((g) => (
              <tr key={g.id}>
                <td>{g.gameDay}</td>
                <td>{formatTimeForDisplay(g.gameTime)}</td>
                <td>{g.venueName}</td>
                <td>{g.notes ?? "—"}</td>
                <td>
                  <button type="button" className="btn-sm" onClick={() => startEdit(g)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-sm"
                    onClick={() => setGameToDelete(g.id)}
                    disabled={deletingId === g.id}
                  >
                    {deletingId === g.id ? "Deleting…" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {games.length === 0 && <p className="muted">No games yet. Add one above.</p>}
      {games.length > 0 && filteredGames.length === 0 && (
        <p className="muted">No games match the current filters.</p>
      )}

      {editingId !== null && (
        <div
          className="dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-game-dialog-title"
          onClick={(e) => e.target === e.currentTarget && cancelEdit()}
        >
          <div ref={editDialogRef} className="dialog" onClick={(e) => e.stopPropagation()}>
            <h2 id="edit-game-dialog-title" className="dialog__title">
              Edit game
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
                  <label htmlFor="edit-game-venue">Venue</label>
                  <select
                    id="edit-game-venue"
                    className="input select"
                    value={editForm.venueId}
                    onChange={(e) => setEditForm((f) => ({ ...f, venueId: e.target.value }))}
                  >
                    <option value="">Select venue</option>
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formRow}>
                  <label htmlFor="edit-game-day">Day</label>
                  <select
                    id="edit-game-day"
                    className="input select"
                    value={editForm.gameDay}
                    onChange={(e) => setEditForm((f) => ({ ...f, gameDay: e.target.value }))}
                  >
                    <option value="">Select day</option>
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formRow}>
                  <label htmlFor="edit-game-time">Time</label>
                  <input
                    id="edit-game-time"
                    type="time"
                    className="input"
                    value={editForm.gameTime}
                    onChange={(e) => setEditForm((f) => ({ ...f, gameTime: e.target.value }))}
                  />
                </div>
                <div className={styles.formRow}>
                  <label htmlFor="edit-game-notes">Notes (optional)</label>
                  <input
                    id="edit-game-notes"
                    type="text"
                    className="input"
                    value={editForm.notes}
                    onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
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
        open={gameToDelete !== null}
        onClose={() => setGameToDelete(null)}
        onConfirm={confirmDeleteGame}
        title="Delete game?"
        confirmLabel="Yes, delete"
        variant="danger"
        loading={deletingId !== null}
      >
        {gameToDelete && (() => {
          const g = games.find((x) => x.id === gameToDelete);
          return g ? (
            <>
              Are you sure you want to delete this game at <strong>{g.venueName}</strong> on {g.gameDay} at {formatTimeForDisplay(g.gameTime)}? Any signups will be removed.
            </>
          ) : null;
        })()}
      </ConfirmDialog>
    </div>
  );
}
