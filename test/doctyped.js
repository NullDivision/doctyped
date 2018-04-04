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
  const models = await doctyped(path.resolve(__dirname, '__mocks__/swagger.json'));

  t.truthy(models.length);
  modelNames.forEach((model) => t.truthy(models.find(({ name }) => model === name)));
});

test('accepts output directory', async (t) => {
  const TEST_PATH = path.resolve(TEST_PATH_BASE, 'definedPath');

  const modelNames = Object.keys(descriptor.definitions);

  t.truthy(modelNames.length);

  modelNames.forEach((model) => t.falsy(fs.existsSync(`${TEST_PATH}/${model}.js.flow`)));

  fs.mkdirSync(TEST_PATH);
  await doctyped(path.resolve(__dirname, '__mocks__/swagger.json'), { output: TEST_PATH });

  modelNames.forEach((model) => t.truthy(fs.existsSync(`${TEST_PATH}/${model}.js.flow`)));
});

test.cb('generates flow type', (t) => {
  const TEST_PATH = path.resolve(TEST_PATH_BASE, 'flow');

  fs.mkdirSync(TEST_PATH);
  doctyped(path.resolve(__dirname, '__mocks__/swagger.json'), { output: TEST_PATH })
    .then(() => {
      fs.readFile(`${TEST_PATH}/Order.js.flow`, (err, response) => {
        const { body: [status, order], type, ...rest } = flowParser.parse(response.toString());
        const { declaration, type: statusType, ...restStatus } = status;
        t.end();
      })
    })
    .catch((err) => t.log(err));
});

test.cb('respects ref imports', (t) => {
  const TEST_PATH = path.resolve(TEST_PATH_BASE, 'refTest');

  fs.mkdirSync(TEST_PATH);
  doctyped(path.resolve(__dirname, '__mocks__/swagger.json'), { output: TEST_PATH }).then(() => {
    fs.readFile(`${TEST_PATH}/Pet.js.flow`, (err, response) => {
      const { body } = flowParser.parse(response.toString());

      t.is(
        body
          .filter(({ type }) => type === 'ExportNamedDeclaration')
          .find(({ declaration: { id: { name } } }) => name === 'Pet')
          .declaration
          .right
          .properties
          .find(({ key: { name } }) => name === 'category')
          .value
          .typeAnnotation
          .id
          .name,
        'Category'
      );
      t.truthy(
        body
          .filter(({ type }) => type === 'ImportDeclaration')
          .find(({ source: { value } }) => value === './Category.js.flow')
      );
      t.end();
    });
  });
});
