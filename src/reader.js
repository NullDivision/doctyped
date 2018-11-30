// @flow

import fs from 'fs';
import http from 'http';
import https from 'https';

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
type GraphQlResponseType = {
  fields: $ReadOnlyArray<{ name: string, type: { kind: string, name: string } }>,
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
  (url): Promise<GraphQlResponse> => new Promise((resolve) => {
    // $FlowFixMe
    const req = client.request(url, { method: 'POST' }, (res) => {
      let data = '';
      
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(JSON.parse(data).data.__schema);
      });
    })
    req.write(`{"query":"query IntrospectionQuery {\n  __schema {\n    queryType {\n      name\n    }\n    mutationType {\n      name\n    }\n    subscriptionType {\n      name\n    }\n    types {\n      ...FullType\n    }\n    directives {\n      name\n      locations\n      args {\n        ...InputValue\n      }\n    }\n  }\n}\n\nfragment FullType on __Type {\n  kind\n  name\n  fields {\n    name\n    args {\n      ...InputValue\n    }\n    type {\n      ...TypeRef\n    }\n  }\n  inputFields {\n    ...InputValue\n  }\n  interfaces {\n    ...TypeRef\n  }\n  enumValues {\n    name\n  }\n  possibleTypes {\n    ...TypeRef\n  }\n}\n\nfragment InputValue on __InputValue {\n  name\n  type {\n    ...TypeRef\n  }\n  defaultValue\n}\n\nfragment TypeRef on __Type {\n  kind\n  name\n  ofType {\n    kind\n    name\n    ofType {\n      kind\n      name\n      ofType {\n        kind\n        name\n        ofType {\n          kind\n          name\n          ofType {\n            kind\n            name\n            ofType {\n              kind\n              name\n              ofType {\n                kind\n                name\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n}","variables":null,"operationName":"IntrospectionQuery"}`);
    req.end();
  });

export default (client: typeof http | typeof https) =>
  async (api: typeof API_GRAPHQL | typeof API_SWAGGER, url: string): Promise<Descriptor | GraphQlResponse> => {
    switch (api) {
      case API_SWAGGER:
        return resolveSwaggerDescriptor(client)(url);
      case API_GRAPHQL:
        return resolveGraphqlDescriptor(client)(url);
      default:
        throw new Error(`Invalid api type '${api}' provided. Type must be one of: ${API_OPTS.join(', ')}`)
    }
  };
