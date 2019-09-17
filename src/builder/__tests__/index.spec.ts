import { API_TYPE, build } from '../';
import buildGraphql from '../graphql';
import buildSwagger from '../swagger';

describe('builder', () => {
  it('resolves selected API', () => {
    expect(build(API_TYPE.GRAPHQL)).toEqual(buildGraphql);
    expect(build(API_TYPE.SWAGGER)).toEqual(buildSwagger);
  });
});
