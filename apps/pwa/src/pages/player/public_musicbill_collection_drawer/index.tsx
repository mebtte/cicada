import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components';
import { Query } from '@/constants';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';
import useNavigate from '@/utils/use_navigate';
import CollectionList from '../pages/public_musicbill_collection/collection_list';
import { SearchTab } from '../constants';
import e, { EventType } from '../eventemitter';
import useDynamicZIndex from '../use_dynamic_z_index';

const Shell = styled.div`
  isolation: isolate;
  height: 100%;
  min-height: 0;

  display: flex;
  flex-direction: column;
`;

const Header = styled(DrawerHeader)`
  position: relative;
  z-index: 3;
  padding: 20px 18px 16px;

  background: #fff;
  border-bottom: 2px solid ${CSSVariable.COLOR_BORDER};
  box-shadow: 0 4px 0 ${CSSVariable.COLOR_SURFACE_SHADOW};
`;

const Body = styled.div`
  position: relative;
  z-index: 0;
  flex: 1;
  min-height: 0;
`;

function PublicMusicbillCollectionDrawer() {
  const [open, setOpen] = useState(false);
  const zIndex = useDynamicZIndex(
    EventType.OPEN_PUBLIC_MUSICBILL_COLLECTION_DRAWER,
  );
  const navigate = useNavigate();

  useEffect(() => {
    const unlisten = e.listen(
      EventType.OPEN_PUBLIC_MUSICBILL_COLLECTION_DRAWER,
      () => setOpen(true),
    );
    return unlisten;
  }, []);

  const navigateToDiscovery = useCallback(() => {
    setOpen(false);
    navigate({
      path: ROOT_PATH.PLAYER + PLAYER_PATH.EXPLORATION,
      query: {
        [Query.SEARCH_TAB]: SearchTab.PUBLIC_MUSICBILL,
      },
    });
  }, [navigate]);

  return (
    <Drawer open={open} onOpenChange={(v) => !v && setOpen(false)}>
      <DrawerContent
        side="right"
        showClose={false}
        accessibleTitle={t('public_musicbill_collection')}
        style={{ width: 'min(80%, 360px)' }}
        zIndex={zIndex}
      >
        <Shell>
          <Header>
            <DrawerTitle>{t('public_musicbill_collection')}</DrawerTitle>
          </Header>
          <Body>
            <CollectionList
              insideDrawer
              onNavigateToDiscovery={navigateToDiscovery}
            />
          </Body>
        </Shell>
      </DrawerContent>
    </Drawer>
  );
}

export default PublicMusicbillCollectionDrawer;
