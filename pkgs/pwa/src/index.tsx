import './polyfill';
// eslint-disable-next-line import/no-extraneous-dependencies
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import 'cropperjs/dist/cropper.min.css';
import * as Sentry from '@sentry/browser';
import { Integrations } from '@sentry/tracing';
import CssBaseline from '@mui/material/CssBaseline';

import u from '@/platform/user';
import { getToken } from './platform/token';
import env from './env';
import logger from './platform/logger';
import App from './app';
import getUser from './server/get_user';
import day from './utils/day';

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

  const token = getToken();
  if (token) {
    window.requestIdleCallback(async () => {
      const user = await getUser();
      const joinTime = new Date(user.join_time);
      u.updateUser({
        ...user,
        joinTime,
        joinTimeString: day(joinTime).format('YYYY-MM-DD HH:mm'),
        cms: !!user.cms,
      });
    });
  }
}

initialize()
  .then(() => {
    const root = createRoot(document.querySelector('#root')!);
    return root.render(
      <HashRouter>
        <CssBaseline />
        <App />
      </HashRouter>,
    );
  })
  .catch((error: Error) => {
    logger.error(error, { description: '初始化失败' });
    const root = document.querySelector('#root')!;
    root.textContent = error.message;
  });
