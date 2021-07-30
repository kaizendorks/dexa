const Stack = require('../../src/stack.model');
const config = require('../../config/dexa.config');
const path = require('path');
const fs = require('fs');
const execa = require('execa');
const { promisify } = require('util');
const glob = promisify(require('glob'));
const expect = require('chai').expect;

const testStacks = {
  predefined: {
    name: 'hello-world'
  },
  fromGit: {
    name: 'vue-vite-tailwind',
    source: 'https://github.com/web2033/vite-vue3-tailwind-starter'
  },
  fromGitAndPath: {
    name: 'vue-vite',
    source: 'https://github.com/vitejs/vite/packages/create-vite/template-vue'
  }
};

describe('command:dx-stack', () => {
  const cli = path.join(__dirname, '../../bin/dx.js');

  before(async () => {
    if (fs.existsSync(config.stacks.databaseJSONFile)){
      await fs.promises.rm(config.stacks.databaseJSONFile);
    }
    await Promise.all(
      Stack.loadAll().filter(s => !s.predefined).map(s => s.cleanup()));
  });

  describe('add subcommand', () => {
    let commandResult;

    describe('without the required arguments', () => {
      it('returns an error when no stack name is provided', async () => {
        commandResult = await execa('node', [cli, 'stack', 'add'], { reject: false });

        expect(commandResult.exitCode).to.equal(1);
        expect(commandResult.stderr).to.contain("error: missing required argument 'name'");
      });

      it('returns an error when no git repo is provided', async () => {
        commandResult = await execa('node', [cli, 'stack', 'add', 'my-new-stack'], { reject: false });

        expect(commandResult.exitCode).to.equal(1);
        expect(commandResult.stderr).to.contain("error: missing required argument 'gitRepoUrl'");
      });
    });

    describe('when pointed at a git repository', () => {
      before(async () => {
        commandResult = await execa('node', [cli, 'stack', 'add', testStacks.fromGit.name, 'https://github.com/web2033/vite-vue3-tailwind-starter'])
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
        commandResult = await execa('node', [cli, 'init', testStacks.fromGit.name], { input });
        expect(commandResult.exitCode).to.equal(0);
      });
    });

    describe('when pointed at a path inside a git repository', () => {
      before(async () => {
        commandResult = await execa('node', [cli, 'stack', 'add', testStacks.fromGitAndPath.name, 'https://github.com/vitejs/vite/packages/create-vite/template-vue'])
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
        commandResult = await execa('node', [cli, 'init', testStacks.fromGitAndPath.name], { input });
        expect(commandResult.exitCode).to.equal(0);
      });
    });
  });

  describe('list subcommand', () => {
    let commandResult;

    before(async () => {
      commandResult = await execa('node', [cli, 'stack', 'list'])
    });

    it('succeeds', () => {
      expect(commandResult.exitCode).to.equal(0);
    });

    it('returns expected predefined stacks', () => {
      expect(commandResult.stdout).to.contain(testStacks.predefined.name);
    });

    it('returns expected user-defined stacks', () => {
      expect(commandResult.stdout).to.contain(testStacks.fromGitAndPath.name);
      expect(commandResult.stdout).to.contain(testStacks.fromGit.name);
    });
  });

  describe('delete subcommand', () => {
    let commandResult;

    describe('without the required arguments', () => {
      it('returns an error when no stack name is provided', async () => {
        commandResult = await execa('node', [cli, 'stack', 'delete'], { reject: false });

        expect(commandResult.exitCode).to.equal(1);
        expect(commandResult.stderr).to.contain("error: missing required argument 'name'");
      });

      it('returns an error when the provided stack name does not exists', async () => {
        commandResult = await execa('node', [cli, 'stack', 'delete', 'non-existing-stack'], { reject: false });

        expect(commandResult.exitCode).to.equal(1);
        expect(commandResult.stderr).to.contain("command-argument value 'non-existing-stack' is invalid for argument 'name'");
      });

      it('returns an error when trying to remove a predefined stack', async () => {
        commandResult = await execa('node', [cli, 'stack', 'delete', testStacks.predefined.name], { reject: false });

        expect(commandResult.exitCode).to.equal(1);
        expect(commandResult.stderr).to.contain(`command-argument value '${testStacks.predefined.name}' is invalid for argument 'name'`);
      });
    });

    describe('with a stack that was added from a git repository', () => {
      let commandResult;

      before(async () => {
        const input = "Y\n"; // simulate user confirming deletion
        commandResult = await execa('node', [cli, 'stack', 'delete', testStacks.fromGit.name], { input });
      });

      it('succeeds', () => {
        expect(commandResult.exitCode).to.equal(0);
      });

      it('the stack cannot be used with the init command', async () => {
        const input = 'n\n'; // simulate user entering "n" to the confirmation question, so we dont actually create a project
        commandResult = await execa('node', [cli, 'init', testStacks.fromGit.name], { input, reject:false });
        expect(commandResult.exitCode).to.equal(1);
        expect(commandResult.stderr).to.contain(`command-argument value '${testStacks.fromGit.name}' is invalid for argument 'stackName'`);
      });

      it('the stack no longer appears in the list command', async () => {
        commandResult = await execa('node', [cli, 'stack', 'list']);
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
        commandResult = await execa('node', [cli, 'stack', 'delete', testStacks.fromGitAndPath.name], { input });
      });

      it('succeeds', () => {
        expect(commandResult.exitCode).to.equal(0);
      });

      it('the stack cannot be used with the init command', async () => {
        const input = 'n\n'; // simulate user entering "n" to the confirmation question, so we dont actually create a project
        commandResult = await execa('node', [cli, 'init', testStacks.fromGitAndPath.name], { input, reject:false });
        expect(commandResult.exitCode).to.equal(1);
        expect(commandResult.stderr).to.contain(`command-argument value '${testStacks.fromGitAndPath.name}' is invalid for argument 'stackName'`);
      });

      it('the stack no longer appears in the list command', async () => {
        commandResult = await execa('node', [cli, 'stack', 'list']);
        expect(commandResult.exitCode).to.equal(0);
        expect(commandResult.stdout).not.to.contain(testStacks.fromGitAndPath.name);
      });

      it('the repo contents have been removed from the user-defined stack folder', async () => {
        const stackLocation = path.resolve(config.stacks.userDefinedStacksLocation, testStacks.fromGitAndPath.name);
        const folderExists = await fs.promises.stat(stackLocation).catch(() => false);

        expect(folderExists).to.be.false;
      });
    });

  });



});
