import path from 'path';
import fs from 'fs-extra';
import degit from 'degit';
import config from '../config/dexa.config.js';
import Command from './command.js';
import { pathToFileURL } from 'url';

const defaultValues = () => ({
  name: '',
  predefined: false,
  origin: '',
  locationPath: '',
  private: false,
  // version: '',
});

class Stack {

  constructor(stackJSONData){
    Object.assign(this, defaultValues(), stackJSONData);

    // Define properties not to be iterated nor included in toJSON
    Object.defineProperty(this, 'originalJSON', {
      enumerable: false,
      get: () => stackJSONData
    });

    // Define regular properties
    // Object.defineProperty(this, 'my-property', {
    //   enumerable: true,
    //   get: () => 42,
    // });
  }

  toJSON(){
    return {
      name: this.name,
      predefined: this.predefined,
      origin: this.origin,
      locationPath: this.locationPath,
      private: this.private,
      // version: this.version,
    };
  }

  async loadCommands(){
    // Load the optional dexa.js file defined alongside the stack
    const dexaCustomProperties = await this._loadDexaCustomPropertiesFile();

    // Merge with default stack properties (Note the default stack properties cant be overriden)
    Object.assign(this,
      dexaCustomProperties,
      {
        init: await this._loadInitCommand(dexaCustomProperties),
        add: await this._loadAddCommands(dexaCustomProperties),
        generate: await this._loadGenerateCommands(dexaCustomProperties)
      },
      this); // this ensures default propeties like name/predefined/locationPath cannot be overriden in .dexarc.js
  }

  async _loadDexaCustomPropertiesFile(){
    const emptyProperties = { init: {}, add: {}, generate: {} };

    // Defining a .dexa.js file is optional. If not found, return empty options
    const dexaCustomPropertiesFilePath = path.resolve(this.locationPath, './dexa.js');
    if (!fs.existsSync(dexaCustomPropertiesFilePath)) return emptyProperties;

    // If exists, import the file.
    // It is expected that dexa.js will contain a default export, being an object that defines properties
    // NOTE: dynamic imports using absolute paths require a "file://" in windows! see https://github.com/nodejs/node/issues/31710
    let dexaCustomProperties = await import(pathToFileURL(dexaCustomPropertiesFilePath));
    if (dexaCustomProperties.default) dexaCustomProperties = dexaCustomProperties.default; // Do not assume there is a default property, in case they used commonJS

    return Object.assign(emptyProperties, dexaCustomProperties);
  }

  async _loadInitCommand(dexaCustomProperties) {
    // do we have a './init' folder or not? If not, the entire "stack folder" is the init command
    const initPath = fs.existsSync(path.resolve(this.locationPath, './init')) ?
      './init' :
      './';

    // Create a Command object, merging its properties with any custom ones defined in the stack's dexa.js file
    return new Command(Object.assign({
      name: 'init',
      description: null,
      templatePath: path.resolve(this.locationPath, initPath),
      stack: this,
      preAction: null,
      postAction: null,
    }, dexaCustomProperties.init));
  }

  async _loadAddCommands(dexaCustomProperties) {
    let templates = [];

    // Each "dx add" command of the stack should be located inside the "./add" folder of the stack
    const templatesLocation = path.resolve(this.locationPath, './add');
    if (!fs.existsSync(templatesLocation)) return templates;

    // Each command has its own subfolder where its template files are defined
    templates = fs.readdirSync(templatesLocation)
      .map(f => path.resolve(this.locationPath, './add', f)) // convert to full paths
      .filter(f => fs.statSync(f).isDirectory()) // ensure they are directories
      .map(f => {
        // Create a Command object, merging its properties with any custom ones defined in the stack's dexa.js file
        const name = path.basename(f); // use folder name as the command name
        const customTemplateProperties = dexaCustomProperties.add[name];
        return new Command(Object.assign({
          name,
          templatePath: f,
          stack: this,
        }, customTemplateProperties));
      });

    return templates;
  }

  async _loadGenerateCommands(dexaCustomProperties) {
    let templates = [];

    // Each "dx generate" command of the stack should be located inside the "./generate" folder of the stack
    const templatesLocation = path.resolve(this.locationPath, './generate');
    if (!fs.existsSync(templatesLocation)) return templates;

    // Each command has its own subfolder where the template files are defined
    templates = fs.readdirSync(templatesLocation)
      .map(f => path.resolve(this.locationPath, './generate', f))
      .filter(f => fs.statSync(f).isDirectory())
      .map(f => {
        // Create a Command object, merging its properties with any custom ones defined in the stack's dexa.js file
        const name = path.basename(f); // use folder name as the command name
        const customTemplateProperties = dexaCustomProperties.generate[name];
        return new Command(Object.assign({
          name,
          templatePath: f,
          stack: this,
        }, customTemplateProperties));
      });

    return templates;
  }

  async runInitCommand({ project, userOptions }){
    return await this.init.apply({
      project,
      userOptions
    });
  }

  async cleanup(){
    // No need to cleanup stacks added from local folders
    if (this.locationPath === this.origin) return;

    // Stacks added from git are downloaded to the local locationPath, and we should remove the downloaded folder
    await fs.promises.rm(this.locationPath, {recursive: true, force: true});
  }

}

const predefinedStacks = [
  new Stack({
    name: 'dexa-stack',
    predefined: true,
    origin: path.resolve(config.stacks.predefinedStacksLocation, 'dexa-stack'),
    locationPath: path.resolve(config.stacks.predefinedStacksLocation, 'dexa-stack'),
  })
];

Stack.loadAll = async () => {
  // load user-defined stacks from the file DB
  let userDefinedStacks = fs.existsSync(config.stacks.databaseJSONFile) ?
    fs.readJSONSync(config.stacks.databaseJSONFile, { encoding: 'utf8' }) :
    [];

  // Convert them to stack objects and merge them with the predefined stacks
  const stacks = predefinedStacks.concat(
    userDefinedStacks.map(stackJSON => new Stack(stackJSON)));

  // Load the command definitions for all stacks
  await Promise.all(stacks.map(stack => stack.loadCommands()));

  return stacks;
};

Stack.saveAll = async (stackModels) => {
  // get user-defined stacks (no need to write the predefined ones)
  const userDefinedStacks = stackModels.filter(s => !s.predefined);
  // save them to the file DB
  await fs.writeJSON(config.stacks.databaseJSONFile, userDefinedStacks, {
    spaces: 2,
    encoding: 'utf8',
    flag: 'w' // see https://nodejs.org/api/fs.html#fs_file_system_flags
  });
};

Stack.newFromGit = async (name, origin, isPrivate = false) => {
  // Origin is a git repo in github/gitlab/bitbucket, download using degit
  const gitRepo = degit(origin, {
    mode: isPrivate ? 'git' : 'tar',
    force: true
  });

  const locationPath = path.resolve(config.stacks.userDefinedStacksLocation, name);
  await gitRepo.clone(locationPath);

  const stack = new Stack({
    name,
    origin,
    locationPath,
    private: isPrivate,
    // version:
  });
  await stack.loadCommands();

  return stack;
};

Stack.newFromLocalFolder = async (name, origin) => {
  const stack = new Stack({
    name,
    origin,
    locationPath: origin,
  });
  await stack.loadCommands();
  return stack;
};

export default Stack;