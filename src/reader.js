// @flow

import fs from 'fs';
import http from 'http';
import https from 'https';
import request from 'request-promise-native';

// $FlowFixMe
import { API_GRAPHQL, API_SWAGGER } from './constants.json';
import logger from './logger';

export type PropertyValue = {| default?: mixed, type?: string |};
export type DescriptorValue = {|
  additionalProperties: PropertyValue,
  properties?: { [string]: PropertyValue },
  required?: $ReadOnlyArray<string>,
  type: string,
  xml: {}
|};
export type Descriptor = {| definitions: { [string]: DescriptorValue } |};
type GraphQlResponseFieldType = { kind: string, name: string, ofType: ?GraphQlResponseFieldType };
type GraphQlResponseType = {
  fields: ?$ReadOnlyArray<{ name: string, type: GraphQlResponseFieldType }>,
  kind: string,
  name: string
};
export type GraphQlResponse = {| types: $ReadOnlyArray<GraphQlResponseType> |};

const API_OPTS = [API_GRAPHQL, API_SWAGGER];

const getLocalDescriptor = (url) => new Promise((resolve, reject) => {
  fs.readFile(url, (err, data) => {
    try {
      if (!data) {
        throw err;
      }

      resolve(JSON.parse(data.toString()));
    } catch (e) {
      logger(e.message);
      reject(new Error('Could not resolve path locally'));
    }
  });
});

const getRemoteDescriptor = (client: typeof http | typeof https) => (url) => new Promise((resolve) => {
  client.get(url, (response) => {
    let rawData = '';

    response.on('data', (chunk) => {
      rawData += chunk;
    });

    response.on('end', () => resolve(JSON.parse(rawData)));
  });
});

const resolveSwaggerDescriptor = (client) => async (url): Promise<Descriptor> => {
  try {
    const { definitions } = await getLocalDescriptor(url);

    return definitions;
  } catch (e) {
    logger(e.message);
    const { definitions } = await getRemoteDescriptor(client)(url);
    return definitions;
  }
};

const resolveGraphqlDescriptor = (client: typeof http | typeof https) =>
  async (options): Promise<GraphQlResponse> => {
    const opts = {
      body: {
        query: 'query IntrospectionQuery {\n  __schema {\n    queryType {\n      name\n    }\n    mutationType {\n      name\n    }\n    subscriptionType {\n      name\n    }\n    types {\n      ...FullType\n    }\n    directives {\n      name\n      locations\n      args {\n        ...InputValue\n      }\n    }\n  }\n}\n\nfragment FullType on __Type {\n  kind\n  name\n  fields {\n    name\n    args {\n      ...InputValue\n    }\n    type {\n      ...TypeRef\n    }\n  }\n  inputFields {\n    ...InputValue\n  }\n  interfaces {\n    ...TypeRef\n  }\n  enumValues {\n    name\n  }\n  possibleTypes {\n    ...TypeRef\n  }\n}\n\nfragment InputValue on __InputValue {\n  name\n  type {\n    ...TypeRef\n  }\n  defaultValue\n}\n\nfragment TypeRef on __Type {\n  kind\n  name\n  ofType {\n    kind\n    name\n    ofType {\n      kind\n      name\n      ofType {\n        kind\n        name\n        ofType {\n          kind\n          name\n          ofType {\n            kind\n            name\n            ofType {\n              kind\n              name\n              ofType {\n                kind\n                name\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n}',
        variables: null,
        operationName: 'IntrospectionQuery'
      },
      insecure: true,
      json: true,
      method: 'POST',
      rejectUnauthorized: false
    };

    try {
      return await request({ ...opts, ...options });
    } catch (err) {
      console.log(err)
      throw new Error(err.message);
    }
  };

type ApiType = typeof API_GRAPHQL | typeof API_SWAGGER;
type Options = {| headers?: {}, uri: string |};
type ResponseType = Descriptor | GraphQlResponse;

export default (client: typeof http | typeof https) =>
  async (api: ApiType, options: Options): Promise<ResponseType> => {
    switch (api) {
      case API_SWAGGER:
        return resolveSwaggerDescriptor(client)(options.uri);
      case API_GRAPHQL:
        return resolveGraphqlDescriptor(client)(options);
      default:
        throw new Error(`Invalid api type '${api}' provided. Type must be one of: ${API_OPTS.join(', ')}`)
    }
  };
