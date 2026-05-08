import { CSSProperties, ReactNode, useCallback, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components';
import { DialogOptions } from './constants';
import e, { EventType } from './eventemitter';
import { t } from '@/i18n';

const srOnly: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0,
};

function DialogBase({
  options,
  onDestroy,
  children,
}: {
  options: DialogOptions;
  onDestroy: (id: string) => void;
  children: ({ onClose }: { onClose: () => void }) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setOpen(true);
  }, []);

  useEffect(() => {
    const unlistenClose = e.listen(EventType.CLOSE, ({ id }) => {
      if (options.id === id) setOpen(false);
    });
    return unlistenClose;
  }, [options.id]);

  useEffect(() => {
    if (!open) {
      const timer = window.setTimeout(() => onDestroy(options.id), 1000);
      return () => window.clearTimeout(timer);
    }
  }, [options.id, onDestroy, open]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent showClose={false} aria-describedby={undefined}>
        <DialogTitle style={srOnly}>{t('dialog')}</DialogTitle>
        {children({ onClose })}
      </DialogContent>
    </Dialog>
  );
}

export default DialogBase;
