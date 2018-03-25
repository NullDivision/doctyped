import test from 'ava';
import fs from 'fs';
import path from 'path';
import sinon from 'sinon';
import flowParser from 'flow-parser';

import descriptor from './__mocks__/swagger.json';
import doctyped from '../src/doctyped';

const TEST_PATH_BASE = path.resolve(__dirname, '..', 'tmp');

test('generates models', async (t) => {
  sinon.stub(process, 'cwd');

  const modelNames = Object.keys(descriptor.definitions);

  await doctyped(path.resolve(__dirname, '__mocks__/swagger.json'));

  modelNames.forEach((model) => t.truthy(fs.existsSync(`${TEST_PATH_BASE}/${model}.js.flow`)));
});

test('accepts output directory', async (t) => {
  const TEST_PATH = path.resolve(TEST_PATH_BASE, 'definedPath');

  const modelNames = Object.keys(descriptor.definitions);

  t.truthy(modelNames.length);

  modelNames.forEach((model) => t.falsy(fs.existsSync(`${TEST_PATH}/${model}.js.flow`)));

  await doctyped(path.resolve(__dirname, '__mocks__/swagger.json'), { output: TEST_PATH });

  modelNames.forEach((model) => t.truthy(fs.existsSync(`${TEST_PATH}/${model}.js.flow`)));
});

test.cb('generates flow type', (t) => {
  const TEST_PATH = path.resolve(TEST_PATH_BASE, 'flow');

  doctyped(path.resolve(__dirname, '__mocks__/swagger.json'), { output: TEST_PATH }).then(() => {
    fs.readFile(`${TEST_PATH}/Order.js.flow`, (err, response) => {
      const { body: [body], comments: [{ value }] } = flowParser.parse(response.toString());
      const { declaration: { id: { name }, right: { properties } }, type } = body;
      const matchOpts = {
        id: { annotation: 'NumberTypeAnnotation', type: 'NullableTypeAnnotation' },
        petId: { annotation: 'NumberTypeAnnotation', type: 'NullableTypeAnnotation' },
        quantity: { annotation: 'NumberTypeAnnotation', type: 'NullableTypeAnnotation' },
        shipDate: { annotation: 'GenericTypeAnnotation', type: 'NullableTypeAnnotation' },
        status: { length: 3, type: 'UnionTypeAnnotation' },
        complete: { annotation: 'BooleanTypeAnnotation', type: 'NullableTypeAnnotation' }
      };

      t.truthy(value.includes('@flow'));
      t.is(type, 'ExportNamedDeclaration');
      t.is(name, 'Order');
      t.is(properties.length, 6);
      properties.forEach(({ key: { name }, value: { type, typeAnnotation, ...value } }) => {
        const { [name]: match } = matchOpts;
        t.is(type, match.type);
        
        switch(type) {
          case 'NullableTypeAnnotation':
            t.is(typeAnnotation.type, match.annotation);
            return;
          case 'UnionTypeAnnotation':
            t.is(value.types.length, match.length);
            return;
          default:
            throw new Error(`Unhandled type '${type}'`);
        }
      });
      t.end();
    });
  });
});
