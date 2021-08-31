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
    async preAction({project, stack, template, userOptions}){
      console.log(`Running the preAction method on: project=${project.name}, stack=${stack.name}, template=${template.name}, options=${userOptions}`);
    },
    async postAction({project, stack, template, userOptions}){
      console.log(`Running the postAction method on: project=${project.name}, stack=${stack.name}, template=${template.name}, options=${userOptions}`);
    }
  }
}