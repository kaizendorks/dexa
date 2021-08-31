#!/usr/bin/env node

import program from 'commander';
import chalk from 'chalk';
import Project from '../src/project.js';
import { ensureStackFromProject } from '../src/stack-manager.js';
import { errorHandler } from '../src/errors.js';

async function main(){
  // Load the project from the current folder (will fail if the current folder isnt a project initialized with dexa)
  const currentFolder = process.cwd();
  const project = Project.load(currentFolder);

  // Either load the stack for the current project, or install it for its origin (unless the user doesnt confirm)
  const stack = await ensureStackFromProject(project);
  if (!stack) return;

  // Configure one command for each of the "generate" templates
  stack.generate.forEach(template => {

    program
      .command(template.name)
      .description(template.description)

      // Command arguments/options
      .argument('<name>', 'name of the new element being generated <required>')
      .option('-o, --override', 'allow dexa to override any existing files')

      // Help
      .showHelpAfterError(chalk.grey(`(run "dx generate ${template.name} --help" for additional usage information)`))

      // Action implementation
      .action(async (name, userOptions/*, command*/) => {
        await template.apply({
          destinationPath: currentFolder,
          project,
          userOptions: {name, ...userOptions},
        });

        console.log(chalk.green(`🚀 Done generating the new "${template.name}"!`));
      });

      // TODO: allow templates to define an optional method "defineCommand({program, currentFolder, project, stack, template})"
      //       which will allow users to add their own parameters, options and help text by calling
      //       commander methods such as program.description, program.argument, program.option, program.addHelpText, etc
      //       HOWEVER note that adding parameters changes the signature of the "action" method,
      //       we could allow only "options" but not "arguments" to be added, by replacing/restoring the addArgument and argument methods of the program object
      //       alternatively we could modify program.argument before calling defineCommand, with a new version that keeps track of added arguments (the original method restored after calling the method)
      //       or just use command._args and command.args to figure out the "names" of the arguments and their order in the function parameters
  });

  // Start processing
  program.showHelpAfterError(chalk.grey('(run "dx generate --help" for a list of the available templates and additional usage information)'));
  await program.parseAsync(process.argv);

  if (!stack.generate.length){
    console.log(chalk.yellow(`The stack ${stack.name} does not define any generate template!`));
  }
}


main()
  .then(() => process.exit(0))
  .catch((e) => {
    errorHandler(e);
    process.exit(1);
  });

