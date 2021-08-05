import fs from 'fs';
import { URL } from 'url';

const packageJSON = JSON.parse(
  fs.readFileSync(new URL('../package.json', import.meta.url).pathname));

export default {
  version: packageJSON.version,
  project: {
    rcfile: '.dexarc',
    cusomizationsFolder: '.dexa'
  },
  stacks: {
    predefinedStacksLocation: new URL('../stacks/predefined', import.meta.url).pathname,
    userDefinedStacksLocation: new URL('../stacks/user-defined', import.meta.url).pathname,
    databaseJSONFile: new URL('./stacks.json', import.meta.url).pathname,
  },

};
