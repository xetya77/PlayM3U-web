'use client';
import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { usePlaylistStore, useUIStore, usePlayerStore } from '@/store';
import type { Channel } from '@/types';

function isRadio(ch: Channel) {
  const s = (ch.group+ch.name+ch.url).toLowerCase();
  return s.includes('radio') || /\.(mp3|aac|ogg|flac|opus)/i.test(ch.url);
}

function ChLogo({ ch, size=40 }: { ch: Channel; size?: number }) {
  const [fail, setFail] = useState(false);
  if (ch.logoUrl && !fail) return (
    <img src={ch.logoUrl} alt="" onError={() => setFail(true)}
      className="object-contain rounded-xl" style={{width:size,height:size}} loading="lazy" />
  );
  const hue = (ch.name.charCodeAt(0)*37+ch.name.charCodeAt(Math.min(1,ch.name.length-1))*13)%360;
  return (
    <div className="rounded-xl flex items-center justify-center font-black text-white text-sm"
      style={{width:size,height:size,background:`hsl(${hue} 40% 22%)`}}>
      {ch.name.replace(/[^\w]/g,'').charAt(0).toUpperCase()||'?'}
    </div>
  );
}

/* ── Left panel: channel list ────────────────────────────────────────────── */
export function ChannelListLeft({ onSelect }: { onSelect:(ch:Channel,idx:number)=>void }) {
  const { getCurrentPlaylist, currentChannelIdx } = usePlaylistStore();
  const { channelListOpen, setChannelListOpen, categoryFilter, setCategoryFilter, searchQuery, setSearchQuery } = useUIStore();
  const { playerState, resolution, bitrate } = usePlayerStore();
  const pl = getCurrentPlaylist();
  const channels = pl?.channels ?? [];
  const activeRef = useRef<HTMLButtonElement>(null);

  const filtered = useMemo(() => {
    let list = channels;
    if (categoryFilter === 'tv') list = list.filter(c => !isRadio(c));
    else if (categoryFilter === 'radio') list = list.filter(isRadio);
    else if (categoryFilter !== 'all') list = list.filter(c => c.group === categoryFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.group.toLowerCase().includes(q));
    }
    return list;
  }, [channels, categoryFilter, searchQuery]);

  // Scroll active into view on open
  useEffect(() => {
    if (channelListOpen) setTimeout(() => activeRef.current?.scrollIntoView({block:'center'}), 80);
  }, [channelListOpen]);

  return (
    <div className="flex flex-col h-full" style={{background:'#16232A'}}>
      {/* Header stats */}
      <div className="px-4 pt-4 pb-2">
        <p className="font-black text-white text-base truncate">{pl?.name ?? 'Channels'}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs" style={{color:'#7A9BA3'}}>{resolution||''}</span>
          {bitrate>0 && <span className="text-xs" style={{color:'#7A9BA3'}}>{bitrate} kb/s</span>}
          <span className="text-xs ml-auto" style={{color:'#7A9BA3'}}>{filtered.length}/{channels.length}</span>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{background:'#1C2F3A'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A9BA3" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="search" placeholder="Search..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-ice/30" />
        </div>
      </div>

      {/* Channel items */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((ch) => {
          const gIdx = channels.indexOf(ch);
          const active = gIdx === currentChannelIdx;
          return (
            <button key={ch.id} ref={active ? activeRef : undefined}
              onClick={() => { onSelect(ch, gIdx); setChannelListOpen(false); }}
              className="ch-item w-full flex items-center gap-3 px-4 py-3"
              style={{background: active ? 'rgba(230,240,242,0.10)' : 'transparent',
                borderLeft: active ? '3px solid #FF5B04' : '3px solid transparent'}}>
              <ChLogo ch={ch} size={38} />
              <div className="flex-1 min-w-0 text-left">
                <p className="font-bold text-sm truncate" style={{color: active ? '#E4EEF0':'#B8CDD1'}}>
                  {gIdx+1} {ch.name}
                </p>
                {ch.group && <p className="text-xs truncate" style={{color:'#4A6670'}}>{ch.group}</p>}
              </div>
              {active && playerState==='playing' && (
                <div className="flex items-end gap-0.5" style={{height:16}}>
                  {[1,2,3,4,5].map(b => (
                    <div key={b} className="eq-bar w-0.5 rounded-full" style={{background:'#FF5B04', height:'100%', animationDelay:`${b*0.08}s`}}/>
                  ))}
                </div>
              )}
              {active && <div className="ml-1 text-xs" style={{color:'#FF5B04'}}>◀</div>}
            </button>
          );
        })}
      </div>

      {/* Bottom: icon strip placeholder */}
      <div className="flex items-center justify-around px-4 py-3 border-t" style={{borderColor:'#1C2F3A'}}>
        <button onClick={() => setChannelListOpen(false)} style={{color:'#7A9BA3'}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
        </button>
      </div>
    </div>
  );
}

/* ── Right panel: GROUP category list ───────────────────────────────────── */
export function ChannelListRight({ onSelectGroup }: { onSelectGroup:(g:string)=>void }) {
  const { getCurrentPlaylist } = usePlaylistStore();
  const { setChannelListOpen, setCategoryFilter } = useUIStore();
  const pl = getCurrentPlaylist();
  const channels = pl?.channels ?? [];

  const groups = useMemo(() => {
    const map = new Map<string,number>();
    for (const ch of channels) {
      map.set(ch.group||'Other', (map.get(ch.group||'Other')??0)+1);
    }
    return Array.from(map.entries()).sort((a,b) => a[0].localeCompare(b[0]));
  }, [channels]);

  const totalMb = usePlayerStore(s => s.bitrate);

  return (
    <div className="flex flex-col h-full" style={{background:'rgba(13,27,36,0.92)', backdropFilter:'blur(10px)'}}>
      <div className="px-5 pt-4 pb-3 flex items-start justify-between">
        <div>
          <p className="font-black text-white text-base tracking-widest uppercase">Group Channel</p>
          <p className="text-xs mt-0.5" style={{color:'#7A9BA3'}}>
            {totalMb > 0 ? `${(totalMb/1000/8).toFixed(1)} MB/s` : ''}
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {groups.map(([group, count]) => (
          <button key={group}
            onClick={() => { setCategoryFilter(group); onSelectGroup(group); setChannelListOpen(false); }}
            className="w-full flex items-center justify-between px-5 py-5 border-b hover:bg-white/5 transition-colors"
            style={{borderColor:'rgba(255,255,255,0.05)'}}>
            <span className="font-black text-white tracking-wide uppercase text-sm">{group}</span>
            <span className="font-bold text-sm" style={{color:'#7A9BA3'}}>{count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
