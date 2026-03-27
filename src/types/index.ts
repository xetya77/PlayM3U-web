// ─── Core Domain Types ────────────────────────────────────────────────────────

export interface Channel {
  id: string;
  name: string;
  url: string;
  logoUrl?: string;
  group: string;
  isDrm: boolean;
  userAgent?: string;
  referrer?: string;
  drmType?: 'clearkey' | 'widevine';
  drmKey?: string;
}

export interface Playlist {
  id: string;
  name: string;
  url: string;
  type: 'url' | 'file';
  downloadOnStart: boolean;
  channels: Channel[];
  lastUpdated: number;
}

// ─── Player Types ─────────────────────────────────────────────────────────────

export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';
export type StreamType = 'hls' | 'dash' | 'direct' | 'youtube' | 'radio';
export type OverlayStyle = 'default' | 'wide' | 'compact' | 'detail';
export type Resolution = 'auto' | 'lowest' | 'highest';
export type RadioBgMode =
  | 'breathing' | 'aurora_half' | 'aurora_full'
  | 'solid' | 'blur' | 'sweep';
export type RadioCoverMode =
  | 'album_art' | 'logo' | 'vinyl_art' | 'vinyl_logo'
  | 'cd_art' | 'cd_logo' | 'cassette_art' | 'cassette_logo';

// ─── App Settings ─────────────────────────────────────────────────────────────

export interface AppSettings {
  overlayStyle: OverlayStyle;
  resolution: Resolution;
  bufferSecs: number;
  loadLastChannel: boolean;
  subtitleEnabled: boolean;
  forceLandscape: boolean;
  navHintAlways: boolean;
  fontSizePct: number;
  radioBgMode: RadioBgMode;
  radioCoverMode: RadioCoverMode;
  totalQuotaMb: number;
}

// ─── Worker Messages ──────────────────────────────────────────────────────────

export interface WorkerParseRequest {
  type: 'PARSE';
  id: string;
  content: string;
}

export interface WorkerParseResponse {
  type: 'PARSE_RESULT';
  id: string;
  channels: Channel[];
  error?: string;
}

export type WorkerMessage = WorkerParseRequest;
export type WorkerResponse = WorkerParseResponse;

// ─── UI State ─────────────────────────────────────────────────────────────────

export type AppPage =
  | 'welcome'
  | 'source'
  | 'url_input'
  | 'name_input'
  | 'playlists'
  | 'settings'
  | 'player'
  | 'app_settings';

export type CategoryFilter = 'all' | 'tv' | 'radio' | string;
