module.exports = {
  env: {
    node: true,
    es2021: true
  },
  extends: "eslint:recommended",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module" // makes top-level await work with eslint v8
  },
  rules: {
  }
};
