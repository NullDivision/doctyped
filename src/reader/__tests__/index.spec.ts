import { readApi, API_TYPE } from '../index';

jest.mock('../api/graphql');
jest.mock('../api/nelmio');
jest.mock('../api/swagger');

describe('reader', () => {
  it('calls Swagger submodule', async () => {
    await readApi(API_TYPE.SWAGGER);

    expect(jest.requireMock('../api/swagger').readApi).toHaveBeenCalledWith();
  });

  it('calls GraphQL submodule', async () => {
    await readApi(API_TYPE.GRAPHQL);

    expect(jest.requireMock('../api/graphql').readApi).toHaveBeenCalledWith();
  });

  it('calls Nelmio submodule', async () => {
    await readApi(API_TYPE.NELMIO);

    expect(jest.requireMock('../api/nelmio').readApi).toHaveBeenCalledWith();
  });
});
