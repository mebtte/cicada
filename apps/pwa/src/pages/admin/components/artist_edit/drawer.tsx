import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import AppDrawer from '@/components/app_drawer';
import AsyncContent from '@/components/async_content';
import adminGetArtist from '@/server/api/admin_get_artist';
import ArtistEditContent from './content';
import type { Artist } from './types';

const DRAWER_WIDTH = 360;
const DRAWER_NARROW_SCREEN_GUTTER = 48;

const EditDrawer = styled(AppDrawer)`
  > div {
    overflow: hidden;
  }
`;

const toEditableArtist = (
  artist: Awaited<ReturnType<typeof adminGetArtist>>,
): Artist => ({
  id: artist.id,
  name: artist.name,
  aliases: artist.aliases,
  searchKeywords: artist.searchKeywords,
  photos: artist.photos,
  musicCount: artist.musicCount,
  createTimestamp: artist.createTimestamp,
});

function ArtistEditDrawer({
  open,
  artistId,
  onClose,
  onSaved,
}: {
  open: boolean;
  artistId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [artist, setArtist] = useState<Artist | null>(null);

  const loadArtist = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      setArtist(toEditableArtist(await adminGetArtist(id)));
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && artistId) {
      void loadArtist(artistId);
    }
    if (!open) {
      setArtist(null);
      setError(null);
    }
  }, [loadArtist, open, artistId]);

  const handleSaved = () => {
    onSaved();
    if (artistId) {
      void loadArtist(artistId);
    }
  };

  // 删除完成后关闭抽屉, 同时通知外层刷新列表
  const handleDeleted = () => {
    onSaved();
    onClose();
  };

  return (
    <EditDrawer
      open={open}
      onClose={onClose}
      width={DRAWER_WIDTH}
      style={{
        maxWidth: `calc(100vw - ${DRAWER_NARROW_SCREEN_GUTTER}px)`,
      }}
      onOpenAutoFocus={(event) => event.preventDefault()}
    >
      <AsyncContent
        loading={loading}
        error={error}
        retry={() => artistId && loadArtist(artistId)}
      >
        {artist ? (
          <ArtistEditContent
            artist={artist}
            onSaved={handleSaved}
            onPhotosChanged={handleSaved}
            onDeleted={handleDeleted}
          />
        ) : null}
      </AsyncContent>
    </EditDrawer>
  );
}

export default ArtistEditDrawer;
