const fs = require('fs');
const jsonToFlow = require('json-to-flow');
const path = require('path');

const DEFAULT_OPTS = { output: path.resolve(process.cwd(), 'tmp') };

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

module.exports = async (url, options) => {
  const opts = { ...DEFAULT_OPTS, ...options };

  let descriptor;

  try {
    descriptor = await getDescriptor(url);
  } catch (e) {
    console.log(e.message);
    descriptor = await getRemoteDescriptor(url);
  }

  const schema = getSchema(descriptor.definitions);

  if (!fs.existsSync(opts.output)) {
    fs.mkdirSync(opts.output);
  }

  jsonToFlow(
    schema,
    {
      preTemplateFn: ({ modelSchema: { _additionalTypes, _refs, ...modelSchema }, ...data }) =>
        ({ modelSchema, refs: _refs, ...data }),
      targetPath: opts.output,
      templatePath: path.join(__dirname, '../src/template.ejs')
    },
    () => console.log('Done')
  );
};
