#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const { getStacks, deleteStackByName } = require('../src/stack-manager');
const { confirm } = require('../src/user-prompts');

const stacksToDelete = getStacks().filter(s => !s.predefined).map(s => s.name);

program
  // Command arguments/options
  .addArgument(new program.Argument('<name>', 'name of the stack to be removed <required>, as per "dx stack list"').choices(stacksToDelete))

  // Help
  // - use default help

  // Action implementation
  .action(async (name) => {
    const proceed = await confirm(`Delete stack ${name}`);
    if (!proceed) return;

    await deleteStackByName(name);
    console.log(chalk.green(`Stack ${name} deleted!`));
  });

// Start processing
program
  .parseAsync(process.argv)
  .catch((e) => {
    console.log(chalk.red('Something went wrong!'));
    console.error(e);
    process.exit(-1);
  });
