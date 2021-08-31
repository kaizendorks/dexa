import path from 'path';
import { promisify } from 'util';
import g from 'glob';
const glob = promisify(g);
import {
  getFileDestinationPath,
  ensureDir,
  copyFile,
  renderHandlebarsTemplateFile,
} from './template-utils.js';

const defaultValues = () => ({
  name: 'init',
  description: '',
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
    const destinationFilePath = getFileDestinationPath(this.path, templateFilePath, destinationPath, userOptions);

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

  async _render({ destinationPath, project, userOptions }){
    const templateFiles = await this._getTemplateFiles();

    const renderedFiles = await Promise.all(templateFiles.map(templateFilePath =>
      this._renderSingleFile(templateFilePath, {
        destinationPath,
        project,
        userOptions,
      })
    ));

    return renderedFiles;
  }

  async apply({ destinationPath, project, userOptions }){
    await this._runPreAction({project, userOptions});

    const renderedFiles = await this._render({ destinationPath, project, userOptions });

    await this._runPostAction({project, userOptions, renderedFiles});

    return renderedFiles;
  }

}

export default Template;