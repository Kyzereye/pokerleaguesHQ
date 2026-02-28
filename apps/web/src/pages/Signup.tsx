import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { formatTimeForDisplay } from "../utils/formatTime";
import ConfirmDialog from "../components/ConfirmDialog";
import styles from "./Signup.module.css";

interface Venue {
  id: string;
  name: string;
}

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Game {
  id: string;
  venueId: string;
  gameDay: string;
  gameTime: string;
  notes?: string;
  venueName: string;
  venueAddress?: string;
}

interface MySignup {
  gameId: string;
  gameDay: string;
  gameTime: string;
  notes?: string;
  venueName: string;
}

function getCurrentDay(): string {
  return DAYS_OF_WEEK[new Date().getDay()];
}

export default function Signup() {
  const navigate = useNavigate();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [mySignup, setMySignup] = useState<MySignup | null>(null);
  const [filterDay, setFilterDay] = useState(getCurrentDay());
  const [filterVenueId, setFilterVenueId] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [alreadySignedUpDialogOpen, setAlreadySignedUpDialogOpen] = useState(false);

  function loadVenues() {
    api("/venues")
      .then((data: { venues: Venue[] }) => setVenues(data.venues ?? []))
      .catch(() => setVenues([]));
  }

  useEffect(() => {
    loadVenues();
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterDay) params.set("day", filterDay);
    if (filterVenueId) params.set("venueId", filterVenueId);
    const qs = params.toString();
    Promise.all([
      api(`/games${qs ? `?${qs}` : ""}`).then((data: { games: Game[] }) => data.games ?? []),
      api("/my-signup").then((data: MySignup) => data).catch(() => null),
    ])
      .then(([gamesList, signup]) => {
        setGames(gamesList);
        setMySignup(signup);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterDay, filterVenueId]);

  async function handleSignup(gameId: string) {
    setMessage(null);
    setActionLoading(gameId);
    try {
      await api(`/games/${gameId}/signup`, { method: "POST" });
      setMessage({ type: "ok", text: "You're signed up. See you there!" });
      const [gamesList, signup] = await Promise.all([
        api(`/games${filterDay ? `?day=${filterDay}` : ""}`).then((d: { games: Game[] }) => d.games ?? []),
        api("/my-signup").then((d: MySignup) => d).catch(() => null),
      ]);
      setGames(gamesList);
      setMySignup(signup);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Sign up failed";
      if (errorMessage.toLowerCase().includes("already signed up")) {
        setAlreadySignedUpDialogOpen(true);
      } else {
        setMessage({ type: "err", text: errorMessage });
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemoveSignup(gameId: string) {
    setMessage(null);
    setActionLoading(gameId);
    try {
      await api(`/games/${gameId}/signup`, { method: "DELETE" });
      setMessage({ type: "ok", text: "Signup removed." });
      setMySignup(null);
      const params = new URLSearchParams();
      if (filterDay) params.set("day", filterDay);
      if (filterVenueId) params.set("venueId", filterVenueId);
      const qs = params.toString();
      const data = await api(`/games${qs ? `?${qs}` : ""}`);
      setGames((data as { games: Game[] }).games ?? []);
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "Failed to remove signup" });
    } finally {
      setActionLoading(null);
    }
  }

  const currentDay = getCurrentDay();

  return (
    <div className="page">
      <div className={styles.pageHeader}>
        <h1>Game signup</h1>
        <p className="muted">
          View available games by day and venue. You can only sign up for games on the day they occur.
        </p>
      </div>

      {/* Filters (based on poker_signup) */}
      <section className={`section ${styles.filtersCard}`}>
        <h2 className={styles.filtersTitle}>Filter games</h2>
        <p className={`muted ${styles.filtersSubtitle}`}>Select a day and optionally filter by venue</p>
        <div className={styles.filterRow}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="filter-day">Day</label>
            <select
              id="filter-day"
              className="select"
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
            >
              {DAYS_OF_WEEK.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setFilterDay(currentDay)}
          >
            Today
          </button>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="filter-venue">Venue</label>
            <select
              id="filter-venue"
              className="select"
              value={filterVenueId}
              onChange={(e) => setFilterVenueId(e.target.value)}
            >
              <option value="">All venues</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {mySignup && (
        <section className="section" style={{ marginBottom: "var(--space-lg)" }}>
          <h2>Your signup</h2>
          <p className="muted">
            {mySignup.venueName} — {mySignup.gameDay} at {formatTimeForDisplay(mySignup.gameTime)}
            {mySignup.notes ? ` — ${mySignup.notes}` : ""}
          </p>
          <p>
            <span className="muted">Remove your signup to choose a different game. </span>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => handleRemoveSignup(mySignup.gameId)}
              disabled={!!actionLoading}
            >
              {actionLoading === mySignup.gameId ? (
                <>
                  <span className="spinner-inline" aria-hidden />
                  Removing…
                </>
              ) : (
                "Remove signup"
              )}
            </button>
          </p>
        </section>
      )}

      <section className="section">
        <h2>
          {filterDay ? `Available games for ${filterDay}` : "Available games"}
        </h2>
        {message && <p className={message.type === "ok" ? "success" : "error"}>{message.text}</p>}
        {loading ? (
          <p className="muted">Loading games…</p>
        ) : games.length === 0 ? (
          <div className={styles.noGames}>
            <p className="muted">No games available.</p>
            <p className="muted">Try a different day or venue, or check back later.</p>
          </div>
        ) : (
          <div className={styles.cardsGrid}>
            {games.map((g) => {
              const isMySignup = mySignup?.gameId === g.id;
              const hasOtherSignup = mySignup && mySignup.gameId !== g.id;
              const isGameToday = g.gameDay === currentDay;
              const canSignUp = isGameToday && !hasOtherSignup && !isMySignup;

              return (
                <div
                  key={g.id}
                  className={`${styles.gameCard} ${!isGameToday ? styles.gameCardDisabled : ""}`}
                >
                  <div className={styles.gameCardHeader}>
                    <h3 className={styles.gameCardTitle}>{g.venueName}</h3>
                    <p className="muted">
                      {g.gameDay} at {formatTimeForDisplay(g.gameTime)}
                    </p>
                  </div>
                  <div className={styles.gameCardBody}>
                    {g.venueAddress && (
                      <p className={`muted ${styles.gameDetail}`}>
                        <span className={styles.gameDetailIcon} aria-hidden>📍</span>
                        {g.venueAddress}
                      </p>
                    )}
                    {g.notes && (
                      <p className={`muted ${styles.gameDetail}`}>
                        <span className={styles.gameDetailIcon} aria-hidden>ℹ</span>
                        {g.notes}
                      </p>
                    )}
                  </div>
                  <div className={styles.gameCardActions}>
                    {isMySignup ? (
                      <span className="muted">You're signed up</span>
                    ) : hasOtherSignup ? (
                      <span className="muted">Remove other signup first</span>
                    ) : canSignUp ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleSignup(g.id)}
                        disabled={!!actionLoading}
                      >
                        {actionLoading === g.id ? (
                          <>
                            <span className="spinner-inline" aria-hidden />
                            Signing up…
                          </>
                        ) : (
                          "Sign up for this game"
                        )}
                      </button>
                    ) : (
                      <p className={`muted ${styles.disabledSignup}`}>
                        Sign up only available on the day of the game.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {message?.type === "ok" && (
        <p>
          <Link to="/the-list" className="btn btn-primary">
            View the list
          </Link>
        </p>
      )}

      <ConfirmDialog
        open={alreadySignedUpDialogOpen}
        onClose={() => setAlreadySignedUpDialogOpen(false)}
        onConfirm={() => {
          setAlreadySignedUpDialogOpen(false);
          navigate("/the-list");
        }}
        title="Already signed up"
        confirmLabel="View the list"
        cancelLabel="Stay"
      >
        You're already signed up for another game. Remove that signup first if you want to choose a different game.
      </ConfirmDialog>
    </div>
  );
}
