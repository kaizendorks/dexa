#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const { getStackNames, deleteStackByName } = require('../src/stack-manager');
const { confirm } = require('../src/user-prompts');

program
  // Command arguments/options
  .addArgument(new program.Argument('<stackName>', 'name of the stack to be removed <required>, as per "dx stack list"').choices(getStackNames()))

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
