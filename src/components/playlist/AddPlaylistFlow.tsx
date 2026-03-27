'use client';
import { useState, useCallback, useEffect } from 'react';
import { useUIStore, usePlaylistStore } from '@/store';
import { useM3UWorker } from '@/hooks/useM3UWorker';
import type { Playlist, Channel } from '@/types';

function generateId() { return `pl_${Date.now()}_${Math.random().toString(36).slice(2,7)}`; }

/* ── Step indicator ─────────────────────────────────────────────────────── */
function Steps({ current }: { current: 1|2|3 }) {
  return (
    <div className="flex gap-2 px-6 pt-6">
      {[1,2,3].map(i => (
        <div key={i} className="step-dot flex-1"
          style={{background: i <= current ? '#FF5B04' : '#2A3F4A'}} />
      ))}
    </div>
  );
}

/* ── Source Page ────────────────────────────────────────────────────────── */
export function SourcePage() {
  const { navigateTo } = useUIStore();
  const [sel, setSel] = useState<'url'|'file'|null>(null);

  return (
    <div className="flex flex-col h-full page-enter" style={{background:'#E4EEF0'}}>
      <Steps current={1} />
      <div className="flex-1 flex flex-col justify-center px-6 gap-6">
        <h2 className="text-3xl font-black text-center" style={{color:'#16232A'}}>
          Import M3U from where?
        </h2>
        <div className="flex flex-col gap-4">
          {(['url','file'] as const).map(opt => (
            <button key={opt} onClick={() => setSel(opt)}
              className="pill-btn py-8 text-xl text-white"
              style={{
                background: sel===opt ? '#0A5055' : '#8FA5AA',
                fontSize:'20px',
              }}>
              {opt === 'url' ? 'Link/URL' : 'Local File'}
            </button>
          ))}
        </div>
      </div>
      <div className="px-6 pb-8 flex flex-col items-center gap-3">
        <button
          onClick={() => sel && navigateTo('url_input')}
          disabled={!sel}
          className="pill-btn w-full py-5 text-lg text-white"
          style={{background:'#0A5055', fontSize:'18px', opacity: sel ? 1 : 0.5}}
        >
          Next step
        </button>
        <p className="text-sm italic text-center" style={{color:'#7A9BA3'}}>
          Choose one to continue<br/>and press next step
        </p>
      </div>
    </div>
  );
}

/* ── URL Input Page ──────────────────────────────────────────────────────── */
export function URLInputPage() {
  const { navigateTo } = useUIStore();
  const { parse } = useM3UWorker();
  const [url, setUrl] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true); setDone(false); setError(''); setProgress(0); setChannels([]);
    // Animate progress
    const iv = setInterval(() => setProgress(p => Math.min(p + Math.random()*15, 90)), 200);
    try {
      const proxies = [url.trim(),
        `https://corsproxy.io/?${encodeURIComponent(url.trim())}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url.trim())}`,
      ];
      let content = '';
      for (const t of proxies) {
        try {
          const r = await fetch(t, {signal: AbortSignal.timeout(20000)});
          if (r.ok) { content = await r.text(); break; }
        } catch { continue; }
      }
      clearInterval(iv); setProgress(95);
      if (!content) throw new Error('Could not fetch URL');
      const parsed = await parse(content);
      if (!parsed.length) throw new Error('No channels found');
      setProgress(100); setChannels(parsed); setDone(true);
      sessionStorage.setItem('pendingUrl', url.trim());
      sessionStorage.setItem('pendingChannels', JSON.stringify(parsed));
      sessionStorage.setItem('pendingAutoRefresh', String(autoRefresh));
    } catch(e) {
      clearInterval(iv); setProgress(0);
      setError(e instanceof Error ? e.message : 'Failed');
    } finally { setLoading(false); }
  }, [url, autoRefresh, parse]);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setLoading(true); setError(''); setProgress(0); setDone(false);
    const iv = setInterval(() => setProgress(p => Math.min(p+20,85)), 150);
    try {
      const content = await file.text();
      const parsed = await parse(content);
      clearInterval(iv); setProgress(100);
      setChannels(parsed); setDone(true);
      sessionStorage.setItem('pendingUrl', `file://${file.name}`);
      sessionStorage.setItem('pendingChannels', JSON.stringify(parsed));
      sessionStorage.setItem('pendingAutoRefresh', 'false');
      setUrl(`file://${file.name}`);
    } catch(e) {
      clearInterval(iv); setError(e instanceof Error ? e.message : 'Error');
    } finally { setLoading(false); }
  }, [parse]);

  return (
    <div className="flex flex-col h-full page-enter" style={{background:'#16232A'}}>
      <Steps current={2} />
      <div className="flex-1 flex flex-col justify-start px-6 pt-8 gap-6">
        <h2 className="text-4xl font-black text-center text-white" style={{letterSpacing:'-1px'}}>
          What's your M3U URL?
        </h2>

        {/* URL input */}
        <div className="rounded-3xl overflow-hidden flex items-center gap-3 px-5 py-4"
          style={{background:'#0D1B24'}}>
          <input
            type="url"
            value={url}
            onChange={e => { setUrl(e.target.value); setDone(false); setChannels([]); }}
            placeholder="Enter playlist URL..."
            className="flex-1 bg-transparent text-xl text-white placeholder-ice/30 font-medium"
            style={{fontSize:'20px'}}
          />
          {url && (
            <button onClick={() => { setUrl(''); setDone(false); setChannels([]); }}
              className="text-ice/40 hover:text-white transition-colors text-2xl">✕</button>
          )}
        </div>

        {/* Auto refresh toggle */}
        <div>
          <h3 className="text-2xl font-black text-white text-center mb-4">Enable auto refresh?</h3>
          <div className="flex rounded-3xl overflow-hidden" style={{background:'#0D1B24'}}>
            <button onClick={() => setAutoRefresh(true)}
              className="flex-1 py-6 text-xl font-bold transition-all rounded-3xl"
              style={{background: autoRefresh ? '#FF5B04' : 'transparent', color:'white', fontSize:'20px'}}>
              Yes
            </button>
            <button onClick={() => setAutoRefresh(false)}
              className="flex-1 py-6 text-xl font-bold transition-all"
              style={{color: !autoRefresh ? 'white' : '#7A9BA3', fontSize:'20px'}}>
              No
            </button>
          </div>
          <p className="text-center mt-3 italic" style={{color:'#7A9BA3', fontSize:'14px'}}>
            The playlist will update each time you open the app.
          </p>
        </div>

        {/* Loading card */}
        {(loading || done) && (
          <div className="rounded-3xl p-5" style={{background:'#E4EEF0'}}>
            {!done && <p className="text-sm font-semibold mb-2" style={{color:'#0A5055'}}>+ Adding Playlist..</p>}
            {channels.length > 0 && (
              <p className="text-3xl font-black mb-3" style={{color:'#16232A'}}>
                {channels.length} Ch <span style={{color:'#FF5B04'}}>●</span> {done ? 'Added' : 'Available'}
              </p>
            )}
            {loading && (
              <>
                <div className="flex justify-between text-xs mb-1" style={{color:'#7A9BA3'}}>
                  <span>0%</span><span>50%</span><span>100%</span>
                </div>
                <div className="rounded-full h-14 overflow-hidden" style={{background:'#D0DDE0'}}>
                  <div className="h-full progress-shimmer rounded-full transition-all duration-300"
                    style={{width:`${progress}%`}} />
                </div>
              </>
            )}
            {done && (
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{background:'#0A5055'}}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p className="text-xl font-black text-center" style={{color:'#16232A'}}>
                  Playlist added
                </p>
                <p className="font-medium" style={{color:'#4A6670'}}>
                  {channels.length} channels imported.
                </p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-2xl p-4 text-center" style={{background:'#3A1010', color:'#FF6B6B'}}>
            {error}
          </div>
        )}
      </div>

      <div className="px-6 pb-8 flex flex-col items-center gap-3">
        {/* File picker */}
        {!done && (
          <label className="pill-btn w-full py-5 text-white cursor-pointer"
            style={{background:'#1C2F3A', fontSize:'16px', border:'1px solid #2A3F4A'}}>
            📁 Pick local file
            <input type="file" accept=".m3u,.m3u8" className="hidden" onChange={handleFile}/>
          </label>
        )}

        {done ? (
          <button onClick={() => navigateTo('name_input')}
            className="pill-btn w-full py-5 text-xl font-bold"
            style={{background:'#E4EEF0', color:'#16232A', fontSize:'18px'}}>
            Next →
          </button>
        ) : (
          <button onClick={handleAdd} disabled={!url.trim() || loading}
            className="pill-btn w-full py-5 text-xl font-bold"
            style={{background: url.trim() && !loading ? '#E4EEF0' : '#2A3F4A',
              color: url.trim() && !loading ? '#16232A' : '#7A9BA3', fontSize:'18px'}}>
            {loading ? 'Loading...' : 'Add playlist'}
          </button>
        )}
        <p className="text-sm italic text-center" style={{color:'#7A9BA3'}}>
          Paste the direct link to your M3U playlist<br/>and press Add playlist
        </p>
      </div>
    </div>
  );
}

/* ── Name Input Page ─────────────────────────────────────────────────────── */
export function NameInputPage() {
  const { navigateTo } = useUIStore();
  const { addPlaylist, playlists } = usePlaylistStore();
  const [name, setName] = useState('');

  const handleDone = useCallback(() => {
    const url = sessionStorage.getItem('pendingUrl') ?? '';
    const channels: Channel[] = JSON.parse(sessionStorage.getItem('pendingChannels') ?? '[]');
    const autoRefresh = sessionStorage.getItem('pendingAutoRefresh') !== 'false';
    const pl: Playlist = {
      id: generateId(), name: name.trim() || 'My Playlist',
      url, type: url.startsWith('file://') ? 'file' : 'url',
      downloadOnStart: autoRefresh, channels, lastUpdated: Date.now(),
    };
    addPlaylist(pl);
    sessionStorage.removeItem('pendingUrl');
    sessionStorage.removeItem('pendingChannels');
    sessionStorage.removeItem('pendingAutoRefresh');
    navigateTo('player');
  }, [name, addPlaylist, navigateTo]);

  return (
    <div className="flex flex-col h-full page-enter" style={{background:'#16232A'}}>
      <Steps current={3} />
      <div className="flex-1 flex flex-col justify-center px-6 gap-8">
        <h2 className="text-3xl font-black text-white text-center" style={{letterSpacing:'-0.5px'}}>
          What should we call<br/>this playlist?
        </h2>
        <div className="rounded-3xl overflow-hidden border-2"
          style={{borderColor:'#0A5055', background:'#E4EEF0'}}>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter playlist name..."
            className="w-full px-6 py-5 text-xl font-semibold bg-transparent"
            style={{color:'#16232A', fontSize:'20px'}}
            autoFocus
          />
        </div>
      </div>
      <div className="px-6 pb-8 flex flex-col items-center gap-3">
        <button onClick={handleDone}
          className="pill-btn w-full py-5 text-xl font-bold"
          style={{background:'#E4EEF0', color:'#16232A', fontSize:'18px'}}>
          Done
        </button>
        <p className="text-sm italic" style={{color:'#7A9BA3'}}>Give it a name to keep things organized.</p>
      </div>
    </div>
  );
}
