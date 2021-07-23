#!/usr/bin/env node

const program = require('commander');

program
  .command('list', 'list all currently installed stacks')
  .parse(process.argv);
