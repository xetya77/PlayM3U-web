import { useRef, useCallback, useEffect } from 'react';
import type { Channel, WorkerParseResponse } from '@/types';

type ParseCallback = (channels: Channel[], error?: string) => void;

/**
 * Hook that owns a persistent M3U Web Worker.
 * Pending callbacks are stored by request ID so multiple parses can
 * be in-flight simultaneously.
 */
export function useM3UWorker() {
  const workerRef = useRef<Worker | null>(null);
  const callbacksRef = useRef<Map<string, ParseCallback>>(new Map());

  useEffect(() => {
    // Worker is only available in browser
    if (typeof window === 'undefined') return;

    const worker = new Worker(new URL('../workers/m3u.worker.ts', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (e: MessageEvent<WorkerParseResponse>) => {
      const { id, channels, error } = e.data;
      const cb = callbacksRef.current.get(id);
      if (cb) {
        cb(channels, error);
        callbacksRef.current.delete(id);
      }
    };

    worker.onerror = (err) => {
      console.error('[M3UWorker] error', err);
    };

    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const parse = useCallback(
    (content: string): Promise<Channel[]> => {
      return new Promise((resolve, reject) => {
        const worker = workerRef.current;
        if (!worker) {
          // Fallback: inline parse (SSR or worker not ready)
          // Just resolve empty — real parse happens client-side
          resolve([]);
          return;
        }

        const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
        callbacksRef.current.set(id, (channels, error) => {
          if (error) reject(new Error(error));
          else resolve(channels);
        });

        worker.postMessage({ type: 'PARSE', id, content });
      });
    },
    []
  );

  return { parse };
}
