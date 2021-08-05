#!/usr/bin/env node

import program from 'commander';

program
  .command('list', 'list all currently installed stacks')
  .command('add', 'add a new stack from either a git repository or a local folder')
  .command('delete', 'delete an existing stack')
  .parse(process.argv);
