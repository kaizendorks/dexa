import execa from 'execa';
import { expect } from 'chai';
import { URL } from 'url';
import config from '../../config/dexa.config.js';

describe('command:dx', () => {
  const cli = new URL('../../bin/dx.js', import.meta.url).pathname;

  describe('autogenerated version', () => {
    let commandResult;

    before(async () => {
      commandResult = await execa('node', [cli, '--version'])
    });

    it('succeeds', () => {
      expect(commandResult.exitCode).to.equal(0);
    });

    it('returns expected version string', () => {
      expect(commandResult.stdout).to.contain(config.version);
    });
  });

  describe('autogenerated help', () => {
    let commandResult;

    before(async () => {
      commandResult = await execa('node', [cli, '--help'])
    });

    it('finished with success', () => {
      expect(commandResult.exitCode).to.equal(0);
    });

    const expectedSubcommands = [
      'add',
      'generate',
      'init',
      'stack',
    ];
    expectedSubcommands.forEach(s => {
      it(`contains the ${s} subcommand`, () => {
        expect(commandResult.stdout).to.contain(s);
      });
    });
  });

});
