module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true
  },
  extends: [
    'airbnb-base'
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
     "comma-dangle": ["error", "never"],
     "no-console": 0
  }
};
