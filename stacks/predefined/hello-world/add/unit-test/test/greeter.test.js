const { greet } = require('../src/greeter');
const assert = require('assert');

assert.strictEqual(greet('World'), 'Hello World!');