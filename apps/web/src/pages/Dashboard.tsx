import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/context";
import { api } from "../api/client";
import { formatTimeForDisplay } from "../utils/formatTime";
import styles from "./Dashboard.module.css";

interface MySignup {
  gameId: string;
  gameDay: string;
  gameTime: string;
  notes?: string;
  venueName: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [mySignup, setMySignup] = useState<MySignup | null>(null);

  useEffect(() => {
    api("/my-signup")
      .then((data: MySignup) => setMySignup(data))
      .catch(() => setMySignup(null));
  }, []);

  function formatDisplayDate(s: string) {
    const d = new Date(s + "Z");
    return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div>
          <h1>Dashboard</h1>
          <p className="muted">
            {`Welcome back${user?.displayName ? `, ${user.displayName}` : user?.email ? `, ${user.email}` : ""}.`}
          </p>
        </div>
      </div>

      <p className="muted" style={{ marginBottom: "var(--space-lg)" }}>
        {mySignup ? "You have an upcoming game." : "No upcoming game."}
      </p>

      <section className="section" style={{ marginBottom: "var(--space-lg)" }}>
        <h2>Your upcoming game</h2>
        {mySignup ? (
          <>
            <p className="muted">
              {mySignup.venueName} — {mySignup.gameDay} at {formatTimeForDisplay(mySignup.gameTime)}
              {mySignup.notes ? ` — ${mySignup.notes}` : ""}
            </p>
            <p>
              <Link to="/the-list" className="btn btn-primary">
                View the list
              </Link>
              {" "}
              <Link to="/signup" className="btn btn-secondary">
                Change signup
              </Link>
            </p>
          </>
        ) : (
          <>
            <p className="muted">You haven’t signed up for a game yet.</p>
            <p>
              <Link to="/signup" className="btn btn-primary">
                Sign up for a game
              </Link>
            </p>
          </>
        )}
      </section>

      <section className="section">
        <h2>Recent activity</h2>
        <p className="muted">No recent activity.</p>
      </section>
    </div>
  );
}
