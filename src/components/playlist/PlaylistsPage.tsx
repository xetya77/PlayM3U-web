'use client';
import { useState } from 'react';
import { usePlaylistStore, useUIStore } from '@/store';
import { useUpdatePlaylistMutation } from '@/hooks/usePlaylistQuery';
import { useM3UWorker } from '@/hooks/useM3UWorker';
import type { Playlist } from '@/types';

export function PlaylistsPage() {
  const { navigateTo, navigateBack } = useUIStore();
  const { playlists, currentPlaylistIdx, setCurrentPlaylist, removePlaylist, updatePlaylist } = usePlaylistStore();
  const { parse } = useM3UWorker();
  const updateMutation = useUpdatePlaylistMutation(parse);
  const [refreshingId, setRefreshingId] = useState<string|null>(null);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editName, setEditName] = useState('');

  const handleRefresh = async (pl: Playlist) => {
    if (pl.type === 'file') return;
    setRefreshingId(pl.id);
    try { await updateMutation.mutateAsync(pl); } finally { setRefreshingId(null); }
  };

  return (
    <div className="flex flex-col h-full page-enter" style={{background:'#16232A'}}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4 border-b" style={{borderColor:'#1C2F3A'}}>
        <button onClick={navigateBack}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
          style={{background:'transparent', color:'#FF5B04'}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="flex-1 text-center">
          <h2 className="text-lg font-black text-white">Playlist</h2>
          <p className="text-xs" style={{color:'#7A9BA3'}}>{playlists.length} playlist tersimpan</p>
        </div>
        <div className="w-9" />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {playlists.map((pl, idx) => {
          const isActive = idx === currentPlaylistIdx;
          return (
            <div key={pl.id} className="rounded-3xl p-5 border-2"
              style={{
                background:'#1C2F3A',
                borderColor: isActive ? '#0A5055' : '#1C2F3A',
              }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm"
                  style={{background:'#16232A', color:'#E4EEF0'}}>
                  {idx+1}
                </div>
                {editingId === pl.id ? (
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    className="flex-1 bg-transparent text-base font-bold border-b text-white"
                    style={{borderColor:'#0A5055'}}
                    onKeyDown={e => { if (e.key==='Enter') {
                      updatePlaylist(pl.id, pl.channels, pl.lastUpdated);
                      setEditingId(null);
                    }}}
                    autoFocus />
                ) : (
                  <span className="flex-1 font-black text-white">{pl.name}</span>
                )}
                {isActive && (
                  <span className="px-3 py-1 rounded-full text-xs font-black text-white"
                    style={{background:'#FF5B04'}}>ACTIVE</span>
                )}
              </div>
              <p className="text-sm mb-1" style={{color:'#7A9BA3'}}>
                {pl.channels.length} channel
                {pl.downloadOnStart && <> · <span style={{color:'#E4EEF0'}}>Auto update</span></>}
              </p>
              <p className="text-xs mb-4 truncate" style={{color:'#4A6670'}}>{pl.url}</p>
              <div className="flex gap-2">
                <button onClick={() => { setEditingId(pl.id); setEditName(pl.name); }}
                  className="pill-btn flex-1 py-3 text-sm text-white"
                  style={{background:'#0A5055'}}>Name</button>
                <button onClick={() => handleRefresh(pl)} disabled={refreshingId===pl.id || pl.type==='file'}
                  className="pill-btn flex-1 py-3 text-sm text-white"
                  style={{background:'#1A3A40', border:'1px solid #0A5055', opacity: pl.type==='file'?0.4:1}}>
                  {refreshingId===pl.id ? '...' : 'URL'}
                </button>
                <button onClick={() => removePlaylist(pl.id)}
                  className="pill-btn flex-1 py-3 text-sm"
                  style={{background:'#2A1010', color:'#FF5B04', border:'1px solid #3A1818'}}>
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer buttons */}
      <div className="px-5 pb-8 flex flex-col gap-3">
        <div className="flex gap-3">
          <button onClick={async () => {
            for (const pl of playlists) {
              if (pl.type === 'url') await updateMutation.mutateAsync(pl).catch(()=>{});
            }
          }}
            className="pill-btn flex-1 py-4 text-white font-bold"
            style={{background:'#0A5055'}}>Refresh All</button>
          <button onClick={() => { setCurrentPlaylist(currentPlaylistIdx); navigateTo('player'); }}
            className="pill-btn flex-1 py-4 text-white font-bold"
            style={{background:'#1C2F3A', border:'1px solid #2A3F4A'}}>Switch Main</button>
        </div>
        <button onClick={() => navigateTo('source')}
          className="pill-btn w-full py-5 text-white font-black text-lg"
          style={{background:'#FF5B04', fontSize:'18px'}}>+ Add Playlist</button>
      </div>
    </div>
  );
}
