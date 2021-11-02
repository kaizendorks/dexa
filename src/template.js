import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import Handlebars from 'handlebars';
import { promisify } from 'util';
import g from 'glob';
const glob = promisify(g);

const handlebarsHelpers = {
  json: (data) => JSON.stringify(data, null, 2)
};

class Template {

  constructor({ templatePath, stack, command }){
    this.path = templatePath;
    this.stack = stack;
    this.command = command;
  }

  toJSON(){
    // ignore stack/command from JSON as it can result in circular loop (since stack contains commands, which contain templates)
    return {
      path: this.path,
    };
  }

  async _getTemplateFiles(){
    // Get all files in the template folders
    const globExpression = path.resolve(this.path, '**', '*');
    // include dotfiles (like .gitignore) and exclude directories
    return await glob(globExpression, { dot: true, nodir: true });
  }

  _getFileDestinationPath(templateFilePath, project, userOptions) {
    // given a file like "/my/template/some/file.js"
    // we can generate its final destination path as in "/my/final/destination/some/file.js"
    // Note we remove the ".hbs" extension that marks it as a handlebars template
    const fileRelativePathInsideTemplate = path.relative(this.path, templateFilePath);
    let fileDestinationPath = path.resolve(project.locationPath, fileRelativePathInsideTemplate).replace('.hbs', '');

    // templates can reference userOptions (like the name argument of "dx generate" commands) in their folder structure or file name
    // so the generated folder/file names can be determined by user provided options
    // Any string __optionName__ in a template's folder/file name, will be replaced with the option value
    for (const optionName in userOptions) {
      fileDestinationPath = fileDestinationPath.replace(
        new RegExp(`__${optionName}__`,'g'),
        userOptions[optionName]);
    }

    return fileDestinationPath;
  }

  async _ensureDir(destinationFilePath) {
    const destinationFileDir = path.parse(destinationFilePath).dir;
    // No need to check if dir exists, mkdir already handles it gracefully
    // const dirExists = await fs.promises.stat(destinationFileDir).catch(() => false);
    // if (dirExists) return;

    await fs.promises.mkdir(destinationFileDir, {recursive: true });
  }

  async _copyFile(templateFilePath, destinationFilePath, userOptions) {
    const failIfExists = userOptions.override ? null : fs.constants.COPYFILE_EXCL;

    await fs.promises.copyFile(templateFilePath, destinationFilePath, failIfExists);
    console.log(chalk.grey(`Copied ${destinationFilePath}`));
  }

  async _renderHandlebarsTemplateFile(templateFilePath, destinationFilePath, { project, userOptions }) {
    // Compile template file into a handlebars template
    const templateFileData = await fs.promises.readFile(templateFilePath);
    const handlebarsTemplate = Handlebars.compile(templateFileData.toString());

    // Render the file using the context data
    const renderedFile = handlebarsTemplate(
      // model passed to the template file
      {
        project,
        stack: this.stack,
        command: this.command,
        userOptions
      },
      // TODO: allow defining custom handlebars helpers as part of either stack or template
      { helpers: handlebarsHelpers }
    );

    // Save the rendered file
    await fs.promises.writeFile(destinationFilePath, renderedFile, {
      encoding: 'utf8',
      flag: userOptions.override ? 'w' : 'wx' // see https://nodejs.org/api/fs.html#fs_file_system_flags
    });
    console.log(chalk.grey(`Rendered ${destinationFilePath}`));
  }

  async _renderSingleFile(templateFilePath, { project, userOptions }){
    const destinationFilePath = this._getFileDestinationPath(templateFilePath, project, userOptions);

    // Ensure the destination directory where the file will be rendered exists
    await this._ensureDir(destinationFilePath);

    // either render the file using handlebars or just copy it to the destination
    if (path.extname(templateFilePath) === '.hbs'){
      await this._renderHandlebarsTemplateFile(templateFilePath, destinationFilePath, { project, userOptions });
    } else {
      await this._copyFile(templateFilePath, destinationFilePath, userOptions);
    }

    return destinationFilePath;
  }

  async render({ project, userOptions }){
    const templateFiles = await this._getTemplateFiles();

    const renderedFiles = await Promise.all(templateFiles.map(templateFilePath =>
      this._renderSingleFile(templateFilePath, { project, userOptions })
    ));

    return renderedFiles;
  }

}

export default Template;
