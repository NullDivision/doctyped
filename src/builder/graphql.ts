import { SchemaValue, SchemaValueProperties } from '.';
import { GraphQlResponse } from '../reader';

const EXTERNAL_TYPE = 'OBJECT';
const ARRAY_TYPE = 'LIST';
const REQUIRED_TYPE = 'NON_NULL';
const SUB_TYPES = [ARRAY_TYPE, REQUIRED_TYPE];

const removeIntrinsicTypes = (
  types: GraphQlResponse['types']
): GraphQlResponse['types'] =>
  types.filter(({ kind, name }) => kind !== 'SCALAR' && !name.startsWith('__'));

const resolveImportType = ({ kind, name, ofType }): string => {
  if (kind === EXTERNAL_TYPE) return name;
  if (ofType && SUB_TYPES.includes(kind)) return resolveImportType(ofType);
};

const resolveType = ({ kind, name, ofType }): string => {
  if (kind === EXTERNAL_TYPE) return name;
  if (ofType && kind === ARRAY_TYPE) return `Array<${resolveType(ofType)}>`;
  if (ofType && kind === REQUIRED_TYPE) return resolveType(ofType);

  return ['String', 'ID'].includes(name)
    ? 'string'
    : name === 'Boolean'
    ? 'boolean'
    : name;
};

const mapProperties = (fields): SchemaValueProperties =>
  (fields || []).reduce(
    (acc, { name, type }) => ({
      ...acc,
      [name]: {
        exportTypes: undefined,
        importTypes: resolveImportType(type),
        required: type.kind === REQUIRED_TYPE,
        type: resolveType(type)
      }
    }),
    {}
  );

export default ({ types }: GraphQlResponse): ReadonlyArray<SchemaValue> =>
  [...removeIntrinsicTypes(types)]
    .sort(
      ({ name: nameA }, { name: nameB }) =>
        (nameA && nameA.localeCompare(nameB)) || 0
    )
    .map(({ fields, name }) => ({ name, properties: mapProperties(fields) }));
