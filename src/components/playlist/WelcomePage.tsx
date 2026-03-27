'use client';
import { useUIStore } from '@/store';

export function WelcomePage() {
  const navigateTo = useUIStore((s) => s.navigateTo);
  return (
    <div className="flex flex-col h-full bg-ice page-enter" style={{background:'#E4EEF0'}}>
      {/* Top spacer */}
      <div className="flex-1" />

      {/* Logo block */}
      <div className="px-8 text-center">
        <p className="text-sm font-semibold tracking-widest mb-3" style={{color:'#7A9BA3'}}>Welcome to</p>
        <h1 className="font-black leading-none" style={{fontSize:'clamp(68px,18vw,96px)', color:'#16232A', letterSpacing:'-2px'}}>
          Play<br/>M3U<span style={{color:'#FF5B04'}}>.</span>
        </h1>
        <p className="mt-8 text-base font-medium" style={{color:'#7A9BA3', lineHeight:'1.6'}}>
          Stream your M3U playlists<br/>in one place.
        </p>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* CTA */}
      <div className="px-6 pb-8 flex flex-col items-center gap-3">
        <button
          onClick={() => navigateTo('source')}
          className="pill-btn w-full py-5 text-lg text-white"
          style={{background:'#0A5055', fontSize:'18px'}}
        >
          Get Started
        </button>
        <p className="text-sm italic" style={{color:'#7A9BA3'}}>Press OK to start</p>
      </div>
    </div>
  );
}
