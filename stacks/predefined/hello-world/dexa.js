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