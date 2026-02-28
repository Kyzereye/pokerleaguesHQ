import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/context";
import { api } from "../api/client";
import { formatAddressDisplay } from "../utils/venueAddress";
import { formatTimeForDisplay } from "../utils/formatTime";
import ConfirmDialog from "../components/ConfirmDialog";
import styles from "./TheList.module.css";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface MySignup {
  gameId: string;
  gameDay: string;
  gameTime: string;
  notes?: string;
  venueName: string;
  venueAddress?: string;
}

interface PlayerSignup {
  signedUpAt: string;
  userId: string;
  displayName: string;
  email: string;
}

interface Game {
  id: string;
  venueId: string;
  gameDay: string;
  gameTime: string;
  notes?: string;
  venueName: string;
  venueAddress?: string;
}

interface VenueGroup {
  venueId: string;
  name: string;
  address?: string;
  games: Game[];
}

export default function TheList() {
  const { user } = useAuth();
  const [hasSignup, setHasSignup] = useState(false);
  const [userGame, setUserGame] = useState<MySignup | null>(null);
  const [playerSignups, setPlayerSignups] = useState<PlayerSignup[]>([]);
  const [todaysGames, setTodaysGames] = useState<VenueGroup[]>([]);
  const [signupsByGameId, setSignupsByGameId] = useState<Record<string, PlayerSignup[]>>({});
  const [selectedDay, setSelectedDay] = useState(DAYS_OF_WEEK[new Date().getDay()]);
  const [loading, setLoading] = useState(true);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const loadUserCurrentGame = useCallback(() => {
    setLoading(true);
    setMessage(null);
    api("/my-signup")
      .then((data: MySignup) => {
        setHasSignup(true);
        setUserGame(data);
        return api(`/games/${data.gameId}/signups`);
      })
      .then((data: { signups: PlayerSignup[] }) => {
        setPlayerSignups(data.signups ?? []);
      })
      .catch(() => {
        setHasSignup(false);
        setUserGame(null);
        setPlayerSignups([]);
        setSignupsByGameId({});
        return api(`/games?day=${selectedDay}`).then(async (data: { games: Game[] }) => {
          const games = data.games ?? [];
          const byVenue = new Map<string, VenueGroup>();
          games.forEach((g) => {
            let group = byVenue.get(g.venueId);
            if (!group) {
              group = { venueId: g.venueId, name: g.venueName, address: g.venueAddress, games: [] };
              byVenue.set(g.venueId, group);
            }
            group.games.push(g);
          });
          setTodaysGames(Array.from(byVenue.values()));

          const signupsByGame: Record<string, PlayerSignup[]> = {};
          const signupResults = await Promise.allSettled(
            games.map((g) => api(`/games/${g.id}/signups`))
          );
          signupResults.forEach((result, i) => {
            const gameId = games[i]?.id;
            if (gameId && result.status === "fulfilled" && result.value) {
              const d = result.value as { signups?: PlayerSignup[] };
              signupsByGame[gameId] = d.signups ?? [];
            } else if (gameId) {
              signupsByGame[gameId] = [];
            }
          });
          setSignupsByGameId(signupsByGame);
        });
      })
      .finally(() => setLoading(false));
  }, [selectedDay]);

  useEffect(() => {
    loadUserCurrentGame();
  }, [loadUserCurrentGame]);

  function formatSignupTime(iso: string) {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  }

  function handleRemoveSignup() {
    if (!userGame) return;
    setRemoving(true);
    setMessage(null);
    api(`/games/${userGame.gameId}/signup`, { method: "DELETE" })
      .then(() => {
        setRemoveDialogOpen(false);
        setMessage({ type: "ok", text: "Successfully removed from game signup." });
        loadUserCurrentGame();
      })
      .catch((err) => {
        setMessage({ type: "err", text: err instanceof Error ? err.message : "Failed to remove signup." });
        setRemoveDialogOpen(false);
      })
      .finally(() => setRemoving(false));
  }

  const isCurrentUser = (userId: string) => user?.id === userId;

  if (loading) {
    return (
      <div className="page">
        <h1>The list</h1>
        <p className="muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className={`page ${styles.theList}`}>
      <div className={styles.pageHeader}>
        <h1>The list</h1>
        <p className="muted">View game signups and player information</p>
      </div>

      {message && <p className={message.type === "ok" ? "success" : "error"}>{message.text}</p>}

      {hasSignup && userGame && (
        <>
          <section className={`section ${styles.gameDetailsCard}`}>
            <h2 className={styles.gameCardTitle}>{userGame.venueName}</h2>
            <p className="muted">
              {userGame.gameDay} at {formatTimeForDisplay(userGame.gameTime)}
              {userGame.notes ? ` — ${userGame.notes}` : ""}
            </p>
            {userGame.venueAddress && <p className="muted">{formatAddressDisplay(userGame.venueAddress)}</p>}
            <p className="muted">
              <strong>Players signed up:</strong> {playerSignups.length}
            </p>
          </section>

          <section className="section">
            <h2>Players signed up</h2>
            <p className="muted">{playerSignups.length} player{playerSignups.length !== 1 ? "s" : ""}</p>

            {playerSignups.length === 0 ? (
              <div className={styles.emptyState}>
                <p className="muted">No other players yet. You're the first one signed up for this game!</p>
              </div>
            ) : (
              <ul className={styles.playersList}>
                {playerSignups.map((signup, i) => (
                  <li key={signup.userId} className={styles.playerCard}>
                    <div className={styles.playerInfo}>
                      <span className={styles.playerNumber}>{i + 1}</span>
                      <span className={styles.playerName}>{signup.displayName || signup.email}</span>
                    </div>
                    <div className={styles.playerActions}>
                      {isCurrentUser(signup.userId) && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => setRemoveDialogOpen(true)}
                          title="Remove my signup"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className={styles.signupTime}>
                      Signed up {formatSignupTime(signup.signedUpAt)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {!hasSignup && (
        <>
          <section className="section">
            <h2>Games — {selectedDay}</h2>
            <p className="muted">You're not signed up for any games. View games and who's signed up by day:</p>
            <div className="form-group" style={{ marginTop: "var(--space-sm)", marginBottom: "var(--space-md)", maxWidth: "200px" }}>
              <label htmlFor="thelist-day">Day</label>
              <select
                id="thelist-day"
                className="select"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {todaysGames.length === 0 ? (
            <section className="section">
              <div className={styles.emptyState}>
                <h3>No games</h3>
                <p className="muted">There are no poker games scheduled for {selectedDay}.</p>
                <Link to="/signup" className="btn btn-primary">
                  View all games
                </Link>
              </div>
            </section>
          ) : (
            todaysGames.map((venue) => (
              <section key={venue.venueId} className="section">
                <h3>{venue.name}</h3>
                {venue.address && <p className="muted">{venue.address}</p>}
                <ul className={styles.gamesList}>
                  {venue.games.map((game) => {
                    const signups = signupsByGameId[game.id] ?? [];
                    return (
                      <li key={game.id} className={styles.gameCard}>
                        <p>
                          <strong>{game.gameDay} at {formatTimeForDisplay(game.gameTime)}</strong>
                          {game.notes && <span className="muted"> — {game.notes}</span>}
                        </p>
                        <p className="muted">
                          <strong>Players signed up:</strong> {signups.length}
                          {signups.length > 0 && (
                            <span> — {signups.map((s) => s.displayName || s.email).join(", ")}</span>
                          )}
                        </p>
                        <Link to="/signup" className="btn btn-primary btn-sm">
                          Sign up for this game
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </>
      )}

      <ConfirmDialog
        open={removeDialogOpen}
        onClose={() => setRemoveDialogOpen(false)}
        onConfirm={handleRemoveSignup}
        title="Remove signup?"
        confirmLabel="Yes, remove me"
        variant="danger"
        loading={removing}
      >
        {userGame && (
          <>Are you sure you want to remove yourself from {userGame.venueName} on {userGame.gameDay} at {formatTimeForDisplay(userGame.gameTime)}?</>
        )}
      </ConfirmDialog>
    </div>
  );
}
