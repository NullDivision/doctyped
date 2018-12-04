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
      {
        name: 'AuthPayload',
        properties: { token: { exportTypes: undefined, importTypes: undefined, required: true } }
      },
      {
        name: 'Mutation',
        properties: {
          createTodo: { exportTypes: undefined, importTypes: 'Todo', required: false },
          login: { exportTypes: undefined, importTypes: 'AuthPayload', required: false },
          register: { exportTypes: undefined, importTypes: 'AuthPayload', required: false },
          updateUser: { exportTypes: undefined, importTypes: 'User', required: false }
        }
      },
      {
        name: 'Post',
        properties: {
          author: { exportTypes: undefined, importTypes: undefined, required: true },
          body: { exportTypes: undefined, importTypes: undefined, required: true },
          createdAt: { exportTypes: undefined, importTypes: undefined, required: true },
          id: { exportTypes: undefined, importTypes: undefined, required: true },
          published: { exportTypes: undefined, importTypes: undefined, required: true },
          title: { exportTypes: undefined, importTypes: undefined, required: true }
        }
      },
      {
        name: 'Product',
        properties: {
          id: { exportTypes: undefined, importTypes: undefined, required: true },
          name: { exportTypes: undefined, importTypes: undefined, required: true },
          price: { exportTypes: undefined, importTypes: undefined, required: true }
        }
      },
      {
        name: 'Query',
        properties: {
          Post: { exportTypes: undefined, importTypes: 'Post', required: false },
          Product: { exportTypes: undefined, importTypes: 'Product', required: false },
          Todo: { exportTypes: undefined, importTypes: 'Todo', required: false },
          User: { exportTypes: undefined, importTypes: 'User', required: false },
          allPosts: { exportTypes: undefined, importTypes: 'Post', required: false },
          allProducts: { exportTypes: undefined, importTypes: 'Product', required: false },
          allTodos: { exportTypes: undefined, importTypes: 'Todo', required: false },
          allUsers: { exportTypes: undefined, importTypes: 'User', required: false },
          me: { exportTypes: undefined, importTypes: 'User', required: false }
        }
      },
      {
        name: 'Subscription',
        properties: { todoAdded: { exportTypes: undefined, importTypes: 'Todo', required: false } }
      },
      {
        name: 'Todo',
        properties: {
          completed: { exportTypes: undefined, importTypes: undefined, required: true },
          id: { exportTypes: undefined, importTypes: undefined, required: true },
          title: { exportTypes: undefined, importTypes: undefined, required: true }
        }
      },
      {
        name: 'User',
        properties: {
          avatar: { exportTypes: undefined, importTypes: undefined, required: false },
          email: { exportTypes: undefined, importTypes: undefined, required: true },
          firstName: { exportTypes: undefined, importTypes: undefined, required: true },
          id: { exportTypes: undefined, importTypes: undefined, required: true },
          lastName: { exportTypes: undefined, importTypes: undefined, required: true }
        }
      }
    ]
  );
});
