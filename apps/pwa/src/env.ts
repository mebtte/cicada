/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle,no-undef */
declare global {
  const __ENV__: {
    SERVER_ADDRESS: string;

    VERSION: string;

    BUILD_TIME: string;
    EMPTY_IMAGE_LIST: string[];
    ERROR_IMAGE_LIST: string[];
    COVER_LIST: string[];
    SENTRY_DSN?: string;
  };
}

const env = {
  ...__ENV__,
  BUILD_TIME: new Date(__ENV__.BUILD_TIME),
};

if (process.env.NODE_ENV !== 'production') {
  console.log(env);
}

export default env;
