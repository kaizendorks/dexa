import path from 'path';
import fs from 'fs-extra';
import config from '../config/dexa.config.js';
import { CurrentFolderIsNotADexaProjectError } from './errors.js';

const defaultValues = () => ({
  name: '',
  locationPath: '',
  stackReference: {},
  features: [] // these are added to a project with the "dx add" commands
});

class Project {
  constructor(projectJSONData){
    Object.assign(this, defaultValues(), projectJSONData);

    // Define properties not to be iterated nor included in toJSON
    Object.defineProperty(this, 'originalJSON', {
      enumerable: false,
      get: () => projectJSONData
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
      stackReference: this.stackReference,
      features: this.features,
    };
  }

  async save(){
    // save project data to the dexarc file
    const projectRcFile = path.resolve(this.locationPath, config.project.rcfile);
    await fs.writeJSON(projectRcFile, this, {
      spaces: 2,
      encoding: 'utf8',
      flag: 'w' // see https://nodejs.org/api/fs.html#fs_file_system_flags
    });
  }

  async addFeature(template, userOptions){
    await template.apply({
      destinationPath: this.locationPath,
      project: this,
      userOptions,
    });

    this.features.push(template.name);
    this.features = [...new Set(this.features)];
    await this.save();
  }
}

Project.load = (locationPath) => {
  // Load project from the dexarc file
  // TODO: should we navigate up the folder structure until we find a dexarc file?
  //       This way can invoke dx add/generate commands from subfolders of the project
  const projectRcFile = path.resolve(locationPath, config.project.rcfile);
  const locationHasProjectFile = fs.existsSync(projectRcFile);
  if (!locationHasProjectFile) throw new CurrentFolderIsNotADexaProjectError(locationPath);

  const projectData = fs.readJSONSync(projectRcFile, {encoding: 'utf8' });
  return new Project({
    locationPath,
    ...projectData
  });
};

Project.init = async ({name, stack, destinationPath, userOptions}) => {
  const project= new Project({
    locationPath: destinationPath,
    name,
    stackReference: {
      name: stack.name,
      origin: stack.origin,
      private: stack.private,
      // version: stack.version,
    },
    features: []
  });

  // render init template
  await stack.applyInitTemplate({
    destinationPath,
    project,
    userOptions
  });
  // generate dexarc file at project root
  await project.save();

  return project;
};

export default Project;