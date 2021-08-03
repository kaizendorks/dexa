#!/usr/bin/env node

const program = require('commander');
const didYouMean = require('didyoumean');
const chalk = require('chalk');

program
  .version(require('../package.json').version, '-v, --version')
  .usage('<command> [options]')
  // these dont work with subcommands
  // .hook('preAction', (thisCommand, actionCommand) => console.log())
  // .hook('postAction', (thisCommand, actionCommand) => console.log())
  .command('add', 'adds stack features to a project')
  .command('init', 'creates a new project using the specified stack')
  .command('stack', 'manages the different stacks. Each stack is made by a project template and its code generators')
  .parse(process.argv);

// Catch all validation in case user mistypes the command
const validCommands = [
  'add',
  'init',
  'stack',
];
const commandName = program.args[0];

if (!validCommands.includes(commandName)) {
  console.log(chalk.red(`Command ${commandName} not found!`));
  const meantCommand = didYouMean(commandName, validCommands);
  if (meantCommand) console.log(chalk.yellow(`Did you mean "${meantCommand}"?`));
  else console.log('Run dx --help to see the available commands');
}
