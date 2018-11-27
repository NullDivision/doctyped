// @flow

import ejs from 'ejs';
import fs from 'fs';
import path from 'path';

import logger from './logger';

export const FORMAT_FLOW = 'flow';
export const FORMAT_TS = 'ts';

type SchemaValue = {| name: string, properties: { [string]: {| required: boolean, type: string |} } |};
type Schema = $ReadOnlyArray<SchemaValue>;

const getAccumulatedExtras = (properties) =>
  Object
    .entries(properties)
    .reduce(
      // $FlowFixMe
      ({ exportTypes: accExports, importTypes: accImports }, [name, { exportTypes: newExport, importTypes: newImport, ...rest }]) => {
        const result = {
          exportTypes: newExport ? [...accExports, { name: name[0].toUpperCase() + name.slice(1), type: newExport }] : accExports,
          importTypes: newImport ? [...accImports, newImport] : accImports
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
