'use client';

import { useEffect, useState } from 'react';
import type { Channel } from '@/types';
import type { OverlayStyle } from '@/types';

interface Props {
  channel: Channel;
  channelIdx: number;
  totalChannels: number;
  overlayStyle: OverlayStyle;
  resolution?: string;
  bitrate?: number;
  visible: boolean;
}

function Logo({ ch, size = 36 }: { ch: Channel; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (ch.logoUrl && !failed) {
    return <img src={ch.logoUrl} alt="" onError={() => setFailed(true)} style={{ width: size, height: size }} className="object-contain rounded" />;
  }
  const hue = (ch.name.charCodeAt(0) * 37) % 360;
  return (
    <div
      style={{ width: size, height: size, background: `hsl(${hue} 50% 20%)` }}
      className="rounded flex items-center justify-center text-white font-bold text-sm"
    >
      {ch.name.charAt(0).toUpperCase()}
    </div>
  );
}

export function ChannelInfoOSD({ channel, channelIdx, totalChannels, overlayStyle, resolution, bitrate, visible }: Props) {
  if (!visible) return null;

  const num = String(channelIdx + 1).padStart(3, '0');
  const res = resolution || '—';
  const br = bitrate ? `${bitrate} kbps` : '';

  if (overlayStyle === 'compact') {
    return (
      <div className="absolute top-4 left-4 right-4 flex items-center gap-3 overlay-panel rounded-xl px-3 py-2 animate-fade-in">
        <span className="text-xs text-muted font-mono">{num}</span>
        <Logo ch={channel} size={28} />
        <span className="text-sm font-medium text-white truncate flex-1">{channel.name}</span>
        {br && <span className="text-xs text-muted">{br}</span>}
      </div>
    );
  }

  if (overlayStyle === 'wide') {
    return (
      <div className="absolute bottom-16 left-4 right-4 overlay-panel rounded-2xl p-4 animate-fade-in">
        <div className="flex items-center gap-4">
          <Logo ch={channel} size={48} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted font-mono">CH {num}</span>
              {channel.group && <span className="text-xs text-accent">{channel.group}</span>}
            </div>
            <p className="text-lg font-semibold text-white truncate">{channel.name}</p>
          </div>
          <div className="text-right text-xs text-muted space-y-0.5">
            <p>{res}</p>
            <p>{br}</p>
          </div>
        </div>
      </div>
    );
  }

  if (overlayStyle === 'detail') {
    return (
      <div className="absolute top-0 right-0 bottom-0 w-72 overlay-panel p-5 flex flex-col justify-center gap-3 animate-slide-right">
        <Logo ch={channel} size={56} />
        <div>
          <p className="text-xs text-muted font-mono mb-1">CH {num} / {totalChannels}</p>
          <p className="text-xl font-bold text-white leading-tight">{channel.name}</p>
          {channel.group && <p className="text-sm text-accent mt-1">{channel.group}</p>}
        </div>
        <div className="space-y-1 text-xs text-muted border-t border-white/10 pt-3">
          {res && res !== '—' && <p>📐 {res}</p>}
          {br && <p>📶 {br}</p>}
          {channel.isDrm && <p>🔒 DRM Protected</p>}
          {channel.userAgent && <p className="truncate">🖥 {channel.userAgent.slice(0, 30)}</p>}
        </div>
      </div>
    );
  }

  // Default
  return (
    <div className="absolute bottom-16 left-4 overlay-panel rounded-2xl px-4 py-3 flex items-center gap-3 max-w-xs animate-fade-in">
      <Logo ch={channel} size={40} />
      <div className="min-w-0">
        <p className="text-xs text-muted">CH {num}</p>
        <p className="text-base font-semibold text-white truncate">{channel.name}</p>
        {channel.group && <p className="text-xs text-accent truncate">{channel.group}</p>}
      </div>
    </div>
  );
}
