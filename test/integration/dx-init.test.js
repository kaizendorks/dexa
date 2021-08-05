
import path from 'path';
import fs from 'fs';
import os from 'os';
import execa from 'execa';
import { promisify } from 'util';
import g from 'glob';
const glob = promisify(g);
import { use as chaiUse, expect} from 'chai';
import shallowDeepEqual from 'chai-shallow-deep-equal';
chaiUse(shallowDeepEqual);
import { URL } from 'url';
import Project from '../../src/project.js';
import config from '../../config/dexa.config.js';

const testStack = {
  name: 'hello-world',
  location: path.resolve(config.stacks.predefinedStacksLocation, 'hello-world'),
};

const loadPackageJson = (projectFolder) => {
  return JSON.parse(fs.readFileSync(path.resolve(projectFolder, 'package.json')));
}

describe('command:dx-init', () => {
  const cli = new URL('../../bin/dx.js', import.meta.url).pathname;
  let tempDir;

  before(async () => {
    tempDir = await fs.promises.mkdtemp(path.resolve(os.tmpdir(), 'dexa-test-'));
  });

  after(async () => {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  });

  describe('without the required arguments', () => {
    it('returns an error when no stack is provided', async () => {
      const commandResult = await execa('node', [cli, 'init'], { cwd: tempDir, reject: false });

      expect(commandResult.exitCode).to.equal(1);
      expect(commandResult.stderr).to.contain("error: missing required argument 'stackName'");
    });

    it('returns an error when the stack doesnt exist', async () => {
      const commandResult = await execa('node', [cli, 'init', 'non-existing-stack'], { cwd: tempDir, reject: false });

      expect(commandResult.exitCode).to.equal(1);
      expect(commandResult.stderr).to.contain("command-argument value 'non-existing-stack' is invalid for argument 'stackName'");
    });
  });

  describe('when the destination folder exists', () => {
    it('asks for confirmation when generating a project in the current folder', async () => {
      const input = 'n\n'; // simulate user entering "n" to the confirmation question
      const commandResult = await execa('node', [cli, 'init', testStack.name], { cwd: tempDir, input });

      expect(commandResult.exitCode).to.equal(0);
      expect(commandResult.stdout.replace(/\n/g, '')).to.contain("Generate project in current directory? (Y/n)");
    });

    it('asks for confirmation when there is already a folder with the new project name', async () => {
      const input = 'n\n'; // simulate user entering "n" to the confirmation question
      const folderToRunCommand = path.resolve(tempDir, '..'); // run "dx init" in the parent folder of the generated temp folder
      const projectName = path.basename(tempDir); // using the name of the temp folder as the project name, thus ensuring there is already a folder with that name
      const commandResult = await execa('node', [cli, 'init', testStack.name, projectName], { cwd: folderToRunCommand, input });

      expect(commandResult.exitCode).to.equal(0);
      expect(commandResult.stdout.replace(/\n/g, '')).to.match(/Target directory exists .* Continue\?/s);
    });

    it('asks for confirmation also when using the "-p" parameter', async () => {
      const input = 'n\n'; // simulate user entering "n" to the confirmation question
      const folderToCreateProject = path.resolve(tempDir, '..'); // run "dx init -p" pointing to the the parent folder of the generated temp folder
      const projectName = path.basename(tempDir); // using the name of the temp folder as the project name, thus ensuring there is already a folder with that name
      const commandResult = await execa('node', [cli, 'init', testStack.name, projectName, '-p', folderToCreateProject], { input });

      expect(commandResult.exitCode).to.equal(0);
      expect(commandResult.stdout.replace(/\n/g, '')).to.match(/Target directory exists .* Continue\?/s);
    });
  });

  describe('when using the default hello-world stack', () => {
    const expectedFiles = [
      '.dexarc',
      '.gitignore',
      'index.js',
      'package.json',
      `src/greeter.js`
    ];

    describe('can generate a project in the current folder', () => {
      let projectName = 'in-current-folder';
      let projectFolder;
      let commandResult;
      let generatedFiles;

      before(async () => {
        projectFolder = path.resolve(tempDir, projectName);
        await fs.promises.mkdir(projectFolder, {recursive: true });

        const input = '\n'; // simulate user entering "Y" to the confirmation question
        commandResult = await execa('node', [cli, 'init', testStack.name], { cwd: projectFolder, input });
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

      it('generated a dexarc file with the project and stack details', () => {
        const project = Project.load(projectFolder);

        expect(project).to.be.shallowDeepEqual({
          name: projectName,
          stackReference: {
            name: testStack.name,
            origin: testStack.location,
          },
          features: [],
        });
      });

      describe('the generated project files', () => {
        it('use the current folder name as the project name', async () => {
          const generatedPackageJson = loadPackageJson(projectFolder);
          expect(generatedPackageJson.name).to.equal('in-current-folder');
        });

        it('received the expected parameters for the handlebars templates', async () => {
          const generatedPackageJson = loadPackageJson(projectFolder);
          expect(generatedPackageJson.dexaInitArguments).to.be.shallowDeepEqual({
            project: {
              name: projectName,
              features: [],
            },
            stack: {
              name: testStack.name,
              predefined: true,
              origin: testStack.location,
              locationPath: testStack.location,
            },
            template: {
              name: 'init',
              path: path.resolve(testStack.location, 'init'),
            },
            userOptions: {
              override: false
            }
          });
        });

        it('have the expected contents so we have a working node project', async () => {
          const generatedProjectResult = await execa('node', ['index.js'], { cwd: projectFolder });
          expect(generatedProjectResult.stdout).to.include('Hello World!');
        });
      });
    });

    describe('with a specific project name', () => {
      let projectName = 'my-project';
      let projectFolder;
      let commandResult;
      let generatedFiles;

      before(async () => {
        projectFolder = path.resolve(tempDir, projectName);

        const input = '\n'; // simulate user entering "Y" to the confirmation question
        commandResult = await execa('node', [cli, 'init', testStack.name, projectName], { cwd: tempDir, input });
        generatedFiles = await glob(path.resolve(tempDir, '**', '*'), { dot: true, nodir: true });
      });

      it('succeeds', () => {
        expect(commandResult.exitCode).to.equal(0);
      });

      expectedFiles.forEach(file => {
        it(`generated the ${file} file`, () => {
          expect(generatedFiles).to.include(path.resolve(projectFolder, file));
        });
      });

      it('generated a dexarc file with the project and stack details', () => {
        const project = Project.load(projectFolder);

        expect(project).to.be.shallowDeepEqual({
          name: 'my-project',
          stackReference: {
            name: testStack.name,
            origin: testStack.location,
          },
          features: [],
        });
      });

      describe('the generated project files', () => {
        it('use the current folder name as the project name', async () => {
          const generatedPackageJson = loadPackageJson(projectFolder);
          expect(generatedPackageJson.name).to.equal(projectName);
        });

        it('received the expected parameters for the handlebars templates', async () => {
          const generatedPackageJson = loadPackageJson(projectFolder);
          expect(generatedPackageJson.dexaInitArguments).to.be.shallowDeepEqual({
            project: {
              name: projectName,
              features: [],
            },
            stack: {
              name: testStack.name,
              predefined: true,
              origin: testStack.location,
              locationPath: testStack.location,
            },
            template: {
              name: 'init',
              path: path.resolve(testStack.location, 'init'),
            },
            userOptions: {
              override: false
            }
          });
        });

        it('have the expected contents so we have a working node project', async () => {
          const generatedProjectResult = await execa('node', ['index.js'], { cwd: projectFolder });
          expect(generatedProjectResult.stdout).to.include('Hello World!');
        });
      });
    });

    describe('with a specific path using the "-p" argument', () => {
      let projectName = 'my-project-with-path';
      let projectFolder;
      let commandResult;
      let generatedFiles;

      before(async () => {
        projectFolder = path.resolve(tempDir, projectName);

        const input = '\n'; // simulate user entering "Y" to the confirmation question
        commandResult = await execa('node', [cli, 'init', testStack.name, projectName, '-p', tempDir], { input }); // instead of executing the command using tempDir as the "cwd", we use the "-p" parameter allowed by the dx init command
        generatedFiles = await glob(path.resolve(tempDir, '**', '*'), { dot: true, nodir: true });
      });

      it('succeeds', () => {
        expect(commandResult.exitCode).to.equal(0);
      });

      expectedFiles.forEach(file => {
        it(`generated the ${file} file`, () => {
          expect(generatedFiles).to.include(path.resolve(projectFolder, file));
        });
      });

      it('generated a dexarc file with the project and stack details', () => {
        const project = Project.load(projectFolder);

        expect(project).to.be.shallowDeepEqual({
          name: 'my-project-with-path',
          stackReference: {
            name: testStack.name,
            origin: testStack.location,
          },
          features: [],
        });
      });

      describe('the generated project files', () => {
        it('use the current folder name as the project name', async () => {
          const generatedPackageJson = loadPackageJson(projectFolder);
          expect(generatedPackageJson.name).to.equal(projectName);
        });

        it('received the expected parameters for the handlebars templates', async () => {
          const generatedPackageJson = loadPackageJson(projectFolder);
          expect(generatedPackageJson.dexaInitArguments).to.be.shallowDeepEqual({
            project: {
              name: projectName,
              features: [],
            },
            stack: {
              name: testStack.name,
              predefined: true,
              origin: testStack.location,
              locationPath: testStack.location,
            },
            template: {
              name: 'init',
              path: path.resolve(testStack.location, 'init'),
            },
            userOptions: {
              override: false
            }
          });
        });

        it('have the expected contents so we have a working node project', async () => {
          const generatedProjectResult = await execa('node', ['index.js'], { cwd: projectFolder });
          expect(generatedProjectResult.stdout).to.include('Hello World!');
        });
      });
    });

    describe('can override contents of a non-empty folder with the "-o" parameter', () => {
      let projectName = 'my-project-with-override';
      let projectFolder;
      let commandResult;
      let generatedFiles;

      before(async () => {
        projectFolder = path.resolve(tempDir, projectName);

        // ensure project folder already contains some of the files/subfolders to be generated
        await fs.promises.mkdir(path.resolve(projectFolder, 'src'), { recursive: true });
        await fs.promises.writeFile(path.resolve(projectFolder, 'index.js'), "console.log('existing file')");
        await fs.promises.writeFile(path.resolve(projectFolder, 'src/greeter.js'), "console.log('another existing file')");
        await fs.promises.writeFile(path.resolve(projectFolder, 'package.json'), '{"the": "existing file"}');

        const input = '\n'; // simulate user entering "Y" to the confirmation question
        commandResult = await execa('node', [cli, 'init', testStack.name, projectName, '--override'], { cwd: tempDir, input });
        generatedFiles = await glob(path.resolve(tempDir, '**', '*'), { dot: true, nodir: true });
      });

      it('succeeds', () => {
        expect(commandResult.exitCode).to.equal(0);
      });

      expectedFiles.forEach(file => {
        it(`generated the ${file} file`, () => {
          expect(generatedFiles).to.include(path.resolve(projectFolder, file));
        });
      });

      describe('the generated and overridden project files', () => {
        it('use the current folder name as the project name', async () => {
          const generatedPackageJson = loadPackageJson(projectFolder);
          expect(generatedPackageJson.name).to.equal(projectName);
        });

        it('received the expected parameters for the handlebars templates', async () => {
          const generatedPackageJson = loadPackageJson(projectFolder);
          expect(generatedPackageJson.dexaInitArguments).to.be.shallowDeepEqual({
            project: {
              name: projectName,
              features: [],
            },
            stack: {
              name: testStack.name,
              predefined: true,
              origin: testStack.location,
              locationPath: testStack.location,
            },
            template: {
              name: 'init',
              path: path.resolve(testStack.location, 'init'),
            },
            userOptions: {
              override: true
            }
          });
        });

        it('have the expected contents so we have a working node project', async () => {
          const generatedProjectResult = await execa('node', ['index.js'], { cwd: projectFolder });
          expect(generatedProjectResult.stdout).to.include('Hello World!');
        });
      });
    });

  });

});
