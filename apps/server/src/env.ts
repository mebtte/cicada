declare global {
  // eslint-disable-next-line no-underscore-dangle
  const __VERSION__: string;
}

export default {
  RUN_ENV: process.env.RUN_ENV as undefined | 'development',
  VERSION: process.env.NODE_ENV === 'production' ? __VERSION__ : undefined,
};
