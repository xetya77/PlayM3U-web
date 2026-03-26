'use client';

import { useSettingsStore, useUIStore, usePlaylistStore } from '@/store';
import { Toggle, Button } from '@/components/ui/primitives';
import type { OverlayStyle, Resolution, RadioBgMode, RadioCoverMode } from '@/types';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted uppercase tracking-wider px-1">{title}</p>
      {children}
    </div>
  );
}

function OptionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-0">
      <span className="text-sm text-slate-300">{label}</span>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Chips<T extends string>({ value, options, onChange }: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            value === o.value ? 'bg-accent text-white' : 'bg-surface text-muted hover:text-white'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SettingsPanel() {
  const { settingsPanelOpen, setSettingsPanelOpen, navigateTo } = useUIStore();
  const { settings, updateSettings } = useSettingsStore();
  const { getCurrentPlaylist } = usePlaylistStore();
  const pl = getCurrentPlaylist();

  if (!settingsPanelOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 z-30 animate-fade-in"
        onClick={() => setSettingsPanelOpen(false)}
      />
      {/* Panel */}
      <div className="absolute top-0 right-0 bottom-0 w-80 bg-bg-deep border-l border-white/10 z-40 overflow-y-auto animate-slide-right">
        <div className="sticky top-0 bg-bg-deep border-b border-white/10 px-5 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-white">Settings</h3>
          <button onClick={() => setSettingsPanelOpen(false)} className="text-muted hover:text-white transition-colors p-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Playlist info */}
          {pl && (
            <div className="glass-card rounded-xl p-3 text-sm">
              <p className="text-muted text-xs">Current playlist</p>
              <p className="text-white font-medium mt-0.5">{pl.name}</p>
              <p className="text-muted text-xs mt-0.5">{pl.channels.length.toLocaleString()} channels</p>
            </div>
          )}

          {/* Playback */}
          <Section title="Playback">
            <OptionRow label="Resolution">
              <Chips<Resolution>
                value={settings.resolution}
                options={[
                  { value: 'auto', label: 'Auto' },
                  { value: 'lowest', label: 'Low' },
                  { value: 'highest', label: 'High' },
                ]}
                onChange={(v) => updateSettings({ resolution: v })}
              />
            </OptionRow>
            <OptionRow label="Buffer">
              <Chips<string>
                value={String(settings.bufferSecs)}
                options={[
                  { value: '10', label: '10s' },
                  { value: '30', label: '30s' },
                  { value: '60', label: '60s' },
                  { value: '120', label: '2min' },
                ]}
                onChange={(v) => updateSettings({ bufferSecs: Number(v) })}
              />
            </OptionRow>
            <OptionRow label="Load last channel">
              <Toggle checked={settings.loadLastChannel} onChange={(v) => updateSettings({ loadLastChannel: v })} />
            </OptionRow>
            <OptionRow label="Subtitles">
              <Toggle checked={settings.subtitleEnabled} onChange={(v) => updateSettings({ subtitleEnabled: v })} />
            </OptionRow>
          </Section>

          {/* OSD Overlay */}
          <Section title="Channel Info Overlay">
            <Chips<OverlayStyle>
              value={settings.overlayStyle}
              options={[
                { value: 'default', label: 'Default' },
                { value: 'wide', label: 'Wide' },
                { value: 'compact', label: 'Compact' },
                { value: 'detail', label: 'Detail' },
              ]}
              onChange={(v) => updateSettings({ overlayStyle: v })}
            />
          </Section>

          {/* Radio */}
          <Section title="Radio Background">
            <Chips<RadioBgMode>
              value={settings.radioBgMode}
              options={[
                { value: 'aurora_half', label: 'Aurora' },
                { value: 'aurora_full', label: 'Aurora Full' },
                { value: 'breathing', label: 'Breathing' },
                { value: 'solid', label: 'Solid' },
                { value: 'sweep', label: 'Sweep' },
                { value: 'blur', label: 'Blur' },
              ]}
              onChange={(v) => updateSettings({ radioBgMode: v })}
            />
          </Section>

          <Section title="Radio Cover">
            <Chips<RadioCoverMode>
              value={settings.radioCoverMode}
              options={[
                { value: 'vinyl_art', label: 'Vinyl' },
                { value: 'vinyl_logo', label: 'Vinyl Logo' },
                { value: 'album_art', label: 'Album Art' },
                { value: 'logo', label: 'Logo' },
              ]}
              onChange={(v) => updateSettings({ radioCoverMode: v })}
            />
          </Section>

          {/* UI */}
          <Section title="Interface">
            <OptionRow label="Nav hint always visible">
              <Toggle checked={settings.navHintAlways} onChange={(v) => updateSettings({ navHintAlways: v })} />
            </OptionRow>
            <OptionRow label="Font size">
              <Chips<string>
                value={String(settings.fontSizePct)}
                options={[
                  { value: '100', label: '100%' },
                  { value: '120', label: '120%' },
                  { value: '140', label: '140%' },
                ]}
                onChange={(v) => updateSettings({ fontSizePct: Number(v) })}
              />
            </OptionRow>
          </Section>

          {/* Navigation */}
          <Section title="Playlists">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => { setSettingsPanelOpen(false); navigateTo('playlists'); }}
            >
              Manage Playlists
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => { setSettingsPanelOpen(false); navigateTo('source'); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add New Playlist
            </Button>
          </Section>
        </div>
      </div>
    </>
  );
}
