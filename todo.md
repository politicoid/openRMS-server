# TODO

## Importing custom models
There are two options:
* Import files
* Some kind of model management service similar to DNS

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

## UML Integration
This may or may not be a useful idea. However, since UML is a general purpose modeling language, and openRMS is a general purpose resource management system, it seems like UML could be a very powerful tool for the development and management of information in openRMS.

## Direct Browser Integration
I could write my own browser, but I think a plugin would be enough. Vivaldi Browser is highly customizable, and is a good option.