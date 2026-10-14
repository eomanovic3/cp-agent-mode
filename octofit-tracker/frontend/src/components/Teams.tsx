import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamRecord = {
  name: string;
  mascot: string;
  members: Array<string | { _id?: string; name?: string }>;
};

export default function Teams() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const { teams: items } = await getJson<{ teams: TeamRecord[] }>('/api/teams');
        if (alive) {
          setTeams(items ?? []);
          setError(null);
        }
      } catch (err) {
        if (alive) {
          setError(err instanceof Error ? err.message : 'Unable to load teams');
          setTeams([]);
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
    <CapabilityCard title="Teams" description="Manage teams and members.">
      {loading && <p role="status">Loading teams...</p>}
      {!loading && error && <div role="alert">Unable to load teams: {error}</div>}
      {!loading && !error && teams.length === 0 && <p>No teams found.</p>}
      {!loading && !error && teams.length > 0 && (
        <ul className="list-group list-group-flush">
          {teams.map((team) => (
            <li key={team.name} className="list-group-item">
              <strong>{team.name}</strong> ({team.mascot})
              <div>{team.members.length} member(s): {team.members.map((member) => typeof member === 'string' ? member : member.name ?? member._id ?? 'Unknown').join(', ') || 'None'}</div>
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
