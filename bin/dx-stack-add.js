#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const { addStackFromGit } = require('../src/stack-manager');
const { errorHandler } = require('../src/errors');

async function main(){
  program
    // Command arguments/options
    .argument('<name>', 'name of the new stack <required>.')
    .argument('<gitRepoUrl>', 'url of the git repository that contains the stack <required>.')
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
    `)

    // Action implementation
    .action(async (name, gitRepoUrl, { private: isPrivate }) => {
      await addStackFromGit(name, gitRepoUrl, isPrivate );
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
