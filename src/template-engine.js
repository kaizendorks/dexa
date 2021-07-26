const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const Handlebars = require('handlebars');
const { promisify } = require('util');
const glob = promisify(require('glob'));

const getTemplateFiles = async (templatePath) => {
  // Get all files in the template folders
  const globExpression = path.resolve(templatePath, '**', '*');
  // include dotfiles (like .gitignore) and exclude directories
  return await glob(globExpression, { dot: true, nodir: true });
};

const getFileDestinationPath = (templatePath, filePath, destinationPath) => {
  // given a file like "/my/template/some/file.js"
  // we can generate its final destination path as in "/my/final/destination/some/file.js"
  // Note we remove the ".hbs" extension that marks it as a handlebars template
  const fileRelativePathInsideTemplate = path.relative(templatePath, filePath);
  return path.resolve(destinationPath, fileRelativePathInsideTemplate).replace('.hbs', '');
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

const renderHandlebarsTemplateFile = async (
  templateFilePath,
  destinationFilePath,
  {
    project,
    userOptions,
    stack
  }
) => {
  // Compile template file into a handlebars template
  const templateFileData = await fs.promises.readFile(templateFilePath);
  const handlebarsTemplate = Handlebars.compile(templateFileData.toString());

  // Render the file using the context data
  const renderedFile = handlebarsTemplate(
    { project, userOptions, stack },
    { helpers: {} }
  );

  // Save the rendered file
  await fs.promises.writeFile(destinationFilePath, renderedFile, {
    encoding: 'utf8',
    flag: userOptions.override ? 'w' : 'wx' // see https://nodejs.org/api/fs.html#fs_file_system_flags
  });
  console.log(chalk.grey(`Rendered ${destinationFilePath}`));
};

const renderTemplate = async (
  templatePath,
  destinationPath,
  {
    project,
    userOptions,
    stack
  }
) => {
  const templateFiles = await getTemplateFiles(templatePath);

  return Promise.all(templateFiles.map(async (templateFilePath) => {
    const destinationFilePath = getFileDestinationPath(templatePath, templateFilePath, destinationPath);

    // Ensure target directory exists
    await ensureDir(destinationFilePath);

    // either copy file or render using handlebars
    return path.extname(templateFilePath) === '.hbs'
      ? await renderHandlebarsTemplateFile(templateFilePath, destinationFilePath, { project, userOptions, stack})
      : await copyFile(templateFilePath, destinationFilePath, userOptions);
  }));
};

module.exports = {
  renderTemplate,
};

