// import execa from 'execa';
import path from 'path';
import { fileURLToPath } from 'url';
// import config from '../../config/dexa.config.js';
import { __reloadStacks, addNewStack, getStacks, deleteStackByName } from '../../src/stack-manager.js';

const stackFixturesFolder = path.resolve(fileURLToPath(import.meta.url), '../');

const testStacks = [
  // A stack with init/add/generate templates, but no dexa.js file with custom properties
  {
    name: 'templates-only-stack',
    location: path.resolve(stackFixturesFolder, './templates-only-stack'),
  },

  // A stack with no init/add/generate templates
  // the entire stack folder becomes the init template and there are no add/generate commands
  {
    name: 'init-only-stack',
    location: path.resolve(stackFixturesFolder, './init-only-stack'),
  },

  // A stack that in addition to init/add/generate templates, has a dexa.js file with custom properties
  {
    name: 'custom-properties-stack',
    location: path.resolve(stackFixturesFolder, './custom-properties-stack'),
  }
];

const templatesOnlyStack = testStacks[0];
const initOnlyStack = testStacks[1];
const customPropertiesStack = testStacks[2];

// Helper method that can be used to add all the test stacks
// Note we use the stack-manager rather than issue "dx stack" commands through execa, since this is much faster
async function installTestStacks(){
  await __reloadStacks();

  // use for loop, as we need to install them in sequence rather than in parallel
  for (const stack of testStacks){
    await addNewStack(stack.name, stack.location);
  }
}

// Helper method that can be used to remove all those stacks
// Note we use the stack-manager rather than issue "dx stack" commands through execa, since this is much faster
async function uninstallTestStacks(){
  await __reloadStacks();

  // use for loop, as we need to uninstall them in sequence rather than in parallel
  const stacksToUninstall = getStacks().filter(stack => testStacks.find(s => s.name === stack.name));
  for (const stack of stacksToUninstall){
    await deleteStackByName(stack.name);
  }
}

export {
  templatesOnlyStack,
  initOnlyStack,
  customPropertiesStack,
  installTestStacks,
  uninstallTestStacks
}