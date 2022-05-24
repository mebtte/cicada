import { SnackbarProvider, OptionsObject, useSnackbar } from 'notistack';
import Eventemitter from '#/utils/eventemitter';
import { createRoot } from 'react-dom/client';
import { useEffect } from 'react';

const DEFAULT_AUTO_HIDE_DURATION = 3000;
enum EventType {
  NOTICE = 'notice',
}
type EventTypeMapData = {
  [EventType.NOTICE]: { message: string; options?: OptionsObject };
};
const eventemitter = new Eventemitter<EventType, EventTypeMapData>();

const node = document.createElement('div');
node.className = 'notice';
document.body.appendChild(node);

function NoticeApp() {
  const { enqueueSnackbar } = useSnackbar();
  useEffect(() => {
    const onNotice = (data: EventTypeMapData[EventType.NOTICE]) =>
      enqueueSnackbar(data.message, data.options);
    eventemitter.on(EventType.NOTICE, onNotice);
    return () => eventemitter.on(EventType.NOTICE, onNotice);
  }, [enqueueSnackbar]);
  return null;
}

const root = createRoot(node);
root.render(
  <SnackbarProvider>
    <NoticeApp />
  </SnackbarProvider>,
);

export default {
  default(message: string, options?: OptionsObject) {
    eventemitter.emit(EventType.NOTICE, {
      message,
      options: {
        variant: 'default',
        autoHideDuration: DEFAULT_AUTO_HIDE_DURATION,
        ...options,
      },
    });
  },
  error(message: string, options?: OptionsObject) {
    eventemitter.emit(EventType.NOTICE, {
      message,
      options: {
        variant: 'error',
        autoHideDuration: DEFAULT_AUTO_HIDE_DURATION + 2000,
        ...options,
      },
    });
  },
};
