import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const { leaderboard: items } = await getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard');
        if (alive) {
          setEntries(items ?? []);
          setError(null);
        }
      } catch (err) {
        if (alive) {
          setError(err instanceof Error ? err.message : 'Unable to load leaderboard');
          setEntries([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals.">
      {loading && <p role="status">Loading leaderboard...</p>}
      {!loading && error && <div role="alert">Unable to load leaderboard: {error}</div>}
      {!loading && !error && entries.length === 0 && <p>No leaderboard found.</p>}
      {!loading && !error && entries.length > 0 && (
        <ol className="list-group list-group-numbered">
          {entries.map((entry) => (
            <li key={`${entry.teamName}-${entry.rank}`} className="list-group-item d-flex justify-content-between align-items-center">
              <span>{entry.rank}. {entry.teamName}</span>
              <span>{entry.totalPoints}</span>
            </li>
          ))}
        </ol>
      )}
    </CapabilityCard>
  );
}

