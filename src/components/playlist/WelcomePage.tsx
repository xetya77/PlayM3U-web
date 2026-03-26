'use client';

import { useUIStore } from '@/store';
import { Button } from '@/components/ui/primitives';

export function WelcomePage() {
  const navigateTo = useUIStore((s) => s.navigateTo);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-6 page-enter">
      {/* Logo */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent-dim to-accent flex items-center justify-center shadow-2xl shadow-accent/30">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="white" fillOpacity="0.15" />
              <polygon points="10,8 10,16 17,12" fill="white" />
            </svg>
          </div>
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-3xl bg-accent/20 blur-xl -z-10 scale-125" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">PlayM3U</h1>
          <p className="text-muted text-sm mt-1">Your personal IPTV player</p>
        </div>
      </div>

      {/* Features */}
      <div className="w-full max-w-sm space-y-3">
        {[
          { icon: '📺', label: 'Live TV & Radio', desc: 'Stream M3U playlists' },
          { icon: '📶', label: 'HLS & DASH', desc: 'Adaptive bitrate streaming' },
          { icon: '📱', label: 'Works Offline', desc: 'PWA with service worker' },
        ].map((f) => (
          <div key={f.label} className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">{f.icon}</span>
            <div>
              <p className="text-sm font-medium text-white">{f.label}</p>
              <p className="text-xs text-muted">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="w-full max-w-sm space-y-3">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => navigateTo('source')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Playlist
        </Button>
        <p className="text-center text-xs text-muted">
          Supports M3U, M3U8 · URL or local file
        </p>
      </div>
    </div>
  );
}
