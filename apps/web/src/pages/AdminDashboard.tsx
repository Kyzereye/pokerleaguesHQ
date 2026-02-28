import { Link } from "react-router-dom";

export default function AdminDashboard() {
  return (
    <div className="page">
      <h1>Admin</h1>
      <p className="muted">Manage players and venues.</p>
      <section className="section" style={{ marginBottom: "var(--space-md)" }}>
        <h2>Manage Players</h2>
        <p className="muted">View and edit users, roles, and status.</p>
        <Link to="/admin/players" className="btn btn-primary">
          Players
        </Link>
      </section>
      <section className="section" style={{ marginBottom: "var(--space-md)" }}>
        <h2>Manage Venues</h2>
        <p className="muted">Manage venues and locations.</p>
        <Link to="/admin/venues" className="btn btn-primary">
          Venues
        </Link>
      </section>
      <section className="section">
        <h2>Manage Games</h2>
        <p className="muted">Add, edit, and delete games by date and venue.</p>
        <Link to="/admin/games" className="btn btn-primary">
          Games
        </Link>
      </section>
    </div>
  );
}
