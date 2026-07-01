import { Drawer, DrawerContent } from '@/components';
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
  return (
    <Drawer open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DrawerContent
        side="right"
        style={{ width: 390 }}
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
