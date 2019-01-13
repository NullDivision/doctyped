// @flow

import test from 'ava';

// $FlowFixMe
import getSchema from '../../src/builder';
import buildGraphql from '../../src/builder/graphql';
import buildSwagger from '../../src/builder/swagger';
// $FlowFixMe
import { API_GRAPHQL, API_SWAGGER } from '../../src/constants.json';

test('resolves selected API', (t) => {
  t.is(getSchema(API_GRAPHQL), buildGraphql);
  t.is(getSchema(API_SWAGGER), buildSwagger);
});
