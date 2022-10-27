import { CSSProperties, useEffect, useState } from 'react';
import { Confirm, Dialog as DialogShape, DialogType } from './constants';
import Dialog, { Content, Title, Action } from '../../components/dialog';
import Button, { Variant } from '../../components/button';
import useEvent from '../use_event';
import { UtilZIndex } from '../../constants';

const maskProps: { style: CSSProperties } = {
  style: { zIndex: UtilZIndex.DIALOG },
};

function DialogItem({
  dialog,
  onDestroy,
}: {
  dialog: DialogShape;
  onDestroy: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const [canceling, setCanceling] = useState(false);
  const onCancel = useEvent(() => {
    setCanceling(true);
    return Promise.resolve(
      // @ts-expect-error
      (dialog as Confirm).onCancel ? (dialog as Confirm).onCancel() : undefined,
    )
      .then((result) => {
        if (typeof result === 'undefined' || !!result) {
          setOpen(false);
        }
      })
      .finally(() => setCanceling(false));
  });

  const [confirming, setConfirming] = useState(false);
  const onConfirm = useEvent(() => {
    setConfirming(true);
    return Promise.resolve(dialog.onConfirm ? dialog.onConfirm() : undefined)
      .then((result) => {
        if (typeof result === 'undefined' || !!result) {
          setOpen(false);
        }
      })
      .finally(() => setConfirming(false));
  });

  useEffect(() => {
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) {
      const timer = window.setTimeout(() => onDestroy(dialog.id), 5000);
      return () => window.clearTimeout(timer);
    }
  }, [dialog.id, onDestroy, open]);
  //
  return (
    <Dialog open={open} maskProps={maskProps}>
      {dialog.title ? <Title>{dialog.title}</Title> : null}
      {dialog.content ? <Content>{dialog.content}</Content> : null}
      <Action>
        {dialog.type === DialogType.CONFIRM ? (
          <Button onClick={onCancel} loading={canceling} disabled={confirming}>
            {(dialog as Confirm).cancelText || '取消'}
          </Button>
        ) : null}
        <Button
          variant={Variant.PRIMARY}
          onClick={onConfirm}
          loading={confirming}
          disabled={canceling}
        >
          {dialog.confirmText || '确定'}
        </Button>
      </Action>
    </Dialog>
  );
}

export default DialogItem;
