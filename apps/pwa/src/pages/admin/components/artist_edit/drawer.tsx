import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Drawer, DrawerContent } from '@/components';
import ErrorCard from '@/components/error_card';
import Spinner from '@/components/spinner';
import adminGetArtist from '@/server/api/admin_get_artist';
import useTitlebarOverlayInsets from '@/utils/use_titlebar_overlay_insets';
import ArtistEditContent from './content';
import type { Artist } from './types';

const DRAWER_WIDTH = 360;
const DRAWER_NARROW_SCREEN_GUTTER = 48;

const EditDrawerContent = styled(DrawerContent)`
  > div {
    overflow: hidden;
  }
`;

const CenterBox = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
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
  const { top: titlebarTop } = useTitlebarOverlayInsets();
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
    <Drawer open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <EditDrawerContent
        side="right"
        style={{
          width: DRAWER_WIDTH,
          maxWidth: `calc(100vw - ${DRAWER_NARROW_SCREEN_GUTTER}px)`,
          paddingTop: titlebarTop,
        }}
        showClose={false}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        {loading ? (
          <CenterBox>
            <Spinner />
          </CenterBox>
        ) : error ? (
          <CenterBox>
            <ErrorCard
              errorMessage={error.message}
              retry={() => artistId && loadArtist(artistId)}
            />
          </CenterBox>
        ) : artist ? (
          <ArtistEditContent
            artist={artist}
            onSaved={handleSaved}
            onPhotosChanged={handleSaved}
            onDeleted={handleDeleted}
          />
        ) : null}
      </EditDrawerContent>
    </Drawer>
  );
}

export default ArtistEditDrawer;
