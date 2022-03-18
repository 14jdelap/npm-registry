# Exercise

NodeJS has a managed packages environment called `npm`. A package is a
functional NodeJS module with versioning, documentation, dependencies (in the
form of other packages), and more.

This repository contains a basic NodeJS server with a `/package` endpoint. When
passed a package name and version, the endpoint returns the dependencies of that
package.

## Task

1. Update the `/package` endpoint, so that it returns all of the transitive
   dependencies for a package, not only the first order dependencies

2. Present these dependencies in a tree view that can be viewed from a Web Browser (you can use any technologies you find suitable)

## Things to consider

* Look at the inner "dependencies" object of a package for analysis of
  first-order dependencies.
* npm returns dependency ranges that follow the
  [Semantic Versioning](https://semver.org/) specification, which you'll need to
  account for.
* The packages update from time to time, just as their dependencies do.
* What makes a good web service? API, performance, data storage, low latency,
  scalability, monitoring, a great web interface, you name it :)
* Consider the quality and structure of your codebase; is it maintainable?
* Consider production readiness (to some extent) and is it safe to deploy changes?
