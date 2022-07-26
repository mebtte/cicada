module.exports = {
  extends: '../../.eslintrc.cjs',
  globals: {
    ServiceWorkerGlobalScope: 'readonly',
  },
  rules: {
    'import/no-extraneous-dependencies': 'off',
  },
};
