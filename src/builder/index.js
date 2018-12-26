// @flow

import buildGraphql from './graphql';
import buildSwagger from './swagger';
// $FlowFixMe
import { API_GRAPHQL, API_SWAGGER } from '../constants.json';

type PropertyValue = {| exportTypes?: string, importTypes?: string, required: boolean, type: string |};
export type SchemaValueProperties = { [string]: PropertyValue };
export type SchemaValue = {| name: string, properties: SchemaValueProperties |};
export type Schema = $ReadOnlyArray<SchemaValue>;

export default (api: typeof API_GRAPHQL | typeof API_SWAGGER) => {
  if (api === API_GRAPHQL) {
    return buildGraphql;
  }
  
  if (api === API_SWAGGER) {
    return buildSwagger;
  }

  throw new Error(`Invalid api type. API must be one of: ${API_GRAPHQL}, ${API_SWAGGER}`);
};
