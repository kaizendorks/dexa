import fs from 'fs';
import path from 'path';
import url from 'url';

const greetersRoot =  path.resolve(url.fileURLToPath(import.meta.url), '../');

// additional greetings created with "dx generate greeting" inside the ./greeters folder
// they are created inside a subfolder and end with .greeter.js, for example: /src/greeters/foo/foo.greeter.js
const findGreeters = () => {
  let greeters = [];

  const greeterFolders = fs.readdirSync(greetersRoot);
  greeterFolders.forEach(folder => {
    if (!fs.lstatSync(path.resolve(greetersRoot, folder)).isDirectory()) return;

    const files = fs.readdirSync(path.resolve(greetersRoot, folder));
    const greeterFiles = files
      .filter(file => file.endsWith('.greeter.js'))
      .map(file => path.resolve(greetersRoot, folder, file));

    greeters = greeters.concat(greeterFiles);
  });

  return greeters;
};

const greetEveryone = async () => {
  await Promise.all(findGreeters().map(async g => {
    // each of the generated greeter files has a function exported as the named export "greet"
    const { greet } = await import(url.pathToFileURL(g)); // NOTE: dynamic imports using absolute paths require a "file://" in windows! see https://github.com/nodejs/node/issues/31710
    console.log(greet('World'));
  }));
};

export { greetEveryone }