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
  const { properties, required = [] } = value;
  const entries = Object.entries(properties);
  const _refs = entries
    .map(([, value]) => value)
    .filter(({ $ref, items }) => $ref || (items && '$ref' in items))
    .map(({ $ref, items }) =>
      $ref ? $ref.replace('#/definitions/', '') : items.$ref.replace('#/definitions/', '')
    )
    .reduce((acc, ref) => acc.includes(ref) ? acc : [...acc, ref], []);

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
  const outputDir = path.resolve(process.cwd(), 'tmp');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  jsonToFlow(
    schema,
    {
      preTemplateFn: ({ modelSchema: { _additionalTypes, _refs, ...modelSchema }, ...data }) =>
        ({ modelSchema, refs: _refs, ...data }),
      targetPath: path.join(process.cwd(), 'tmp'),
      templatePath: path.join(__dirname, '../src/template.ejs')
    },
    () => console.log('Done')
  );
};
