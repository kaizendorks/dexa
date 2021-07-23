#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const stacks = require('../config/stacks.json');

// Command options/help
// none

// Parse user input
program
  .parse(process.argv);

// Add padding before/after execution
// console.log();
// process.on('exit', () => {
//   console.log();
// });

// Display currently installed stacks
console.log(chalk.gray("Predefined stacks:"));
for(var predefinedStack in stacks.predefined){
  console.log(`${chalk.green(predefinedStack)}: ${stacks.predefined[predefinedStack]}`);
}

console.log();
console.log(chalk.gray("User-defined stacks:"));
for(var userDefinedStack in stacks.userDefined){
  console.log(`${chalk.green(userDefinedStack)}: ${stacks.userDefined[userDefinedStack]}`);
}
