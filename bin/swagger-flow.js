#! /usr/bin/env node

const argv = require('yargs-parser')(process.argv.slice(2));
const join = require('path').join;
const jsonToFlow = require('json-to-flow');
const readFile = require('fs').readFile;

const fixUnhandledTypes = (type) => {
  if (type === 'integer') {
    return 'number';
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
  const _additionalTypes = entries
    .reduce(
      (acc, [key, value]) =>
        value.enum ? { ...acc, [key]: value.enum.map((enumVal) => `'${enumVal}'`).join('|') } : acc,
      {}
    );

  return {
    ...acc,
    [key]: Object
      .entries(properties)
      .reduce(
        (acc, [propKey, propValue]) => {
          const { type, ...rest } = propValue;

          return {
            ...acc,
            [propKey]: { required: required.includes(propKey), type: fixUnhandledTypes(type), ...rest }
          };
        },
        { _additionalTypes, _refs }
      )
  };
};

const getFlowCongifs = (entries) => entries.reduce(reduceEntry, {});

const getSchema = (definitions) => getFlowCongifs(Object.entries(definitions));

readFile(argv._[0], (err, data) => {
  const schema = getSchema(JSON.parse(data.toString()).definitions);

  jsonToFlow(
    schema,
    {
      preTemplateFn: ({ modelSchema: { _additionalTypes, _refs, ...modelSchema }, ...data }) =>
        console.log( _additionalTypes ) ||
        ({ additionalTypes: _additionalTypes, modelSchema, refs: _refs, ...data }),
      targetPath: join(__dirname, '../tmp'),
      templateData: { modelSuperClass: null },
      templatePath: string = join(__dirname, '../src/template.ejs')
    },
    () => console.log('Done')
  );
});


