// @flow
import test from 'ava';

// $FlowFixMe
import mockData from '../__mocks__/graphql.json';
import buildGraphql from '../../src/builder/graphql';

// example taken from https://fakerql.com/
test('builds from graphql types', (t) => {
  t.deepEqual(
    buildGraphql(mockData.data.__schema),
    [
      {
        name: 'AuthPayload',
        properties: { token: { exportTypes: undefined, importTypes: undefined, required: true, type: 'string' } }
      },
      {
        name: 'Mutation',
        properties: {
          createTodo: { exportTypes: undefined, importTypes: 'Todo', required: false, type: 'Todo' },
          login: { exportTypes: undefined, importTypes: 'AuthPayload', required: false, type: 'AuthPayload' },
          register: { exportTypes: undefined, importTypes: 'AuthPayload', required: false, type: 'AuthPayload' },
          updateUser: { exportTypes: undefined, importTypes: 'User', required: false, type: 'User' }
        }
      },
      {
        name: 'Post',
        properties: {
          author: { exportTypes: undefined, importTypes: 'User', required: true, type: 'User' },
          body: { exportTypes: undefined, importTypes: undefined, required: true, type: 'string' },
          createdAt: { exportTypes: undefined, importTypes: undefined, required: true, type: 'string' },
          id: { exportTypes: undefined, importTypes: undefined, required: true, type: 'string' },
          published: { exportTypes: undefined, importTypes: undefined, required: true, type: 'boolean' },
          title: { exportTypes: undefined, importTypes: undefined, required: true, type: 'string' }
        }
      },
      {
        name: 'Product',
        properties: {
          id: { exportTypes: undefined, importTypes: undefined, required: true, type: 'string' },
          name: { exportTypes: undefined, importTypes: undefined, required: true, type: 'string' },
          price: { exportTypes: undefined, importTypes: undefined, required: true, type: 'string' }
        }
      },
      {
        name: 'Query',
        properties: {
          Post: { exportTypes: undefined, importTypes: 'Post', required: false, type: 'Post' },
          Product: { exportTypes: undefined, importTypes: 'Product', required: false, type: 'Product' },
          Todo: { exportTypes: undefined, importTypes: 'Todo', required: false, type: 'Todo' },
          User: { exportTypes: undefined, importTypes: 'User', required: false, type: 'User' },
          allPosts: { exportTypes: undefined, importTypes: 'Post', required: false, type: 'Array<Post>' },
          allProducts: { exportTypes: undefined, importTypes: 'Product', required: false, type: 'Array<Product>' },
          allTodos: { exportTypes: undefined, importTypes: 'Todo', required: false, type: 'Array<Todo>' },
          allUsers: { exportTypes: undefined, importTypes: 'User', required: false, type: 'Array<User>' },
          me: { exportTypes: undefined, importTypes: 'User', required: false, type: 'User' }
        }
      },
      {
        name: 'Subscription',
        properties: { todoAdded: { exportTypes: undefined, importTypes: 'Todo', required: false, type: 'Todo' } }
      },
      {
        name: 'Todo',
        properties: {
          completed: { exportTypes: undefined, importTypes: undefined, required: true, type: 'boolean' },
          id: { exportTypes: undefined, importTypes: undefined, required: true, type: 'string' },
          title: { exportTypes: undefined, importTypes: undefined, required: true, type: 'string' }
        }
      },
      {
        name: 'User',
        properties: {
          avatar: { exportTypes: undefined, importTypes: undefined, required: false, type: 'string' },
          email: { exportTypes: undefined, importTypes: undefined, required: true, type: 'string' },
          firstName: { exportTypes: undefined, importTypes: undefined, required: true, type: 'string' },
          id: { exportTypes: undefined, importTypes: undefined, required: true, type: 'string' },
          lastName: { exportTypes: undefined, importTypes: undefined, required: true, type: 'string' }
        }
      }
    ]
  );
});

test('resolves basic propert structure', (t) => {
  const queryType = buildGraphql(mockData.data.__schema).find(({ name }) => name === 'Query');

  t.truthy(queryType);

  if (!queryType) throw new Error('Not an object');

  t.true(
    Object.values(queryType.properties).every((property) => {
      if (!(property instanceof Object)) throw new Error('Not an object');

      return 'exportTypes' in property &&
        'importTypes' in property &&
        'required' in property &&
        'type' in property;
    })
  );
});
