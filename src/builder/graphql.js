// @flow

import type { SchemaValue } from '.';
import type { GraphQlResponse } from '../reader';

const EXTERNAL_TYPE = 'OBJECT';
const ARRAY_TYPE = 'LIST';

const removeIntrinsicTypes = (types) => types.filter(({ kind, name }) => kind !== 'SCALAR' && !name.startsWith('__'));

const resolveImportType = ({ kind, name, ofType }): ?string => {
  if (kind === EXTERNAL_TYPE) return name;
  if (kind === ARRAY_TYPE) {
    if (ofType) return `Array<${resolveImportType(ofType) || '*'}>`;
    return 'Array<*>';
  }
};

const mapProperties = (fields): $PropertyType<SchemaValue, 'properties'> =>
  (fields || []).reduce((acc, { name, type }) => ({
    ...acc,
    [name]: { exportTypes: undefined, importTypes: resolveImportType(type) }
  }), {});

export default ({ types }: GraphQlResponse): $ReadOnlyArray<SchemaValue> =>
  removeIntrinsicTypes(types)
    .sort(({ name: nameA }, { name: nameB }) => nameA && nameA.localeCompare(nameB) || 0)
    .map(({ fields, name }) => ({ name, properties: mapProperties(fields) }));
