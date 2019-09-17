import { parse } from 'flow-parser';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { ScriptTarget, createSourceFile } from 'typescript';
import { generateFile, FORMAT_TYPE } from '../fileGenerator';

const TEST_PATH_BASE = resolve(__dirname, '../../tmp');

describe('fileGenerator', () => {
  it('respects ref imports', async () => {
    const TEST_PATH = resolve(TEST_PATH_BASE, 'refTest' + new Date().getTime());

    await fs.mkdir(TEST_PATH);

    generateFile(FORMAT_TYPE.FLOW, TEST_PATH, [
      {
        name: 'Pet',
        properties: {
          category: {
            importTypes: 'Category',
            required: true,
            type: 'Category'
          }
        }
      }
    ]);

    const response = await fs.readFile(`${TEST_PATH}/Pet.js.flow`);
    const { body } = await parse(response.toString());

    expect(body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          declaration: expect.objectContaining({
            id: expect.objectContaining({ name: 'Pet' }),
            right: expect.objectContaining({
              properties: expect.arrayContaining([
                expect.objectContaining({
                  key: expect.objectContaining({ name: 'category' }),
                  value: expect.objectContaining({
                    id: expect.objectContaining({ name: 'Category' })
                  })
                })
              ])
            })
          }),
          type: 'ExportNamedDeclaration'
        }),
        expect.objectContaining({
          source: expect.objectContaining({ value: './Category.js.flow' }),
          type: 'ImportDeclaration'
        })
      ])
    );
  });

  it('resolves array types', async () => {
    const TEST_PATH = resolve(
      TEST_PATH_BASE,
      'arrayTest' + new Date().getTime()
    );

    await fs.mkdir(TEST_PATH);
    await generateFile(FORMAT_TYPE.FLOW, TEST_PATH, [
      {
        name: 'Pet',
        properties: { photoUrls: { required: true, type: 'Array<string>' } }
      }
    ]);

    const response = await fs.readFile(`${TEST_PATH}/Pet.js.flow`);
    const {
      body: [body]
    } = await parse(response.toString());

    expect(body.declaration).toMatchObject({
      id: expect.objectContaining({ name: 'Pet' }),
      right: expect.objectContaining({
        properties: expect.arrayContaining([
          expect.objectContaining({
            key: expect.objectContaining({ name: 'photoUrls' }),
            value: expect.objectContaining({
              id: expect.objectContaining({ name: 'Array' }),
              typeParameters: expect.objectContaining({
                params: expect.arrayContaining([
                  expect.objectContaining({
                    type: 'StringTypeAnnotation'
                  })
                ])
              })
            })
          })
        ])
      })
    });
  });

  it('resolves number types', async () => {
    const TEST_PATH = resolve(
      TEST_PATH_BASE,
      'numberTest' + new Date().getTime()
    );

    await fs.mkdir(TEST_PATH);
    await generateFile(FORMAT_TYPE.FLOW, TEST_PATH, [
      {
        name: 'Order',
        properties: {
          petId: { required: true, type: 'number' },
          quantity: { required: true, type: 'number' }
        }
      }
    ]);
    const response = await fs.readFile(`${TEST_PATH}/Order.js.flow`);
    const {
      declaration: {
        right: { properties }
      }
    } = parse(response.toString())
      .body.filter(({ type }) => type === 'ExportNamedDeclaration')
      .find(
        ({
          declaration: {
            id: { name }
          }
        }) => name === 'Order'
      );

    expect(properties).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: expect.objectContaining({ name: 'petId' }),
          value: expect.objectContaining({
            type: 'NumberTypeAnnotation'
          })
        }),
        expect.objectContaining({
          key: expect.objectContaining({ name: 'quantity' }),
          value: expect.objectContaining({
            type: 'NumberTypeAnnotation'
          })
        })
      ])
    );
  });

  it('dedups imports from same files', async () => {
    const TEST_PATH = join(TEST_PATH_BASE, 'dedup' + new Date().getTime());

    await fs.mkdir(TEST_PATH);
    await generateFile(FORMAT_TYPE.FLOW, TEST_PATH, [
      {
        name: 'Pet',
        properties: {
          category: {
            importTypes: 'Category',
            required: true,
            type: 'Category'
          },
          categories: {
            importTypes: 'Category',
            required: true,
            type: 'Array<Category>'
          }
        }
      }
    ]);

    const TEST_FILE = join(TEST_PATH, 'Pet.js.flow');

    const result = await fs.readFile(TEST_FILE, 'utf8');
    expect(result.match(/Category.js/g)).toHaveLength(1);
  });
});
