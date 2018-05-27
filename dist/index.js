#! /usr/bin/env node
'use strict';

var _yargs = require('yargs');

var _yargs2 = _interopRequireDefault(_yargs);

var _doctyped = require('./doctyped');

var _doctyped2 = _interopRequireDefault(_doctyped);

var _package = require('../package.json');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

_yargs2.default.usage('Usage: $0 /path/to/descriptor')
// help
.help().alias('help', 'h')
// version
.version(_package.version).alias('version', 'v').option('output', { alias: 'o' }).describe('output', 'Destination directory').command('$0 <file>', 'parse descriptor', yargs => yargs.positional('file', { describe: 'file or url', type: 'string' }), (_ref) => {
  let { file } = _ref,
      opts = _objectWithoutProperties(_ref, ['file']);

  return (0, _doctyped2.default)(file, opts);
}).argv;