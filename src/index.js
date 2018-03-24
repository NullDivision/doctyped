#! /usr/bin/env node

require('yargs')
  .usage('Usage: $0 /path/to/descriptor')
  // help
  .help()
  .alias('help', 'h')
  // version
  .version(require('../package.json').version)
  .alias('version', 'v')
  .option('output', { alias: 'o' })
  .describe('output', 'Destination directory')
  .command(
    '$0 <file>',
    'parse descriptor',
    (yargs) => yargs.positional('file', { describe: 'file or url', type: 'string' }),
    ({ file, ...opts }) => require('./doctyped')(file, opts)
  )
  .argv;
