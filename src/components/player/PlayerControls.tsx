'use client';

import { useCallback } from 'react';
import { usePlayerStore, useUIStore, usePlaylistStore } from '@/store';

interface Props {
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onToggleChannelList: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export function PlayerControls({ onPrev, onNext, onTogglePlay, onToggleChannelList, videoRef }: Props) {
  const { playerState, volume, muted, resolution, bitrate, setVolume, setMuted } = usePlayerStore();
  const { setSettingsPanelOpen, navigateTo } = useUIStore();
  const { getCurrentPlaylist, currentChannelIdx } = usePlaylistStore();
  const pl = getCurrentPlaylist();

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !muted;
    setMuted(!muted);
  }, [videoRef, muted, setMuted]);

  const handleVolume = useCallback((val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    setVolume(val);
    if (val > 0) setMuted(false);
  }, [videoRef, setVolume, setMuted]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch { /* ignore */ }
  }, []);

  const isPlaying = playerState === 'playing';
  const isLoading = playerState === 'loading';

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 flex items-center gap-3">
      {/* Prev */}
      <CtrlBtn onClick={onPrev} title="Previous channel">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
      </CtrlBtn>

      {/* Play/Pause */}
      <CtrlBtn onClick={onTogglePlay} title={isPlaying ? 'Pause' : 'Play'} large>
        {isLoading ? (
          <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
        ) : isPlaying ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        )}
      </CtrlBtn>

      {/* Next */}
      <CtrlBtn onClick={onNext} title="Next channel">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
      </CtrlBtn>

      {/* Volume */}
      <div className="flex items-center gap-2 ml-1">
        <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
          {muted || volume === 0 ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
          )}
        </button>
        <input
          type="range"
          min={0} max={1} step={0.05}
          value={muted ? 0 : volume}
          onChange={(e) => handleVolume(parseFloat(e.target.value))}
          className="w-20 accent-sky-400"
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Stats */}
      {(resolution || bitrate > 0) && (
        <div className="hidden sm:flex items-center gap-2 text-xs text-white/50">
          {resolution && <span>{resolution}</span>}
          {bitrate > 0 && <span>{bitrate}k</span>}
        </div>
      )}

      {/* Channel list toggle */}
      <CtrlBtn onClick={onToggleChannelList} title="Channel list">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
      </CtrlBtn>

      {/* Settings */}
      <CtrlBtn onClick={() => setSettingsPanelOpen(true)} title="Settings">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      </CtrlBtn>

      {/* Fullscreen */}
      <CtrlBtn onClick={toggleFullscreen} title="Fullscreen">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
      </CtrlBtn>
    </div>
  );
}

function CtrlBtn({ children, onClick, title, large }: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  large?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`text-white/80 hover:text-white transition-colors ${large ? 'p-2 bg-white/10 rounded-full hover:bg-white/20' : 'p-1.5 hover:bg-white/10 rounded-lg'}`}
    >
      {children}
    </button>
  );
}
