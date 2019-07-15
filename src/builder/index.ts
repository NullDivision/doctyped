import buildGraphql from './graphql';
import buildSwagger from './swagger';

export enum API_TYPE {
  GRAPHQL = 'graphql',
  SWAGGER = 'swagger'
}

interface PropertyValue {
  exportTypes?: string;
  importTypes?: string;
  required: boolean;
  type: string;
}
export interface SchemaValueProperties { [key: string]: PropertyValue };
export interface SchemaValue {
  name: string;
  properties: SchemaValueProperties;
}
export type Schema = ReadonlyArray<SchemaValue>;

export function build(api: API_TYPE) {
  if (api === API_TYPE.GRAPHQL) {
    return buildGraphql;
  }

  if (api === API_TYPE.SWAGGER) {
    return buildSwagger;
  }

  throw new Error(
    `Invalid api type. API must be one of: ${
      Object.values(API_TYPE).join(', ')
    }`
  );
};
