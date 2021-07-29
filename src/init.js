const path = require('path');
const chalk = require('chalk');
const { getStackByname } = require('./stack-manager');
const { renderTemplate } = require('./template-engine');

const renderInitTemplate = async ({
  stackName,
  projectName,
  fullDestinationPath,
  override
}) => {

  const stack = getStackByname(stackName);
  const templates = stack.loadTemplates();
  const templatePath = path.resolve(stack.locationPath, templates.init.path);
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