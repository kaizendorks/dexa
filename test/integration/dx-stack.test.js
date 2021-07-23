
const path = require('path');
const expect = require('chai').expect;
const execa = require('execa');

describe('command:dx-stack', () => {
  const cli = path.join(__dirname, '../../bin/dx.js');

  describe('list subcommand', () => {
    let commandResult;

    before(() => execa('node', [cli, 'stack', 'list']).then(res => {
      commandResult = res;
    }));

    it('succeeds', () => {
      expect(commandResult.exitCode).to.equal(0);
    });

    it('returns expected predefined stacks', () => {
      expect(commandResult.stdout).to.contain('hello-world');
    });
  });

});
