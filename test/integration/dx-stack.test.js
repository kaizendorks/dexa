import path from 'path';
import fs from 'fs';
import execa from 'execa';
import { promisify } from 'util';
import g from 'glob';
const glob = promisify(g);
import { expect } from 'chai';
import config from '../../config/dexa.config.js';
import { __reloadStacks, getStacks, deleteStackByName } from '../../src/stack-manager.js';

const testStacks = {
  predefined: {
    name: 'dexa-stack'
  },
  fromGit: {
    name: 'vue-vite-tailwind',
    origin: 'https://github.com/web2033/vite-vue3-tailwind-starter'
  },
  fromGitAndPath: {
    name: 'vue-vite',
    origin: 'https://github.com/vitejs/vite/packages/create-vite/template-vue'
  },
  fromLocalFolder: {
    // We can add with an alternative name one of the predefined stacks, so we can test we can "dx stack add" from local folders
    name: 'from-local-folder',
    origin: path.resolve(config.stacks.predefinedStacksLocation, 'dexa-stack'),
  }
};

describe('command:dx-stack', () => {

  // Cleanup any remains of the additional test stacks used in these tests
  after(async () => {
    await __reloadStacks();

    const stacksToCleanup = [testStacks.fromGit, testStacks.fromGitAndPath, testStacks.fromLocalFolder];
    for (const stack of getStacks()){
      if (!stacksToCleanup.find(s => s.name === stack.name)) continue;

      await deleteStackByName(stack.name);
    }
  });

  describe('add subcommand', () => {
    let commandResult;

    describe('without the required arguments', () => {
      it('returns an error when no stack name is provided', async () => {
        commandResult = await execa.node(config.dexaCLI, ['stack', 'add'], { reject: false });

        expect(commandResult.exitCode).to.equal(1);
        expect(commandResult.stderr).to.contain("error: missing required argument 'name'");
      });

      it('returns an error when no git repo is provided', async () => {
        commandResult = await execa.node(config.dexaCLI, ['stack', 'add', 'my-new-stack'], { reject: false });

        expect(commandResult.exitCode).to.equal(1);
        expect(commandResult.stderr).to.contain("error: missing required argument 'origin'");
      });
    });

    describe('when pointed at a git repository', () => {
      before(async () => {
        commandResult = await execa.node(config.dexaCLI, ['stack', 'add', testStacks.fromGit.name, testStacks.fromGit.origin])
      });

      it('succeeds', () => {
        expect(commandResult.exitCode).to.equal(0);
      });

      it('the repo contents have been downloaded to the user-defined stack folder', async () => {
        const stackLocation = path.resolve(config.stacks.userDefinedStacksLocation, testStacks.fromGit.name);
        const stackFiles = await glob(path.resolve(stackLocation, '**', '*'), { dot: true, nodir: true });

        expect(stackFiles).to.include.members([
          path.resolve(stackLocation, '.gitignore'),
          path.resolve(stackLocation, 'package.json'),
          path.resolve(stackLocation, 'src/main.js'),
          path.resolve(stackLocation, 'src/views/Home.vue'),
          path.resolve(stackLocation, '.github/dependabot.yml')
        ]);
      });

      it('the stack can be used with the init command', async () => {
        const input = 'n\n'; // simulate user entering "n" to the confirmation question, so we dont actually create a project
        commandResult = await execa.node(config.dexaCLI, ['init', testStacks.fromGit.name], { input });
        expect(commandResult.exitCode).to.equal(0);
      });
    });

    describe('when pointed at a path inside a git repository', () => {
      before(async () => {
        commandResult = await execa.node(config.dexaCLI, ['stack', 'add', testStacks.fromGitAndPath.name, testStacks.fromGitAndPath.origin])
      });

      it('succeeds', () => {
        expect(commandResult.exitCode).to.equal(0);
      });

      it('the repo contents have been downloaded to the user-defined stack folder', async () => {
        const stackLocation = path.resolve(config.stacks.userDefinedStacksLocation, testStacks.fromGitAndPath.name);
        const stackFiles = await glob(path.resolve(stackLocation, '**', '*'), { dot: true, nodir: true });

        expect(stackFiles).to.include.members([
          path.resolve(stackLocation, 'package.json'),
          path.resolve(stackLocation, 'src/main.js'),
          path.resolve(stackLocation, 'src/components/HelloWorld.vue'),
        ]);
      });

      it('the stack can be used with the init command', async () => {
        const input = 'n\n'; // simulate user entering "n" to the confirmation question, so we dont actually create a project
        commandResult = await execa.node(config.dexaCLI, ['init', testStacks.fromGitAndPath.name], { input });
        expect(commandResult.exitCode).to.equal(0);
      });
    });

    describe('when pointed at a local folder', () => {
      before(async () => {
        commandResult = await execa.node(config.dexaCLI, ['stack', 'add', testStacks.fromLocalFolder.name, testStacks.fromLocalFolder.origin])
      });

      it('succeeds', () => {
        expect(commandResult.exitCode).to.equal(0);
      });

      it('the stack can be used with the init command', async () => {
        const input = 'n\n'; // simulate user entering "n" to the confirmation question, so we dont actually create a project
        commandResult = await execa.node(config.dexaCLI, ['init', testStacks.fromLocalFolder.name], { input });
        expect(commandResult.exitCode).to.equal(0);
      });
    });
  });

  describe('list subcommand', () => {
    let commandResult;

    before(async () => {
      commandResult = await execa.node(config.dexaCLI, ['stack', 'list'])
    });

    it('succeeds', () => {
      expect(commandResult.exitCode).to.equal(0);
    });

    it('returns expected predefined stacks', () => {
      expect(commandResult.stdout).to.contain(testStacks.predefined.name);
    });

    it('returns expected user-defined stacks', () => {
      expect(commandResult.stdout).to.contain(testStacks.fromGitAndPath.name);
      expect(commandResult.stdout).to.contain(testStacks.fromGitAndPath.origin);

      expect(commandResult.stdout).to.contain(testStacks.fromGit.name);
      expect(commandResult.stdout).to.contain(testStacks.fromGit.origin);

      expect(commandResult.stdout).to.contain(testStacks.fromLocalFolder.name);
      expect(commandResult.stdout).to.contain(testStacks.fromLocalFolder.origin);
    });
  });

  describe('delete subcommand', () => {
    let commandResult;

    describe('without the required arguments', () => {
      it('returns an error when no stack name is provided', async () => {
        commandResult = await execa.node(config.dexaCLI, ['stack', 'delete'], { reject: false });

        expect(commandResult.exitCode).to.equal(1);
        expect(commandResult.stderr).to.contain("error: missing required argument 'name'");
      });

      it('returns an error when the provided stack name does not exists', async () => {
        commandResult = await execa.node(config.dexaCLI, ['stack', 'delete', 'non-existing-stack'], { reject: false });

        expect(commandResult.exitCode).to.equal(1);
        expect(commandResult.stderr).to.contain("command-argument value 'non-existing-stack' is invalid for argument 'name'");
      });

      it('returns an error when trying to remove a predefined stack', async () => {
        commandResult = await execa.node(config.dexaCLI, ['stack', 'delete', testStacks.predefined.name], { reject: false });

        expect(commandResult.exitCode).to.equal(1);
        expect(commandResult.stderr).to.contain(`command-argument value '${testStacks.predefined.name}' is invalid for argument 'name'`);
      });
    });

    describe('with a stack that was added from a git repository', () => {
      let commandResult;

      before(async () => {
        const input = "Y\n"; // simulate user confirming deletion
        commandResult = await execa.node(config.dexaCLI, ['stack', 'delete', testStacks.fromGit.name], { input });
      });

      it('succeeds', () => {
        expect(commandResult.exitCode).to.equal(0);
      });

      it('the stack cannot be used with the init command', async () => {
        const input = 'n\n'; // simulate user entering "n" to the confirmation question, so we dont actually create a project
        commandResult = await execa.node(config.dexaCLI, ['init', testStacks.fromGit.name], { input, reject:false });
        expect(commandResult.exitCode).to.equal(1);
        expect(commandResult.stderr).to.contain(`error: unknown command '${testStacks.fromGit.name}'`);
      });

      it('the stack no longer appears in the list command', async () => {
        commandResult = await execa.node(config.dexaCLI, ['stack', 'list']);
        expect(commandResult.exitCode).to.equal(0);
        expect(commandResult.stdout).not.to.contain(testStacks.fromGit.name);
      });

      it('the repo contents have been removed from the user-defined stack folder', async () => {
        const stackLocation = path.resolve(config.stacks.userDefinedStacksLocation, testStacks.fromGit.name);
        const folderExists = await fs.promises.stat(stackLocation).catch(() => false);

        expect(folderExists).to.be.false;
      });
    });

    describe('with a stack that was added from a path inside a git repository', () => {
      let commandResult;

      before(async () => {
        const input = "Y\n"; // simulate user confirming deletion
        commandResult = await execa.node(config.dexaCLI, ['stack', 'delete', testStacks.fromGitAndPath.name], { input });
      });

      it('succeeds', () => {
        expect(commandResult.exitCode).to.equal(0);
      });

      it('the stack cannot be used with the init command', async () => {
        const input = 'n\n'; // simulate user entering "n" to the confirmation question, so we dont actually create a project
        commandResult = await execa.node(config.dexaCLI, ['init', testStacks.fromGitAndPath.name], { input, reject:false });
        expect(commandResult.exitCode).to.equal(1);
        expect(commandResult.stderr).to.contain(`error: unknown command '${testStacks.fromGitAndPath.name}'`);
      });

      it('the stack no longer appears in the list command', async () => {
        commandResult = await execa.node(config.dexaCLI, ['stack', 'list']);
        expect(commandResult.exitCode).to.equal(0);
        expect(commandResult.stdout).not.to.contain(testStacks.fromGitAndPath.name);
      });

      it('the repo contents have been removed from the user-defined stack folder', async () => {
        const stackLocation = path.resolve(config.stacks.userDefinedStacksLocation, testStacks.fromGitAndPath.name);
        const folderExists = await fs.promises.stat(stackLocation).catch(() => false);

        expect(folderExists).to.be.false;
      });
    });

    describe('with a stack that was added from a local folder', () => {
      let commandResult;

      before(async () => {
        const input = "Y\n"; // simulate user confirming deletion
        commandResult = await execa.node(config.dexaCLI, ['stack', 'delete', testStacks.fromLocalFolder.name], { input });
      });

      it('succeeds', () => {
        expect(commandResult.exitCode).to.equal(0);
      });

      it('the stack cannot be used with the init command', async () => {
        const input = 'n\n'; // simulate user entering "n" to the confirmation question, so we dont actually create a project
        commandResult = await execa.node(config.dexaCLI, ['init', testStacks.fromLocalFolder.name], { input, reject:false });
        expect(commandResult.exitCode).to.equal(1);
        expect(commandResult.stderr).to.contain(`error: unknown command '${testStacks.fromLocalFolder.name}'`);
      });

      it('the stack no longer appears in the list command', async () => {
        commandResult = await execa.node(config.dexaCLI, ['stack', 'list']);
        expect(commandResult.exitCode).to.equal(0);
        expect(commandResult.stdout).not.to.contain(testStacks.fromLocalFolder.name);
      });

      it('the original local folder has not been removed nor cleaned up', async () => {
        const stackOrigin = testStacks.fromLocalFolder.origin;
        const stackFiles = await glob(path.resolve(testStacks.fromLocalFolder.origin, '**', '*'), { dot: true, nodir: true });

        expect(stackFiles).to.include.members([
          path.resolve(stackOrigin, 'init/README.md.hbs'),
          path.resolve(stackOrigin, 'init/init/sample-copy.md'),
          path.resolve(stackOrigin, 'init/init/sample-template.md.hbs.hbs'),
          path.resolve(stackOrigin, 'add/customizations/dexa.js'),
          path.resolve(stackOrigin, 'generate/feature/add/__name__/README.md.hbs'),
        ]);
      });
    });

  });



});
