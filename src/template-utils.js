import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import Handlebars from 'handlebars';

const getFileDestinationPath = (templatePath, templateFilePath, destinationPath, userOptions) => {
  // given a file like "/my/template/some/file.js"
  // we can generate its final destination path as in "/my/final/destination/some/file.js"
  // Note we remove the ".hbs" extension that marks it as a handlebars template
  const fileRelativePathInsideTemplate = path.relative(templatePath, templateFilePath);
  let fileDestinationPath = path.resolve(destinationPath, fileRelativePathInsideTemplate).replace('.hbs', '');

  // templates can reference userOptions (like the name argument of "dx generate" commands) in their folder structure or file name
  // so the generated folder/file names can be determined by user provided options
  // Any string __optionName__ in a template's folder/file name, will be replaced with the option value
  for (const optionName in userOptions) {
    fileDestinationPath = fileDestinationPath.replace(
      new RegExp(`__${optionName}__`,'g'),
      userOptions[optionName]);
  }

  return fileDestinationPath;
};

const ensureDir = async (destinationFilePath) => {
  const destinationFileDir = path.parse(destinationFilePath).dir;
  // No need to check if dir exists, mkdir already handles it gracefully
  // const dirExists = await fs.promises.stat(destinationFileDir).catch(() => false);
  // if (dirExists) return;

  await fs.promises.mkdir(destinationFileDir, {recursive: true });
};

const copyFile = async (templateFilePath, destinationFilePath, userOptions) => {
  const failIfExists = userOptions.override ? null : fs.constants.COPYFILE_EXCL;

  await fs.promises.copyFile(templateFilePath, destinationFilePath, failIfExists);
  console.log(chalk.grey(`Copied ${destinationFilePath}`));
};

const handlebarsHelpers = {
  json: (data) => JSON.stringify(data, null, 2)
};

const renderHandlebarsTemplateFile = async (
  templateFilePath,
  destinationFilePath,
  {
    project,
    stack,
    template,
    userOptions,
  }
) => {
  // Compile template file into a handlebars template
  const templateFileData = await fs.promises.readFile(templateFilePath);
  const handlebarsTemplate = Handlebars.compile(templateFileData.toString());

  // Render the file using the context data
  const renderedFile = handlebarsTemplate(
    { project, stack, template, userOptions },
    // TODO: allow defining custom handlebars helpers as part of either stack or template
    { helpers: handlebarsHelpers }
  );

  // Save the rendered file
  await fs.promises.writeFile(destinationFilePath, renderedFile, {
    encoding: 'utf8',
    flag: userOptions.override ? 'w' : 'wx' // see https://nodejs.org/api/fs.html#fs_file_system_flags
  });
  console.log(chalk.grey(`Rendered ${destinationFilePath}`));
};

export {
  getFileDestinationPath,
  ensureDir,
  copyFile,
  renderHandlebarsTemplateFile,
};

