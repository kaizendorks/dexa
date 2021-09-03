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
// While having access to the same libraries/utilities that dexa does (like execa or inquirer, see peerDependencies in package.json)
// NOTE, to use ES modules in this file, make sure to either:
//    have a package.json file in the stack where you set the type:module
//    use the .mjs extension

export default {
  init: {
    description: 'Initializes my awesome project',
    async preAction({project, stack, template, userOptions}){
      console.log(`Running the preAction method on: project=${project.name}, stack=${stack.name}, template=${template.name}, options=${userOptions}`);
    },
    async postAction({project, stack, template, userOptions}){
      console.log(`Running the postAction method on: project=${project.name}, stack=${stack.name}, template=${template.name}, options=${userOptions}`);
    },
  },

  // You can customize any "dx add" command defined by your stack
  add: {
    // "my-feature": {
    //   description: "Adds the my-feature feature to the initialized project",
    //   async preAction({project, stack, template, userOptions}){
    //     console.log(`Running the preAction method on: project=${project.name}, stack=${stack.name}, template=${template.name}, options=${userOptions}`);
    //   },
    //   async postAction({project, stack, template, userOptions}){
    //     console.log(`Running the postAction method on: project=${project.name}, stack=${stack.name}, template=${template.name}, options=${userOptions}`);
    //   },
    // }
  },

  // You can also customize any "dx generate" command defined by your stack
  generate: {
    // "my-generator": {
    //   description: "Generates code in the initialized project using my-generator generator",
    //   async preAction({project, stack, template, userOptions}){
    //     console.log(`Running the preAction method on: project=${project.name}, stack=${stack.name}, template=${template.name}, options=${userOptions}`);
    //   },
    //   async postAction({project, stack, template, userOptions}){
    //     console.log(`Running the postAction method on: project=${project.name}, stack=${stack.name}, template=${template.name}, options=${userOptions}`);
    //   },
    // }
  }
}