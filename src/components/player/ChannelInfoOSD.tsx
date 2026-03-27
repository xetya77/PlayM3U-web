'use client';
import { useState } from 'react';
import type { Channel } from '@/types';

function Logo({ ch, size=56 }: { ch: Channel; size?: number }) {
  const [f, setF] = useState(false);
  if (ch.logoUrl && !f) return (
    <img src={ch.logoUrl} alt="" onError={() => setF(true)}
      style={{width:size,height:size,objectFit:'contain',borderRadius:12}} />
  );
  const hue = (ch.name.charCodeAt(0)*37)%360;
  return (
    <div style={{width:size,height:size,background:`hsl(${hue} 40% 22%)`,borderRadius:12,
      display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,color:'#E4EEF0',fontSize:size*0.35}}>
      {ch.name.charAt(0).toUpperCase()}
    </div>
  );
}

interface Props {
  channel: Channel;
  channelIdx: number;
  totalChannels: number;
  overlayStyle: string;
  resolution?: string;
  bitrate?: number;
  visible: boolean;
}

export function ChannelInfoOSD({ channel, channelIdx, totalChannels, overlayStyle, resolution, bitrate, visible }: Props) {
  if (!visible) return null;

  // Default style — bottom-left card matching screenshot
  return (
    <div className="absolute osd-card flex items-center gap-4 px-5 py-4"
      style={{bottom:72, left:16, maxWidth:'60%', animation:'fadeIn 0.2s ease-out'}}>
      <Logo ch={channel} size={56} />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-black text-white text-xl">{channelIdx+1}</span>
          <span className="font-black text-white text-xl truncate">{channel.name}</span>
        </div>
        {channel.group && (
          <p className="text-xs font-semibold uppercase tracking-wider truncate mt-0.5"
            style={{color:'rgba(230,240,242,0.55)'}}>{channel.group}</p>
        )}
      </div>
    </div>
  );
}
