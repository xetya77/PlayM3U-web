// ─── M3U Parser Web Worker ────────────────────────────────────────────────────
// Runs entirely off the main thread. Supports Patterns A, B, C from the
// original Android M3UParser.java

import type { Channel, WorkerMessage, WorkerResponse } from '../types';

/**
 * Extract a quoted attribute from an #EXTINF line.
 * e.g. tvg-logo="https://..." → "https://..."
 */
function extractAttr(line: string, attr: string): string | undefined {
  const re = new RegExp(`${attr}=["']([^"']*)["']`);
  const m = line.match(re);
  return m ? m[1].trim() : undefined;
}

function isMeta(line: string): boolean {
  return line.startsWith('#EXTVLCOPT') || line.startsWith('#KODIPROP');
}

function isUrl(line: string): boolean {
  return (
    line.startsWith('http') ||
    line.startsWith('rtmp') ||
    line.startsWith('rtsp') ||
    line.startsWith('//')
  );
}

let _idCounter = 0;
function makeId(): string {
  return `ch_${Date.now()}_${++_idCounter}`;
}

function applyMeta(line: string, ch: Channel): void {
  if (line.startsWith('#EXTVLCOPT:http-user-agent=')) {
    const v = line.slice('#EXTVLCOPT:http-user-agent='.length);
    if (v && !ch.userAgent) ch.userAgent = v;
  } else if (line.startsWith('#EXTVLCOPT:http-referrer=')) {
    const v = line.slice('#EXTVLCOPT:http-referrer='.length);
    if (v && !ch.referrer) ch.referrer = v;
  } else if (line.startsWith('#KODIPROP:inputstream.adaptive.license_type=')) {
    const t = line.slice('#KODIPROP:inputstream.adaptive.license_type='.length);
    if (!ch.drmType) {
      if (t.includes('clearkey') || t === 'org.w3.clearkey') ch.drmType = 'clearkey';
      else if (t.includes('widevine')) ch.drmType = 'widevine';
    }
  } else if (line.startsWith('#KODIPROP:inputstream.adaptive.license_key=')) {
    const v = line.slice('#KODIPROP:inputstream.adaptive.license_key='.length);
    if (v && !ch.drmKey) ch.drmKey = v;
  }
}

/**
 * Full M3U parser — port of M3UParser.java supporting patterns A, B, C.
 */
function parseM3U(content: string): Channel[] {
  const channels: Channel[] = [];
  if (!content) return channels;

  const rawLines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const total = rawLines.length;

  let name: string | undefined;
  let logo: string | undefined;
  let group: string | undefined;
  let userAgent: string | undefined;
  let referrer: string | undefined;
  let drmType: Channel['drmType'];
  let drmKey: string | undefined;

  for (let i = 0; i < total; i++) {
    const line = rawLines[i].trim();

    if (line.startsWith('#EXTINF')) {
      const comma = line.lastIndexOf(',');
      const n =
        comma >= 0 && comma < line.length - 1
          ? line.slice(comma + 1).trim()
          : undefined;
      name = n && n.length > 0 ? n : 'Channel';
      logo = extractAttr(line, 'tvg-logo');
      group = extractAttr(line, 'group-title');

      const inlineUa = extractAttr(line, 'tvg-user-agent');
      if (inlineUa) userAgent = inlineUa;
      const inlineRef = extractAttr(line, 'http-referrer');
      if (inlineRef) referrer = inlineRef;
    } else if (line.startsWith('#EXTVLCOPT:http-user-agent=')) {
      userAgent = line.slice('#EXTVLCOPT:http-user-agent='.length).trim();
    } else if (line.startsWith('#EXTVLCOPT:http-referrer=')) {
      referrer = line.slice('#EXTVLCOPT:http-referrer='.length).trim();
    } else if (line.startsWith('#KODIPROP:inputstream.adaptive.license_type=')) {
      const t = line.slice('#KODIPROP:inputstream.adaptive.license_type='.length).trim();
      if (t.includes('clearkey') || t === 'org.w3.clearkey') drmType = 'clearkey';
      else if (t.includes('widevine')) drmType = 'widevine';
    } else if (line.startsWith('#KODIPROP:inputstream.adaptive.license_key=')) {
      drmKey = line.slice('#KODIPROP:inputstream.adaptive.license_key='.length).trim();
    } else if (!line.startsWith('#') && line.length > 0 && isUrl(line)) {
      const ch: Channel = {
        id: makeId(),
        name: name || 'Channel',
        url: line,
        logoUrl: logo,
        group: group || '',
        isDrm: !!drmType,
        userAgent,
        referrer,
        drmType,
        drmKey,
      };
      channels.push(ch);

      // ── Pattern B: scan metadata after URL ────────────────────────────────
      const urlPos = i;
      let nextExtinfPos = total;
      for (let k = i + 1; k < total && k < i + 60; k++) {
        if (rawLines[k].trim().startsWith('#EXTINF')) {
          nextExtinfPos = k;
          break;
        }
      }

      let j = i + 1;
      while (j < nextExtinfPos) {
        const nl = rawLines[j].trim();
        if (isMeta(nl)) {
          const blockStart = j;
          const block: string[] = [];
          while (j < nextExtinfPos && isMeta(rawLines[j].trim())) {
            block.push(rawLines[j].trim());
            j++;
          }
          const distFromUrl = blockStart - urlPos;
          const distToNext = nextExtinfPos - blockStart;
          if (distFromUrl <= distToNext) {
            for (const bl of block) applyMeta(bl, ch);
            ch.isDrm = !!ch.drmType;
          }
        } else {
          j++;
        }
      }
      // ──────────────────────────────────────────────────────────────────────

      // Reset state
      name = undefined;
      logo = undefined;
      group = undefined;
      userAgent = undefined;
      referrer = undefined;
      drmType = undefined;
      drmKey = undefined;
    }
  }

  return channels;
}

// ─── Worker message handler ───────────────────────────────────────────────────
self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data;
  if (msg.type === 'PARSE') {
    try {
      const channels = parseM3U(msg.content);
      const response: WorkerResponse = {
        type: 'PARSE_RESULT',
        id: msg.id,
        channels,
      };
      self.postMessage(response);
    } catch (err) {
      const response: WorkerResponse = {
        type: 'PARSE_RESULT',
        id: msg.id,
        channels: [],
        error: err instanceof Error ? err.message : String(err),
      };
      self.postMessage(response);
    }
  }
};

export {};
