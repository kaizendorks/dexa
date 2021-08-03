#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const { getStackByname } = require('../src/stack-manager');
const Project = require('../src/project');

// Load the project from the current folder (will fail if the current folder isnt a project initialized with dexa)
// TODO: better handle error by throwing specific error "CurrentFolderIsNotADexaProjectError" that is catched here and given a useful error in the console
const currentFolder = process.cwd();
const project = Project.load(currentFolder);

// Load the stack
// TODO: if the stack or its version isnt downloaded locally, we will need to download it before proceeding
//       this means we might have to do these initialization steps in an async function called from the entrypoint of this file
const stack = getStackByname(project.stackReference.name);

// Configure one command for each of the "add" templates
stack.getAddTemplates().forEach(template => {

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
program
  .showHelpAfterError(chalk.grey('(run "dx add --help" for a list of the available templates and additional usage information)'))
  .parseAsync(process.argv)
  .catch((e) => {
    console.log(chalk.red('Something went wrong!'));
    console.error(e);
    process.exit(-1);
  });

