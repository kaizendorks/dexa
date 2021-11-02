# dexa Changelog

## Releases

### 0.3.1

#### General
- added npmignore to exclude files from published package
- Refactor stack-manager to use top-level await when loading all the stacks. Every time a stack is loaded/created, its init/add/generate templates are loaded with an async method `loadTemplates` that combines default information with any custom properties defined in the optional `dexa.js` file of the stack.

#### Template
- rename the `render` method as `apply`, since not every template will copy/render files. Some might provide a custom overriden action and just use execa to for example `npx fastify-cli init`

#### Init
- add optional description for stack in dexa.js, use it as `program.description` when wiring all the `dx init` commands. (would need to refactor current dx-add.js to create a command per stack)
- add custom pre/post actions in stack's dexa.js. Call same signature than the .action (since its based on defined arguments/options)

#### Add
- allow extra config/metadata to be defined in dexa.js.
    - description
    - The same pre/postAction than in init are available

Generate:
- allow extra config/metadata to be defined in dexa.js.
    - description
    - The same pre/postAction than in init are available

### 0.3.0

#### General
- Rewrite to ES6. This will better align the project so customizations in stacks are also preferably done in ES modules, as well as supporting top-level async-await

#### Stack management
- Can now add stacks from a local folder using `dx stack add` (previously only stack from git repos could be added). This will help testing stacks while they are created/updated, as well as testing features of dexa like prompt to install stack when executing `dx add/generate` commands.

#### Add command
- First implementation of the command now available. Stacks can define their own "add" commands by just adding template folders inside their `/add`, for example adding `./add/unit-test` makes `dx add unit-test` available for projects using that stack. There is zero config or metadata needed other than the template folder.
- The `dx add` command has to be run in the context of the root folder of a project previously initialized with `dx init` (ie, a folder that contains a `.dexarc` file). A specific error is returned if the command is run in other folders
- In case the `.dexarc` file references a stack not found locally, the `dx add` command will automatically prompt the user to install the stack.

#### Generate command
- First implementation of the command now available. Stacks can define their own "generate" commands by just adding template folders inside their `/generate`, for example adding `./generate/api` makes `dx generate api` available for projects using that stack. There is zero config or metadata needed other than the template folder.
- All the `dx generate` commands will take a `[name]` required argument as in `dx generate page my-new-page`.
- The `dx generate` command has to be run in the context of the root folder of a project previously initialized with `dx init` (ie, a folder that contains a `.dexarc` file). A specific error is returned if the command is run in other folders
- In case the `.dexarc` file references a stack not found locally, the `dx generate` command will automatically prompt the user to install the stack.

### 0.2.0

#### Init
- DONE - introduce project/stack classes
- DONE - create a dexarc file after generating the project

### 0.1.0

#### Init
- DONE - create project from one of the current stacks init template
- DONE - add integration tests

#### Stack
- DONE add stack from git repo, using degit
- DONE move predefined stacks away from "stacks.json" (which should be gitignored and just created on save by stacks-manager)
- DONE add "init only" stack from git repo (ie, repo that doesnt have init/add/generate folders, the entire repo is just an init template)
- DONE remove stack
- DONE Add tests for add/init/remove stack from git
- DONE allow specifying a "path" inside the repo, to support repos defining multiple stacks


## Roadmap

### 0.4.0 - IN PROGRESS

General:
- Rename the `Template` class as `Command`. Rename its `_render` method as `renderTemplate`. Extract `renderTemplate` and `renderSingleFile` to a new `Template` class that also includes all the current private utilities in `template-utils`
- Rewrite README docs so instead of "generators" we talk of commands, which can be of 2 types: "stack features" (aka `dx add`) or "code generators" (aka `dx generate`)

Template:
- Conditional rendering of files:
    - add `makeVariant` method to manually handle scenarios where a template like `generate/api-crud` has subfolders like `/common`, `/mongo` or `/postgre` with some logic based on the project features and/or user provided options to determine which ones to render. This way in the overriding template's action method, the received template object can be used to `const commonTemplate = makeVariant('./common')` and later call `commonTemplate.render(...)` (and similar for the other variants) based on arbitrary logic as implemented by the stack.
    - allow conditional rendering of template files based on the user options. This could be done either through the file name with a convention like `unitTests=true$$myfile.hbs` meaning this file is only rendered when the user option `unitTests == true`. Alternatively, the extended options in `dexa.js` for a given template could contain an optional function to filter files based on user options (could receive an array of file paths and return a filtered array, or just return an array of regex/globs that template class will use to filter those files which match any regex/glob)

Init:
- DONE - override default action (render template) in dexa.js. After this overriden action, still have to initialize dexarc project file
- optionally create new git repo and first commit


Add:
- allow extra config/metadata to be defined in dexa.js.
    - A `defineCLICommand` method receives the commander program so users can add additional parameters/options.
    - override default action as in init template

Generate:
- allow extra config/metadata to be defined in dexa.js.
    - A `defineCLICommand` method receives the commander program so users can add additional parameters/options.
    - override default action as in init template

### 0.5.0

Init:
- allow initializing directly from a git repo without first having to `dx install` the stack. This should install the stack in the background, then initialize the new project
- add custom helpers for the templates via a property in the `dexa.js` file of the stack
- add predefined helpers like camelCase, kebapCase, and relative path between files

Add:
- allow users to optionally include available "add" commands when initializing a project (with a prompt showing them so users can select them)
- allow command to depend on other add commands (fail if not added before or prompt user to add?)

Generate:
- allow command to depend on some add command(s) (fail if not added before or prompt user to add?)

### 0.6.0

Stack:
- manage versions of stacks (new command to update stack, keep track of version used with project). Stack version taken from the hash parameter of the source (as in `#v1.0.3`). Update command can be invoked as `dx stack update foo` so downloads and overrides the default version, or `dx stack update foo branch-or-tag` so it downloads version `#branch-or-tag`

Add:
- commands are version aware. If project was created with a specific stack version and that version isnt installed locally, it will download before executing the command

Generate:
- commands are version aware. If the project was created with a specific stack version and that version isnt installed locally, it will download before executing the command

### 0.7.0

Overrides:
- projects can override specific generators by adding a `.dexa` folder at its root, with a similar structure than that of a regular stack. Any generate commands defined here take precedence over default ones in the stack
- projects can add their own additional generate commands in a similar fashion

### 0.8.0

Init:
- make the predefined hello-world a stack that only shows when enabling development/debug mode. Could be an environment variable, or check if process.env.npm_lifecycle_script exists and contains "mocha"?
- once we have a repo with example stacks, repoint tests so we dont depend on 3rd party repos/templates that might change

Stack:
- predefined "init" only stack to create your own stack

Sample stacks:
- commander CLI stack
- vite + fastify stack (can init templates be replaced by invoking vue-cli and fastify-cli???)
- terraform stack

# 0.9.0

Docs:
- Create vuepress docs site
- Move questions to FAQ
- Usage - how to create stacks, folder structure, static and handlebar files
- Usage - how to create stacks, optional dexa.js metadata
- Usage - how to create stacks, use predefined `dx init dexa-stack` stack
- Usage - managing stacks. (Add from either git or local folder, list and delete stacks)
- Usage - using stacks, how to create a project with a stack
- Usage - using stacks, how to invoke add/generate commands with a stack
- API - cli commands
- API - stack definition, optional metadata structure
- API - stack definition, arguments for metadata methods: defineCLICommand, pre/postAction, action
- API - stack definition, parameters passed to handlebars files
- Examples - predefined dexa-stack to create your own stacks
- Examples - add `dexa-stacks` repository with stacks for: node-cli, vue-fastify, terraform

## License

MIT © [by its authors](https://github.com/kaizendorks/dexa/graphs/contributors)