import React, { useState, useCallback } from 'react';
import { useSelector, shallowEqual } from 'react-redux';

import Drawer, { Title } from '@/components/drawer';
import { State as GlobalShortcutState } from '@/store/global_shortcut/constants';
import {
  GLOBAL_SHORTCUT,
  GLOBAL_SHORTCUT_MAP_LABEL,
} from '@/constants/global_shortcut';
import Shortcut from './shortcut';
import ShortcutDialog from './shortcut_dialog';

const bodyProps = {
  style: {
    width: 350,
  },
};

const ShortcutDrawer = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const globalShortcut = useSelector(
    ({ globalShortcut: gs }: { globalShortcut: GlobalShortcutState }) => gs,
    shallowEqual,
  );
  const [editingShortcut, setEditingShortcut] = useState('');
  const [shortcutDialogOpen, setShortcutDialogOpen] = useState(false);
  const editShortcut = useCallback((shortcut) => {
    setEditingShortcut(shortcut);
    setShortcutDialogOpen(true);
  }, []);
  const closeShortcutDialog = useCallback(
    () => setShortcutDialogOpen(false),
    [],
  );

  return (
    <>
      <Drawer open={open} onClose={onClose} bodyProps={bodyProps}>
        <Title>全局快捷键</Title>
        <div>
          {Object.values(GLOBAL_SHORTCUT).map((shortcut) => (
            <Shortcut
              key={shortcut}
              label={GLOBAL_SHORTCUT_MAP_LABEL[shortcut]}
              keys={globalShortcut[shortcut]}
              onEdit={() => editShortcut(shortcut)}
            />
          ))}
        </div>
      </Drawer>
      {editingShortcut ? (
        <ShortcutDialog
          globalShortcut={globalShortcut}
          open={shortcutDialogOpen}
          onClose={closeShortcutDialog}
          shortcut={editingShortcut}
        />
      ) : null}
    </>
  );
};

export default React.memo(ShortcutDrawer);
