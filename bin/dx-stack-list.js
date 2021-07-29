#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const { getStacks } = require('../src/stack-manager');

program
  // Command arguments/options
  // - none

  // Help
  // - use default help

  // Action implementation
  .action(async () => {
    const stacks = getStacks();

    console.log(chalk.gray("Predefined stacks:"));
    const predefinedStacks = stacks.filter(s => s.predefined);
    console.table(predefinedStacks, ['name']);

    console.log();
    console.log(chalk.gray("User-defined stacks:"));
    const userDefinedStacks = stacks.filter(s => !s.predefined);
    console.table(userDefinedStacks, ['name', 'origin']);
  });

// Start processing
program
  .parseAsync(process.argv)
  .catch(() => process.exit(-1));
