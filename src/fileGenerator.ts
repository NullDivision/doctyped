import { renderFile } from 'ejs';
import { promises as fs } from 'fs';
import { resolve } from 'path';

import { Schema, SchemaValue, SchemaValueProperties } from './builder';
import logger from './logger';

export enum FORMAT_TYPE {
  FLOW = 'flow',
  TS = 'ts'
}

interface AccumulatedExtras {
  exportTypes: Array<{ name: string; type: string }>;
  importTypes: Array<string>;
}

const getAccumulatedExtras = (
  properties: SchemaValueProperties
): AccumulatedExtras =>
  Object.entries(properties).reduce(
    (acc, currentValue) => {
      const { exportTypes: accExports, importTypes: accImports } = acc;
      const [name, value] = currentValue;
      const { exportTypes: newExport, importTypes: newImport } = value;

      return {
        exportTypes: newExport
          ? [...accExports, { name: name[0].toUpperCase() + name.slice(1), type: newExport }]
          : accExports,
        importTypes:
          newImport && !accImports.includes(newImport)
            ? [...accImports, newImport]
            : accImports
      };
    },
    { exportTypes: [], importTypes: [] } as AccumulatedExtras
  );

export async function generateFile(
  format: FORMAT_TYPE,
  output: string,
  schema: Schema
): Promise<void> {
  const requests = schema.map((descriptor: SchemaValue): Promise<void> | void => {
    if (!(descriptor instanceof Object)) return;

    const { name, properties } = descriptor;
    const templateFile = format === FORMAT_TYPE.TS ? 'typescript' : 'flow';

    return new Promise((promiseResolve, promiseReject): void => {
      renderFile(
        resolve(__dirname, `templates/${templateFile}.ejs`),
        { name, properties, ...getAccumulatedExtras(properties) },
        async (err, result): Promise<void> => {
          if (err) {
            logger(err);
          }

          try {
            await fs.writeFile(
              `${output}/${name}.${format === FORMAT_TYPE.TS ? 'd.ts' : 'js.flow'}`,
              result
            );
          } catch (error) {
            promiseReject(error);
            return;
          }

          promiseResolve();
        }
      );
    });
  });

  await Promise.all(requests);
}
