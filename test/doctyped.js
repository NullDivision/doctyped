import test from 'ava';
import flowParser from 'flow-parser';
import { existsSync, promises as fs } from 'fs';
import https from 'https';
import path from 'path';
import sinon from 'sinon';
import ts from 'typescript';

import descriptor from './__mocks__/swagger.json';
import { API_TYPE, doctyped } from '../dist/doctyped';
import * as reader from '../dist/reader';
import { FORMAT_TYPE } from '../dist/fileGenerator.js';

const { GRAPHQL: API_GRAPHQL, SWAGGER: API_SWAGGER } = API_TYPE;
const TEST_PATH_BASE = path.resolve(__dirname, '..', 'tmp');
const SWAGGER_FILE = path.resolve(__dirname, '__mocks__/swagger.json')

test('generates models', async (t) => {
  sinon.stub(process, 'cwd');

  const modelNames = Object.keys(descriptor.definitions);
  const models = await doctyped(SWAGGER_FILE, { api: API_SWAGGER });

  t.truthy(models.length);
  modelNames.forEach((model) => t.truthy(models.find(({ name }) => model === name)));
});

test('accepts output directory', async (t) => {
  try {
    const TEST_PATH = path.resolve(TEST_PATH_BASE, 'definedPath');
    const modelNames = Object.keys(descriptor.definitions);

    t.truthy(modelNames.length);

    modelNames.forEach((model) =>
      t.falsy(existsSync(`${TEST_PATH}/${model}.js.flow`))
    );

    await fs.mkdir(TEST_PATH);
    await doctyped(SWAGGER_FILE, { api: API_SWAGGER, output: TEST_PATH });

    modelNames.forEach((model) =>
      t.truthy(existsSync(`${TEST_PATH}/${model}.js.flow`))
    );
  } catch (error) {
    console.log(error);
  }
});

test('generates flow type', async (t) => {
  const TEST_PATH = path.resolve(TEST_PATH_BASE, 'flow');

  await fs.mkdir(TEST_PATH);
  await doctyped(SWAGGER_FILE, { api: API_SWAGGER, output: TEST_PATH });

  t.truthy(existsSync(`${TEST_PATH}/Order.js.flow`));
});

test('respects ref imports', async (t) => {
  const TEST_PATH = path.resolve(TEST_PATH_BASE, 'refTest');

  await fs.mkdir(TEST_PATH);
  await doctyped(SWAGGER_FILE, { api: API_SWAGGER, output: TEST_PATH })

  const response = await fs.readFile(`${TEST_PATH}/Pet.js.flow`);
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
});

test('resolves array types', async (t) => {
  const TEST_PATH = path.resolve(TEST_PATH_BASE, 'arrayTest');

  await fs.mkdir(TEST_PATH);
  await doctyped(SWAGGER_FILE, { api: API_SWAGGER, output: TEST_PATH });

  const response = await fs.readFile(`${TEST_PATH}/Pet.js.flow`)
  const property = flowParser
    .parse(response.toString())
    .body
    .filter(({ type }) => type === 'ExportNamedDeclaration')
    .find(({ declaration: { id: { name } } }) => name === 'Pet')
    .declaration
    .right
    .properties
    .find(({ key: { name } }) => name === 'photoUrls')
    .value;

  t.is(property.id.name, 'Array');
  t.truthy(property.typeParameters.params.find(({ type }) => type === 'StringTypeAnnotation'));
});

test('resolves number types', async (t) => {
  const TEST_PATH = path.resolve(TEST_PATH_BASE, 'numberTest');

  await fs.mkdir(TEST_PATH);
  await doctyped(SWAGGER_FILE, { api: API_SWAGGER, output: TEST_PATH });
  const response = await fs.readFile(`${TEST_PATH}/Order.js.flow`);
  const { declaration: { right: { properties } } } = flowParser
    .parse(response.toString())
    .body
    .filter(({ type }) => type === 'ExportNamedDeclaration')
    .find(({ declaration: { id: { name } } }) => name === 'Order')

  t.is(properties.find(({ key: { name } }) => name === 'petId').value.typeAnnotation.type, 'NumberTypeAnnotation');
  t.is(
    properties.find(({ key: { name } }) => name === 'quantity').value.typeAnnotation.type,
    'NumberTypeAnnotation'
  );
});

test('resolves path from url', async (t) => {
  sinon.stub(https, 'get').callsArgWith(1, { on: (event, cb) => cb('{ "definitions": {} }')});

  const response = await doctyped('https://localhost:12000/api', { api: API_SWAGGER });

  t.truthy(response);
});

test('generates typescript files', async (t) => {
  const TEST_PATH = path.join(TEST_PATH_BASE, 'ts');

  await fs.mkdir(TEST_PATH);
  await doctyped(
    SWAGGER_FILE,
    { api: API_SWAGGER, format: FORMAT_TYPE.TS, output: TEST_PATH }
  )

  const response = await fs.readdir(TEST_PATH);

  Object
    .keys(descriptor.definitions)
    .forEach((modelName) => t.truthy(response.includes(`${modelName}.d.ts`)));
});

test('builds valid ts interface', async (t) => {
  const TEST_PATH = path.join(TEST_PATH_BASE, 'tsInterface');

  await fs.mkdir(TEST_PATH);
  await doctyped(
    SWAGGER_FILE,
    { api: API_SWAGGER, format: FORMAT_TYPE.TS, output: TEST_PATH }
  );

  const TEST_FILE = path.join(TEST_PATH, 'Pet.d.ts');

  const result = await fs.readFile(TEST_FILE);
  const { statements } = ts.createSourceFile(TEST_FILE, result.toString(), ts.ScriptTarget.ES6, false);
  const [CategoryImport, TagImport] = statements;
  t.is(CategoryImport.moduleSpecifier.text, './Category.ts');
  t.is(TagImport.moduleSpecifier.text, './Tag.ts');
});

test('dedups imports from same files', async (t) => {
  const TEST_PATH = path.join(TEST_PATH_BASE, 'dedup');

  await fs.mkdir(TEST_PATH);
  await doctyped(SWAGGER_FILE, { api: API_SWAGGER, output: TEST_PATH });

  const TEST_FILE = path.join(TEST_PATH, 'Pet.js.flow');

  const result = await fs.readFile(TEST_FILE, 'utf8');
  t.is(result.match(/Category.js/g).length, 1);
});
