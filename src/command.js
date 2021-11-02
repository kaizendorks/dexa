import Template from './template.js';

const defaultValues = () => ({
  name: 'init',
  description: '',
  templatePath: '',
  stack: {},
  postAction: null,
  preAction: null,
});

class Command {

  constructor(templateJSONData){
    Object.assign(this, defaultValues(), templateJSONData);

    this.template = new Template({
      templatePath: this.templatePath,
      stack: this.stack,
      command: this
    });

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

  async _runPreAction({project, userOptions}){
    if (!this.preAction) return;
    await this.preAction({project, stack: this.stack, command: this, userOptions});
  }

  async _runPostAction({project, userOptions, actionResult}){
    if (!this.postAction) return;
    await this.postAction({project, stack: this.stack, command: this, userOptions, actionResult});
  }

  async _runAction({project, userOptions}){
    // By default, we just render the template
    // However users can override the template's action method with any arbitrary implementation
    if (this.action) {
      return await this.action({ project, stack: this.stack, command: this, userOptions });
    } else {
      const renderedFiles = await this.template.render({ project, userOptions });
      return { renderedFiles };
    }
  }

  async apply({ project, userOptions }){
    await this._runPreAction({project, userOptions});
    const actionResult = await this._runAction({ project, userOptions });
    await this._runPostAction({project, userOptions, actionResult});

    return actionResult;
  }

}

export default Command;