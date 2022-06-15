const { env } = process;

const PORT = env.PORT ? Number(env.PORT) : undefined;
const EMAIL_PORT = env.EMAIL_PORT ? Number(env.EMAIL_PORT) : undefined;
const CLUSTER_COUNT = env.CLUSTER_COUNT ? Number(env.CLUSTER_COUNT) : undefined;

export default {
  RUN_ENV: env.RUN_ENV as undefined | 'development',

  INITIAL_SUPER_USER_EMAIL: env.INITIAL_SUPER_USER_EMAIL as undefined | string,

  PORT,
  PUBLIC_ADDRESS: env.PUBLIC_ADDRESS as undefined | string,
  EMAIL_HOST: env.EMAIL_HOST as undefined | string,
  EMAIL_PORT,
  EMAIL_USER: env.EMAIL_USER as undefined | string,
  EMAIL_PASS: env.EMAIL_PASS as undefined | string,
  CLUSTER_COUNT,
};
