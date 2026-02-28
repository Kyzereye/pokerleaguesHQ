import { useState, useEffect } from "react";
import { api } from "../api/client";

interface StandingRow {
  rank: number;
  userId: string;
  displayName: string;
  points: number;
  wins: number;
  period: string;
}

export default function Standings() {
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [periods, setPeriods] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    const url = selectedPeriod ? `/standings?period=${encodeURIComponent(selectedPeriod)}` : "/standings";
    api(url)
      .then((data: { standings: StandingRow[]; periods: string[] }) => {
        setStandings(data.standings ?? []);
        setPeriods(data.periods ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load standings"))
      .finally(() => setLoading(false));
  }, [selectedPeriod]);

  return (
    <div className="page">
      <h1>Standings</h1>
      <p className="muted">Points and rankings by period.</p>

      {periods.length > 1 && (
        <div className="form-group" style={{ marginBottom: "var(--space-lg)", maxWidth: "200px" }}>
          <label htmlFor="standings-period">Period</label>
          <select
            id="standings-period"
            className="select"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="">All</option>
            {periods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading…</p>}

      {!loading && !error && (
        <section className="section">
          <h2>Rankings</h2>
          {standings.length === 0 ? (
            <p className="muted">No standings yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Points</th>
                    <th>Wins</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row) => (
                    <tr key={row.userId}>
                      <td>{row.rank}</td>
                      <td>{row.displayName}</td>
                      <td>{row.points}</td>
                      <td>{row.wins}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
