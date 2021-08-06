import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import execa from 'execa';
import { promisify } from 'util';
import g from 'glob';
const glob = promisify(g);
import chai from 'chai';
import shallowDeepEqual from 'chai-shallow-deep-equal';
const expect = chai.expect;
chai.use(shallowDeepEqual);
import { URL } from 'url';
import Project from '../../src/project.js';
import config from '../../config/dexa.config.js';

const testStack = {
  name: 'hello-world',
  location: path.resolve(config.stacks.predefinedStacksLocation, 'hello-world'),
};

describe('command:dx-add', () => {
  const cli = new URL('../../bin/dx.js', import.meta.url).pathname;
  let tempDir;

  before(async () => {
    tempDir = await fs.promises.mkdtemp(path.resolve(os.tmpdir(), 'dexa-test-'));
  });

  after(async () => {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  });

  describe('without the required arguments', () => {
    let projectFolder;

    before(async () => {
      await execa('node', [cli, 'init', testStack.name, 'cli-arguments'], { cwd: tempDir });
      projectFolder = path.resolve(tempDir, 'cli-arguments');
    });

    it('returns an error when executed outside of a project folder that was initialized with dx init', async () => {
      const commandResult = await execa('node', [cli, 'add'], { cwd: tempDir, reject: false });

      expect(commandResult.exitCode).to.equal(1);
      expect(commandResult.stderr.replace(/\n/g, '')).to.match(/The folder ".*" does not contain a dexa project or its "\.dexarc" file cannot be found/s);
    });

    it('returns the help when the template name is missing', async () => {
      const commandResult = await execa('node', [cli, 'add'], { cwd: projectFolder, reject: false });

      expect(commandResult.exitCode).to.equal(1);
      expect(commandResult.stderr).to.contain("Usage: dx-add [options] [command]");
    });
  });

  describe('when using the default hello-world stack', () => {
    let projectName = 'test-add-unit-test';
    let projectFolder;

    before(async () => {
      await execa('node', [cli, 'init', testStack.name, projectName], { cwd: tempDir });
      projectFolder = path.resolve(tempDir, projectName);
    });

    it('shows the expected add templates in the automated help', async () => {
      const commandResult = await execa('node', [cli, 'add', '--help'], { cwd: projectFolder, reject: false });

      expect(commandResult.exitCode).to.equal(0);
      [
        'unit-test'
      ].forEach(templateName => {
        expect(commandResult.stdout).to.contain(`${templateName} [options]`);
      });
    });

    it('returns an error when there is no template with that name', async () => {
      const commandResult = await execa('node', [cli, 'add', 'non-existing-template'], { cwd: projectFolder, reject: false });

      expect(commandResult.exitCode).to.equal(1);
      expect(commandResult.stderr).to.contain("error: unknown command 'non-existing-template'");
      expect(commandResult.stderr).to.contain('run "dx add --help" for a list of the available templates and additional usage information');
    });

    describe('and its "unit-test" add template', () => {
      let commandResult;
      let generatedFiles;
      const expectedFiles = [
        './test/greeter.test.js',
        '.dx-add-args-trap.js',
      ];

      before(async () => {
        commandResult = await execa('node', [cli, 'add', 'unit-test'], { cwd: projectFolder });
        generatedFiles = await glob(path.resolve(projectFolder, '**', '*'), { dot: true, nodir: true });
      });

      it('succeeds', () => {
        expect(commandResult.exitCode).to.equal(0);
      });

      expectedFiles.forEach(file => {
        it(`generated the ${file} file`, () => {
          expect(generatedFiles).to.include(path.resolve(projectFolder, file));
        });
      });

      it('updated the dexarc file by adding the unit-test to the list of features added to the project', () => {
        const project = Project.load(projectFolder);

        expect(project).to.be.shallowDeepEqual({
          name: projectName,
          stackReference: {
            name: testStack.name,
            origin: testStack.location,
          },
          features: ['unit-test'],
        });
      });

      describe('the generated template files', () => {

        it('received the expected parameters for the handlebars templates', async () => {
          const { default: argsInHandlebarsTemplates } = await import(path.resolve(projectFolder, '.dx-add-args-trap.js'));
          expect(argsInHandlebarsTemplates).to.be.shallowDeepEqual({
            project: {
              name: projectName,
              features: [],
            },
            stack: {
              name: testStack.name,
              predefined: true,
              origin: testStack.location,
              locationPath: testStack.location,
              private: false,
            },
            template: {
              name: 'unit-test',
              path: path.resolve(testStack.location, 'add/unit-test'),
            },
            userOptions: {}
          });
        });

        it('have the expected contents so we have a working node project', async () => {
          const generatedTestsResult = await execa('node', ['./test/greeter.test.js'], { cwd: projectFolder });
          expect(generatedTestsResult.exitCode).to.equal(0);
        });
      });
    });

    describe('can override contents of a non-empty folder with the "-o" parameter', () => {
      let projectName = 'unit-test-with-override';
      let projectFolder;
      let commandResult;

      before(async () => {
        projectFolder = path.resolve(tempDir, projectName);

        // create project
        await execa('node', [cli, 'init', testStack.name, projectName], { cwd: tempDir });

        // ensure project folder already contains some of the files/subfolders to be generated by the add command
        await fs.promises.mkdir(path.resolve(projectFolder, 'test'), { recursive: true });
        await fs.promises.writeFile(path.resolve(projectFolder, 'test/greeter.test.js'), "definitely not valid JS code");

        // now run the add command
        commandResult = await execa('node', [cli, 'add', 'unit-test', '--override'], { cwd: projectFolder });
      });

      it('succeeds', () => {
        expect(commandResult.exitCode).to.equal(0);
      });

      describe('the generated and overridden template files', () => {

        it('received the expected parameters for the handlebars templates', async () => {
          const { default: argsInHandlebarsTemplates } = await import(path.resolve(projectFolder, '.dx-add-args-trap.js'));
          expect(argsInHandlebarsTemplates).to.be.shallowDeepEqual({
            project: {
              name: projectName,
              features: [],
            },
            stack: {
              name: testStack.name,
              predefined: true,
              origin: testStack.location,
              locationPath: testStack.location,
              private: false,
            },
            template: {
              name: 'unit-test',
              path: path.resolve(testStack.location, 'add/unit-test'),
            },
            userOptions: {
              override: true
            }
          });
        });

        it('have the expected contents so we have a working node project', async () => {
          const generatedTestsResult = await execa('node', ['./test/greeter.test.js'], { cwd: projectFolder });
          expect(generatedTestsResult.exitCode).to.equal(0);
        });
      });
    });

  });

  describe('when using a stack not installed locally', () => {
    let alternativeStack = {
      name: 'hello-world-alt',
      location: ''
    };
    let projectName = 'test-missing-stack';
    let projectFolder;
    let commandResult;

    before(async () => {
      // create a copy of the existing "hello-world" predefined stack
      alternativeStack.location = path.resolve(tempDir, alternativeStack.name);
      await fs.copy(testStack.location, alternativeStack.location, { recursive: true });

      // register it as a new stack
      await execa('node', [cli, 'stack', 'add', alternativeStack.name, alternativeStack.location]);

      // create a new project using the added stack
      await execa('node', [cli, 'init', alternativeStack.name, projectName], { cwd: tempDir });
      projectFolder = path.resolve(tempDir, projectName);

      // now remove the stack
      await execa('node', [cli, 'stack', 'delete', alternativeStack.name], { input: 'Y\n' });
    });

    it('prompts the user to install the stack before proceeding', async () => {
      const input = "n\n"; // simulate typing no when prompted
      commandResult = await execa('node', [cli, 'add', 'unit-test'], { cwd: projectFolder, input });

      expect(commandResult.exitCode).to.equal(0);
      expect(commandResult.stdout).to.include(`The stack ${alternativeStack.name} is not installed locally. Do you want to add it?`);
    });

    describe('can install the stack while executing the add command', () => {
      before(async () => {
        // run the add command, confirming that we want to install the missing stack
        const input = 'Y\n';
        commandResult = await execa('node', [cli, 'add', 'unit-test'], { cwd: projectFolder, input });
      });

      it('succeeds', () => {
        expect(commandResult.exitCode).to.equal(0);
      });

      describe('the generated template files', () => {

        it('received the expected parameters for the handlebars templates', async () => {
          const { default: argsInHandlebarsTemplates } = await import(path.resolve(projectFolder, '.dx-add-args-trap.js'));
          expect(argsInHandlebarsTemplates).to.be.shallowDeepEqual({
            project: {
              name: projectName,
              features: [],
            },
            stack: {
              name: alternativeStack.name,
              predefined: false,
              origin: alternativeStack.location,
              locationPath: alternativeStack.location,
              private: false,
            },
            template: {
              name: 'unit-test',
              path: path.resolve(alternativeStack.location, 'add/unit-test'),
            },
            userOptions: {}
          });
        });

        it('have the expected contents so we have a working node project', async () => {
          const generatedTestsResult = await execa('node', ['./test/greeter.test.js'], { cwd: projectFolder });
          expect(generatedTestsResult.exitCode).to.equal(0);
        });
      });
    });

  });

});
