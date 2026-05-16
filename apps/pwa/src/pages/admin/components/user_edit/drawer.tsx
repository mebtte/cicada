import { Drawer, DrawerContent } from '@/components';
import useTitlebarOverlayInsets from '@/utils/use_titlebar_overlay_insets';
import UserEditContent from './content';
import type { User } from './types';

function UserEditDrawer({
  open,
  user,
  onClose,
  onSaved,
  onDeleted,
}: {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: (id: string) => void;
}) {
  const { top: titlebarTop } = useTitlebarOverlayInsets();

  return (
    <Drawer open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DrawerContent
        side="right"
        style={{ width: 390, paddingTop: titlebarTop }}
        showClose={false}
        accessibleTitle={user?.username}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        {user ? (
          <UserEditContent
            user={user}
            onClose={onClose}
            onSaved={onSaved}
            onDeleted={onDeleted}
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

export default UserEditDrawer;
