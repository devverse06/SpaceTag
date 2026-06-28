"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SpaceRecord } from "@/lib/types";

const POLL_INTERVAL_MS = 3000;
const MAX_CONSECUTIVE_ERRORS = 5;

export function useSpacePolling(
  spaceId: string | null,
  enabled: boolean,
  onUpdate?: (space: SpaceRecord) => void,
  onError?: (message: string) => void,
) {
  const [space, setSpace] = useState<SpaceRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onUpdateRef = useRef(onUpdate);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
    onErrorRef.current = onError;
  }, [onUpdate, onError]);

  const fetchSpace = useCallback(async (id: string) => {
    const response = await fetch(`/api/spaces/${id}?lite=1`);
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      throw new Error(data.error ?? "Failed to fetch space");
    }
    return (await response.json()) as SpaceRecord;
  }, []);

  useEffect(() => {
    if (!spaceId || !enabled) return;

    let cancelled = false;
    let consecutiveErrors = 0;

    const poll = async () => {
      try {
        const record = await fetchSpace(spaceId);
        if (cancelled) return;

        consecutiveErrors = 0;
        setSpace(record);
        setError(null);
        onUpdateRef.current?.(record);

        if (record.status === "DONE" || record.status === "FAILED") {
          return true;
        }
        return false;
      } catch (err) {
        if (cancelled) return true;

        consecutiveErrors += 1;
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          const message = err instanceof Error ? err.message : "Polling failed";
          setError(message);
          onErrorRef.current?.(message);
          return true;
        }
        return false;
      }
    };

    let intervalId: ReturnType<typeof setInterval> | undefined;

    void poll().then((done) => {
      if (done || cancelled) return;
      intervalId = setInterval(() => {
        void poll().then((finished) => {
          if (finished && intervalId) clearInterval(intervalId);
        });
      }, POLL_INTERVAL_MS);
    });

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [spaceId, enabled, fetchSpace]);

  return { space, error };
}
