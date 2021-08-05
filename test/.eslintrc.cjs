module.exports = {
  rules: {
    'no-unused-expressions': 0,
    'no-invalid-this': 0,
  },
  globals: {
    // These are all mocha globals which should be allowed
    before: false,
    after: false,
    beforeEach: false,
    afterEach: false,
    describe: false,
    it: false,
  },
};
