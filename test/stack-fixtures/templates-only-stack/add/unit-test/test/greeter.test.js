import { greet } from '../src/greeter.js';
import assert from 'assert';

assert.strictEqual(greet('World'), 'Hello World!');