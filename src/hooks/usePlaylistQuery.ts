import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePlaylistStore } from '@/store';
import type { Channel, Playlist } from '@/types';

// ─── Fetch raw M3U text ───────────────────────────────────────────────────────

async function fetchM3UContent(url: string): Promise<string> {
  // Try direct fetch first; fall back to CORS proxy
  const proxies = [
    url,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  ];

  let lastErr: Error | undefined;
  for (const target of proxies) {
    try {
      const res = await fetch(target, {
        headers: { 'User-Agent': 'PlayM3U-Web/1.0' },
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (text.includes('#EXTM3U') || text.includes('#EXTINF')) return text;
      throw new Error('Not a valid M3U file');
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr ?? new Error('Failed to fetch playlist');
}

// ─── Query key factory ────────────────────────────────────────────────────────

export const queryKeys = {
  playlist: (id: string) => ['playlist', id] as const,
  channelLogo: (url: string) => ['logo', url] as const,
};

// ─── Hook: fetch + cache playlist channels ────────────────────────────────────

export function usePlaylistQuery(playlist: Playlist | undefined, parseM3U: (content: string) => Promise<Channel[]>) {
  return useQuery({
    queryKey: queryKeys.playlist(playlist?.id ?? ''),
    queryFn: async () => {
      if (!playlist) return [];
      if (playlist.type === 'file' || playlist.url.startsWith('data:')) {
        // Already parsed channels stored in playlist
        return playlist.channels;
      }
      const content = await fetchM3UContent(playlist.url);
      const channels = await parseM3U(content);
      return channels;
    },
    enabled: !!playlist,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,   // 30 minutes
    retry: 2,
  });
}

// ─── Hook: update playlist from network ──────────────────────────────────────

export function useUpdatePlaylistMutation(
  parseM3U: (content: string) => Promise<Channel[]>
) {
  const queryClient = useQueryClient();
  const updatePlaylist = usePlaylistStore((s) => s.updatePlaylist);

  return useMutation({
    mutationFn: async (playlist: Playlist) => {
      if (playlist.type === 'file') {
        return { id: playlist.id, channels: playlist.channels };
      }
      const content = await fetchM3UContent(playlist.url);
      const channels = await parseM3U(content);
      return { id: playlist.id, channels };
    },
    onSuccess: ({ id, channels }) => {
      const now = Date.now();
      updatePlaylist(id, channels, now);
      queryClient.invalidateQueries({ queryKey: queryKeys.playlist(id) });
    },
  });
}
