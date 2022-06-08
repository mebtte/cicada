import './polyfill';
// eslint-disable-next-line import/no-extraneous-dependencies
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import 'cropperjs/dist/cropper.min.css';
import logger from './platform/logger';
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
    logger.error(error, { description: '初始化失败' });
    const root = document.querySelector('#root')!;
    root.textContent = error.message;
  });

if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .catch((error) => console.error(error));
  });
}
