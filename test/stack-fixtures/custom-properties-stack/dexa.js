import { assert } from 'console';
import fs from 'fs';

// This file is optional. Dexa is able to inspect the folder structre:
//      /hello-world
//        /init
//          ...
//        /add
//          /unit-test
//            ...
//        /generate
//          /greeter
//            ...
//
// and automatically figure out that the "hello-world" stack has
// an init template, as well as one add template (dx add unit-test) and one generate template (dx generate greeter)

// However using this file it is possible to further customize these templates and generators

// To use ES modules, you need to either:
//    have a package.json file in the stack where you set the type:module
//    use the .mjs extension
// Alternatively, use commonJS syntax as in module.exports = { ... }
export default {
  init: {
    description: 'Create a new hello-world console app to verify that dexa works as expected',
    async action({project, stack, template, userOptions}){
      console.log(`Running the action method on: project=${project.name}, stack=${stack.name}, template=${template.name}, options=${userOptions}`);

      // should have run _after_ the preAction
      assert(userOptions.myInjectedOption === 42);

      // running async code is allowed
      // this could be any arbitrary code. It could also end up running its default action, rendering the template as below
      const renderedFiles = await template._render({ project, userOptions });
      return { myReturnedValue: 123, renderedFiles };
    },
    async preAction({project, stack, template, userOptions}){
      // running async code is allowed
      const projectFolderExists = await fs.promises.stat(project.locationPath).catch(() => false);

      // can modify the provided userOptions
      Object.assign(userOptions, {
        myInjectedOption: 42,
        projectFolderExists
      });

      console.log(`Running the preAction method on: project=${project.name}, stack=${stack.name}, template=${template.name}, options=${userOptions}`);
    },
    async postAction({project, stack, template, userOptions, actionResult}){
      // running async code is also allowed
      const projectFolderExists = await fs.promises.stat(project.locationPath).catch(() => false);

      // should have run _after_ both the preAction and action
      assert(projectFolderExists);
      assert(userOptions.myInjectedOption === 42);

      // should receive the returned result from the action method
      assert(actionResult.myReturnedValue === 123);
      assert(actionResult.renderedFiles.length > 0);

      console.log(`Running the postAction method on: project=${project.name}, stack=${stack.name}, template=${template.name}, options=${userOptions}`);
    }
  }
}