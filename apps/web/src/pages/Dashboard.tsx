import { Link } from "react-router-dom";
import { useAuth } from "../auth/context";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const { user } = useAuth();

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
        No upcoming game.
      </p>

      <section className="section" style={{ marginBottom: "var(--space-lg)" }}>
        <h2>Your upcoming game</h2>
        <p className="muted">You haven’t signed up for a game yet.</p>
        <p>
          <Link to="/signup" className="btn btn-primary">
            Sign up for a game
          </Link>
        </p>
      </section>

      <section className="section">
        <h2>Recent activity</h2>
        <p className="muted">No recent activity.</p>
      </section>
    </div>
  );
}
