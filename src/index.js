#! /usr/bin/env node

import yargs from 'yargs';

import doctyped from './doctyped';
import { version } from '../package.json';

yargs
  .usage('Usage: $0 /path/to/descriptor')
  // help
  .help()
  .alias('help', 'h')
  // version
  .version(version)
  .alias('version', 'v')
  .option('output', { alias: 'o' })
  .option('api', { alias: 'a', demand: true })
  .option('authorization')
  .describe('output', 'Destination directory')
  .command(
    '$0 <file>',
    'parse descriptor',
    (yargs) => yargs.positional('file', { describe: 'file or url', type: 'string' }),
    ({ file, ...opts }) => doctyped(file, opts)
  )
  .argv;
