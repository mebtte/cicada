/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle,no-undef */
declare global {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const __DEFINE__: {
    VERSION: string;

    BUILD_TIME: string;
    EMPTY_IMAGE_LIST: string[];
    ERROR_IMAGE_LIST: string[];
  };
}

const definition = {
  ...__DEFINE__,
  BUILD_TIME: new Date(__DEFINE__.BUILD_TIME),
  WITH_SW: process.env.WITH_SW,

  DEVELOPMENT: process.env.NODE_ENV === 'development',
};

export default definition;
