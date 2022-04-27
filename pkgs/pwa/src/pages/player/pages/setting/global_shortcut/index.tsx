import React, { useCallback, useState } from 'react';

import Button from '@/components/button';
import Item from '../item';
import ShortcutDrawer from './shortcut_drawer';

const GlobalShortcut = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  return (
    <>
      <Item>
        <div className="label">全局快捷键</div>
        <Button label="编辑" size={24} onClick={openDrawer} />
      </Item>
      <ShortcutDrawer open={drawerOpen} onClose={closeDrawer} />
    </>
  );
};

export default GlobalShortcut;
