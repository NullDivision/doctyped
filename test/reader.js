import test from 'ava';

import { API_GRAPHQL } from '../src/constants.json';
import getDescriptor from '../src/reader';

test.cb('resolves graphql requests', (t) => {
  const TEST_URL = 'http://localhost';
  const TEST_DATA = { data: { __schema: {} } };

  getDescriptor({
    request: (url, { method }, callback) => {
      t.is(url, TEST_URL);
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
  })(API_GRAPHQL, TEST_URL).then((result) => {
    t.deepEqual(result, TEST_DATA.data.__schema);
    t.end();
  });
});

test.cb('notifies about error messages', (t) => {
  const TEST_STATUS = "I'm a teapot";

  getDescriptor({
    request: (url, opts, callback) => {
      callback({
        on: () => null,
        setEncoding: () => null,
        statusCode: 400,
        statusMessage: TEST_STATUS
      });

      return { end: () => null, write: () => null };
    }
  })(API_GRAPHQL).catch((err) => {
    t.is(err.message, TEST_STATUS);
    t.end();
  });
});
