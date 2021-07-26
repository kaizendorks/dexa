const path = require('path');
const chalk = require('chalk');
const { getStackByname } = require('./stacks-manager');
const { renderTemplate } = require('./template-engine');

const renderInitTemplate = async ({
  stackName,
  projectName,
  fullDestinationPath,
  override
}) => {

  const stack = getStackByname(stackName);
  const templatePath = path.resolve(stack.locationPath, 'init');
  console.log(chalk.grey(`Creating new project in "${fullDestinationPath}" using stack "${stackName}" from ${templatePath}`));

  await renderTemplate(templatePath, fullDestinationPath, {
    project: { name: projectName },
    stack,
    userOptions: { override }
  });
};

module.exports = {
  renderInitTemplate,
};