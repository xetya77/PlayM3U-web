'use client';

import { useState, useCallback, useEffect } from 'react';
import { useUIStore, usePlaylistStore } from '@/store';
import { useM3UWorker } from '@/hooks/useM3UWorker';
import { Button, Input, Toggle, Spinner, LoadingDots } from '@/components/ui/primitives';
import type { Playlist, Channel } from '@/types';

function generateId() {
  return `pl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Source Selection ─────────────────────────────────────────────────────────
export function SourcePage() {
  const { navigateTo, navigateBack } = useUIStore();
  const [selected, setSelected] = useState<'url' | 'file' | null>(null);

  return (
    <div className="flex flex-col h-full page-enter">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button onClick={navigateBack} className="p-2 rounded-xl hover:bg-bg-hover transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <h2 className="text-lg font-semibold">Add Playlist</h2>
          <p className="text-xs text-muted">Choose your source type</p>
        </div>
      </div>

      <div className="flex-1 px-5 flex flex-col gap-3">
        {/* URL option */}
        <button
          onClick={() => setSelected('url')}
          className={`glass-card rounded-2xl p-5 flex items-center gap-4 text-left transition-all ${selected === 'url' ? 'border-accent/60 bg-accent/10' : 'hover:bg-bg-hover'}`}
        >
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent text-xl">🔗</div>
          <div className="flex-1">
            <p className="font-medium text-white">Remote URL</p>
            <p className="text-xs text-muted mt-0.5">Paste an M3U/M3U8 link</p>
          </div>
          {selected === 'url' && (
            <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          )}
        </button>

        {/* File option */}
        <button
          onClick={() => setSelected('file')}
          className={`glass-card rounded-2xl p-5 flex items-center gap-4 text-left transition-all ${selected === 'file' ? 'border-accent/60 bg-accent/10' : 'hover:bg-bg-hover'}`}
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl">📁</div>
          <div className="flex-1">
            <p className="font-medium text-white">Local File</p>
            <p className="text-xs text-muted mt-0.5">Open .m3u or .m3u8 file</p>
          </div>
          {selected === 'file' && (
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          )}
        </button>
      </div>

      <div className="px-5 pb-8">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!selected}
          onClick={() => navigateTo(selected === 'url' ? 'url_input' : 'url_input')}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

// ─── URL Input ────────────────────────────────────────────────────────────────
export function URLInputPage() {
  const { navigateTo, navigateBack } = useUIStore();
  const { parse } = useM3UWorker();
  const [url, setUrl] = useState('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetch = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    try {
      const proxies = [
        url.trim(),
        `https://corsproxy.io/?${encodeURIComponent(url.trim())}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url.trim())}`,
      ];
      let content = '';
      for (const target of proxies) {
        try {
          const res = await fetch(target, { signal: AbortSignal.timeout(20000) });
          if (res.ok) { content = await res.text(); break; }
        } catch { continue; }
      }
      if (!content) throw new Error('Could not fetch URL');
      const parsed = await parse(content);
      if (parsed.length === 0) throw new Error('No channels found in playlist');
      setChannels(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load playlist');
    } finally {
      setLoading(false);
    }
  }, [url, parse]);

  // Store pending data in sessionStorage to pass to name page
  const handleNext = useCallback(() => {
    sessionStorage.setItem('pendingUrl', url.trim());
    sessionStorage.setItem('pendingChannels', JSON.stringify(channels));
    navigateTo('name_input');
  }, [url, channels, navigateTo]);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const content = await file.text();
      const parsed = await parse(content);
      if (parsed.length === 0) throw new Error('No channels found');
      setChannels(parsed);
      setUrl(`file://${file.name}`);
      sessionStorage.setItem('pendingUrl', `file://${file.name}`);
      sessionStorage.setItem('pendingContent', content);
      sessionStorage.setItem('pendingChannels', JSON.stringify(parsed));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse file');
    } finally {
      setLoading(false);
    }
  }, [parse]);

  return (
    <div className="flex flex-col h-full page-enter">
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button onClick={navigateBack} className="p-2 rounded-xl hover:bg-bg-hover transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <h2 className="text-lg font-semibold">Playlist Source</h2>
          <p className="text-xs text-muted">Enter URL or pick a file</p>
        </div>
      </div>

      <div className="flex-1 px-5 flex flex-col gap-4">
        <Input
          label="Playlist URL"
          placeholder="https://example.com/playlist.m3u8"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setChannels([]); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
        />

        <div className="flex gap-2">
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleFetch}
            disabled={!url.trim() || loading}
          >
            {loading ? <Spinner size={16} /> : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            )}
            {loading ? 'Loading...' : 'Fetch'}
          </Button>
          <label className="cursor-pointer inline-flex items-center gap-2 bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 hover:bg-bg-hover transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            File
            <input type="file" accept=".m3u,.m3u8,text/plain" className="hidden" onChange={handleFile} />
          </label>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {channels.length > 0 && (
          <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg">✓</div>
            <div>
              <p className="text-sm font-medium text-white">{channels.length.toLocaleString()} channels found</p>
              <p className="text-xs text-muted">Ready to save</p>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 pb-8">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={channels.length === 0}
          onClick={handleNext}
        >
          Next — Name Playlist
        </Button>
      </div>
    </div>
  );
}

// ─── Name & Save ──────────────────────────────────────────────────────────────
export function NameInputPage() {
  const { navigateTo, navigateBack } = useUIStore();
  const { addPlaylist, setCurrentPlaylist, playlists } = usePlaylistStore();
  const [name, setName] = useState('My Playlist');
  const [downloadOnStart, setDownloadOnStart] = useState(true);

  const handleSave = useCallback(() => {
    const url = sessionStorage.getItem('pendingUrl') ?? '';
    const channelsJson = sessionStorage.getItem('pendingChannels') ?? '[]';
    const channels: Channel[] = JSON.parse(channelsJson);
    const isFile = url.startsWith('file://');

    const playlist: Playlist = {
      id: generateId(),
      name: name.trim() || 'My Playlist',
      url,
      type: isFile ? 'file' : 'url',
      downloadOnStart,
      channels,
      lastUpdated: Date.now(),
    };
    addPlaylist(playlist);
    setCurrentPlaylist(playlists.length); // point to new playlist
    sessionStorage.removeItem('pendingUrl');
    sessionStorage.removeItem('pendingChannels');
    sessionStorage.removeItem('pendingContent');
    navigateTo('player');
  }, [name, downloadOnStart, addPlaylist, setCurrentPlaylist, playlists.length, navigateTo]);

  const [channelCount, setChannelCount] = useState(0);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('pendingChannels') ?? '[]';
      setChannelCount(JSON.parse(raw).length);
    } catch { setChannelCount(0); }
  }, []);

  return (
    <div className="flex flex-col h-full page-enter">
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button onClick={navigateBack} className="p-2 rounded-xl hover:bg-bg-hover transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <h2 className="text-lg font-semibold">Name Your Playlist</h2>
          <p className="text-xs text-muted">{channelCount.toLocaleString()} channels ready</p>
        </div>
      </div>

      <div className="flex-1 px-5 flex flex-col gap-5">
        <Input
          label="Playlist Name"
          placeholder="My IPTV Playlist"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="glass-card rounded-2xl p-4">
          <Toggle
            checked={downloadOnStart}
            onChange={setDownloadOnStart}
            label="Auto-refresh on open"
          />
          <p className="text-xs text-muted mt-2 ml-14">Update playlist from source each time the app opens</p>
        </div>
      </div>

      <div className="px-5 pb-8">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleSave}
          disabled={!name.trim()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
          Save & Watch
        </Button>
      </div>
    </div>
  );
}
