#!/usr/bin/env node

import program from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import Project from '../src/project.js';
import { getStacks } from '../src/stack-manager.js';
import { confirm } from '../src/user-prompts.js';
import { errorHandler } from '../src/errors.js';

async function main(){
  const currentFolderName = path.basename(process.cwd());

  // add one "dx init" command per stack. Given a stack named "foo" this will create a command "dx init foo"
  getStacks().forEach(stack => {
    program
      .command(stack.name)
      .description(stack.init.description)

      // Command arguments/options
      .argument('[projectName]', 'name of the new project. If omitted, the current folder is used', currentFolderName)
      .option('-p, --path <destinationPath>', 'path to the folder where the project will be initialized. If omitted, the current folder will be used', process.cwd())
      .option('-o, --override', 'allow dexa to override any existing files')

      // Help
      .showHelpAfterError(chalk.grey('(run "dx init --help" for additional usage information)'))
      .addHelpText('after', `
    Examples:
      ${chalk.grey('# generate a new project using the stack "hello-world" in the current folder')}
      $ dx init hello-world

      ${chalk.grey('# generate a new project named "my-project" using the stack "hello-world" in the current folder')}
      $ dx init hello-world my-project

      ${chalk.grey('# create a new project named "my-project" inside the /foo/bar directory')}
      $ dx init hello-world my-project -p /foo/bar
      `)

      // Action implementation
      .action(async (projectName, { path: destinationPath, override = false }/*, command*/) => {
        const generateInCurrentFolder = projectName === currentFolderName && destinationPath === process.cwd();
        const fullDestinationPath = path.resolve(destinationPath, generateInCurrentFolder ? '' : projectName);
        const destinationExists = await fs.promises.stat(fullDestinationPath).catch(() => false);

        if (generateInCurrentFolder){
          const proceed = await confirm('Generate project in current directory?');
          if (!proceed) return;
        } else if(destinationExists) {
          const proceed = await confirm(`Target directory exists (${fullDestinationPath}). Existing files will only be overridden with the "-o" option. Continue?`);
          if (!proceed) return;
        }

        console.log(`Creating new project in "${fullDestinationPath}" using stack "${stack.name}"`);

        await Project.init({
          name: projectName,
          stack,
          destinationPath: fullDestinationPath,
          userOptions: { override }
        });

        console.log(chalk.green(`???? Done generating new project "${projectName}" in "${fullDestinationPath}"!`));
      });
  });

  // Start processing
  program.showHelpAfterError(chalk.grey('(run "dx init --help" or "dx stack list" to see the available stacks and additional usage information)'));
  await program.parseAsync(process.argv);

}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    errorHandler(e);
    process.exit(1);
  });

