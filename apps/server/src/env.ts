const { env } = process;

export default {
  RUN_ENV: env.RUN_ENV as undefined | 'development',
};
