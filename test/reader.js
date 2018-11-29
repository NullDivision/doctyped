import test from 'ava';

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
  })('graphql', TEST_URL).then((result) => {
    t.deepEqual(result, TEST_DATA.data.__schema);
    t.end();
  });
});
