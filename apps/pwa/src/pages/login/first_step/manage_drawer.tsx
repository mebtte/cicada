import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components';
import { t } from '@/i18n';
import useTitlebarOverlayInsets from '@/utils/use_titlebar_overlay_insets';
import ManageContent from './manage_content';

function ManageDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { top: titlebarTop } = useTitlebarOverlayInsets();

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent
        side="right"
        style={{ width: 'min(340px, 85%)', paddingTop: titlebarTop }}
      >
        <DrawerHeader>
          <DrawerTitle>{t('manage_origins')}</DrawerTitle>
        </DrawerHeader>
        <ManageContent onEmpty={onClose} />
      </DrawerContent>
    </Drawer>
  );
}

export default ManageDrawer;
