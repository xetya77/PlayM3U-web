'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import {
  usePlaylistStore,
  useUIStore,
  usePlayerStore,
  useSettingsStore,
} from '@/store';
import { useHLSPlayer } from '@/hooks/useHLSPlayer';
import { usePlaylistQuery } from '@/hooks/usePlaylistQuery';
import { useM3UWorker } from '@/hooks/useM3UWorker';
import { RadioUI } from './RadioUI';
import { ChannelList } from './ChannelList';
import { ChannelInfoOSD } from './ChannelInfoOSD';
import { PlayerControls } from './PlayerControls';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { LoadingDots } from '@/components/ui/primitives';
import { useTouchSwipe } from '@/hooks/useTouchSwipe';
import type { Channel } from '@/types';

export function PlayerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { loadChannel, togglePlay } = useHLSPlayer(videoRef);
  const { parse } = useM3UWorker();
  const { settings } = useSettingsStore();
  const {
    getCurrentPlaylist,
    getCurrentChannel,
    currentChannelIdx,
    setCurrentChannel,
    updatePlaylist,
  } = usePlaylistStore();
  const { navigateTo, channelListOpen, setChannelListOpen } = useUIStore();
  const { playerState, isRadioMode, errorMsg, resolution, bitrate } = usePlayerStore();

  const pl = getCurrentPlaylist();
  const currentChannel = getCurrentChannel();

  // TanStack Query: fetch/cache channels
  const { data: queryChannels, isLoading: queryLoading } = usePlaylistQuery(pl, parse);

  // Sync fetched channels back into store if needed
  useEffect(() => {
    if (queryChannels && pl && queryChannels !== pl.channels && queryChannels.length > 0) {
      updatePlaylist(pl.id, queryChannels, Date.now());
    }
  }, [queryChannels, pl, updatePlaylist]);

  // OSD visibility
  const [osdVisible, setOsdVisible] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const showControls = useCallback(() => {
    setOsdVisible(true);
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (playerState === 'playing') {
        setControlsVisible(false);
        if (!settings.navHintAlways) setOsdVisible(false);
      }
    }, 4000);
  }, [playerState, settings.navHintAlways]);

  useEffect(() => {
    showControls();
    return () => clearTimeout(hideTimer.current);
  }, [currentChannelIdx]);

  // Load channel on mount / channel change
  useEffect(() => {
    if (currentChannel) {
      loadChannel(currentChannel);
    }
  }, [currentChannel]);

  const handleSelectChannel = useCallback((ch: Channel, idx: number) => {
    setCurrentChannel(idx);
    setChannelListOpen(false);
  }, [setCurrentChannel, setChannelListOpen]);

  const handlePrev = useCallback(() => {
    const channels = pl?.channels ?? [];
    if (channels.length === 0) return;
    const newIdx = (currentChannelIdx - 1 + channels.length) % channels.length;
    setCurrentChannel(newIdx);
  }, [pl, currentChannelIdx, setCurrentChannel]);

  const handleNext = useCallback(() => {
    const channels = pl?.channels ?? [];
    if (channels.length === 0) return;
    const newIdx = (currentChannelIdx + 1) % channels.length;
    setCurrentChannel(newIdx);
  }, [pl, currentChannelIdx, setCurrentChannel]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'PageUp') handlePrev();
      if (e.key === 'ArrowDown' || e.key === 'PageDown') handleNext();
      if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      if (e.key === 'Escape') setChannelListOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handlePrev, handleNext, togglePlay, setChannelListOpen]);

  // Swipe gestures on player
  useTouchSwipe(containerRef, {
    onSwipeUp: handleNext,
    onSwipeDown: handlePrev,
    onSwipeRight: () => setChannelListOpen(true),
    onTap: showControls,
  });

  if (!pl) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted">No playlist selected</p>
        <button
          onClick={() => navigateTo('source')}
          className="text-accent text-sm hover:underline"
        >
          Add a playlist →
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black overflow-hidden cursor-pointer"
      onClick={showControls}
      onMouseMove={showControls}
      onTouchStart={showControls}
    >
      {/* ── Video element ──────────────────────────────────────────────────── */}
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-contain ${isRadioMode ? 'opacity-0 pointer-events-none' : ''}`}
        playsInline
        autoPlay
      />

      {/* ── Radio UI ───────────────────────────────────────────────────────── */}
      {isRadioMode && currentChannel && (
        <RadioUI channel={currentChannel} />
      )}

      {/* ── Loading overlay ────────────────────────────────────────────────── */}
      {(playerState === 'loading' || queryLoading) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 pointer-events-none">
          <LoadingDots />
          <p className="text-xs text-muted">{queryLoading ? 'Fetching playlist...' : 'Connecting...'}</p>
        </div>
      )}

      {/* ── Error card ─────────────────────────────────────────────────────── */}
      {playerState === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="glass-card rounded-2xl px-6 py-5 text-center max-w-xs">
            <p className="text-2xl mb-2">📡</p>
            <p className="text-sm font-medium text-white">Stream Error</p>
            <p className="text-xs text-muted mt-1">{errorMsg || 'Unable to load stream'}</p>
            <div className="flex gap-2 mt-4 pointer-events-auto justify-center">
              <button
                onClick={(e) => { e.stopPropagation(); currentChannel && loadChannel(currentChannel); }}
                className="text-xs text-accent hover:underline"
              >
                Retry
              </button>
              <span className="text-muted">·</span>
              <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="text-xs text-muted hover:text-white">
                Next channel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Channel Info OSD ───────────────────────────────────────────────── */}
      {currentChannel && (
        <ChannelInfoOSD
          channel={currentChannel}
          channelIdx={currentChannelIdx}
          totalChannels={pl.channels.length}
          overlayStyle={settings.overlayStyle}
          resolution={resolution}
          bitrate={bitrate}
          visible={osdVisible}
        />
      )}

      {/* ── Player Controls ────────────────────────────────────────────────── */}
      <div
        className={`transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <PlayerControls
          onPrev={handlePrev}
          onNext={handleNext}
          onTogglePlay={togglePlay}
          onToggleChannelList={() => setChannelListOpen(!channelListOpen)}
          videoRef={videoRef}
        />
      </div>

      {/* ── Channel List Sidebar ───────────────────────────────────────────── */}
      {channelListOpen && (
        <>
          <div
            className="absolute inset-0 bg-black/50 z-20 animate-fade-in"
            onClick={() => setChannelListOpen(false)}
          />
          <div className="absolute top-0 left-0 bottom-0 w-72 z-30 animate-slide-right shadow-2xl">
            <ChannelList onSelect={handleSelectChannel} />
          </div>
        </>
      )}

      {/* ── Settings Panel ─────────────────────────────────────────────────── */}
      <SettingsPanel />

      {/* ── Top bar (playlist name + back) ─────────────────────────────────── */}
      <div
        className={`absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => navigateTo('settings')}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          <span className="text-sm">{pl.name}</span>
        </button>
        {currentChannel && (
          <div className="text-xs text-white/50 truncate max-w-[140px]">
            {currentChannel.name}
          </div>
        )}
      </div>
    </div>
  );
}
