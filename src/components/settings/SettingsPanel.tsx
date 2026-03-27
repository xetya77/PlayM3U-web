'use client';
import { useSettingsStore, useUIStore } from '@/store';
import type { OverlayStyle, Resolution, RadioBgMode, RadioCoverMode } from '@/types';

function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4 border-b" style={{borderColor:'#1C2F3A'}}>
      <div className="flex-1 pr-4">
        <p className="font-semibold text-white">{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{color:'#7A9BA3'}}>{sub}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!on)} className="relative cursor-pointer"
      style={{width:52, height:28}}>
      <div className="absolute inset-0 rounded-full transition-colors"
        style={{background: on ? '#0A5055' : '#2A3F4A'}} />
      <div className="absolute top-1 transition-all rounded-full bg-white shadow"
        style={{width:20, height:20, left: on ? 28 : 4}} />
    </div>
  );
}

function Chips<T extends string>({ value, options, onChange }: {
  value: T; options: {v:T; l:string}[]; onChange:(v:T)=>void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {options.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)}
          className="px-4 py-2 rounded-xl text-sm font-bold transition-colors"
          style={{background: value===o.v ? '#FF5B04' : '#1C2F3A',
            color: value===o.v ? 'white' : '#7A9BA3'}}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

export function SettingsPage() {
  const { navigateBack } = useUIStore();
  const { settings: s, updateSettings: u } = useSettingsStore();

  return (
    <div className="flex flex-col h-full page-enter" style={{background:'#16232A'}}>
      <div className="flex items-center gap-3 px-5 pt-6 pb-4 border-b" style={{borderColor:'#1C2F3A'}}>
        <button onClick={navigateBack}
          className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{color:'#FF5B04'}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h2 className="flex-1 text-center text-lg font-black text-white">Settings</h2>
        <div className="w-9"/>
      </div>

      <div className="flex-1 overflow-y-auto px-5">
        <Row label="Video Quality" sub={s.resolution === 'auto' ? 'Automatic' : s.resolution === 'lowest' ? 'Lowest' : 'Highest'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A9BA3" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </Row>
        <div className="py-2"><Chips<Resolution> value={s.resolution}
          options={[{v:'auto',l:'Auto'},{v:'lowest',l:'Lowest'},{v:'highest',l:'Highest'}]}
          onChange={v => u({resolution:v})} /></div>

        <Row label="Buffer size" sub="Larger buffer reduces interruptions but uses more memory">
          <span className="font-bold text-white">{s.bufferSecs} seconds</span>
        </Row>
        <div className="py-2 flex gap-2">
          {[10,30,60,120].map(v => (
            <button key={v} onClick={() => u({bufferSecs:v})}
              className="px-4 py-2 rounded-xl text-sm font-bold"
              style={{background: s.bufferSecs===v ? '#FF5B04':'#1C2F3A',
                color: s.bufferSecs===v ? 'white':'#7A9BA3'}}>
              {v<60 ? `${v}s` : `${v/60}m`}
            </button>
          ))}
        </div>

        <Row label="Resume on startup" sub="Auto-play last watched channel when opening app">
          <Toggle on={s.loadLastChannel} onChange={v => u({loadLastChannel:v})} />
        </Row>
        <Row label="Subtitles" sub="Show subtitles when available">
          <Toggle on={s.subtitleEnabled} onChange={v => u({subtitleEnabled:v})} />
        </Row>
        <Row label="Landscape Orientation" sub="Always force landscape mode">
          <Toggle on={s.forceLandscape} onChange={v => u({forceLandscape:v})} />
        </Row>

        <Row label="Font Size" sub="Adjust text size for better readability on TV">
          <span className="font-black text-white">{s.fontSizePct}%</span>
        </Row>
        <div className="py-2 flex gap-2 flex-wrap">
          {[100,120,140,160,180,200].map(v => (
            <button key={v} onClick={() => u({fontSizePct:v})}
              className="px-3 py-2 rounded-xl text-sm font-bold"
              style={{background: s.fontSizePct===v ? '#FF5B04':'#1C2F3A',
                color: s.fontSizePct===v ? 'white':'#7A9BA3'}}>
              {v}%
            </button>
          ))}
        </div>

        <Row label="Overlay Style" sub="Channel info display style">
          <span className="font-bold capitalize" style={{color:'#7A9BA3'}}>{s.overlayStyle}</span>
        </Row>
        <div className="py-2"><Chips<OverlayStyle> value={s.overlayStyle}
          options={[{v:'default',l:'Default'},{v:'wide',l:'Wide'},{v:'compact',l:'Compact'},{v:'detail',l:'Detail'}]}
          onChange={v => u({overlayStyle:v})} /></div>

        <Row label="Radio Background" sub="Visual style for radio channels">
          <span/>
        </Row>
        <div className="py-2"><Chips<RadioBgMode> value={s.radioBgMode}
          options={[{v:'aurora_half',l:'Aurora'},{v:'breathing',l:'Breathing'},{v:'solid',l:'Solid'},{v:'blur',l:'Blur'},{v:'sweep',l:'Sweep'}]}
          onChange={v => u({radioBgMode:v})} /></div>

        <div className="h-8" />
      </div>
    </div>
  );
}

/* Slide-over panel version for use inside player */
export function SettingsPanel() {
  const { settingsPanelOpen, setSettingsPanelOpen } = useUIStore();
  if (!settingsPanelOpen) return null;
  return (
    <>
      <div className="absolute inset-0 bg-black/50 z-30" onClick={() => setSettingsPanelOpen(false)} />
      <div className="absolute top-0 right-0 bottom-0 w-80 z-40 overflow-y-auto" style={{background:'#16232A'}}>
        <SettingsPage />
      </div>
    </>
  );
}
