import path from 'path';
import fs from 'fs-extra';
import degit from 'degit';
import config from '../config/dexa.config.js';
import Template from './template.js';

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

  getInitTemplate() {
    // do we have a './init' folder or not? If not, the entire "stack folder" is the init template
    const initPath = fs.existsSync(path.resolve(this.locationPath, './init')) ?
      './init' :
      './';

    // TODO: should templates be loaded as part of the constructor?
    // TODO: combine with settings in optional dexa.js file at the root of the stack folder

    return new Template({
      name: 'init',
      path: path.resolve(this.locationPath, initPath),
      stack: this,
      preAction: null,
      postAction: null,
    });
  }

  getAddTemplates() {
    let templates = [];

    // Each "dx add" template of the stack should be located inside the "./add" folder of the stack
    const templatesLocation = path.resolve(this.locationPath, './add');
    if (!fs.existsSync(templatesLocation)) return templates;

    // Each template has its own subfolder where the template files are defined
    templates = fs.readdirSync(templatesLocation)
      .map(f => path.resolve(this.locationPath, './add', f)) // convert to full paths
      .filter(f => fs.statSync(f).isDirectory()) // ensure they are directories
      .map(f => new Template({
        name: path.basename(f), // use folder name as the template name
        path: f,
        stack: this,
      }));

    // TODO: combine with settings in optional dexa.js file at the root of the stack folder
    // TODO: override with settings in either .dexarc or .dexarc.js files in project root (where project model is passed as an optional parameter)

    return templates;
  }

  getGenerateTemplates() {
    let templates = [];

    // Each "dx generate" template of the stack should be located inside the "./generate" folder of the stack
    const templatesLocation = path.resolve(this.locationPath, './generate');
    if (!fs.existsSync(templatesLocation)) return templates;

    // Each template has its own subfolder where the template files are defined
    templates = fs.readdirSync(templatesLocation)
      .map(f => path.resolve(this.locationPath, './generate', f))
      .filter(f => fs.statSync(f).isDirectory())
      .map(f => new Template({
        name: path.basename(f), // use folder name as the template name
        path: f,
        stack: this,
      }));

    // TODO: combine with settings in optional dexa.js file at the root of the stack folder
    // TODO: override with settings in either .dexarc or .dexarc.js files in project root (where project model is passed as an optional parameter)

    return templates;
  }

  async renderInitTemplate({ destinationPath, project, userOptions }){
    const template = this.getInitTemplate();
    return await template.render({
      destinationPath,
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
    name: 'hello-world',
    predefined: true,
    origin: path.resolve(config.stacks.predefinedStacksLocation, 'hello-world'),
    locationPath: path.resolve(config.stacks.predefinedStacksLocation, 'hello-world'),
  })
];

Stack.loadAll = () => {
  // load user-defined stacks from the file DB
  let userDefinedStacks = fs.existsSync(config.stacks.databaseJSONFile) ?
    fs.readJSONSync(config.stacks.databaseJSONFile, { encoding: 'utf8' }) :
    [];

  // Convert them to stack objects and merge them with the predefined stacks
  return predefinedStacks.concat(
    userDefinedStacks.map(stackJSON => new Stack(stackJSON)));
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

  return new Stack({
    name,
    origin,
    locationPath,
    private: isPrivate,
    // version:
  });
};

Stack.newFromLocalFolder = async (name, origin) => {
  return new Stack({
    name,
    origin,
    locationPath: origin,
  });
};

export default Stack;