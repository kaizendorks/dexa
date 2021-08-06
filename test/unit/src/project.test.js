import path from 'path';
import sinon from 'sinon';
import { expect } from 'chai';
import * as td from 'testdouble';
import config from '../../../config/dexa.config.js';
import { CurrentFolderIsNotADexaProjectError } from '../../../src/errors.js';

describe('the project class', () => {
  let fsMock;
  let Project;

  before(async () => {
    fsMock = {
      existsSync: sinon.stub(),
      writeJSON: sinon.stub(),
      readJSONSync: sinon.stub(),
    };

    // replace node_moodules with "td.replace"
    await td.replace('fs-extra', fsMock);
    // replace dexa-specific ES modules with td.replaceEsm
    // await td.replaceEsm('../config/dexa.config.js', undefined, mockConfig);
    Project = await import('../../../src/project.js');
    Project = Project.default;
  });

  after(() => {
    td.reset();
  });

  describe('static load method', () => {
    const locationPath = '/some/path';
    const rcFile = path.resolve(locationPath, config.project.rcfile);

    it('loads the project properties from the dexarc file in the given location', async () => {
      let mockProjectData = {
        name: 'test-project',
        stackReference: { some: 'stack' },
        features: ['some', 'features']
      };
      fsMock.existsSync.withArgs(rcFile).returns(true);
      fsMock.readJSONSync.withArgs(rcFile, { encoding: 'utf8' }).returns(mockProjectData);

      let loadedProject = await Project.load(locationPath);

      expect(loadedProject).to.be.eql(mockProjectData);
    });

    it('throws an error if the given location does not contain a dexarc file', () => {
      fsMock.existsSync.withArgs(rcFile).returns(false);

      expect(() => Project.load(locationPath)).to.throw(CurrentFolderIsNotADexaProjectError);
    });
  });

  describe('save method', () => {
    const locationPath = '/some/path';
    const rcFile = path.resolve(locationPath, config.project.rcfile);

    it('saves the projectData to the rcFile in the given location', async () => {
      const mockProjectData = {
        name: 'test-project',
        stackReference: { some: 'stack' },
        features: ['some', 'features']
      };
      let testProject = new Project(mockProjectData);
      fsMock.writeJSON.withArgs(rcFile, mockProjectData, { spaces: 2, encoding: 'utf8', mode: 'w' }).resolves();

      await testProject.save(locationPath);

      sinon.assert.calledOnce(fsMock.writeJSON);
    });
  });

});
