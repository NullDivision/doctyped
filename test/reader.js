import test from 'ava';
import request from 'request-promise-native';
import sinon from 'sinon';

import { API_TYPE } from '../dist/builder';
import { getDescriptorResolver } from '../dist/reader';

const mockRequest = sinon.stub(request, 'Request');

test.cb('resolves graphql requests', (t) => {
  const TEST_URL = 'http://localhost';
  const TEST_DATA = { data: { __schema: {} } };
  mockRequest.returns(TEST_DATA);

  getDescriptorResolver({
    request: ({ method, uri }, callback) => {
      t.is(uri, TEST_URL);
      t.is(method, 'POST');

      callback({
        on: (state, stateCb) => {
          if (state === 'data') {
            stateCb(JSON.stringify(TEST_DATA));
          }

          if (state === 'end') {
            stateCb();
          }
        },
        setEncoding: () => {}
      });
    }
  })(API_TYPE.GRAPHQL, { uri: TEST_URL }).then((result) => {
    t.deepEqual(result, TEST_DATA.data.__schema);
    t.end();
  });
});

test.cb('notifies about error messages', (t) => {
  const TEST_STATUS = "I'm a teapot";
  mockRequest.throws(new Error(TEST_STATUS));

  getDescriptorResolver({
    request: (url, callback) => {
      callback({
        on: () => null,
        setEncoding: () => null,
        statusCode: 400,
        statusMessage: TEST_STATUS
      });

      return { end: () => null, write: () => null };
    }
  })(API_TYPE.GRAPHQL).catch((err) => {
    t.is(err.message, TEST_STATUS);
    t.end();
  });
});
