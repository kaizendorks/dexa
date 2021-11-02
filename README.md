# dexa

> create awesome project templates turbocharged with generators/scaffolders!

dexa is a CLI tool that allows developers and teams to capture their preferred _tech stacks_ as a project template and a set of code generators.

Each of these stacks can be distributed as a git repository. Create them in a publicly available service such as Github to encourage usage and sharing across the wider community. But you are also free to use dexa with private repositories.

* [Installation](#installation)
* [Getting started](#getting-started)
* [Reference](#reference)
    * [Installing stacks](#installing-stacks)
    * [Using stacks](#using-stacks)
    * [Creating stacks](#creating-stacks)
* [API](#api)
* [Examples](#examples)
* [FAQ](#introduction)
    * [How can dexa help you?](#how-can-dexa-help-you)
    * [Is it limited to JavaScript projects?](#is-it-limited-to-javascript-projects)
    * [Can I use a project template without generators?](#can-i-use-a-project-template-without-generators)
* [Changelog and Roadmap](#changelog-and-roadmap)
* [Licence](#license)

## Installation

> Requires **Node.js 14** or later!

You can install dexa as a global tool, making the `dx` executable available in your shell:
```sh
# install
npm install -g dexa
# verify
dx --version
dx stack list
```

Alternatively, you can use `npx` to run dexa commands without installing as a global tool:
```sh
npx dexa --version
npx dexa stack list
```

## Getting started

### What is a stack
Dexa allows users to create and use **stacks**, where each stack is a project template combined with CLI commands such as code generators or feature installers. To better understand what a **stack** is, let's use an existing stack in our test samples.

The [hello-world-stack](test/stack-fixtures/hello-world-stack) creates a _hello world_ Node.js console application. To install the stack, use the `dx stack add` command, pointing to the git repo where the stack is located
```
dx stack add hello-world https://github.com/kaizendorks/dexa/test/stack-fixtures/hello-world-stack
```

Let's now create a **project** using the stack. For this, you use the `dx init` command and the name you gave to the stack when installed.
```
dx init hello-world my-first-project
```
> You can see all the installed stacks with `dx init --help`

Once finished, it will have created a new folder named `my-first-project`, which contains the project created by the stack.
Let's run the project to verify it indeed created a working project:
```
cd ./my-first-project
node index.js
Hello World!
```

Awesome, looks like the stack successfully creates hello world console applications.

Let's now explore the **commands** available with this stack. Any stack can define 2 flavours of commands:
- **feature installers**, which are available through `dx add` in the CLI. These are meant to be optional project features that are optionally _added once_ to each project
- **code generators**, which are available through `dx generate` in the CLI. Thse encapsulate the boilerplate code for elementes of which you can add many to your project, like a page or a crud-API

> Each stack is defined with a particular domain in mind, so the commands implemented by each stack will be based on that context. For example, a stack for creating web applications with Vue.js and Fastify migh provide _features_ such as `unit-test`, `i18n` or `graphQL`, and _generators_ such as `page`, `component` or `rest-api`.

Let's see them in action. Begin by adding the `unit-test` feature:
```
dx add unit-test
```

This has added a very simple unit test to our project. For completeness, let's verify it works
```
node ./test/greeter.test.js
```

Great, now let's generate the code for a new `greeter`, so the application says more than `"Hello World"`
```
dx generate greeter tutorial
```

And verify it generated working code
```
node index.js
Hello World!
Hello World from the greeter tutorial!
```

> Note the parameter `tutorial` provided in the command has been used inside the template of the `greeter` command.

Yay, the stack can generate code! You can cleanup with:
```
cd ../
rm -rf ./my-first-project
dx stack delete hello-world
```

### How to create a stack

The sample hello world stack we have seen above is great to get a sense on how dexa works. But chances are that you are not interested in creating more Node.js hello world applications.

The good news are that you can create your own stacks, and define whatever project templates and commands you want!
Let's see how to create one.

A stack just needs to follow a certain structure organising the commands and their templates:
```
/init
  the project template
/add
  each feature installer command has a subfolder here that contains the feature template
/generate
  each code generator command has a subfolder here with the generator template
```
> This is the basic structure. See the reference guide for more advanced usages

To make things even simpler, dexa comes with a predefined stack named `dexa-stack` that can be used to create your own stacks:
```
dx init dexa-stack my-stack
```

If you inspect the generated files, it looks like this:
```
my-stack
├── README.md
├── add
│   └── README.md
├── generate
│   └── README.md
└── init
    ├── sample-copy.md
    └── sample-template.md.hbs
```

> Those various README.md files contain valuable information on how a stack works and how you can update the project template as well as creating your own commands.

Can we now test our stack? Yes you can test it directly from its local folder, without publishing it to git.

As per the development instructions in the generated README.md file, install the stack by running in its root folder:
```
dx stack add my-stack $(pwd)
```

Now on a separated terminal and folder, try generating a project using your stack:
```
dx init my-stack test-project
```

If you inspect the generated project, you will notice the stack used the project template defined inside its ./init folder.
```
test-project
├── sample-copy.md
└── sample-template.md
```

Take a moment to inspect the files inside the `./init` template folder. Notice how the `.hbs` extension makes the file a dynamic template with placeholders. If you want to regenerate the project after modifying the files, use the same init command with the override flag (`--override` or `-o`):
```
dx init my-stack test-project --override
```

### How to add commands to a stack

Let's now see how to define commands. Each command has a folder containing its code template, similar to the `./init` template. The template folder for a _feature installer_ command lives inside the `./add` folder, while the template folder for a _code generator_ command lives inside the `./generate` folder.

You can manually create these folders, or use the commands provided by the `dexa-stack` stack. For example, lets add a feature command using:
```
dx generate feature my-feature
```

Your stack should now like follows:
```
my-stack
├── README.md
├── add
│   ├── README.md
│   └── my-feature
│       └── README.md
├── generate
│   └── README.md
└── init
    ├── sample-copy.md
    └── sample-template.md.hbs
```

Take a moment to create some files and subfolder inside the `./add/my-feature` folder.

Once you are ready, navigate to the folder where you created the `test-project`. Let's try your feature command:
```
dx add my-feature
```

Awesome! You have created your first feature command.

Try the same with the code generator. Back at the root of the stack definition, run (please bear with me):
```
dx generate generator my-generator
```

Notice there is a new folder `./generate/my-generator` which contains the template for the new command.
```
my-stack
├── README.md
├── add
│   ├── README.md
│   └── my-feature
│       └── README.md
├── generate
│   ├── README.md
│   └── my-generator
│       └── README.md
└── init
    ├── sample-copy.md
    └── sample-template.md.hbs
```

As before, take another moment to update/create files inside the template folder `./generate/my-generator`.

> When a user invokes a `dx generate` command, in addition to the name of the generator, there is a second parameter which is the name of that particular instance of the generator.
> For example, assume a generator that creates new REST APIs. You might run `dx generate rest-api customer` and `dx generate rest-api profile` to create the customer and profile APIs respectively
> The `__name__` part of any of the template file/folder names will be replaced with `customer` and `profile` respectively. Inside any `.hbs` files of the template, you can similarly use the placeholder `{{ userOptions.name }}`.

Once you are ready, navigate to the `test-project` folder and give it a go:
```
dx generate my-generator foo
```

Great! And this finishes the basics on how to create your own stacks.

> Check the reference section for more advanced scenarios like adding extra input parameters or defining functions to run when invoking the code generators.

### Publish the stack

The only remaining (optional) step is to publish your stack so others can use it!

Simply publish the stack to a git repo, allowing anyone with access to that repo to install the stack. For example, if you publish your stack as a public Github repo, users of your stack can install it using a command like:
```
dx stack add https://github.com/username/reponame
```

## Reference

### Installing stacks

TBC

### Using stacks

TBC

### Creating stacks

TBC

## API

TBC

## Examples

See [test stacks](test/stack-fixtures)

## FAQ

### How can dexa help you?

Imagine you work in a team that frequently creates web applications with Vue3 and fastify. You probably have an opinionated way of setting these up, so you can capture your project template in a repo. This way you can `dx stack add` your repo as a _stack_ in dexa, so you can later create projects with `dx init my-vue-fastify-template`.

You might sometimes use docker, you can then expand your stack repo with another template that adds docker and compose files so you can `dx add docker`. In some projects you might use postgre while in others you might use mongoDB, you can then capture 2 further templates that allow you to `dx add postgre` or `dx add mongo` to your project.

You will likely find yourself regularly creating elements like pages or apis to your web application. Dexa can also help you by expanding your stack with template generators so you can `dx generate page new-page` or `dx generate api new-api`!

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

### Is it limited to JavaScript or web projects?

Absolutely not! While dexa is written in JavaScript, you can define stack templates for any language. In a nutshell, dexa will render the templates you define, what those templates contain is entirely up to you.

For example, you could create a terraform stack so you can `dx init terraform`. This stack could define features such as S3 or azure blob remote storage so you can `dx add remote-aws-s3` or `dx add remote-azure-blob`. In a similar fashion, you could then create generators for any common terraform modules you typically use, allowing you to `dx generate s3-bucket` or `dx generate aws-kubernetes`.

### Can I use a project template without generators?

You can define a stack by pointing to a repo that contains just a project template like this [vue-vite-tailwind](https://github.com/web2033/vite-vue3-tailwind-starter) starter
```
dx stack add vue-vite https://github.com/web2033/vite-vue3-tailwind-starter
```

You will be able to create new projects using that template as in `dx init vue-vite`, but here will be no `dx add` or `dx generate` commands available for those generated projects.

This is similar to using [degit](https://github.com/Rich-Harris/degit), except you can keep track of these templates as dexa stacks.

# Changelog and Roadmap

See [CHANGELOG.md](./CHANGELOG.md)

## License

MIT © [by its authors](https://github.com/kaizendorks/dexa/graphs/contributors)

See [LICENSE.md](./LICENSE.md)
