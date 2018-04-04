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

const DEFAULT_OPTS = { output: null };

// const getTypeValue = (type, list) => {
//   if (type === 'integer') {
//     return 'number';
//   }

//   if (list) {
//     return list.map((value) => `'${value}'`).join('|');
//   }

//   return type;
// };

// const reduceEntry = (acc, [key, value]) => {
//   const { properties, required = [] } = value;
//   const entries = Object.entries(properties);
//   const _refs = entries
//     .map(([, value]) => value)
//     .filter(({ $ref, items }) => $ref || (items && '$ref' in items))
//     .map(({ $ref, items }) =>
//       $ref ? $ref.replace('#/definitions/', '') : items.$ref.replace('#/definitions/', '')
//     )
//     .reduce((acc, ref) => acc.includes(ref) ? acc : [...acc, ref], []);

//   return {
//     ...acc,
//     [key]: Object
//       .entries(properties)
//       .reduce(
//         (acc, [propKey, propValue]) => {
//           const { enum: list, type, ...rest } = propValue;

//           return {
//             ...acc,
//             [propKey]: { required: required.includes(propKey), type: getTypeValue(type, list), ...rest }
//           };
//         },
//         { _refs }
//       )
//   };
// };

// const getFlowCongifs = (entries) => entries.reduce(reduceEntry, {});

// const getSchema = (definitions) => getFlowCongifs(Object.entries(definitions));

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
      console.log(e.message);
      reject(new Error('Could not resolve path locally'));
    }
  });
});

const getDescriptor = (url): Promise<Descriptor> => {
  try {
    return getLocalDescriptor(url);
  } catch (e) {
    console.log(e.message);
    return getRemoteDescriptor(url);
  }
};

const buildFiles = (output, schema) =>
  schema.forEach(({ name, ...rest }) =>
    ejs.renderFile(
      path.resolve(__dirname, 'template.ejs'),
      { name, ...rest },
      (err, result) => {
        if (err) {
          console.log(err);
        }

        fs.writeFile(`${output}/${name}.js.flow`, result, (err) => { err && console.log(err); });
      }
    )
  );

const doPropertyTransform = (required) =>
  (name, { $ref, enum: optsList, type }) => {
    let parsedType = '*';
    let exportType;
    let importType;

    switch (type) {
      case 'integer':
        parsedType = 'number';
        break
      case 'string':
      case 'boolean':
        parsedType = type;

        if (optsList) {
          parsedType = `${name[0].toUpperCase()}${name.substr(1)}`;
          exportType = optsList.map((opt) => `'${opt}'`).join('|');
        }
      default:
        if ($ref) {
          parsedType = importType = $ref.replace('#/definitions/', '');
        }
    }

    return {
      exports: exportType,
      imports: importType,
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

export default async (url: string, options: {}): Promise<Schema> => {
  const { output } = { ...DEFAULT_OPTS, ...options };
  const { definitions } = await getDescriptor(url);
  const schema = getSchema(definitions);

  if (output) {
    buildFiles(output, schema);
  }

  return schema;
};
