import './polyfill';
// eslint-disable-next-line import/no-extraneous-dependencies
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import 'cropperjs/dist/cropper.min.css';
import * as Sentry from '@sentry/browser';
import { Integrations } from '@sentry/tracing';

import { getToken } from './platform/token';
import env from './env';
import store from './store';
import { reloadUser } from './store/user';
import logger from './platform/logger';
import App from './app';

async function initialize() {
  if (env.SENTRY_DSN) {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      integrations: [new Integrations.BrowserTracing()],
      tracesSampleRate: 1.0,
      enabled: process.env.NODE_ENV === 'production',
    });
    Sentry.configureScope((scope) => {
      scope.setExtra('version', env.VERSION);
    });
  }

  if (getToken()) {
    // @ts-expect-error
    window.requestIdleCallback(() => store.dispatch(reloadUser()));
  }
}

initialize()
  .then(() => {
    const root = createRoot(document.querySelector('#root')!);
    return root.render(
      <HashRouter>
        <Provider store={store}>
          <App />
        </Provider>
      </HashRouter>,
    );
  })
  .catch((error: Error) => {
    logger.error(error, { description: '初始化失败', report: true });
    const root = document.querySelector('#root')!;
    root.textContent = error.message;
  });
