'use client';
import { useState, useMemo } from 'react';
import type { Channel } from '@/types';
import { usePlayerStore } from '@/store';

function getDominantColor(logoUrl?: string): string {
  // Fallback colors based on channel name hash
  return '#8B1A1A'; // default red-dark for blur effect
}

export function RadioUI({ channel }: { channel: Channel }) {
  const { playerState, nowPlaying } = usePlayerStore();
  const playing = playerState === 'playing';
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
      {/* Blur background from channel logo */}
      {channel.logoUrl && !imgFailed ? (
        <img src={channel.logoUrl} alt="" onError={() => setImgFailed(true)}
          className="radio-blur-bg absolute inset-0 w-full h-full object-cover" style={{opacity:0.5}} />
      ) : (
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at center, #5C1010 0%, #1A0808 60%, #0D0505 100%)',
        }}/>
      )}
      {/* Dark overlay */}
      <div className="absolute inset-0" style={{background:'rgba(0,0,0,0.35)'}}/>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-5 px-8 text-center">
        {/* Logo card */}
        <div className="rounded-3xl overflow-hidden shadow-2xl"
          style={{width:200,height:200,background:'rgba(255,255,255,0.95)'}}>
          {channel.logoUrl && !imgFailed ? (
            <img src={channel.logoUrl} alt={channel.name}
              className="w-full h-full object-contain p-3" onError={() => setImgFailed(true)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl font-black"
              style={{color:'#16232A'}}>
              {channel.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Channel name */}
        <div>
          <h2 className="font-black text-white text-2xl tracking-wide uppercase"
            style={{letterSpacing:'1px', textShadow:'0 2px 8px rgba(0,0,0,0.6)'}}>
            {channel.name}
          </h2>
          {channel.group && (
            <p className="mt-1 font-semibold text-sm tracking-widest uppercase"
              style={{color:'rgba(255,255,255,0.55)'}}>
              {channel.group}
            </p>
          )}
          {/* Divider */}
          <div className="mx-auto mt-4 mb-3 rounded-full" style={{width:40,height:2,background:'rgba(255,255,255,0.25)'}}/>
          {nowPlaying && (
            <p className="text-sm font-semibold" style={{color:'rgba(255,255,255,0.7)', maxWidth:280, wordBreak:'break-all'}}>
              {nowPlaying}
            </p>
          )}
        </div>
      </div>

      {/* Clock top-right */}
      <ClockOverlay />
    </div>
  );
}

function ClockOverlay() {
  const [t, setT] = useState('');
  useState(() => {
    const update = () => {
      const n = new Date();
      setT(`${n.getHours().toString().padStart(2,'0')}:${n.getMinutes().toString().padStart(2,'0')}:${n.getSeconds().toString().padStart(2,'0')}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  });
  return (
    <div className="absolute top-4 right-4 font-black tabular-nums"
      style={{color:'rgba(255,255,255,0.7)', fontSize:'18px', letterSpacing:'1px'}}>
      {t}
    </div>
  );
}
