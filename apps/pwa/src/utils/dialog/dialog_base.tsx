import {
  CSSProperties,
  HtmlHTMLAttributes,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { DialogOptions } from './constants';
import Dialog from '../../components/dialog';
import { UtilZIndex } from '../../constants/style';
import e, { EventType } from './eventemitter';

const maskProps: { style: CSSProperties } = {
  style: { zIndex: UtilZIndex.DIALOG },
};

function DialogBase({
  options,
  onDestroy,
  children,
  bodyProps,
}: {
  options: DialogOptions;
  onDestroy: (id: string) => void;
  children: ({ onClose }: { onClose: () => void }) => ReactNode;
  bodyProps?: HtmlHTMLAttributes<HTMLDivElement>;
}) {
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setOpen(true);
  }, []);

  useEffect(() => {
    const unlistenClose = e.listen(EventType.CLOSE, ({ id }) => {
      if (options.id === id) {
        setOpen(false);
      }
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
    <Dialog open={open} maskProps={maskProps} bodyProps={bodyProps}>
      {children({ onClose })}
    </Dialog>
  );
}

export default DialogBase;
