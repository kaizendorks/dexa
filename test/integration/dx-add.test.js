
const path = require('path');
const fs = require('fs');
const os = require('os');
const execa = require('execa');
const { promisify } = require('util');
const glob = promisify(require('glob'));
const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-shallow-deep-equal'));
const Project = require('../../src/project');

describe('command:dx-add', () => {
  const cli = path.join(__dirname, '../../bin/dx.js');
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
      await execa('node', [cli, 'init', 'hello-world', 'cli-arguments'], { cwd: tempDir });
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
      await execa('node', [cli, 'init', 'hello-world', projectName], { cwd: tempDir });
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
        '.dx-add-args-trap.json',
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
            name: 'hello-world',
            origin: path.resolve(__dirname, '../../stacks/predefined/hello-world'),
          },
          features: ['unit-test'],
        });
      });

      describe('the generated template files', () => {

        it('received the expected parameters for the handlebars templates', async () => {
          const argsInHandlebarsTemplates = require(path.resolve(projectFolder, '.dx-add-args-trap.json'));
          expect(argsInHandlebarsTemplates).to.be.shallowDeepEqual({
            project: {
              name: projectName,
              features: [],
            },
            stack: {
              name: 'hello-world',
              predefined: true,
              origin: path.resolve(__dirname, '../../stacks/predefined/hello-world'),
              locationPath: path.resolve(__dirname, '../../stacks/predefined/hello-world'),
            },
            template: {
              name: 'unit-test',
              path: path.resolve(__dirname, '../../stacks/predefined/hello-world/add/unit-test'),
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
        await execa('node', [cli, 'init', 'hello-world', projectName], { cwd: tempDir });

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
          const argsInHandlebarsTemplates = require(path.resolve(projectFolder, '.dx-add-args-trap.json'));
          expect(argsInHandlebarsTemplates).to.be.shallowDeepEqual({
            project: {
              name: projectName,
              features: [],
            },
            stack: {
              name: 'hello-world',
              predefined: true,
              origin: path.resolve(__dirname, '../../stacks/predefined/hello-world'),
              locationPath: path.resolve(__dirname, '../../stacks/predefined/hello-world'),
            },
            template: {
              name: 'unit-test',
              path: path.resolve(__dirname, '../../stacks/predefined/hello-world/add/unit-test'),
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

});
