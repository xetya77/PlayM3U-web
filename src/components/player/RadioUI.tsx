'use client';

import { useState, useEffect } from 'react';
import type { Channel } from '@/types';
import { useSettingsStore, usePlayerStore } from '@/store';

function VinylDisc({ channel, spinning }: { channel: Channel; spinning: boolean }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className={`relative w-44 h-44 ${spinning ? 'vinyl-spin' : 'vinyl-spin paused'}`}>
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-700 via-slate-900 to-slate-700 shadow-2xl shadow-black/60" />
      {/* Groove lines */}
      {[0.75, 0.65, 0.55, 0.45].map((r) => (
        <div
          key={r}
          className="absolute rounded-full border border-white/5"
          style={{
            inset: `${(1 - r) / 2 * 100}%`,
          }}
        />
      ))}
      {/* Label center */}
      <div className="absolute inset-[30%] rounded-full bg-gradient-to-br from-accent-dim to-bg-deep overflow-hidden flex items-center justify-center">
        {channel.logoUrl && !imgFailed ? (
          <img src={channel.logoUrl} alt="" onError={() => setImgFailed(true)} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl font-bold text-accent/60">
            {channel.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      {/* Center pin */}
      <div className="absolute inset-[48%] rounded-full bg-white/20" />
      {/* Shine */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
    </div>
  );
}

function EQBars({ playing }: { playing: boolean }) {
  return (
    <div className={`flex items-end gap-1 h-8 ${playing ? '' : 'opacity-30'}`}>
      {[6, 10, 14, 8, 12, 16, 10, 7, 13, 9].map((h, i) => (
        <div
          key={i}
          className={`w-1.5 bg-accent rounded-full origin-bottom ${playing ? 'eq-bar' : ''}`}
          style={{
            height: `${h * 4}%`,
            animationDelay: `${i * 0.07}s`,
            minHeight: '4px',
          }}
        />
      ))}
    </div>
  );
}

interface Props {
  channel: Channel;
}

export function RadioUI({ channel }: Props) {
  const { settings } = useSettingsStore();
  const { playerState, nowPlaying } = usePlayerStore();
  const playing = playerState === 'playing';

  const bgMode = settings.radioBgMode;

  const getBgClass = () => {
    if (bgMode === 'aurora_full' || bgMode === 'aurora_half') return 'aurora-bg';
    if (bgMode === 'solid') return 'bg-bg-deep';
    if (bgMode === 'sweep') return 'bg-gradient-to-br from-bg-deep via-accent-dim/30 to-bg-deep';
    return 'aurora-bg';
  };

  return (
    <div className={`relative flex flex-col items-center justify-center w-full h-full overflow-hidden ${getBgClass()}`}>
      {/* Background blur overlay */}
      {channel.logoUrl && (
        <div
          className="absolute inset-0 scale-125 blur-3xl opacity-20"
          style={{ backgroundImage: `url(${channel.logoUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      )}

      <div className="relative z-10 flex flex-col items-center gap-6 px-8">
        {/* Vinyl / cover */}
        <div className="relative">
          <div className="absolute inset-0 scale-110 rounded-full bg-accent/10 blur-2xl" />
          {settings.radioCoverMode.includes('vinyl') ? (
            <VinylDisc channel={channel} spinning={playing} />
          ) : (
            // Album art / logo square
            <div className="w-44 h-44 rounded-2xl overflow-hidden bg-bg-card shadow-2xl shadow-black/60">
              {channel.logoUrl ? (
                <img src={channel.logoUrl} alt={channel.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-accent/40">
                  {channel.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Channel info */}
        <div className="text-center space-y-1 max-w-xs">
          <h2 className="text-xl font-bold text-white truncate">{channel.name}</h2>
          {channel.group && (
            <p className="text-sm text-slate-400">{channel.group}</p>
          )}
          {nowPlaying && (
            <p className="text-xs text-accent truncate mt-1">♪ {nowPlaying}</p>
          )}
        </div>

        {/* EQ Visualizer */}
        <EQBars playing={playing} />

        {/* Status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${playing ? 'bg-accent animate-pulse' : 'bg-muted'}`} />
          <span className="text-xs text-muted font-medium uppercase tracking-widest">
            {playing ? 'Live' : playerState === 'loading' ? 'Connecting...' : 'Paused'}
          </span>
        </div>
      </div>
    </div>
  );
}
