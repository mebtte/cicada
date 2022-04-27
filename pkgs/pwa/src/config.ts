import { SERVER_ORIGIN } from './constants/storage_key';

const config = {
  ...__CONFIG__,
  serverOrigin: localStorage.getItem(SERVER_ORIGIN) || '',
  buildTime: new Date(__CONFIG__.buildTime),
};

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line no-console
  console.log(config);
}

export default config;
