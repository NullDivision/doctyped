// @flow

import fs from 'fs';
import http from 'http';
import https from 'https';

import buildFiles, { FORMAT_FLOW } from './fileGenerator';
import logger from './logger';

type DescriptorValue = {| properties: {| [string]: {| type?: string |} |}, required?: $ReadOnlyArray<string> |};
type Descriptor = {| definitions: {| [string]: DescriptorValue |} |};
type Definitions = $PropertyType<Descriptor, 'definitions'>;
type Schema = $ReadOnlyArray<{|
  name: $Keys<Definitions>,
  properties: { [$Keys<$PropertyType<Definitions, 'properties'>>]: {| required: boolean, type: string |} }
|}>;
type SwaggerProperty = { $ref?: string, enum: Array<string>, items: SwaggerProperty, type: string };

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

const doPropertyTransform = (required) =>
  (name, { $ref, enum: optsList, items, type }: SwaggerProperty) => {
    let parsedType = '*';
    let exportType;
    let importType;
    let ucName = `${name[0].toUpperCase()}${name.substr(1)}`;

    switch (type) {
      case 'integer':
        parsedType = 'number';
        break
      case 'number':
      case 'string':
      case 'boolean':
        parsedType = type;

        if (optsList) {
          parsedType = ucName;
          exportType = optsList.map((opt) => `'${opt}'`).join('|');
        }
        break;
      case 'array':
        const subType = doPropertyTransform([])(`${ucName}Opts`, items);

        parsedType = `Array<${subType.type}>`;
        exportType = subType.exportTypes;
        importType = subType.importTypes;

        break;
      default:
        if (typeof $ref === 'string') {
          parsedType = importType = $ref.replace('#/definitions/', '');
        }
    }

    return {
      exportTypes: exportType,
      importTypes: importType,
      required: !!required && required.includes(name),
      type: parsedType
    };
  };

const getSchema = (definitions: Definitions): Schema => {
  const definitionEntries = Object.entries(definitions);

  return definitionEntries
    .map(([name, value]) => {
      if (!(value instanceof Object)) return { name: '', properties: {} };

      const { properties, required } = value;
      const getProperty = doPropertyTransform(required);
      const propEntries = Object

      return {
        name,
        properties: Object
          .entries(properties)
          .reduce((acc, [propName, prop]) => {
            if (!(prop instanceof Object)) return acc;
            
            return { ...acc, [propName]: getProperty(propName, prop) };
          }, {})
      };
    });
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
