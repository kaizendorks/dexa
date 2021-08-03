# dexa

dexa is a CLI tool that allows developers and teams to capture their preferred tech stacks as a project template and a set of code generators.

Each of these stacks is captured as a git repository. Create them in a publicly available service such as Github to encourage usage and sharing across the wider community. But you are also free to use dexa with private repositories.

> Requires **Node.js 14** or later!

* [Installation](#installation)
* [Introduction](#introduction)
    * [How can dexa help you?](#how-can-dexa-help-you)
    * [Is it limited to JavaScript projects?](#is-it-limited-to-javascript-projects)
    * [Can I use a project template without generators?](#can-i-use-a-project-template-without-generators)
* [Usage](#usage)
* [API](#api)
* [Examples](#examples)
* [Roadmap](#roadmap)
* [Licence](#license)

## Installation

You can install dexa as a global tool, making the `dx` executable available in your shell:
```sh
# install
npm install -g dexa
# verify
dx --version
```

Alternatively, you can use `npx` to run dexa commands without installing as a global tool:
```sh
npx dexa --version
```

## Introduction

### How can dexa help you?

Imagine you work in a team that frequently creates web applications with Vue3 and fastify. You probably have an opinionated way of setting these up, so you can capture your project template in a repo. This way you can `dx stack add` your repo as a _stack_ in dexa, so you can later create projects with `dx init my-vue-fastify-template`.

You might sometimes use docker, you can then expand your stack repo with another template that adds docker and compose files so you can `dx add docker`. In some projects you might use postgre while in others you might use mongoDB, you can then capture 2 further templates that allow you to `dx add postgre` or `dx add mongo` to your project.

You will likely find yourself regularly creatin elements like pages or apis to your web application. Dexa can also help you by expanding your stack with template generators so you can `dx generate page new-page` or `dx generate api new-api`!

This means you can create your dexa stack as a repo with the following structure:
```
/
|__ /init
|   |__ fileA // can be any extension (and copied as is) or `.hbs` (with replacements and helpers)
|   |__ /some/folder/fileB
|   |__ ... more template files and folders
|__ /add
|   |__ /docker
|   |   |__ ...
|   |__ /postgre
|   |   |__ ...
|   |__ /mongo
|       |__ ...
|__ /generate
|   |__ /api
|   |   |__ ...
|   |__ /page
|       |__ ...
|__ dexa.js // optional file, defines additional metadata/options/arguments for each template
```

Once the stack is defined in a repo:
- Install the stack by pointing to the repo, as in `dx stack add git@github.com:DaniJG/my-stack.git`
- Create a new project using the name of the stack, as in `dx init my-stack`
- Add stack features to a generated project by running `dx add` commands within the project root folder, as in `dx add docker`
- Generate code by running `dx generate` commands within the project root folder, as in `dx generate page my-new-page`

### Is it limited to JavaScript projects?

Absolutely not! While dexa is written in JavaScript, you can define stack templates for any language. In a nutshell, dexa will render the templates you define, what those templates contain is entirely up to you.

For example, you could create a terraform stack so you can `dx init terraform`. This stack could define features such as S3 or azure blob remote storage so you can `dx add remote-aws-s3` or `dx add remote-azure-blob`. In a similar fashion, you could then create generators for any common terraform modules you typically use, allowing you to `dx generate s3-bucket` or `dx generate aws-kubernetes`.

### Can I use a project template without generators?

You can define a stack by pointing to a repo that contains just a project template like this [vue-vite-tailwind](https://github.com/web2033/vite-vue3-tailwind-starter) starter
```
dx stack add vue-vite https://github.com/web2033/vite-vue3-tailwind-starter
```

You will be able to create new projects using that template as in `dx init vue-vite`, but here will be no `dx add` or `dx generate` commands available for those generated projects.

This is similar to using [degit](https://github.com/Rich-Harris/degit), except you can keep track of these templates as dexa stacks.

## Usage

TBC

## API

TBC

## Examples

TBC

## Roadmap

Init:
- DONE - create project from one of the current stacks init template
- DONE - add integration tests
- DONE - introduce project/stack classes
- DONE - create a dexarc file after generating the project
- optionally create new git repo and first commit
- add custom pre/post actions in stack's dexa.js. Call same signature than the .action (since its based on defined arguments/options)
- override default action (render template) in dexa.js. In addition to parameters of pre/post actions, inject a `dexa` object with methods to for example render a template
- add custom helpers for the templates

Stack:
- DONE add stack from git repo, using degit
- DONE move predefined stacks away from "stacks.json" (which should be gitignored and just created on save by stacks-manager)
- DONE add "init only" stack from git repo (ie, repo that doesnt have init/add/generate folders, the entire repo is just an init template)
- DONE remove stack
- DONE Add tests for add/init/remove stack from git
- DONE allow specifying a "path" inside the repo, to support repos defining multiple stacks
- manage versions of stacks (update stack, keep track of version used with project). Stack version taken from the hash parameter of the source (as in `#v1.0.3`). Update command can be invoked as `dx stack update foo` so downloads and overrides the default version, or `dx stack update foo branch-or-tag` so it downloads version `#branch-or-tag`
- once we have a repo with example stacks, repoint tests so we dont depend on 3rd party repos/templates that might change

Add:
- requires to be run in folder with `dexarc` file
- automatically download stack if not currently installed
- allow stacks to define their "add" commands, by just adding a template folder inside `/add`. No need for any extra config or metadata in `dexa.js`
- allow extra config/metadata to be defined in dexa.js. A `defineCommand` method receives the commander program so users can add additional parameters/options. The same pre/post/action than in init are available
- allow users to optionally include available "add" commands when initializing a project
- allow command to depend on other add commands (fail if not added before)

Generate:
- allow stacks to define their "generate" commands, by just adding a template folder inside `/generate`. No need for any extra config or metadata in `dexa.js`, all commands will take a `[name]` required argument as in `dx generate page my-new-page`
- allow extra config/metadata to be defined in dexa.js. A `defineCommand` method receives the commander program so users can add additional parameters/options. The same pre/post/action than in init are available

Overrides:
- projects can override specific generators with a combination of dexarc and templates inside the .dexa folder
- projects can add their own additional generators in a similar fashion

Stacks:
- predefined "init" only stack to create your own stack
- vite + fastify stack

## License

MIT © [by its authors](https://github.com/kaizendorks/dexa/graphs/contributors)