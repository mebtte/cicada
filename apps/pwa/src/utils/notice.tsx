import { ThemeProvider } from '@mui/material';
import { SnackbarProvider, OptionsObject, useSnackbar } from 'notistack';
import Eventemitter from '#/utils/eventemitter';
import { createRoot } from 'react-dom/client';
import { useEffect } from 'react';
import theme from '@/style/theme';

const DEFAULT_OPTIONS: OptionsObject = {
  autoHideDuration: 6000,
  anchorOrigin: { vertical: 'top', horizontal: 'right' },
};
enum EventType {
  NOTICE = 'notice',
  CLOSE = 'close',
}
type EventTypeMapData = {
  [EventType.NOTICE]: { message: string; options?: OptionsObject };
  [EventType.CLOSE]: string;
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
  <ThemeProvider theme={theme}>
    <SnackbarProvider maxSnack={5}>
      <NoticeApp />
    </SnackbarProvider>
  </ThemeProvider>,
);

export default {
  close(key: string) {
    eventemitter.emit(EventType.CLOSE, key);
  },
  default(message: string, options?: OptionsObject) {
    eventemitter.emit(EventType.NOTICE, {
      message,
      options: {
        variant: 'default',
        ...DEFAULT_OPTIONS,
        ...options,
      },
    });
  },
  error(message: string, options?: OptionsObject) {
    eventemitter.emit(EventType.NOTICE, {
      message,
      options: {
        variant: 'error',
        ...DEFAULT_OPTIONS,
        ...options,
      },
    });
  },
  success(message: string, options?: OptionsObject) {
    eventemitter.emit(EventType.NOTICE, {
      message,
      options: {
        variant: 'success',
        ...DEFAULT_OPTIONS,
        ...options,
      },
    });
  },
  info(message: string, options?: OptionsObject) {
    eventemitter.emit(EventType.NOTICE, {
      message,
      options: {
        variant: 'info',
        ...DEFAULT_OPTIONS,
        ...options,
      },
    });
  },
};
