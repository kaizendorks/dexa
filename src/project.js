const path = require('path');
const fs = require('fs');
const config = require('../config/dexa.config');
const chalk = require('chalk');

const defaultValues = () => ({
  name: '',
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

  async save(locationPath){
    const projectRcFile = path.resolve(locationPath, config.project.rcfile);
    // save project data to the dexarc file
    await fs.promises.writeFile(projectRcFile, JSON.stringify(this, null, 2), {
      encoding: 'utf8',
      flag: 'w' // see https://nodejs.org/api/fs.html#fs_file_system_flags
    });
  }

  toJSON(){
    return {
      name: this.name,
      stackReference: this.stackReference,
      features: this.features,
    };
  }
}

Project.load = (locationPath) => {
  // Load project from the dexarc file
  // TODO: should we navigate up the folder structure until we find a dexarc file? This way can invoke dx add/generate commands from subfolders of the project
  const projectRcFile = path.resolve(locationPath, config.project.rcfile);
  const locationHasProjectFile = fs.existsSync(projectRcFile);
  if (!locationHasProjectFile) throw new Error(`The directory ${locationPath} does not contain a dexa project file`);

  const projectData = JSON.parse(fs.readFileSync(projectRcFile, 'utf8'));
  return new Project(projectData);
};

Project.init = async ({name, stack, destinationPath, userOptions}) => {
  const project= new Project({
    name,
    stackReference: {
      name: stack.name,
      origin: stack.origin,
      // version: stack.version,
    },
    features: []
  });
  console.log(chalk.grey(`Creating new project in "${destinationPath}" using stack "${stack.name}" from ${stack.locationPath}`));

  // render init template
  await stack.renderInitTemplate({
    destinationPath,
    project,
    userOptions
  });
  // generate dexarc file at project root
  await project.save(destinationPath);

  return project;
};

module.exports = Project;