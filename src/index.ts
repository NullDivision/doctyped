#! /usr/bin/env node

import { usage } from 'yargs';

// @ts-ignore
import doctyped from './doctyped';

const packageVersion = process.env.npm_package_version;

if (!packageVersion) throw new Error('Invalid package version');

usage('Usage: $0 /path/to/descriptor')
  // help
  .help()
  .alias('help', 'h')
  // version
  .version(packageVersion)
  .alias('version', 'v')
  .option('output', { alias: 'o' })
  .option('api', { alias: 'a', demand: true })
  .option('authorization', {})
  .describe('output', 'Destination directory')
  .command(
    '$0 <file>',
    'parse descriptor',
    (yargs) => yargs.positional('file', { describe: 'file or url', type: 'string' }),
    ({ file, ...opts }) => doctyped(file, opts)
  )
  .argv;

// @ts-ignore
export const doctyped = doctyped;
