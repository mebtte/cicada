/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle,no-undef */
declare global {
  const __ENV__: {
    VERSION: string;

    BUILD_TIME: string;
    EMPTY_IMAGE_LIST: string[];
    ERROR_IMAGE_LIST: string[];
    COVER_LIST: string[];
  };
}

const env = {
  ...__ENV__,
  BUILD_TIME: new Date(__ENV__.BUILD_TIME),
  WITH_SW: process.env.WITH_SW,
};

export default env;
