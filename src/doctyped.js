const fs = require('fs');
const jsonToFlow = require('json-to-flow');
const path = require('path');

const getTypeValue = (type, list) => {
  if (type === 'integer') {
    return 'number';
  }

  if (list) {
    return list.map((value) => `'${value}'`).join('|');
  }

  return type;
};

const reduceEntry = (acc, [key, value]) => {
  if (key === 'User') console.log(value);

  const { properties, required = [] } = value;
  const entries = Object.entries(properties);
  const _refs = entries
    .map(([, value]) => value)
    .filter(({ $ref, items }) => $ref || (items && '$ref' in items))
    .map(({ $ref, items }) =>
      $ref ? $ref.replace('#/definitions/', '') : items.$ref.replace('#/definitions/', '')
    );

  return {
    ...acc,
    [key]: Object
      .entries(properties)
      .reduce(
        (acc, [propKey, propValue]) => {
          const { enum: list, type, ...rest } = propValue;

          return {
            ...acc,
            [propKey]: { required: required.includes(propKey), type: getTypeValue(type, list), ...rest }
          };
        },
        { _refs }
      )
  };
};

const getFlowCongifs = (entries) => entries.reduce(reduceEntry, {});

const getSchema = (definitions) => getFlowCongifs(Object.entries(definitions));

const getRemoteDescriptor = (url) => {
  const client = url.startsWith('https') ? 'https' : 'http';

  return new Promise((resolve, reject) => {
    require(client).get(url, (response) => {
      let rawData = '';

      response.on('data', (chunk) => {
        rawData += chunk;
      });

      response.on('end', () => resolve(JSON.parse(rawData)));
    });
  });
};

const getDescriptor = (url) => new Promise((resolve, reject) => {
  fs.readFile(url, async (err, data) => {
    try {
      resolve(JSON.parse(data.toString()));
    } catch (e) {
      reject(e);
    }
  });
});

module.exports = async (url) => {
  let descriptor;

  try {
    descriptor = await getDescriptor(url);
  } catch (e) {
    descriptor = await getRemoteDescriptor(url);
  }

  const schema = getSchema(descriptor.definitions);

  jsonToFlow(
    schema,
    {
      preTemplateFn: ({ modelSchema: { _additionalTypes, _refs, ...modelSchema }, ...data }) =>
        ({ modelSchema, refs: _refs, ...data }),
      targetPath: path.join(__dirname, '../tmp'),
      templatePath: string = path.join(__dirname, '../src/template.ejs')
    },
    () => console.log('Done')
  );
};
