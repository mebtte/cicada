import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { MdClose } from 'react-icons/md';
import { Drawer, DrawerContent } from '@/components';
import ErrorCard from '@/components/error_card';
import Spinner from '@/components/spinner';
import { CSSVariable } from '@/global_style';
import adminGetSinger from '@/server/api/admin_get_singer';
import SingerEditContent from './singer_edit_content';
import type { Singer } from './types';

const EditDrawerContent = styled(DrawerContent)`
  > div {
    overflow: hidden;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 8px;
  padding: 0;
  background: transparent;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    background 120ms,
    color 120ms;

  &:hover {
    background: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  }

  &:focus-visible {
    outline: 2px solid ${CSSVariable.COLOR_PRIMARY};
    outline-offset: 2px;
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

  return (
    <Drawer open={open} onOpenChange={(nextOpen) => nextOpen || undefined}>
      <EditDrawerContent
        side="right"
        style={{ width: 360 }}
        showClose={false}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <CloseButton
          type="button"
          aria-label="Close"
          title="Close"
          onClick={onClose}
        >
          <MdClose size={20} />
        </CloseButton>
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
          />
        ) : null}
      </EditDrawerContent>
    </Drawer>
  );
}

export default SingerEditDrawer;
