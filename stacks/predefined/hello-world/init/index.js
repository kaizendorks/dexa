import { greet } from './src/greeter.js';
import { greetEveryone } from './src/greeters/index.js';

// default "greeting"
console.log(greet('World'));

// additional greetings created with "dx generate greeting" inside the ./greeters folder
greetEveryone()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
