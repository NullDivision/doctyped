// @flow

import test from 'ava';

import getSchema from '../src/builder';
// $FlowFixMe
import { API_GRAPHQL, API_SWAGGER } from '../src/constants.json';

test('handles additional properties', (t) => {
  const TEST_DATA = {
		Order: {
      properties: { complete: { type: 'boolean', default: false } },
      additionalProperties: { type: 'number' },
			type: 'object',
			xml: { name: 'Order' }
		}
	};
  const TEST_RESPONSE = [
    {
      name: 'Order',
      properties: {
        complete: { exportTypes: undefined, importTypes: undefined, required: false, type: 'boolean' },
        '[string]': { exportTypes: undefined, importTypes: undefined, required: false, type: 'number' }
      }
    }
  ];

  // $FlowFixMe
  t.deepEqual(getSchema(API_SWAGGER)(TEST_DATA), TEST_RESPONSE);
});

test('builds from graphql types', (t) => {
  t.deepEqual(
    // $FlowFixMe
    getSchema(API_GRAPHQL)({
      types: [{ fields: [{ name: 'me', type: { kind: 'OBJECT', name: 'User' } }], name: 'Query' }]
    }),
    [
      {
        name: 'Query',
        properties: { me: { importTypes: 'User', required: true, type: 'User' } }
      }
    ]
  );
});
