import './polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import 'cropperjs/dist/cropper.min.css';
import * as Sentry from '@sentry/browser';
import { Integrations } from '@sentry/tracing';

import { getToken } from './platform/token';
import config from './config';
import store from './store';
import { reloadUser } from './store/user';
import logger from './platform/logger';
import App from './app';
import ErrorCard from './components/error_card';

async function initialize() {
  if (config.sentryDSN) {
    Sentry.init({
      dsn: config.sentryDSN,
      integrations: [new Integrations.BrowserTracing()],
      tracesSampleRate: 1.0,
      enabled: process.env.NODE_ENV === 'production',
    });
    Sentry.configureScope((scope) => {
      scope.setExtra('version', config.version);
    });
  }

  if (getToken()) {
    // @ts-expect-error
    window.requestIdleCallback(() => store.dispatch(reloadUser()));
  }
}

initialize()
  .then(
    () =>
      void ReactDOM.render(
        <HashRouter>
          <Provider store={store}>
            <App />
          </Provider>
        </HashRouter>,
        document.querySelector('#root'),
      ),
  )
  .catch((error) => {
    logger.error(error, { description: '初始化失败', report: true });
    return void ReactDOM.render(
      <ErrorCard
        errorMessage="初始化失败"
        retry={() => window.location.reload()}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          left: 0,
          top: 0,
        }}
      />,
      document.querySelector('#root'),
    );
  });
