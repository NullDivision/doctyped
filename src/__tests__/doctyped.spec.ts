import { join, resolve } from 'path';

import { API_TYPE, doctyped } from '../doctyped';
// import * as reader from '../dist/reader';
import { FORMAT_TYPE } from '../fileGenerator';

jest.mock('https');
jest.mock('../fileGenerator');

const { SWAGGER: API_SWAGGER } = API_TYPE;
const TEST_PATH_BASE = resolve(__dirname, '../..', 'tmp');
const SWAGGER_FILE = resolve(__dirname, '__data__/swagger.json');
const MODEL_NAMES = Object.keys(
  require('./__data__/swagger.json').definitions
);

describe('doctyped', () => {
  it('generates models', async () => {
    const models = await doctyped(SWAGGER_FILE, { api: API_SWAGGER });

    expect(models.length).toBeTruthy();
    expect(models.map(({ name }) => name)).toEqual(MODEL_NAMES);
  });

  it('generates flow files', async () => {
    const TEST_PATH = '../accepted-output-directory';

    await doctyped(SWAGGER_FILE, { api: API_SWAGGER, output: TEST_PATH });

    expect(
      jest.requireMock('../fileGenerator').generateFile
    ).toHaveBeenCalledWith('flow', TEST_PATH, expect.any(Array));
  });

  test('resolves path from url', async () => {
    jest
      .requireMock('https')
      .get.mockImplementationOnce((url: any, callback: any) =>
        callback({
          on: (event: any, cb: any) =>
            event === 'data' ? cb('{ "definitions": {} }') : cb()
        })
      );

    const response = await doctyped('https://localhost:12000/api', {
      api: API_SWAGGER
    });

    expect(response).toBeTruthy();
  });

  it('generates typescript files', async () => {
    const TEST_PATH = join(TEST_PATH_BASE, 'ts' + new Date().getTime());

    await doctyped(SWAGGER_FILE, {
      api: API_SWAGGER,
      format: FORMAT_TYPE.TS,
      output: TEST_PATH
    });

    expect(
      jest.requireMock('../fileGenerator').generateFile
    ).toHaveBeenCalledWith(FORMAT_TYPE.TS, TEST_PATH, expect.any(Object));
  });
});
