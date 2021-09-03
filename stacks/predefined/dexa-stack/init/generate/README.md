any folder you create here is automatically detected as a `dx generate` command.

ie, if you add a folder `/my-generator` it automatically wires the command `dx generate my-generator`.
Inside each generator folder, you can use handlebars templates in the same way than in the init template.

Use the generator commands for things you would _generate multiple times_ in a project, such as pages, APIs or components