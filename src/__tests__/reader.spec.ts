import http = require('http');
import nock = require('nock');
import { API_TYPE } from '../builder';
import { getDescriptorResolver } from '../reader';

describe('reader', () => {
  beforeAll(() => {
    nock.disableNetConnect();
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  it('resolves graphql requests', async () => {
    const TEST_URL = 'http://localhost/graphiql';
    const TEST_DATA = { data: { __schema: {} } };

    nock('http://localhost').post('/graphiql').reply(200, TEST_DATA);

    const result = await getDescriptorResolver(http)(
      API_TYPE.GRAPHQL,
      { uri: TEST_URL }
    );

    expect(result).toEqual(TEST_DATA.data.__schema);
  }, 10000);

  it('notifies about error messages', async () => {
    expect.assertions(1);

    const TEST_STATUS = "I'm a teapot";

    nock('http://localhost').post('/graphiql').replyWithError(TEST_STATUS);

    return expect(
      getDescriptorResolver(http)(API_TYPE.GRAPHQL, {
        uri: 'http://localhost/graphiql'
      })
    ).rejects.toThrowError(TEST_STATUS)
  });
});
