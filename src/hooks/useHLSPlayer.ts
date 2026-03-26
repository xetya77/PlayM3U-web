'use client';

import { useRef, useCallback, useEffect } from 'react';
import { usePlayerStore, useSettingsStore } from '@/store';
import type { Channel } from '@/types';

// Lazy-load Hls to avoid SSR issues
let HlsClass: typeof import('hls.js').default | null = null;

async function getHls() {
  if (HlsClass) return HlsClass;
  const mod = await import('hls.js');
  HlsClass = mod.default;
  return HlsClass;
}

function detectStreamType(url: string): 'hls' | 'dash' | 'direct' {
  const lower = url.toLowerCase().split('?')[0];
  if (lower.endsWith('.m3u8') || lower.includes('.m3u8')) return 'hls';
  if (lower.endsWith('.mpd') || lower.includes('.mpd')) return 'dash';
  return 'direct';
}

export function useHLSPlayer(videoRef: React.RefObject<HTMLVideoElement>) {
  const hlsRef = useRef<import('hls.js').default | null>(null);
  const { setPlayerState, setResolution, setBitrate, setErrorMsg, setIsRadioMode } =
    usePlayerStore();
  const { settings } = useSettingsStore();

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  const loadChannel = useCallback(
    async (channel: Channel) => {
      const video = videoRef.current;
      if (!video) return;

      destroyHls();
      setPlayerState('loading');
      setErrorMsg('');

      const url = channel.url;
      const type = detectStreamType(url);

      // Detect radio mode: no video track expected (audio-only streams)
      const isAudioOnly =
        !url.match(/\.(mp4|mkv|avi|ts|mov)/i) &&
        (channel.group?.toLowerCase().includes('radio') ||
          channel.name?.toLowerCase().includes('radio') ||
          url.includes('radio') ||
          url.match(/\.(mp3|aac|ogg|flac|opus)/i) !== null);

      setIsRadioMode(isAudioOnly);

      const headers: Record<string, string> = {};
      if (channel.userAgent) headers['User-Agent'] = channel.userAgent;
      if (channel.referrer) headers['Referer'] = channel.referrer;

      try {
        if (type === 'hls') {
          const Hls = await getHls();

          if (Hls.isSupported()) {
            const bufferSecs = settings.bufferSecs;

            const hls = new Hls({
              maxBufferLength: bufferSecs,
              maxMaxBufferLength: bufferSecs * 2,
              manifestLoadingTimeOut: 15000,
              manifestLoadingMaxRetry: 3,
              levelLoadingTimeOut: 15000,
              fragLoadingTimeOut: 20000,
              xhrSetup: (xhr, reqUrl) => {
                if (channel.userAgent) {
                  // Note: browser blocks User-Agent header in XHR for security
                }
              },
            });

            hlsRef.current = hls;

            hls.loadSource(url);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              video.play().catch(() => {});
              setPlayerState('playing');
            });

            hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
              const level = hls.levels[data.level];
              if (level) {
                setResolution(`${level.width}×${level.height}`);
                setBitrate(Math.round(level.bitrate / 1000));
              }
            });

            hls.on(Hls.Events.FRAG_LOADED, (_, data) => {
              setBitrate(Math.round((data.frag.stats.total * 8) / (data.frag.stats.loading.end - data.frag.stats.loading.start) / 1000));
            });

            hls.on(Hls.Events.ERROR, (_, data) => {
              if (data.fatal) {
                setPlayerState('error');
                setErrorMsg(data.details ?? 'Stream error');
                if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                  hls.startLoad();
                } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                  hls.recoverMediaError();
                } else {
                  destroyHls();
                }
              }
            });

            // Apply resolution preference
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (settings.resolution === 'lowest') {
                hls.currentLevel = 0;
              } else if (settings.resolution === 'highest') {
                hls.currentLevel = hls.levels.length - 1;
              } else {
                hls.currentLevel = -1; // auto
              }
            });
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS (Safari)
            video.src = url;
            video.play().catch(() => {});
            setPlayerState('playing');
          } else {
            throw new Error('HLS not supported in this browser');
          }
        } else {
          // Direct / progressive
          video.src = url;
          video.play().catch(() => {});
          setPlayerState('playing');
        }

        // Common video event handlers
        video.onwaiting = () => setPlayerState('loading');
        video.onplaying = () => setPlayerState('playing');
        video.onpause = () => setPlayerState('paused');
        video.onerror = () => {
          setPlayerState('error');
          setErrorMsg('Failed to load stream');
        };
      } catch (err) {
        setPlayerState('error');
        setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      }
    },
    [destroyHls, setPlayerState, setErrorMsg, setIsRadioMode, setResolution, setBitrate, settings]
  );

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [videoRef]);

  useEffect(() => {
    return destroyHls;
  }, [destroyHls]);

  return { loadChannel, togglePlay, destroyHls, hlsRef };
}
