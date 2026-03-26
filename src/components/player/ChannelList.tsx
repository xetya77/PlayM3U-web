'use client';

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { usePlaylistStore, useUIStore, usePlayerStore } from '@/store';
import { EmptyState, Spinner } from '@/components/ui/primitives';
import type { Channel } from '@/types';

function isRadioChannel(ch: Channel): boolean {
  const s = (ch.group + ch.name + ch.url).toLowerCase();
  return s.includes('radio') || !!ch.url.match(/\.(mp3|aac|ogg|flac|opus)/i);
}

function ChannelLogo({ ch }: { ch: Channel }) {
  const [failed, setFailed] = useState(false);
  if (ch.logoUrl && !failed) {
    return (
      <img
        src={ch.logoUrl}
        alt=""
        onError={() => setFailed(true)}
        className="w-full h-full object-contain"
        loading="lazy"
      />
    );
  }
  // Fallback: initial letter
  const letter = ch.name.replace(/[^\w]/g, '').charAt(0).toUpperCase() || '?';
  const hue = (ch.name.charCodeAt(0) * 37 + ch.name.charCodeAt(1 % ch.name.length) * 13) % 360;
  return (
    <div
      className="w-full h-full flex items-center justify-center text-xs font-bold text-white/90 rounded-lg"
      style={{ background: `hsl(${hue} 50% 25%)` }}
    >
      {letter}
    </div>
  );
}

interface Props {
  onSelect: (ch: Channel, idx: number) => void;
}

export function ChannelList({ onSelect }: Props) {
  const { getCurrentPlaylist, currentChannelIdx } = usePlaylistStore();
  const { categoryFilter, setCategoryFilter, searchQuery, setSearchQuery, setChannelListOpen } = useUIStore();
  const { playerState } = usePlayerStore();
  const pl = getCurrentPlaylist();
  const inputRef = useRef<HTMLInputElement>(null);

  const channels = pl?.channels ?? [];

  // All unique groups
  const groups = useMemo(() => {
    const set = new Set(channels.map((c) => c.group).filter(Boolean));
    return Array.from(set).sort();
  }, [channels]);

  // Filter channels
  const filtered = useMemo(() => {
    let list = channels;
    if (categoryFilter === 'tv') list = list.filter((c) => !isRadioChannel(c));
    else if (categoryFilter === 'radio') list = list.filter(isRadioChannel);
    else if (categoryFilter !== 'all') list = list.filter((c) => c.group === categoryFilter);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.group.toLowerCase().includes(q));
    }
    return list;
  }, [channels, categoryFilter, searchQuery]);

  const handleSelect = useCallback((ch: Channel) => {
    const globalIdx = channels.indexOf(ch);
    onSelect(ch, globalIdx);
    setChannelListOpen(false);
  }, [channels, onSelect, setChannelListOpen]);

  useEffect(() => {
    // Auto-focus search on open
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col h-full bg-bg-deep">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-white text-sm">{pl?.name ?? 'Channels'}</h3>
            <p className="text-xs text-muted">{filtered.length.toLocaleString()} / {channels.length.toLocaleString()}</p>
          </div>
          <button
            onClick={() => setChannelListOpen(false)}
            className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors text-muted hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            ref={inputRef}
            type="search"
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 px-4 py-2 overflow-x-auto no-scrollbar border-b border-white/5">
        {[
          { id: 'all', label: '⚡ All' },
          { id: 'tv', label: '📺 TV' },
          { id: 'radio', label: '📻 Radio' },
          ...groups.slice(0, 12).map((g) => ({ id: g, label: g })),
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              categoryFilter === cat.id
                ? 'bg-accent text-white'
                : 'text-muted hover:text-white hover:bg-bg-hover'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <EmptyState icon="📭" title="No channels found" description="Try a different search or category" />
        ) : (
          <div>
            {filtered.map((ch, i) => {
              const globalIdx = channels.indexOf(ch);
              const isActive = globalIdx === currentChannelIdx;
              return (
                <button
                  key={ch.id}
                  onClick={() => handleSelect(ch)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-hover transition-colors ${isActive ? 'channel-active' : ''}`}
                >
                  {/* Logo */}
                  <div className="w-9 h-9 flex-shrink-0 rounded-lg overflow-hidden bg-surface">
                    <ChannelLogo ch={ch} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 text-left">
                    <p className={`text-sm truncate ${isActive ? 'text-accent font-medium' : 'text-slate-200'}`}>
                      {ch.name}
                    </p>
                    {ch.group && (
                      <p className="text-xs text-muted truncate">{ch.group}</p>
                    )}
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isActive && playerState === 'playing' && (
                      <div className="flex items-end gap-0.5 h-4">
                        {[1,2,3,4,5].map((b) => (
                          <div key={b} className="eq-bar w-0.5 bg-accent rounded-full h-full" style={{ animationDelay: `${b*0.1}s` }} />
                        ))}
                      </div>
                    )}
                    {ch.isDrm && (
                      <svg className="text-orange-400 w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    )}
                    <span className="text-xs text-muted">{i + 1}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
