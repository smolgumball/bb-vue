// eslint-disable-next-line no-undef
module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 13,
    sourceType: 'module',
  },
  ignorePatterns: ['*.d.ts'],
  rules: {
    'no-constant-condition': 0,
  },
}
