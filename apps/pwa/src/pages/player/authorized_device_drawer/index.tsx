import { useEffect, useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components';
import { t } from '@/i18n';
import playerEventemitter, { EventType } from '../eventemitter';
import useDynamicZIndex from '../use_dynamic_z_index';
import Content from './content';

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
        showClose={false}
        style={{
          width: 'min(420px, calc(100dvw - 20px))',
          maxWidth: 'calc(100dvw - 20px)',
        }}
        zIndex={zIndex}
      >
        <DrawerHeader>
          <DrawerTitle>{t('authorized_devices')}</DrawerTitle>
        </DrawerHeader>
        <Content />
      </DrawerContent>
    </Drawer>
  );
}

export default AuthorizedDeviceDrawer;
