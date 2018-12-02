// @flow

import test from 'ava';

// $FlowFixMe
import mockData from './__mocks__/graphql.json';
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

// example taken from https://fakerql.com/
test('builds from graphql types', (t) => {
  t.deepEqual(
    // $FlowFixMe
    getSchema(API_GRAPHQL)(mockData.data.__schema),
    [
      { name: 'AuthPayload', properties: { token: { exportTypes: undefined, importTypes: undefined } } },
      {
        name: 'Mutation',
        properties: {
          createTodo: { exportTypes: undefined, importTypes: undefined },
          login: { exportTypes: undefined, importTypes: undefined },
          register: { exportTypes: undefined, importTypes: undefined },
          updateUser: { exportTypes: undefined, importTypes: undefined }
        }
      },
      {
        name: 'Post',
        properties: {
          author: { exportTypes: undefined, importTypes: undefined },
          body: { exportTypes: undefined, importTypes: undefined },
          createdAt: { exportTypes: undefined, importTypes: undefined },
          id: { exportTypes: undefined, importTypes: undefined },
          published: { exportTypes: undefined, importTypes: undefined },
          title: { exportTypes: undefined, importTypes: undefined }
        }
      },
      {
        name: 'Product',
        properties: {
          id: { exportTypes: undefined, importTypes: undefined },
          name: { exportTypes: undefined, importTypes: undefined },
          price: { exportTypes: undefined, importTypes: undefined }
        }
      },
      {
        name: 'Query',
        properties: {
          Post: { exportTypes: undefined, importTypes: undefined },
          Product: { exportTypes: undefined, importTypes: undefined },
          Todo: { exportTypes: undefined, importTypes: undefined },
          User: { exportTypes: undefined, importTypes: undefined },
          allPosts: { exportTypes: undefined, importTypes: undefined },
          allProducts: { exportTypes: undefined, importTypes: undefined },
          allTodos: { exportTypes: undefined, importTypes: undefined },
          allUsers: { exportTypes: undefined, importTypes: undefined },
          me: { exportTypes: undefined, importTypes: undefined }
        }
      },
      { name: 'Subscription', properties: { todoAdded: { exportTypes: undefined, importTypes: undefined } } },
      {
        name: 'Todo',
        properties: {
          completed: { exportTypes: undefined, importTypes: undefined },
          id: { exportTypes: undefined, importTypes: undefined },
          title: { exportTypes: undefined, importTypes: undefined }
        }
      },
      {
        name: 'User',
        properties: {
          avatar: { exportTypes: undefined, importTypes: undefined },
          email: { exportTypes: undefined, importTypes: undefined },
          firstName: { exportTypes: undefined, importTypes: undefined },
          id: { exportTypes: undefined, importTypes: undefined },
          lastName: { exportTypes: undefined, importTypes: undefined }
        }
      }
    ]
  );
});
