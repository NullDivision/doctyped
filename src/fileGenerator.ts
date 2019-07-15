import { renderFile } from 'ejs';
import { writeFile } from 'fs';
import { resolve } from 'path';

import { Schema, SchemaValue, SchemaValueProperties } from './builder';
import logger from './logger';

export enum FORMAT_TYPE {
  FLOW = 'flow',
  TS = 'ts'
}

const getAccumulatedExtras = (properties: SchemaValueProperties) =>
  Object.entries(properties).reduce((acc, currentValue) => {
      const { exportTypes: accExports, importTypes: accImports } = acc;
      const [name, value] = currentValue;

      const { exportTypes: newExport, importTypes: newImport } = value;
      const result = {
        exportTypes: newExport ? [...accExports, { name: name[0].toUpperCase() + name.slice(1), type: newExport }]
                               : accExports,
        importTypes: newImport && !accImports.includes(newImport) ? [...accImports, newImport] : accImports
      };

      return result;
    },
    { exportTypes: [], importTypes: [] }
  );

export function generateFile(
  format: FORMAT_TYPE,
  output: string,
  schema: Schema
) {
  return schema.forEach((descriptor: SchemaValue) => {
    if (!(descriptor instanceof Object)) return;

    const { name, properties } = descriptor;
    const templateFile = format === FORMAT_TYPE.TS ? 'typescript' : 'flow';

    return renderFile(
      resolve(__dirname, `templates/${templateFile}.ejs`),
      { name, properties, ...getAccumulatedExtras(properties) },
      (err, result) => {
        if (err) {
          logger(err);
        }

        writeFile(
          `${output}/${name}.${format === FORMAT_TYPE.TS ? 'd.ts' : 'js.flow'}`,
          result,
          (err) => { err && logger(err); }
        );
      }
    );
  });
};
