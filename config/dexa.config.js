const path = require('path');

module.exports = {

  stacks: {
    predefinedStacksLocation: path.resolve(__dirname, '../stacks/predefined'),
    userDefinedStacksLocation: path.resolve(__dirname, '../stacks/user-defined'),
    databaseJSONFile: path.resolve(__dirname, 'stacks.json')
  }

};
