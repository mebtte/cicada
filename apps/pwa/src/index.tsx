import './polyfill';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import 'cropperjs/dist/cropper.min.css';
import logger from '#/utils/logger';
import App from './app';

// eslint-disable-next-line no-empty-function
async function initialize() {}

initialize()
  .then(() => {
    const root = createRoot(document.querySelector('#root')!);
    return root.render(
      <HashRouter>
        <App />
      </HashRouter>,
    );
  })
  .catch((error: Error) => {
    logger.error(error, '初始化失败');
    const root = document.querySelector('#root')!;
    root.textContent = error.message;
  });

if ('serviceWorker' in navigator) {
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
}
