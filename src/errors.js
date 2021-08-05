const chalk = require('chalk');
const config = require('../config/dexa.config');

class DexaError extends Error {}

class CurrentFolderIsNotADexaProjectError extends DexaError {
  constructor(currentFolder) {
    super(`The folder "${currentFolder}" does not contain a dexa project or its "${config.project.rcfile}" file cannot be found.`);
    this.name = this.constructor.name;
  }
}

class StackAlreadyExistsError extends DexaError {
  constructor(stackName) {
    super(`Stack ${stackName} already exists`);
    this.name = this.constructor.name;
  }
}

class StackDoesNotExistsError extends DexaError {
  constructor(stackName) {
    super(`Stack ${stackName} does not exists`);
    this.name = this.constructor.name;
  }
}

const errorHandler = (e) => {
  if (e instanceof DexaError){
    console.error(chalk.red(e.message));
  } else {
    console.error(chalk.red('Something went wrong!'));
    console.error(e);
  }
};

module.exports = {
  DexaError,
  CurrentFolderIsNotADexaProjectError,
  StackAlreadyExistsError,
  StackDoesNotExistsError,
  errorHandler
};
