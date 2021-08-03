const path = require('path');
const { promisify } = require('util');
const glob = promisify(require('glob'));
const {
  getFileDestinationPath,
  ensureDir,
  copyFile,
  renderHandlebarsTemplateFile,
} = require('./template-utils');

const defaultValues = () => ({
  path: '',
  stack: {},
  postAction: null,
  preAction: null,
});

class Template {

  constructor(templateJSONData){
    Object.assign(this, defaultValues(), templateJSONData);

    // Define properties not to be iterated nor included in toJSON
    Object.defineProperty(this, 'originalJSON', {
      enumerable: false,
      get: () => templateJSONData
    });

    // Define regular properties
    // Object.defineProperty(this, 'my-property', {
    //   enumerable: true,
    //   get: () => 42,
    // });
  }

  async _getTemplateFiles(){
    // Get all files in the template folders
    const globExpression = path.resolve(this.path, '**', '*');
    // include dotfiles (like .gitignore) and exclude directories
    return await glob(globExpression, { dot: true, nodir: true });
  }

  async _runPreAction({project, userOptions}){
    if (!this.preAction) return;
    await this.preAction({project, stack: this.stack, template: this, userOptions});
  }

  async _runPostAction({project, userOptions, renderedFiles}){
    if (!this.postAction) return;
    await this.postAction({project, stack: this.stack, template: this, userOptions, renderedFiles});
  }

  async _renderSingleFile(templateFilePath, { destinationPath, project, userOptions }){
    const destinationFilePath = getFileDestinationPath(this.path, templateFilePath, destinationPath);

    // Ensure the destination directory where the file will be rendered exists
    await ensureDir(destinationFilePath);

    // either render the file using handlebars or just copy it to the destination
    if (path.extname(templateFilePath) === '.hbs'){
      await renderHandlebarsTemplateFile(templateFilePath, destinationFilePath, {
        project,
        stack: this.stack,
        template: this,
        userOptions,
      });
    } else {
      await copyFile(templateFilePath, destinationFilePath, userOptions);
    }

    return destinationFilePath;
  }

  async render({ destinationPath, project, userOptions }){
    await this._runPreAction({project, userOptions});

    const templateFiles = await this._getTemplateFiles();

    const renderedFiles = await Promise.all(templateFiles.map(templateFilePath =>
      this._renderSingleFile(templateFilePath, {
        destinationPath,
        project,
        userOptions,
      })
    ));

    await this._runPostAction({project, userOptions, renderedFiles});

    return renderedFiles;
  }

}

module.exports = Template;