#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const { confirm } = require('../src/user-prompts');
const { getStackNames, getStackByname } = require('../src/stack-manager');
const Project = require('../src/project');

const currentFolderName = path.basename(process.cwd());

program
  // Command arguments/options
  .addArgument(new program.Argument('<stackName>', 'name of the stack to use <required>, as per "dx stack list"').choices(getStackNames()))
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
  .action(async (stackName, projectName, { path: destinationPath, override = false }/*, command*/) => {
    const generateInCurrentFolder = projectName === currentFolderName && destinationPath === process.cwd();
    const fullDestinationPath = path.resolve(destinationPath, generateInCurrentFolder ? '' : projectName);
    const destinationExists = await fs.promises.stat(fullDestinationPath).catch(() => false);
    console.log(`stackName: ${stackName}, project: ${projectName}, folder: ${destinationPath}`);
    console.log(fullDestinationPath);

    if (generateInCurrentFolder){
      const proceed = await confirm('Generate project in current directory?');
      if (!proceed) return;
    } else if(destinationExists) {
      const proceed = await confirm(`Target directory exists (${fullDestinationPath}). Existing files will only be overridden with the "-o" option. Continue?`);
      if (!proceed) return;
    }

    await Project.init({
      name: projectName,
      stack: getStackByname(stackName),
      destinationPath: fullDestinationPath,
      userOptions: { override }
    });
  });

// Start processing
program
  .parseAsync(process.argv)
  .catch((e) => {
    console.log(chalk.red('Something went wrong!'));
    console.error(e);
    process.exit(-1);
  });

