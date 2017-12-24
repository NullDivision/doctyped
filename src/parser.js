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

module.exports = (url) => {
  fs.readFile(url, (err, data) => {
    const schema = getSchema(JSON.parse(data.toString()).definitions);

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
  });
};
