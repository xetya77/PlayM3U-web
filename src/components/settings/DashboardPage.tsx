'use client';
import { useState, useEffect } from 'react';
import { usePlaylistStore, useUIStore } from '@/store';

export function DashboardPage() {
  const { navigateTo } = useUIStore();
  const { playlists, currentPlaylistIdx } = usePlaylistStore();
  const pl = playlists[currentPlaylistIdx];

  const [time, setTime] = useState({ h: '--', m: '--', date: '' });
  useEffect(() => {
    const update = () => {
      const n = new Date();
      setTime({
        h: n.getHours().toString().padStart(2,'0'),
        m: n.getMinutes().toString().padStart(2,'0'),
        date: n.toLocaleDateString('en-US',{weekday:'short',month:'long',day:'numeric'}),
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col h-full page-enter" style={{background:'#16232A'}}>
      {/* Thin left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{background:'#E4EEF0', opacity:0.15}} />

      {/* Clock — vertically centered */}
      <div className="flex-1 flex flex-col items-center justify-center gap-2">
        <div className="flex items-baseline gap-1">
          <span className="font-black tabular-nums" style={{fontSize:'clamp(72px,20vw,110px)', color:'#E4EEF0', letterSpacing:'-4px', lineHeight:1}}>
            {time.h}
          </span>
          <span className="clock-colon font-black" style={{fontSize:'clamp(60px,16vw,90px)', color:'#E4EEF0', marginBottom:'4px'}}>:</span>
          <span className="font-black tabular-nums" style={{fontSize:'clamp(72px,20vw,110px)', color:'#E4EEF0', letterSpacing:'-4px', lineHeight:1}}>
            {time.m}
          </span>
        </div>
        <p className="font-bold" style={{color:'#7A9BA3', fontSize:'16px'}}>{time.date}</p>
        {pl && <p className="font-medium mt-1" style={{color:'#4A6670', fontSize:'14px'}}>{pl.name}.</p>}
      </div>

      {/* Bottom menu pill */}
      <div className="px-5 pb-10">
        <div className="flex rounded-full overflow-hidden" style={{background:'#E4EEF0'}}>
          {[
            { label: 'Start', action: () => navigateTo('player'), disabled: !pl },
            { label: 'Playlist', action: () => navigateTo('playlists'), disabled: false },
            { label: 'Settings', action: () => navigateTo('app_settings' as any), disabled: false },
          ].map((item, i) => (
            <button key={item.label}
              onClick={item.action}
              disabled={item.disabled}
              className="flex-1 py-5 font-bold transition-colors"
              style={{
                color: item.disabled ? '#A0B4BA' : '#16232A',
                fontSize: '16px',
                borderRight: i < 2 ? '1px solid #C8D8DC' : 'none',
              }}>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
