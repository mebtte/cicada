module.exports = {
  extends: '../../.eslintrc.cjs',
  rules: {
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: true,
      },
    ],
  },
};
