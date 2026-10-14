import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityRecord = {
  type: string;
  minutes: number;
  points: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const { activities: items } = await getJson<{ activities: ActivityRecord[] }>('/api/activities');
        if (alive) {
          setActivities(items ?? []);
          setError(null);
        }
      } catch (err) {
        if (alive) {
          setError(err instanceof Error ? err.message : 'Unable to load activities');
          setActivities([]);
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
    <CapabilityCard title="Activities" description="Track student activity minutes and points.">
      {loading && <p role="status">Loading activities...</p>}
      {!loading && error && <div role="alert">Unable to load activities: {error}</div>}
      {!loading && !error && activities.length === 0 && <p>No activities found.</p>}
      {!loading && !error && activities.length > 0 && (
        <ul className="list-group list-group-flush">
          {activities.map((activity, index) => (
            <li key={`${activity.type}-${activity.minutes}-${index}`} className="list-group-item">
              {activity.type} · {activity.minutes} minutes · {activity.points} points
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}

