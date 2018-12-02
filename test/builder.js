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
          createTodo: { exportTypes: undefined, importTypes: 'Todo' },
          login: { exportTypes: undefined, importTypes: 'AuthPayload' },
          register: { exportTypes: undefined, importTypes: 'AuthPayload' },
          updateUser: { exportTypes: undefined, importTypes: 'User' }
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
          Post: { exportTypes: undefined, importTypes: 'Post' },
          Product: { exportTypes: undefined, importTypes: 'Product' },
          Todo: { exportTypes: undefined, importTypes: 'Todo' },
          User: { exportTypes: undefined, importTypes: 'User' },
          allPosts: { exportTypes: undefined, importTypes: 'Array<Post>' },
          allProducts: { exportTypes: undefined, importTypes: 'Array<Product>' },
          allTodos: { exportTypes: undefined, importTypes: 'Array<Todo>' },
          allUsers: { exportTypes: undefined, importTypes: 'Array<User>' },
          me: { exportTypes: undefined, importTypes: 'User' }
        }
      },
      { name: 'Subscription', properties: { todoAdded: { exportTypes: undefined, importTypes: 'Todo' } } },
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
