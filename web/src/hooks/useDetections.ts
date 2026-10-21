import { useEffect, useState } from 'react';
import type { Detections } from '../types';

export function useDetections(url = '/detections.json') {
  const [data, setData] = useState<Detections | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`Could not load ${url} (${r.status})`);
        return r.json();
      })
      .then((d: Detections) => alive && setData(d))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [url]);

  return { data, error };
}
