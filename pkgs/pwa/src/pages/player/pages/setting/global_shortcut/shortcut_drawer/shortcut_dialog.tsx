import React, { useCallback, useState, useEffect } from 'react';
import styled from 'styled-components';
import keyboard from 'keyboardjs';

import toast from '@/platform/toast';
import {
  GLOBAL_SHORTCUT,
  GLOBAL_SHORTCUT_MAP_LABEL,
  MUST_HAS_KEYS,
  KEYBOARDJS_MAP_ELECTRON_KEY,
} from '@/constants/global_shortcut';
import store from '@/store';
import {
  registerAll,
  unregisterAll,
  setShortcutKeys,
} from '@/store/global_shortcut';
import { State as GlobalShortcutState } from '@/store/global_shortcut/constants';
import electron from '@/platform/electron';
import Dialog, { Title, Content, Action } from '@/components/dialog';
import Button, { Type } from '@/components/button';

const ACTION_SIZE = 32;
const StyledContent = styled(Content)`
  > .content {
    padding: 15px 0;
    background-color: rgb(0 0 0 / 0.05);
    border-radius: 4px;
    font-size: 16px;
    text-align: center;
    > .key {
      &:not(:last-child)::after {
        content: '  +  ';
      }
    }
  }
`;

const ShortcutDialog = ({
  globalShortcut,
  open,
  onClose,
  shortcut,
}: {
  globalShortcut: GlobalShortcutState;
  open: boolean;
  onClose: () => void;
  shortcut: string;
}) => {
  const [currentKeys, setCurrentKeys] = useState([]);
  const onRemove = useCallback(() => {
    // @ts-ignore
    store.dispatch(setShortcutKeys(shortcut, []));
    return onClose();
  }, [shortcut, onClose]);
  const onSave = useCallback(() => {
    let hasPivotalKey = false;
    for (const k of MUST_HAS_KEYS) {
      if (currentKeys.includes(k)) {
        hasPivotalKey = true;
        break;
      }
    }
    if (!hasPivotalKey) {
      return toast.error(
        `全局快捷键至少包含 ${MUST_HAS_KEYS.join('/')} 中的一个`,
      );
    }
    if (electron.remote.globalShortcut.isRegistered(currentKeys.join('+'))) {
      return toast.error('当前快捷键已被其他程序占用');
    }
    for (const sc of Object.values(GLOBAL_SHORTCUT)) {
      if (
        sc !== shortcut &&
        globalShortcut[sc].length &&
        globalShortcut[sc].join(',') === currentKeys.join(',')
      ) {
        return toast.error(
          `当前快捷键已被"${GLOBAL_SHORTCUT_MAP_LABEL[sc]}"占用`,
        );
      }
    }
    // @ts-ignore
    store.dispatch(setShortcutKeys(shortcut, currentKeys));
    setTimeout(onClose, 0);
  }, [globalShortcut, shortcut, currentKeys, onClose]);

  useEffect(() => {
    const keydownListener = (event) => {
      event.preventDefault();
      const { pressedKeys } = event;
      const keys = Array.from(
        new Set<string>(
          pressedKeys
            .map((k) => KEYBOARDJS_MAP_ELECTRON_KEY[k] || '')
            .filter((k) => !!k),
        ),
      ).sort((a, b) => {
        const aIsSuper = MUST_HAS_KEYS.includes(a);
        const bIsSuper = MUST_HAS_KEYS.includes(b);
        if (aIsSuper && bIsSuper) {
          return MUST_HAS_KEYS.indexOf(a) - MUST_HAS_KEYS.indexOf(b);
        }
        if (aIsSuper && !bIsSuper) {
          return -1;
        }
        if (!aIsSuper && bIsSuper) {
          return 1;
        }
        if (a < b) {
          return 1;
        }
        if (a > b) {
          return -1;
        }
        return 0;
      });
      setCurrentKeys(keys);
    };

    if (open) {
      store.dispatch(unregisterAll());
      keyboard.bind('', keydownListener);
    } else {
      store.dispatch(registerAll());
      keyboard.unbind('', keydownListener);
      setCurrentKeys([]);
    }

    return () => {
      store.dispatch(registerAll());
      keyboard.unbind('', keydownListener);
    };
  }, [open]);

  return (
    <Dialog open={open}>
      <Title>
        &quot;{GLOBAL_SHORTCUT_MAP_LABEL[shortcut]}&quot;&nbsp;全局快捷键
      </Title>
      <StyledContent>
        {currentKeys.length ? (
          <div className="content">
            {currentKeys.map((key) => (
              <span className="key" key={key}>
                {key}
              </span>
            ))}
          </div>
        ) : (
          <div className="content empty">按下组合键</div>
        )}
      </StyledContent>
      <Action>
        <div className="left">
          <Button
            label="删除快捷键"
            size={ACTION_SIZE}
            onClick={onRemove}
            type={Type.DANGER}
          />
        </div>
        <Button label="取消" size={ACTION_SIZE} onClick={onClose} />
        <Button
          label="设置"
          size={ACTION_SIZE}
          type={Type.PRIMARY}
          onClick={onSave}
          disabled={!currentKeys.length}
        />
      </Action>
    </Dialog>
  );
};

export default ShortcutDialog;
