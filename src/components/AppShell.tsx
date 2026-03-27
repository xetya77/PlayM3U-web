'use client';
import { useEffect } from 'react';
import { usePlaylistStore, useUIStore } from '@/store';
import { WelcomePage } from '@/components/playlist/WelcomePage';
import { SourcePage, URLInputPage, NameInputPage } from '@/components/playlist/AddPlaylistFlow';
import { PlaylistsPage } from '@/components/playlist/PlaylistsPage';
import { PlayerPage } from '@/components/player/PlayerPage';
import { DashboardPage } from '@/components/settings/DashboardPage';
import { SettingsPage } from '@/components/settings/SettingsPanel';

export function AppShell() {
  const { page, navigateTo } = useUIStore();
  const { playlists } = usePlaylistStore();

  useEffect(() => {
    if (playlists.length > 0 && page === 'welcome') navigateTo('settings');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const render = () => {
    switch (page) {
      case 'welcome':     return <WelcomePage />;
      case 'source':      return <SourcePage />;
      case 'url_input':   return <URLInputPage />;
      case 'name_input':  return <NameInputPage />;
      case 'playlists':   return <PlaylistsPage />;
      case 'player':      return <PlayerPage />;
      case 'settings':    return <DashboardPage />;
      case 'app_settings' as any: return <SettingsPage />;
      default: return playlists.length > 0 ? <DashboardPage /> : <WelcomePage />;
    }
  };

  return <div className="w-full h-full relative overflow-hidden" style={{background:'#16232A'}}>{render()}</div>;
}
