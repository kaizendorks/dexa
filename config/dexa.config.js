import fs from 'fs';
import path from 'path';
import { URL } from 'url';

const dexaRoot = new URL('../', import.meta.url).pathname;
const packageJSON = JSON.parse(fs.readFileSync(
  path.resolve(dexaRoot, 'package.json')));

export default {
  dexaRoot,
  version: packageJSON.version,
  project: {
    rcfile: '.dexarc',
    cusomizationsFolder: '.dexa'
  },
  stacks: {
    predefinedStacksLocation: path.resolve(dexaRoot, './stacks/predefined'),
    userDefinedStacksLocation: path.resolve(dexaRoot, './stacks/user-defined'),
    databaseJSONFile: path.resolve(dexaRoot, './config/stacks.json'),
  },

};
