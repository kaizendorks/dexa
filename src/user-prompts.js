const inquirer = require('inquirer');

const confirm = async (message) => {
  const answer = await inquirer.prompt([{
    type: 'confirm',
    message,
    name: 'ok',
    default: true
  }]);
  return answer.ok;
};

module.exports = {
  confirm,
};