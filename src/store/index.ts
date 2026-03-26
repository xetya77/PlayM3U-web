import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Playlist,
  Channel,
  AppSettings,
  AppPage,
  CategoryFilter,
  PlayerState,
} from '@/types';

// ─── Default Settings ─────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  overlayStyle: 'default',
  resolution: 'auto',
  bufferSecs: 30,
  loadLastChannel: false,
  subtitleEnabled: false,
  forceLandscape: false,
  navHintAlways: false,
  fontSizePct: 100,
  radioBgMode: 'aurora_half',
  radioCoverMode: 'vinyl_art',
  totalQuotaMb: 0,
};

// ─── Playlist Store ───────────────────────────────────────────────────────────

interface PlaylistState {
  playlists: Playlist[];
  currentPlaylistIdx: number;
  currentChannelIdx: number;
  addPlaylist: (pl: Playlist) => void;
  removePlaylist: (id: string) => void;
  updatePlaylist: (id: string, channels: Channel[], lastUpdated: number) => void;
  setCurrentPlaylist: (idx: number) => void;
  setCurrentChannel: (idx: number) => void;
  getCurrentPlaylist: () => Playlist | undefined;
  getCurrentChannel: () => Channel | undefined;
  getChannels: () => Channel[];
}

export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set, get) => ({
      playlists: [],
      currentPlaylistIdx: 0,
      currentChannelIdx: 0,

      addPlaylist: (pl) =>
        set((s) => ({ playlists: [...s.playlists, pl] })),

      removePlaylist: (id) =>
        set((s) => ({
          playlists: s.playlists.filter((p) => p.id !== id),
          currentPlaylistIdx: 0,
          currentChannelIdx: 0,
        })),

      updatePlaylist: (id, channels, lastUpdated) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === id ? { ...p, channels, lastUpdated } : p
          ),
        })),

      setCurrentPlaylist: (idx) =>
        set({ currentPlaylistIdx: idx, currentChannelIdx: 0 }),

      setCurrentChannel: (idx) => set({ currentChannelIdx: idx }),

      getCurrentPlaylist: () => {
        const { playlists, currentPlaylistIdx } = get();
        return playlists[currentPlaylistIdx];
      },

      getCurrentChannel: () => {
        const pl = get().getCurrentPlaylist();
        if (!pl) return undefined;
        return pl.channels[get().currentChannelIdx];
      },

      getChannels: () => {
        const pl = get().getCurrentPlaylist();
        return pl?.channels ?? [];
      },
    }),
    { name: 'playm3u-playlists' }
  )
);

// ─── Settings Store ───────────────────────────────────────────────────────────

interface SettingsState {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    { name: 'playm3u-settings' }
  )
);

// ─── UI / Navigation Store ────────────────────────────────────────────────────

interface UIState {
  page: AppPage;
  pageHistory: AppPage[];
  categoryFilter: CategoryFilter;
  searchQuery: string;
  sidebarOpen: boolean;
  channelListOpen: boolean;
  settingsPanelOpen: boolean;
  playlistSwitcherOpen: boolean;

  navigateTo: (page: AppPage) => void;
  navigateBack: () => void;
  setCategoryFilter: (f: CategoryFilter) => void;
  setSearchQuery: (q: string) => void;
  setSidebarOpen: (v: boolean) => void;
  setChannelListOpen: (v: boolean) => void;
  setSettingsPanelOpen: (v: boolean) => void;
  setPlaylistSwitcherOpen: (v: boolean) => void;
}

export const useUIStore = create<UIState>()((set, get) => ({
  page: 'welcome',
  pageHistory: [],
  categoryFilter: 'all',
  searchQuery: '',
  sidebarOpen: false,
  channelListOpen: false,
  settingsPanelOpen: false,
  playlistSwitcherOpen: false,

  navigateTo: (page) =>
    set((s) => ({
      page,
      pageHistory: [...s.pageHistory, s.page],
    })),

  navigateBack: () =>
    set((s) => {
      const history = [...s.pageHistory];
      const prev = history.pop();
      return { page: prev ?? 'welcome', pageHistory: history };
    }),

  setCategoryFilter: (f) => set({ categoryFilter: f }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  setChannelListOpen: (v) => set({ channelListOpen: v }),
  setSettingsPanelOpen: (v) => set({ settingsPanelOpen: v }),
  setPlaylistSwitcherOpen: (v) => set({ playlistSwitcherOpen: v }),
}));

// ─── Player Store ─────────────────────────────────────────────────────────────

interface PlayerStoreState {
  playerState: PlayerState;
  isRadioMode: boolean;
  nowPlaying: string;
  volume: number;
  muted: boolean;
  resolution: string;
  bitrate: number;
  errorMsg: string;

  setPlayerState: (s: PlayerState) => void;
  setIsRadioMode: (v: boolean) => void;
  setNowPlaying: (s: string) => void;
  setVolume: (v: number) => void;
  setMuted: (v: boolean) => void;
  setResolution: (r: string) => void;
  setBitrate: (b: number) => void;
  setErrorMsg: (m: string) => void;
}

export const usePlayerStore = create<PlayerStoreState>()((set) => ({
  playerState: 'idle',
  isRadioMode: false,
  nowPlaying: '',
  volume: 1,
  muted: false,
  resolution: '',
  bitrate: 0,
  errorMsg: '',

  setPlayerState: (s) => set({ playerState: s }),
  setIsRadioMode: (v) => set({ isRadioMode: v }),
  setNowPlaying: (s) => set({ nowPlaying: s }),
  setVolume: (v) => set({ volume: v }),
  setMuted: (v) => set({ muted: v }),
  setResolution: (r) => set({ resolution: r }),
  setBitrate: (b) => set({ bitrate: b }),
  setErrorMsg: (m) => set({ errorMsg: m }),
}));
