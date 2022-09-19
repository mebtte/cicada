declare global {
  // eslint-disable-next-line no-underscore-dangle
  const VERSION: string;
}

export default {
  RUN_ENV: process.env.RUN_ENV as undefined | 'development',
  VERSION: process.env.NODE_ENV === 'producation' ? VERSION : undefined,
};
