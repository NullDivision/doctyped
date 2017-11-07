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

const getSchema = (definitions) =>
  Object
    .entries(definitions)
    .reduce(
      (acc, [key, value]) => {
        const { properties, required = [] } = value;
        const _refs = Object
          .values(properties)
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
                const { type, ...rest } = propValue;

                return {
                  ...acc,
                  [propKey]: { required: required.includes(propKey), type: fixUnhandledTypes(type), ...rest }
                };
              },
              { _refs }
            )
        };
      },
      {}
    );

readFile(argv._[0], (err, data) => {
  const schema = getSchema(JSON.parse(data.toString()).definitions);

  jsonToFlow(
    schema,
    {
      preTemplateFn: ({ modelSchema: { _refs, ...modelSchema }, ...data }) => ({ modelSchema, refs: _refs, ...data }),
      targetPath: join(__dirname, '../tmp'),
      templateData: { modelSuperClass: null },
      templatePath: string = join(__dirname, '../src/template.ejs')
    },
    console.log
  );
});


