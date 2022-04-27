import React, { useState } from 'react';

import { DIALOG_TYPE } from '@/platform/dialog';
import Dialog, { Title, Content, Action } from '@/components/dialog';
import Button from '@/components/button';
import { Dialog as DialogType } from './type';

const ACTION_SIZE = 32;

const DialogWrapper = ({
  dialog,
  onClose,
}: {
  dialog: DialogType;
  onClose: (id: string) => void;
}) => {
  const [confirming, setConfirming] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const {
    id,
    type,
    open,
    title,
    content,
    confirmText,
    onConfirm,
    cancelText,
    onCancel,
  } = dialog;
  const onComfirmWrapper = async () => {
    let doNotClose: boolean | void = false;
    setConfirming(true);
    if (onConfirm) {
      doNotClose = await onConfirm();
    }
    setConfirming(false);
    if (!doNotClose) {
      onClose(id);
    }
  };
  const onCancelWrapper = async () => {
    let doNotClose: boolean | void = false;
    setCanceling(true);
    if (onCancel) {
      doNotClose = await onCancel();
    }
    setCanceling(false);
    if (!doNotClose) {
      onClose(id);
    }
  };
  return (
    <Dialog open={open}>
      {title ? <Title>{title}</Title> : null}
      {content ? <Content>{content}</Content> : null}
      <Action>
        {type === DIALOG_TYPE.CONFIRM && (
          <Button
            label={cancelText}
            onClick={onCancelWrapper}
            loading={canceling}
            disabled={confirming || canceling}
            size={ACTION_SIZE}
          />
        )}
        <Button
          label={confirmText}
          onClick={onComfirmWrapper}
          loading={confirming}
          disabled={confirming || canceling}
          size={ACTION_SIZE}
        />
      </Action>
    </Dialog>
  );
};

export default DialogWrapper;
