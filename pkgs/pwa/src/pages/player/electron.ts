import React, { useEffect } from 'react';
import { useSelector, shallowEqual } from 'react-redux';

import { State as GlobalShortcutState } from '../../store/global_shortcut/constants';
import { GLOBAL_SHORTCUT } from '../../constants/global_shortcut';
import eventemitter, { EventType } from './eventemitter';
import electron from '../../platform/electron';

const SHORTCUT_MAP_ACTION = {
  [GLOBAL_SHORTCUT.TOGGLE_VISIBLE]: () => {
    const window = electron.remote.getCurrentWindow();
    if (window.isFocused()) {
      return window.minimize();
    }
    return window.show();
  },
  [GLOBAL_SHORTCUT.TOGGLE_PLAY]: () =>
    eventemitter.emit(EventType.ACTION_TOGGLE_PLAY),
  [GLOBAL_SHORTCUT.PREVIOUS]: () =>
    eventemitter.emit(EventType.ACTION_PREVIOUS),
  [GLOBAL_SHORTCUT.NEXT]: () => eventemitter.emit(EventType.ACTION_NEXT),
};

const Electron = () => {
  const globalShortcut = useSelector(
    ({ globalShortcut: gs }: { globalShortcut: GlobalShortcutState }) => gs,
    shallowEqual,
  );

  useEffect(() => {
    if (globalShortcut.on) {
      Object.values(GLOBAL_SHORTCUT).forEach((shortcut) => {
        if (globalShortcut[shortcut].length) {
          electron.remote.globalShortcut.register(
            globalShortcut[shortcut].join('+'),
            SHORTCUT_MAP_ACTION[shortcut],
          );
        }
      });
    } else {
      electron.remote.globalShortcut.unregisterAll();
    }
    return () => electron.remote.globalShortcut.unregisterAll();
  }, [globalShortcut]);

  useEffect(() => {
    const beforeUnloadListener = () =>
      electron.remote.globalShortcut.unregisterAll();
    window.addEventListener('beforeunload', beforeUnloadListener);
    return () =>
      window.removeEventListener('beforeunload', beforeUnloadListener);
  }, []);

  return null;
};

export default React.memo(Electron);
