import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Drawer, DrawerContent } from '@/components';
import ErrorCard from '@/components/error_card';
import Spinner from '@/components/spinner';
import adminGetSinger from '@/server/api/admin_get_singer';
import useTitlebarOverlayInsets from '@/utils/use_titlebar_overlay_insets';
import SingerEditContent from './content';
import type { Singer } from './types';

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

const toEditableSinger = (
  singer: Awaited<ReturnType<typeof adminGetSinger>>,
): Singer => ({
  id: singer.id,
  name: singer.name,
  aliases: singer.aliases,
  photos: singer.photos,
  musicCount: singer.musicCount,
  createUser: {
    id: singer.createUser.id,
    username: singer.createUser.username,
    nickname: singer.createUser.nickname,
  },
  createTimestamp: singer.createTimestamp,
});

function SingerEditDrawer({
  open,
  singerId,
  onClose,
  onSaved,
}: {
  open: boolean;
  singerId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { top: titlebarTop } = useTitlebarOverlayInsets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [singer, setSinger] = useState<Singer | null>(null);

  const loadSinger = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      setSinger(toEditableSinger(await adminGetSinger(id)));
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && singerId) {
      void loadSinger(singerId);
    }
    if (!open) {
      setSinger(null);
      setError(null);
    }
  }, [loadSinger, open, singerId]);

  const handleSaved = () => {
    onSaved();
    if (singerId) {
      void loadSinger(singerId);
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
              retry={() => singerId && loadSinger(singerId)}
            />
          </CenterBox>
        ) : singer ? (
          <SingerEditContent
            singer={singer}
            onSaved={handleSaved}
            onPhotosChanged={handleSaved}
            onDeleted={handleDeleted}
          />
        ) : null}
      </EditDrawerContent>
    </Drawer>
  );
}

export default SingerEditDrawer;
