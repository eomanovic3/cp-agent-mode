import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title: string;
  focus?: string;
  reason?: string;
  minutes?: number;
  difficulty?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const userEmail = 'mona@example.com';
        const { suggestions: items } = await getJson<{ suggestions: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`);
        if (alive) {
          setSuggestions(items ?? []);
          setError(null);
        }
      } catch (err) {
        if (alive) {
          setError(err instanceof Error ? err.message : 'Unable to load workout suggestions');
          setSuggestions([]);
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
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
      {loading && <p role="status">Loading workout suggestions...</p>}
      {!loading && error && <div role="alert">Unable to load workout suggestions: {error}</div>}
      {!loading && !error && suggestions.length === 0 && <p>No workout suggestions found.</p>}
      {!loading && !error && suggestions.length > 0 && (
        <ul className="list-group list-group-flush">
          {suggestions.map((suggestion) => (
            <li key={suggestion.title} className="list-group-item">
              <strong>{suggestion.title}</strong>
              {suggestion.focus && <div>Focus: {suggestion.focus}</div>}
              {suggestion.reason && <div>{suggestion.reason}</div>}
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}

