any folder you create here is automatically detected as a `dx add` command.

ie, if you add a folder `/my-feature` it automatically wires the command `dx generate my-feature`.
Inside each feature folder, you can use handlebars templates in the same way than inside the template files for the init command.

Use the feature commands for things you would _add once_ to a project, such as test support, docker files, a helm chart, a particular library, etc