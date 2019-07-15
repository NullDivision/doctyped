#! /usr/bin/env node

import { usage } from 'yargs';

import { API_TYPE, doctyped as _doctyped } from './doctyped';

const packageVersion = process.env.npm_package_version;

if (!packageVersion) throw new Error('Invalid package version');

usage('Usage: $0 /path/to/descriptor')
  // help
  .help()
  .alias('help', 'h')
  // version
  .version(packageVersion)
  .alias('version', 'v')
  .option('output', { alias: 'o', string: true })
  .option(
    'api',
    { alias: 'a', choices: Object.values(API_TYPE), demand: true }
  )
  .option('authorization', { string: true })
  .describe('output', 'Destination directory')
  .command(
    '$0 <file>',
    'parse descriptor',
    (yargs) => yargs.positional('file', { describe: 'file or url', type: 'string' }),
    ({ file, ...opts }) => {
      if (!file) throw new Error('File not provided');

      doctyped(file, opts)
    }
  )
  .argv;

export const doctyped = _doctyped;
