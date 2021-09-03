import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dexaRoot = path.resolve(fileURLToPath(import.meta.url), '../../');
const packageJSON = JSON.parse(fs.readFileSync(
  path.resolve(dexaRoot, 'package.json')));

export default {
  dexaRoot,
  dexaCLI: path.resolve(dexaRoot, packageJSON.bin.dx),
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
