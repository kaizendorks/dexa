#!/usr/bin/env node

import program from 'commander';
import chalk from 'chalk';
import { addNewStack } from '../src/stack-manager.js';
import { errorHandler } from '../src/errors.js';

async function main(){
  program
    // Command arguments/options
    .argument('<name>', 'name of the new stack <required>.')
    .argument('<origin>', 'either url of a git repository or a path to a local folder <required>.')
    .option('--private', 'enable usage of git+ssh with your ssh credentials to access private repositories.')

    // Help
    .showHelpAfterError(chalk.grey('(run "dx stack add --help" for additional usage information)'))
    .addHelpText('after', `
  Examples:
    ${chalk.grey('# create a new stack named "vue-vite" from a public github repo. All these examples are equivalent')}
    $ dx stack add vue-vite https://github.com/web2033/vite-vue3-tailwind-starter
    $ dx stack add vue-vite github:web2033/vite-vue3-tailwind-starter
    $ dx stack add vue-vite git@github.com:web2033/vite-vue3-tailwind-starter

    ${chalk.grey('# create a new stack named "vue-vite " from a specific folder inside a public github repo')}
    $ dx stack add vue-vite https://github.com/vitejs/vite/packages/create-vite/template-vue

    ${chalk.grey('# create a new stack named "vue-vite" from a private repository. (Note it will use ssh and needs you to have ssh keys configured)')}
    $ dx stack add vue-vite https://github.com/my-company/some-private-repo --private

    ${chalk.grey('# create a new stack named "my-stack" from a local folder. This is very useful when creating your own stacks so you can test them!')}
    $ dx stack add my-stack /some/local/folder
    `)

    // Action implementation
    .action(async (name, origin, { private: isPrivate }) => {
      await addNewStack(name, origin, isPrivate );
      console.log(chalk.green(`Stack ${name} added!`));
    });

  // Start processing
  return program.parseAsync(process.argv);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    errorHandler(e);
    process.exit(1);
  });
