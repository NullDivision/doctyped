import * as http from 'http';
import * as https from 'https';

import { API_TYPE, Schema, build } from './builder';
import { FORMAT_TYPE, generateFile } from './fileGenerator';
import { getDescriptorResolver } from './reader';

export { API_TYPE } from './builder';

interface Options {
  api: API_TYPE;
  authorization?: string;
  format?: FORMAT_TYPE;
  output?: string
};

const DEFAULT_OPTS = { format: FORMAT_TYPE.FLOW, output: null };

const getClient = (url) => url.startsWith('https') ? https : http;

export async function doctyped (
  url: string,
  options: Options
): Promise<Schema> {
  const { api, authorization, format, output } = { ...DEFAULT_OPTS, ...options };
  const headers = authorization ? { Authorization: authorization } : {};

  const describe = getDescriptorResolver(getClient(url));
  const definitions = await describe(api, { headers, uri: url });
  // @ts-ignore
  const schema = build(api)(definitions);

  if (typeof output === 'string') {
    generateFile(format, output, schema);
  }

  return schema;
};
