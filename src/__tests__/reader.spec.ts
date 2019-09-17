import { API_TYPE } from '../builder';
import { getDescriptorResolver } from '../reader';

jest.mock('http');
jest.mock('request-promise-native');

describe('reader', () => {
  it('resolves graphql requests', async () => {
    const TEST_URL = 'http://localhost';
    const TEST_DATA = { data: { __schema: {} } };

    jest
      .requireMock('request-promise-native')
      .post.mockResolvedValue(TEST_DATA);

    const result = await getDescriptorResolver(jest.requireMock('http'))(
      API_TYPE.GRAPHQL,
      { uri: TEST_URL }
    );

    expect(result).toEqual(TEST_DATA.data.__schema);
  });

  it('notifies about error messages', async () => {
    expect.assertions(1);

    const TEST_STATUS = "I'm a teapot";

    jest
      .requireMock('request-promise-native')
      .post
      .mockRejectedValue(new Error(TEST_STATUS));

    try {
      await getDescriptorResolver(jest.requireMock('http'))(API_TYPE.GRAPHQL, {
        uri: ''
      });
    } catch (error) {
      expect(error.message).toBe(TEST_STATUS);
    }
  });
});
