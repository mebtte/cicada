import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components';
import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';
import playerEventemitter, { EventType } from '../eventemitter';
import useDynamicZIndex from '../use_dynamic_z_index';
import Content from './content';

// Keep status states centered in the drawer's remaining body area.
const ContentFrame = styled.div`
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

function AuthorizedDeviceDrawer() {
  const [open, setOpen] = useState(false);
  const zIndex = useDynamicZIndex(EventType.OPEN_AUTHORIZED_DEVICE_DRAWER);

  useEffect(() => {
    return playerEventemitter.listen(
      EventType.OPEN_AUTHORIZED_DEVICE_DRAWER,
      () => setOpen(true),
    );
  }, []);

  const onClose = () => setOpen(false);

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent
        side="right"
        style={{
          width: 'min(350px, calc(100dvw - 48px))',
          maxWidth: 'calc(100dvw - 48px)',
        }}
        zIndex={zIndex}
      >
        <ContentFrame>
          <Header>
            <DrawerTitle>{t('authorized_devices')}</DrawerTitle>
          </Header>
          <Content />
        </ContentFrame>
      </DrawerContent>
    </Drawer>
  );
}

export default AuthorizedDeviceDrawer;
