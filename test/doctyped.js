import test from 'ava';
import fs from 'fs';
import path from 'path';

import descriptor from './__mocks__/swagger.json';
import doctyped from '../src/doctyped';

const TEST_PATH_BASE = path.resolve(__dirname, '..', 'tmp');

const cleanDir = (dirname) =>
  new Promise((resolve) =>
    fs.readdir(
      dirname,
      (err, files) => {
        if (err && err.errno === -2) {
          resolve();
          return;
        }

        files
          .filter((f) => f !== '.gitkeep')
          .forEach((f) => fs.unlink(path.resolve(dirname, f), (err) => {}))

        resolve();
      }
    )
  );

test('generates models', async (t) => {
  await cleanDir(TEST_PATH_BASE);

  const modelNames = Object.keys(descriptor.definitions);

  await doctyped(path.resolve(__dirname, '__mocks__/swagger.json'));

  modelNames.forEach((model) => t.truthy(fs.existsSync(`${TEST_PATH_BASE}/${model}.js.flow`)));
});

test('accepts output directory', async (t) => {
  const TEST_PATH = path.resolve(TEST_PATH_BASE, 'definedPath');
  await cleanDir(TEST_PATH);

  const modelNames = Object.keys(descriptor.definitions);

  t.truthy(modelNames.length);

  modelNames.forEach((model) => t.falsy(fs.existsSync(`${TEST_PATH}/${model}.js.flow`)));

  await doctyped(path.resolve(__dirname, '__mocks__/swagger.json'), { output: TEST_PATH });

  modelNames.forEach((model) => t.truthy(fs.existsSync(`${TEST_PATH}/${model}.js.flow`)));
});
