'use client';
import { useRef, useCallback, useEffect, useState } from 'react';
import { usePlaylistStore, useUIStore, usePlayerStore, useSettingsStore } from '@/store';
import { useHLSPlayer } from '@/hooks/useHLSPlayer';
import { usePlaylistQuery } from '@/hooks/usePlaylistQuery';
import { useM3UWorker } from '@/hooks/useM3UWorker';
import { useTouchSwipe } from '@/hooks/useTouchSwipe';
import { RadioUI } from './RadioUI';
import { ChannelListLeft, ChannelListRight } from './ChannelList';
import { ChannelInfoOSD } from './ChannelInfoOSD';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import type { Channel } from '@/types';

function ClockOverlay() {
  const [t, setT] = useState('');
  useEffect(() => {
    const upd = () => { const n=new Date(); setT(`${n.getHours().toString().padStart(2,'0')}:${n.getMinutes().toString().padStart(2,'0')}:${n.getSeconds().toString().padStart(2,'0')}`); };
    upd(); const id=setInterval(upd,1000); return ()=>clearInterval(id);
  },[]);
  return (
    <div className="absolute top-4 right-4 font-black tabular-nums pointer-events-none"
      style={{color:'rgba(255,255,255,0.75)', fontSize:'18px', letterSpacing:'1px',
        textShadow:'0 1px 4px rgba(0,0,0,0.6)'}}>
      {t}
    </div>
  );
}

export function PlayerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { loadChannel, togglePlay } = useHLSPlayer(videoRef);
  const { parse } = useM3UWorker();
  const { settings } = useSettingsStore();
  const { getCurrentPlaylist, getCurrentChannel, currentChannelIdx, setCurrentChannel, updatePlaylist } = usePlaylistStore();
  const { navigateTo, channelListOpen, setChannelListOpen } = useUIStore();
  const { playerState, isRadioMode, errorMsg, resolution, bitrate } = usePlayerStore();

  const pl = getCurrentPlaylist();
  const currentChannel = getCurrentChannel();

  // left vs right panel
  const [panelSide, setPanelSide] = useState<'left'|'right'>('left');

  // TanStack Query
  const { data: queryChannels, isLoading: queryLoading } = usePlaylistQuery(pl, parse);
  useEffect(() => {
    if (queryChannels && pl && queryChannels.length > 0 && queryChannels !== pl.channels) {
      updatePlaylist(pl.id, queryChannels, Date.now());
    }
  }, [queryChannels, pl, updatePlaylist]);

  // OSD / controls auto-hide
  const [osdVisible, setOsdVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const showUI = useCallback(() => {
    setOsdVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!channelListOpen) setOsdVisible(false);
    }, 4000);
  }, [channelListOpen]);

  useEffect(() => { showUI(); return () => clearTimeout(hideTimer.current); }, [currentChannelIdx]);

  // Load channel
  useEffect(() => { if (currentChannel) loadChannel(currentChannel); }, [currentChannel]);

  const handleSelectChannel = useCallback((ch: Channel, idx: number) => {
    setCurrentChannel(idx); setChannelListOpen(false);
  }, [setCurrentChannel, setChannelListOpen]);

  const handlePrev = useCallback(() => {
    const chs = pl?.channels ?? [];
    setCurrentChannel((currentChannelIdx - 1 + chs.length) % chs.length);
  }, [pl, currentChannelIdx, setCurrentChannel]);

  const handleNext = useCallback(() => {
    const chs = pl?.channels ?? [];
    setCurrentChannel((currentChannelIdx + 1) % chs.length);
  }, [pl, currentChannelIdx, setCurrentChannel]);

  // Keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key==='ArrowUp'||e.key==='PageUp') { e.preventDefault(); handlePrev(); }
      if (e.key==='ArrowDown'||e.key==='PageDown') { e.preventDefault(); handleNext(); }
      if (e.key===' ') { e.preventDefault(); togglePlay(); }
      if (e.key==='Escape') setChannelListOpen(false);
    };
    window.addEventListener('keydown',h);
    return () => window.removeEventListener('keydown',h);
  }, [handlePrev, handleNext, togglePlay, setChannelListOpen]);

  // Swipe
  useTouchSwipe(containerRef, {
    onSwipeUp: handleNext,
    onSwipeDown: handlePrev,
    onSwipeRight: () => { setPanelSide('left'); setChannelListOpen(true); },
    onSwipeLeft: () => { setPanelSide('right'); setChannelListOpen(true); },
    onTap: showUI,
  });

  if (!pl) return (
    <div className="flex flex-col items-center justify-center h-full gap-4" style={{background:'#16232A'}}>
      <p style={{color:'#7A9BA3'}}>No playlist selected</p>
      <button onClick={() => navigateTo('source')} className="pill-btn px-8 py-3 text-white"
        style={{background:'#0A5055'}}>Add Playlist</button>
    </div>
  );

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden"
      onClick={showUI} onMouseMove={showUI}>

      {/* Video */}
      <video ref={videoRef}
        className="absolute inset-0 w-full h-full"
        style={{objectFit:'contain', opacity: isRadioMode?0:1}}
        playsInline autoPlay />

      {/* Radio UI */}
      {isRadioMode && currentChannel && <RadioUI channel={currentChannel} />}

      {/* Clock (always visible) */}
      {!isRadioMode && <ClockOverlay />}

      {/* Loading */}
      {(playerState==='loading'||queryLoading) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex gap-2">
            {[0,1,2].map(i => (
              <div key={i} className="dot-b w-2 h-2 rounded-full" style={{background:'#FF5B04', animationDelay:`${i*0.2}s`}}/>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {playerState==='error' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="rounded-3xl p-6 text-center" style={{background:'rgba(20,33,40,0.92)', maxWidth:280}}>
            <p className="text-2xl mb-2">📡</p>
            <p className="font-bold text-white mb-1">Stream Error</p>
            <p className="text-sm mb-4" style={{color:'#7A9BA3'}}>{errorMsg||'Unable to load stream'}</p>
            <div className="flex gap-3 justify-center pointer-events-auto">
              <button onClick={e => {e.stopPropagation(); currentChannel&&loadChannel(currentChannel);}}
                className="pill-btn px-4 py-2 text-sm text-white" style={{background:'#0A5055'}}>Retry</button>
              <button onClick={e => {e.stopPropagation(); handleNext();}}
                className="pill-btn px-4 py-2 text-sm" style={{background:'#1C2F3A',color:'#E4EEF0'}}>Next</button>
            </div>
          </div>
        </div>
      )}

      {/* OSD */}
      {currentChannel && (
        <div style={{opacity: osdVisible?1:0, transition:'opacity 0.3s', pointerEvents:'none'}}>
          <ChannelInfoOSD channel={currentChannel} channelIdx={currentChannelIdx}
            totalChannels={pl.channels.length} overlayStyle={settings.overlayStyle}
            resolution={resolution} bitrate={bitrate} visible={osdVisible} />
        </div>
      )}

      {/* Left sidebar icons (always visible, minimal) */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-4 py-4 px-2"
        style={{opacity: osdVisible?1:0, transition:'opacity 0.3s'}}>
        <button onClick={e=>{e.stopPropagation(); setPanelSide('left'); setChannelListOpen(true);}}
          className="w-10 h-10 flex items-center justify-center rounded-full"
          style={{background:'rgba(13,27,36,0.7)', color:'#E4EEF0'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/></svg>
        </button>
        <button onClick={e=>{e.stopPropagation(); setPanelSide('right'); setChannelListOpen(true);}}
          className="w-10 h-10 flex items-center justify-center rounded-full"
          style={{background:'rgba(13,27,36,0.7)', color:'#E4EEF0'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        </button>
        <button onClick={e=>{e.stopPropagation(); useUIStore.getState().setSettingsPanelOpen(true);}}
          className="w-10 h-10 flex items-center justify-center rounded-full"
          style={{background:'rgba(13,27,36,0.7)', color:'#E4EEF0'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
        </button>
      </div>

      {/* Bottom: prev/next + play indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4"
        style={{opacity: osdVisible?1:0, transition:'opacity 0.3s'}}>
        <button onClick={e=>{e.stopPropagation(); handlePrev();}}
          className="w-10 h-10 flex items-center justify-center rounded-full"
          style={{background:'rgba(13,27,36,0.7)', color:'#E4EEF0'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20"/><rect x="5" y="4" width="2" height="16"/></svg>
        </button>
        <button onClick={e=>{e.stopPropagation(); togglePlay();}}
          className="w-14 h-14 flex items-center justify-center rounded-full"
          style={{background:'rgba(13,27,36,0.85)', color:'#E4EEF0', border:'2px solid rgba(255,255,255,0.15)'}}>
          {playerState==='playing' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          )}
        </button>
        <button onClick={e=>{e.stopPropagation(); handleNext();}}
          className="w-10 h-10 flex items-center justify-center rounded-full"
          style={{background:'rgba(13,27,36,0.7)', color:'#E4EEF0'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><rect x="17" y="4" width="2" height="16"/></svg>
        </button>
      </div>

      {/* Back button top-left */}
      <button onClick={e=>{e.stopPropagation(); navigateTo('settings');}}
        className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center rounded-full"
        style={{background:'rgba(13,27,36,0.7)', color:'#E4EEF0',
          opacity: osdVisible?1:0, transition:'opacity 0.3s'}}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>

      {/* Channel list panel */}
      {channelListOpen && (
        <>
          <div className="absolute inset-0 z-20" onClick={() => setChannelListOpen(false)}
            style={{background:'rgba(0,0,0,0.35)'}}/>
          <div className={`absolute top-0 bottom-0 z-30 ${panelSide==='left'?'left-0':'right-0'}`}
            style={{width:'55%', maxWidth:360, animation:'slideIn 0.22s ease-out'}}>
            {panelSide==='left'
              ? <ChannelListLeft onSelect={handleSelectChannel}/>
              : <ChannelListRight onSelectGroup={g => { useUIStore.getState().setCategoryFilter(g); setChannelListOpen(false); }}/>
            }
          </div>
        </>
      )}

      {/* Settings panel */}
      <SettingsPanel />
    </div>
  );
}
