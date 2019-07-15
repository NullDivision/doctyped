import test from 'ava';

import { API_TYPE, build } from '../../dist/builder';
import buildGraphql from '../../dist/builder/graphql';
import buildSwagger from '../../dist/builder/swagger';

test('resolves selected API', (t) => {
  t.is(build(API_TYPE.GRAPHQL), buildGraphql);
  t.is(build(API_TYPE.SWAGGER), buildSwagger);
});
