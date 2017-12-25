#! /usr/bin/env node

require('yargs')
  .usage('Usage: $0 /path/to/descriptor')
  // help
  .help()
  .alias('help', 'h')
  // version
  .version(require('../package.json').version)
  .alias('version', 'v')
  .command(
    '$0 <file>',
    'parse descriptor',
    (yargs) => yargs.positional('file', { describe: 'file or url', type: 'string' }),
    ({ file }) => require('./doctyped')(file)
  )
  .argv;
