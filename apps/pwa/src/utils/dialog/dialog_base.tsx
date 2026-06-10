import { ReactNode, useCallback, useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components';
import { DialogOptions } from './constants';
import e, { EventType } from './eventemitter';
import { t } from '@/i18n';

function getAccessibleTitle(options: DialogOptions) {
  const title = 'title' in options ? (options.title as ReactNode) : null;
  return title || t('dialog');
}

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
  const [hasOpened, setHasOpened] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setOpen(true);
  }, []);

  useEffect(() => {
    if (open) {
      setHasOpened(true);
    }
  }, [open]);

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
      <DialogContent
        showClose={false}
        aria-describedby={undefined}
        accessibleTitle={getAccessibleTitle(options)}
        forceMount={hasOpened ? true : undefined}
        // 避免 Radix 在弹窗打开时自动聚焦首个按钮并触发 focus-visible 描边。
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        {children({ onClose })}
      </DialogContent>
    </Dialog>
  );
}

export default DialogBase;
