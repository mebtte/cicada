import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components';
import { t } from '@/i18n';
import ManageContent from './manage_content';

function ManageDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent side="right" style={{ width: 'min(340px, 85%)' }}>
        <DrawerHeader>
          <DrawerTitle>{t('manage_origins')}</DrawerTitle>
        </DrawerHeader>
        <ManageContent onEmpty={onClose} />
      </DrawerContent>
    </Drawer>
  );
}

export default ManageDrawer;
