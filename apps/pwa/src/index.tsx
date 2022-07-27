import './polyfill';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import 'cropperjs/dist/cropper.min.css';
import App from './app';

createRoot(document.querySelector('#root')!).render(
  <HashRouter>
    <App />
  </HashRouter>,
);

if ('serviceWorker' in navigator) {
  // @ts-expect-error
  // eslint-disable-next-line no-undef
  if (__WITH_SW__) {
    window.requestIdleCallback(() =>
      import('workbox-window').then(({ Workbox }) => {
        const wb = new Workbox('/service_worker.js');
        wb.addEventListener('waiting', () => {
          /**
           * @todo 更新提示
           * @author mebtte<hi@mebtte.com>
           */
          const yes = window.confirm('已更新到最新版本, 是否立即刷新使用?');
          if (yes) {
            wb.addEventListener('controlling', () => window.location.reload());
            wb.messageSkipWaiting();
          }
        });

        wb.register();
      }),
    );
  } else {
    window.requestIdleCallback(() => {
      window.navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          registrations.forEach((registration) => registration.unregister()),
        );
    });
  }
}
