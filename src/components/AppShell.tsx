'use client';

import { useEffect } from 'react';
import { usePlaylistStore, useUIStore } from '@/store';
import { WelcomePage } from '@/components/playlist/WelcomePage';
import { SourcePage, URLInputPage, NameInputPage } from '@/components/playlist/AddPlaylistFlow';
import { PlaylistsPage } from '@/components/playlist/PlaylistsPage';
import { PlayerPage } from '@/components/player/PlayerPage';
import { DashboardPage } from '@/components/settings/DashboardPage';

export function AppShell() {
  const { page, navigateTo } = useUIStore();
  const { playlists } = usePlaylistStore();

  // Determine starting page on first hydration
  useEffect(() => {
    if (playlists.length > 0 && page === 'welcome') {
      navigateTo('settings');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderPage = () => {
    switch (page) {
      case 'welcome':      return <WelcomePage />;
      case 'source':       return <SourcePage />;
      case 'url_input':    return <URLInputPage />;
      case 'name_input':   return <NameInputPage />;
      case 'playlists':    return <PlaylistsPage />;
      case 'player':       return <PlayerPage />;
      case 'settings':     return <DashboardPage />;
      default:
        return playlists.length > 0 ? <DashboardPage /> : <WelcomePage />;
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-bg-deep">
      {renderPage()}
    </div>
  );
}
