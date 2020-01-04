import { promises as fs } from 'fs';
import * as http from 'http';
import * as https from 'https';
import { post as request } from 'request-promise-native';

import { API_TYPE } from './builder';
import logger from './logger';

export interface PropertyValue {
  default?: unknown;
  type?: string;
}
export interface DescriptorValue {
  additionalProperties: PropertyValue;
  properties?: { [key: string]: PropertyValue };
  required?: ReadonlyArray<string>;
  type: string;
  xml: {};
}
export interface Descriptor {
  definitions: { [key: string]: DescriptorValue };
}
export interface GraphQlResponseFieldType {
  kind: string;
  name: string;
  ofType?: GraphQlResponseFieldType;
}
interface GraphQlResponseType {
  fields?: ReadonlyArray<{ name: string; type: GraphQlResponseFieldType }>;
  kind: string;
  name: string;
}
export interface GraphQlResponse {
  types: ReadonlyArray<GraphQlResponseType>;
}

const API_OPTS = Object.values(API_TYPE);

async function getLocalDescriptor(
  url: Parameters<typeof fs['readFile']>['0']
): Promise<unknown> {
  try {
    const data = await fs.readFile(url);

    if (!data) {
      throw new Error('Descriptor path empty');
    }

    return JSON.parse(data.toString());
  } catch (e) {
    logger(e.message);
    throw new Error('Could not resolve path locally');
  }
}

const getRemoteDescriptor = (client: typeof http | typeof https) => (
  url: Parameters<typeof client['get']>['0']
): Promise<unknown> =>
  new Promise((resolve) => {
    client.get(url, (response) => {
      let rawData = '';

      response.on('data', (chunk) => {
        rawData += chunk;
      });

      response.on('end', () => resolve(JSON.parse(rawData)));
    });
  });

interface DescriptorResponse {
  definitions: Descriptor;
}

function isDescriptor(descriptor: unknown): descriptor is DescriptorResponse {
  return descriptor instanceof Object && 'definitions' in descriptor;
}

const resolveSwaggerDescriptor = (
  client: Parameters<typeof getRemoteDescriptor>['0']
) => async (
  url: Parameters<typeof getLocalDescriptor>['0'] & Parameters<ReturnType<typeof getRemoteDescriptor>>['0']
): Promise<Descriptor | undefined> => {
  try {
    const descriptor = await getLocalDescriptor(url);

    if (isDescriptor(descriptor)) {
      return descriptor.definitions;
    }
  } catch (e) {
    logger(e.message);
    const descriptor = await getRemoteDescriptor(client)(url);

    if (isDescriptor(descriptor)) {
      return descriptor.definitions;
    }
  }
};

const resolveGraphqlDescriptor = () => async (
  options: Parameters<typeof request>['0']
): Promise<GraphQlResponse> => {
  const opts = {
    body: {
      query:
        'query IntrospectionQuery {\n  __schema {\n    queryType {\n      name\n    }\n    mutationType {\n      name\n    }\n    subscriptionType {\n      name\n    }\n    types {\n      ...FullType\n    }\n    directives {\n      name\n      locations\n      args {\n        ...InputValue\n      }\n    }\n  }\n}\n\nfragment FullType on __Type {\n  kind\n  name\n  fields {\n    name\n    args {\n      ...InputValue\n    }\n    type {\n      ...TypeRef\n    }\n  }\n  inputFields {\n    ...InputValue\n  }\n  interfaces {\n    ...TypeRef\n  }\n  enumValues {\n    name\n  }\n  possibleTypes {\n    ...TypeRef\n  }\n}\n\nfragment InputValue on __InputValue {\n  name\n  type {\n    ...TypeRef\n  }\n  defaultValue\n}\n\nfragment TypeRef on __Type {\n  kind\n  name\n  ofType {\n    kind\n    name\n    ofType {\n      kind\n      name\n      ofType {\n        kind\n        name\n        ofType {\n          kind\n          name\n          ofType {\n            kind\n            name\n            ofType {\n              kind\n              name\n              ofType {\n                kind\n                name\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n}',
      variables: null,
      operationName: 'IntrospectionQuery'
    },
    json: true,
    rejectUnauthorized: false
  };

  try {
    const {
      data: { __schema }
    } = await request({ ...opts, ...options });
    return __schema;
  } catch (err) {
    logger(err.stack);

    throw new Error(err.message);
  }
};

interface Options {
  headers?: {};
  uri: string;
}
export type ResponseType = Descriptor | GraphQlResponse | undefined;

export const getDescriptorResolver = (
  client: typeof http | typeof https
) => async (api: API_TYPE, options: Options): Promise<ResponseType> => {
  switch (api) {
    case API_TYPE.SWAGGER:
      return resolveSwaggerDescriptor(client)(options.uri);
    case API_TYPE.GRAPHQL:
      return resolveGraphqlDescriptor()(options);
    default:
      throw new Error(
        `Invalid api type '${api}' provided. Type must be one of: ${API_OPTS.join(
          ', '
        )}`
      );
  }
};
