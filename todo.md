# TODO

## Importing custom models
There are two options:
1. Import files
2. Some kind of model management service similar to DNS

## Rendering templates
Easiest method is to use Polymer 1.0, but then I'm relying on a system which could easily change.

## Namespaces
Since I want to be able to share data types and rendering engines across platforms, and because I want a server to be able to handle multiple sites, a namespace system is going to be needed.

## Sandboxing
The code as data system that is being used opens up a lot of potential security issues. A sandbox system is going to be needed in order to protect the server.

## Clean up multiple access methods
Because of the original nature of the software package, and the desire to add a virtual file system, there is some question of how well the database access method and filesystem access method will integrate smoothly.

## Standardize error messages
A client won't be able easily understand the human readable error messages.
