#!/usr/bin/env node

import program from 'commander';
import chalk from 'chalk';
import Project from '../src/project.js';
import { getStackByname } from '../src/stack-manager.js';
import { confirm } from '../src/user-prompts.js';
import { addStackFromGit } from '../src/stack-manager.js';
import { errorHandler } from '../src/errors.js';

async function main(){
  // Load the project from the current folder (will fail if the current folder isnt a project initialized with dexa)
  const currentFolder = process.cwd();
  const project = Project.load(currentFolder);

  // Load the stack
  // It is possible that the stack does not exist locally (if the project was created by someone else or if the stack has been deleted)
  let stack = getStackByname(project.stackReference.name);
  if (!stack){
    const shouldDownloadStack = await confirm(`The stack ${project.stackReference.name} is not installed locally. Do you want to add it?`);
    if (!shouldDownloadStack) return;

    stack = await addStackFromGit(project.stackReference.name, project.stackReference.origin, project.stackReference.private);
  }

  // Configure one command for each of the "add" templates
  const addTemplates = stack.getAddTemplates();
  addTemplates.forEach(template => {

    program
      .command(template.name)
      // Command arguments/options
      .option('-o, --override', 'allow dexa to override any existing files')

      // Help
      .showHelpAfterError(chalk.grey(`(run "dx add ${template.name} --help" for additional usage information)`))

      // Action implementation
      .action(async (userOptions/*, command*/) => {
        const destinationPath = currentFolder;

        // TODO: should we add a method to the project class like "addFeature(template, destinationPath, userOptions)" ?
        await template.render({
          destinationPath,
          project,
          // TODO: rename userOptions as simply options across the codebase
          userOptions,
        });

        project.features.push(template.name);
        project.features = [...new Set(project.features)];
        await project.save(destinationPath);
      });

      // TODO: allow templates to define an optional method "defineCommand({program, currentFolder, project, stack, template})"
      //       which will allow users to add their own parameters, options and help text by calling
      //       commander methods such as program.description, program.argument, program.option, program.addHelpText, etc
      //       HOWEVER note that adding parameters changes the signature of this method,
      //       so we would need to get the args array and separate the arguments from the options given the command definition
      //       instead only allow "options" but not "arguments" to be added, by replacing/restoring the addArgument and argument methods of the program object
      //       alternatively we could modify program.argument before calling defineCommand, with a new version that keeps track of added arguments (the original method restored after calling the method)
      //       or just use command._args and command.args to figure out the "names" of the arguments and their order in the function parameters
  });

  // Start processing
  program.showHelpAfterError(chalk.grey('(run "dx add --help" for a list of the available templates and additional usage information)'));
  await program.parseAsync(process.argv);

  if (!addTemplates.length){
    console.log(chalk.yellow(`The stack ${stack.name} does not define any add template!`));
  }
}


main()
  .then(() => process.exit(0))
  .catch((e) => {
    errorHandler(e);
    process.exit(1);
  });

