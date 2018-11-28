// @flow

import type { Schema, SchemaValue } from './builder';

import ejs from 'ejs';
import fs from 'fs';
import path from 'path';

import logger from './logger';

export const FORMAT_FLOW = 'flow';
export const FORMAT_TS = 'ts';

const getAccumulatedExtras = (properties) =>
  Object.entries(properties).reduce((acc, currentValue) => {
      const { exportTypes: accExports, importTypes: accImports } = acc;
      const [name, value] = currentValue;

      if (!(value instanceof Object)) return acc;
      
      const { exportTypes: newExport, importTypes: newImport, ...rest } = value;
      const result = {
        exportTypes: newExport ? [...accExports, { name: name[0].toUpperCase() + name.slice(1), type: newExport }] : accExports,
        importTypes: newImport && !accImports.includes(newImport) ? [...accImports, newImport] : accImports
      };

      return result;
    },
    { exportTypes: [], importTypes: [] }
  );

export default (format: typeof FORMAT_FLOW | typeof FORMAT_TS, output: string, schema: Schema | mixed) => {
  if (!Array.isArray(schema)) return;
  
  return schema.forEach((descriptor: SchemaValue | mixed) => {
    if (!(descriptor instanceof Object)) return;
    
    const { name, properties } = descriptor;
    const templateFile = format === FORMAT_TS ? 'typescript' : 'flow';

    return ejs.renderFile(
      path.resolve(__dirname, `templates/${templateFile}.ejs`),
      { name, properties, ...getAccumulatedExtras(properties) },
      (err, result) => {
        if (err) {
          logger(err);
        }

        fs.writeFile(
          `${output}/${name}.${format === FORMAT_TS ? 'd.ts' : 'js.flow'}`,
          result,
          (err) => { err && logger(err); }
        );
      }
    );
  });
};
