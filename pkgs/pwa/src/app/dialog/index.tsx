import React, { useState, useEffect, useCallback } from 'react';

import { eventemitter, EVENT_TYPE, DIALOG_TYPE } from '@/platform/dialog';
import getRandomString from '@/utils/get_random_string';
import { Dialog as DialogType } from './type';
import Dialog from './dialog';

const DialogList = () => {
  const [dialogList, setDialogList] = useState<DialogType[]>([]);
  const closeDialog = useCallback((id) => {
    setTimeout(
      () => setDialogList((dl) => dl.filter((dialog) => dialog.id !== id)),
      5000,
    );
    setDialogList((dl) =>
      dl.map((dialog) => {
        if (dialog.id === id) {
          return {
            ...dialog,
            open: false,
          };
        }
        return dialog;
      }),
    );
  }, []);

  useEffect(() => {
    const dialogListener = ({
      type,
      title,
      content,
      confirmText,
      onConfirm,
      cancelText,
      onCancel,
    }: {
      type: DIALOG_TYPE;
      title?: string;
      content?: React.ReactNode;
      confirmText: string;
      onConfirm?: () => void | boolean;
      cancelText?: string;
      onCancel?: () => void | boolean;
    }) =>
      setDialogList((dl) => [
        ...dl,
        {
          id: getRandomString(),
          open: true,
          type,
          title,
          content,
          confirmText,
          onConfirm,
          cancelText,
          onCancel,
        },
      ]);
    eventemitter.on(EVENT_TYPE, dialogListener);
    return () => void eventemitter.off(EVENT_TYPE, dialogListener);
  }, []);

  return (
    <>
      {dialogList.map((dialog) => (
        <Dialog key={dialog.id} dialog={dialog} onClose={closeDialog} />
      ))}
    </>
  );
};

export default React.memo(DialogList);
