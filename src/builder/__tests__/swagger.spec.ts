// import test from 'ava';

import buildSwagger from '../swagger';

describe('swagger', () => {
  it('handles additional properties', () => {
    const TEST_DATA = {
      Order: {
        properties: { complete: { type: 'boolean', default: false } },
        additionalProperties: { type: 'number' },
        type: 'object',
        xml: { name: 'Order' }
      }
    };
    const TEST_RESPONSE = [
      {
        name: 'Order',
        properties: {
          complete: { exportTypes: undefined, importTypes: undefined, required: false, type: 'boolean' },
          '[string]': { exportTypes: undefined, importTypes: undefined, required: false, type: 'number' }
        }
      }
    ];

    expect(buildSwagger(TEST_DATA)).toEqual(TEST_RESPONSE);
  });
});
