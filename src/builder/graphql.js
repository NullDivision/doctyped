// @flow

import type { SchemaValue } from '.';
import type { GraphQlResponse } from '../reader';

const removeIntrinsicTypes = (types) => types.filter(({ kind, name }) => kind !== 'SCALAR' && !name.startsWith('__'));

const mapProperties = (fields): $PropertyType<SchemaValue, 'properties'> =>
  (fields || []).reduce((acc, { name }) => ({
    ...acc,
    [name]: { exportTypes: undefined, importTypes: undefined }
  }), {});

export default ({ types }: GraphQlResponse): $ReadOnlyArray<SchemaValue> =>
  removeIntrinsicTypes(types)
    .sort(({ name: nameA }, { name: nameB }) => nameA && nameA.localeCompare(nameB) || 0)
    .map(({ fields, name }) => ({ name, properties: mapProperties(fields) }));
