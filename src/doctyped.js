// @flow

import fs from 'fs';
import http from 'http';
import https from 'https';

import getSchema, { type Schema } from './builder';
import buildFiles, { FORMAT_FLOW } from './fileGenerator';
import logger from './logger';

export type PropertyValue = {| default?: mixed, type?: string |};
export type DescriptorValue = {|
  additionalProperties: PropertyValue,
  properties?: { [string]: PropertyValue },
  required?: $ReadOnlyArray<string>,
  type: string,
  xml: {}
|};
export type Descriptor = {| definitions: { [string]: DescriptorValue } |};

const DEFAULT_OPTS = { format: FORMAT_FLOW, output: null };

const getRemoteDescriptor = (url) => {
  const client = url.startsWith('https') ? https : http;

  return new Promise((resolve, reject) => {
    client.get(url, (response) => {
      let rawData = '';

      response.on('data', (chunk) => {
        rawData += chunk;
      });

      response.on('end', () => resolve(JSON.parse(rawData)));
    });
  });
};

const getLocalDescriptor = (url) => new Promise((resolve, reject) => {
  fs.readFile(url, (err, data) => {
    try {
      if (!data) {
        throw err;
      }

      resolve(JSON.parse(data.toString()));
    } catch (e) {
      logger(e.message);
      reject(new Error('Could not resolve path locally'));
    }
  });
});

const getDescriptor = async (url): Promise<Descriptor> => {
  try {
    const response = await getLocalDescriptor(url);

    return response;
  } catch (e) {
    logger(e.message);
    const response = await getRemoteDescriptor(url);
    return response;
  }
};

export default async (url: string, options: {| output?: string |}): Promise<Schema> => {
  const { format, output } = { ...DEFAULT_OPTS, ...options };
  const { definitions } = await getDescriptor(url);
  const schema = getSchema(definitions);

  if (typeof output === 'string') {
    buildFiles(format, output, schema);
  }

  return schema;
};
