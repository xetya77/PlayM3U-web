'use client';

import { useState, useEffect } from 'react';
import { usePlaylistStore, useUIStore } from '@/store';
import { Button, Badge } from '@/components/ui/primitives';

function Clock() {
  const [time, setTime] = useState({ h: '', m: '', d: '' });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime({
        h: now.getHours().toString().padStart(2, '0'),
        m: now.getMinutes().toString().padStart(2, '0'),
        d: now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-center">
      <div className="flex items-baseline justify-center gap-1">
        <span className="text-5xl font-bold text-white tabular-nums tracking-tight">{time.h}</span>
        <span className="text-3xl font-light text-accent animate-pulse">:</span>
        <span className="text-5xl font-bold text-white tabular-nums tracking-tight">{time.m}</span>
      </div>
      <p className="text-sm text-muted mt-1">{time.d}</p>
    </div>
  );
}

export function DashboardPage() {
  const { navigateTo } = useUIStore();
  const { playlists, currentPlaylistIdx, setCurrentPlaylist } = usePlaylistStore();
  const currentPl = playlists[currentPlaylistIdx];

  const menuItems = [
    {
      id: 'watch',
      icon: '▶',
      label: 'Watch',
      desc: currentPl ? `${currentPl.name} · ${currentPl.channels.length.toLocaleString()} ch` : 'No playlist',
      action: () => navigateTo('player'),
      accent: true,
    },
    {
      id: 'playlists',
      icon: '📋',
      label: 'Playlists',
      desc: `${playlists.length} saved`,
      action: () => navigateTo('playlists'),
    },
    {
      id: 'add',
      icon: '➕',
      label: 'Add Playlist',
      desc: 'URL or file',
      action: () => navigateTo('source'),
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-bg-deep via-bg-card to-bg-deep page-enter">
      {/* Ambient top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 relative z-10">
        {/* Clock */}
        <Clock />

        {/* Current playlist badge */}
        {currentPl && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs text-muted">{currentPl.name}</span>
          </div>
        )}

        {/* Menu cards */}
        <div className="w-full max-w-sm space-y-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              disabled={item.id === 'watch' && !currentPl}
              className={`w-full glass-card rounded-2xl p-4 flex items-center gap-4 text-left transition-all active:scale-[0.98] hover:bg-bg-hover disabled:opacity-40 disabled:pointer-events-none ${item.accent ? 'border-accent/30' : ''}`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${item.accent ? 'bg-accent text-white' : 'bg-surface'}`}>
                {item.icon}
              </div>
              <div>
                <p className={`font-semibold ${item.accent ? 'text-accent' : 'text-white'}`}>{item.label}</p>
                <p className="text-xs text-muted">{item.desc}</p>
              </div>
              <svg className="ml-auto text-muted w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          ))}
        </div>
      </div>

      {/* Version footer */}
      <div className="pb-6 text-center text-xs text-muted/40">PlayM3U Web · PWA</div>
    </div>
  );
}
