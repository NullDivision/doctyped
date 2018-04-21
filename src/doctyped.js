// @flow

import ejs from 'ejs';
import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';

type Descriptor = {|
  definitions: {| [string]: {| properties: {| [string]: {| type?: string |} |}, required?: $ReadOnlyArray<string> |} |}
|};
type Definitions = $PropertyType<Descriptor, 'definitions'>;
type Schema = $ReadOnlyArray<{|
  name: $Keys<Definitions>,
  properties: { [$Keys<$PropertyType<Definitions, 'properties'>>]: {| required: boolean, type: string |} }
|}>;
type SwaggerProperty = { $ref?: string, enum: Array<string>, items: SwaggerProperty, type: string };

const DEFAULT_OPTS = { format: 'flow', output: null };

const getLogger = (allow) => (...content) => allow && console.log(...content);

const logger = getLogger(process.env.NODE_ENV === 'development');

const getAccumulatedExtras = (properties) =>
  Object
    .entries(properties)
    .reduce(
      // $FlowFixMe
      ({ exportTypes: accExports, importTypes: accImports }, [name, { exportTypes: newExport, importTypes: newImport, ...rest }]) => {
        const result = { exportTypes: newExport ? [...accExports, { name: name[0].toUpperCase() + name.slice(1), type: newExport }] : accExports, importTypes: newImport ? [...accImports, newImport] : accImports };

        return result;
      },
      { exportTypes: [], importTypes: [] }
    );

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

const buildFiles = (format, output, schema) =>
  schema.forEach(({ name, properties }) =>
    ejs.renderFile(
      path.resolve(__dirname, 'template.ejs'),
      { name, properties, ...getAccumulatedExtras(properties) },
      (err, result) => {
        if (err) {
          logger(err);
        }

        fs.writeFile(
          `${output}/${name}.${format === 'ts' ? 'ts.d' : 'js.flow'}`,
          result,
          (err) => { err && logger(err); }
        );
      }
    )
  );

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
        if ($ref) {
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
  const definitionEntries: $ReadOnlyArray<[string, any]> = Object.entries(definitions);

  return definitionEntries
    .map(([name, { properties, required }]: [string, $PropertyType<Definitions, 'properties'>]) => {
      const getProperty = doPropertyTransform(required);

      return {
        name,
        properties: Object
          .entries(properties)
          .reduce((acc, [propName, prop]: [string, any]) => ({ ...acc, [propName]: getProperty(propName, prop) }), {})
      };
    });
};

export default async (url: string, options: { output?: string }): Promise<Schema> => {
  const { format, output } = { ...DEFAULT_OPTS, ...options };
  const { definitions } = await getDescriptor(url);
  const schema = getSchema(definitions);

  if (output) {
    buildFiles(format, output, schema);
  }

  return schema;
};
