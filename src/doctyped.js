// @flow

import http from 'http';
import https from 'https';

import getSchema, { type Schema } from './builder';
// $FlowFixMe
import { API_GRAPHQL, API_SWAGGER } from './constants.json';
import buildFiles, { FORMAT_FLOW, FORMAT_TS } from './fileGenerator';
import getDescriptor from './reader';

type Options = {|
  api: typeof API_GRAPHQL | typeof API_SWAGGER,
  format?: typeof FORMAT_FLOW | typeof FORMAT_TS,
  output?: string
|};

const DEFAULT_OPTS = { format: FORMAT_FLOW, output: null };

const getClient = (url) => url.startsWith('https') ? https : http;

export default async (url: string, options: Options): Promise<Schema> => {
  const { api, authorization, format, output } = { ...DEFAULT_OPTS, ...options };
  const headers = authorization ? { Authorization: authorization } : {};

  const describe = getDescriptor(getClient(url));
  const definitions = await describe(api, { headers, uri: url });
  // $FlowFixMe
  const schema = getSchema(api)(definitions);

  if (typeof output === 'string') {
    buildFiles(format, output, schema);
  }

  return schema;
};
