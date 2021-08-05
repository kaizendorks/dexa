#!/usr/bin/env node

import program from 'commander';

program
  .command('list', 'list all currently installed stacks')
  .command('add', 'add a new stack from a git repository')
  .command('delete', 'delete an existing stack')
  .parse(process.argv);
