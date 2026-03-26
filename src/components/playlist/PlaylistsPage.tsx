'use client';

import { useState } from 'react';
import { usePlaylistStore, useUIStore } from '@/store';
import { useUpdatePlaylistMutation } from '@/hooks/usePlaylistQuery';
import { useM3UWorker } from '@/hooks/useM3UWorker';
import { Button, Spinner, Badge } from '@/components/ui/primitives';
import type { Playlist } from '@/types';

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function PlaylistsPage() {
  const { navigateTo, navigateBack } = useUIStore();
  const { playlists, currentPlaylistIdx, setCurrentPlaylist, removePlaylist } = usePlaylistStore();
  const { parse } = useM3UWorker();
  const updateMutation = useUpdatePlaylistMutation(parse);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleUpdate = async (pl: Playlist) => {
    if (pl.type === 'file') return;
    setUpdatingId(pl.id);
    try { await updateMutation.mutateAsync(pl); } catch { /* ignore */ }
    finally { setUpdatingId(null); }
  };

  const handleSwitch = (idx: number) => {
    setCurrentPlaylist(idx);
    navigateTo('player');
  };

  return (
    <div className="flex flex-col h-full page-enter">
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={navigateBack} className="p-2 rounded-xl hover:bg-bg-hover transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div>
            <h2 className="text-lg font-semibold">Playlists</h2>
            <p className="text-xs text-muted">{playlists.length} saved</p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigateTo('source')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 space-y-3 pb-4">
        {playlists.map((pl, idx) => {
          const isActive = idx === currentPlaylistIdx;
          return (
            <div
              key={pl.id}
              className={`glass-card rounded-2xl overflow-hidden transition-all ${isActive ? 'border-accent/40' : ''}`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white truncate">{pl.name}</span>
                      {isActive && <Badge color="blue">Active</Badge>}
                      {pl.type === 'file' && <Badge color="green">Local</Badge>}
                    </div>
                    <p className="text-xs text-muted mt-1 truncate">{pl.url}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {pl.channels.length.toLocaleString()} channels · Updated {timeAgo(pl.lastUpdated)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-white/5 px-4 py-2.5 flex items-center gap-2">
                {!isActive && (
                  <Button variant="primary" size="sm" onClick={() => handleSwitch(idx)}>
                    Watch
                  </Button>
                )}
                {pl.type === 'url' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={updatingId === pl.id}
                    onClick={() => handleUpdate(pl)}
                  >
                    {updatingId === pl.id ? <Spinner size={14} /> : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    )}
                    Refresh
                  </Button>
                )}
                {deletingId === pl.id ? (
                  <div className="ml-auto flex gap-2">
                    <Button variant="danger" size="sm" onClick={() => { removePlaylist(pl.id); setDeletingId(null); }}>
                      Delete
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeletingId(null)}>Cancel</Button>
                  </div>
                ) : (
                  <button
                    className="ml-auto p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    onClick={() => setDeletingId(pl.id)}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
