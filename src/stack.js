const path = require('path');
const fs = require('fs');
const degit = require('degit');
const config = require('../config/dexa.config');
const Template = require('./template');

const defaultValues = () => ({
  name: '',
  predefined: false,
  origin: '',
  locationPath: '',
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
      // version: this.version,
    };
  }

  _getInitTemplate() {
    // do we have a './init' folder or not? If not, the entire "stack folder" is the init template
    const initPath = fs.existsSync(path.resolve(this.locationPath, './init')) ?
      './init' :
      './';

    // TODO: should templates be loaded as part of the constructor?
    // TODO: combine with settings in optional dexa.js file at the root of the stack folder

    return new Template({
      path: path.resolve(this.locationPath, initPath),
      stack: this,
      preAction: null,
      postAction: null,
    });
  }

  _getAddTemplates() {
    const templates = [];

    // TODO: find all subfolders of the `./add' folder inside the stack
    // TODO: combine with settings in optional dexa.js file at the root of the stack folder
    // TODO: override with settings in either .dexarc or .dexarc.js files in project root (where project model is passed as an optional parameter)

    return templates;
  }

  _getGenerateTemplates() {
    const templates = [];

    // TODO: find all subfolders of the `./add' folder inside the stack
    // TODO: combine with settings in optional dexa.js file at the root of the stack folder
    // TODO: override with settings in either .dexarc or .dexarc.js files in project root (where project model is passed as an optional parameter)

    return templates;
  }

  async renderInitTemplate({ destinationPath, project, userOptions }){
    const template = this._getInitTemplate();
    return await template.render({
      destinationPath,
      project,
      userOptions
    });
  }

  async cleanup(){
    await fs.promises.rm(this.locationPath, {recursive: true, force: true});
  }

}

const predefinedStacks = [
  new Stack({
    name: 'hello-world',
    predefined: true,
    origin: path.resolve(config.stacks.predefinedStacksLocation, 'hello-world'),
    locationPath: path.resolve(config.stacks.predefinedStacksLocation, 'hello-world'),
    init: './init',
  })
];

Stack.loadAll = () => {
  // load user-defined stacks from the file DB
  const dbFileExists = fs.existsSync(config.stacks.databaseJSONFile);
  const userDefinedStacks = dbFileExists ? require(config.stacks.databaseJSONFile) : [];

  // Convert them to stack objects and merge them with the predefined stacks
  return predefinedStacks.concat(
    userDefinedStacks.map(stackJSON => new Stack(stackJSON)));
};

Stack.saveAll = async (stackModels) => {
  // get user-defined stacks (no need to write the predefined ones)
  const userDefinedStacks = stackModels.filter(s => !s.predefined);
  // save them to the file DB
  await fs.promises.writeFile(config.stacks.databaseJSONFile, JSON.stringify(userDefinedStacks, null, 2), {
    encoding: 'utf8',
    flag: 'w' // see https://nodejs.org/api/fs.html#fs_file_system_flags
  });
};

Stack.newFromGit = async (name, gitRepoUrl, isPrivate = false) => {
  const gitRepo = degit(gitRepoUrl, {
    mode: isPrivate ? 'git' : 'tar',
    force: true
  });

  const locationPath = path.resolve(config.stacks.userDefinedStacksLocation, name);
  await gitRepo.clone(locationPath);

  return new Stack({
    name,
    origin: gitRepoUrl,
    locationPath,
    // version:
  });
};

module.exports = Stack;