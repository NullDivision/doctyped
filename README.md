# doctyped · [![Build Status](https://travis-ci.com/NullDivision/doctyped.svg?branch=master)](https://travis-ci.com/NullDivision/doctyped)

## Description

Auto-generate Flow or TypeScript types from API documentation descriptions.

## Installing
`yarn add -D doctyped` or `npm install --save-dev doctyped`

## Usage
### Node
```javascript
import doctyped from 'doctyped/doctyped';

const types = doctyped('/path/to/descriptor');
```
The above code will generate an object containing all models and properties defined by the swagger descriptor.
This is useful if we want to run checks against types in the runtime environment.
Optionally, we can pass an options object `{ output: '/someoutput/path' }`as the second argument that will generate `js.flow` files.
### CLI
```
yarn doctyped -a <flow-or-ts> -o <destination-directory> <api-url>
```
