const path = require('path');
const stacksConfig = require('../config/stacks.json');

let stacks;

const getStacks = () => {
  if (!stacks) {
    stacks = stacksConfig.map(s => Object.assign({}, s, {
      locationPath: s.predefined ? path.resolve(__dirname, '..', s.locationPath) : s.locationPath
    }));
  }
  return stacks;
};

const getStackNames = () => getStacks().map(s => s.name);

const getStackByname = (name) => getStacks().find(s => s.name === name);

module.exports = {
  getStacks,
  getStackNames,
  getStackByname,
};