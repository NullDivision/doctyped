// @flow

import type { Descriptor, DescriptorValue, GraphQlResponse } from './reader';
// $FlowFixMe
import { API_GRAPHQL, API_SWAGGER } from './constants.json';

type SwaggerProperty = { $ref?: string, enum: Array<string>, items: SwaggerProperty, type: string };
type PropertyValue = {| exportTypes?: string, importTypes?: string, required: boolean, type: string |};
export type SchemaValue = {|
  name: string,
  properties: { [string]: PropertyValue }
|};
export type Schema = $ReadOnlyArray<SchemaValue>;

const GQL_TOP_LEVEL_TYPE = 'OBJECT';

const doPropertyTransform = (required) =>
  (name, { $ref, enum: optsList, items, type }: SwaggerProperty) => {
    let parsedType = '*';
    let exportType;
    let importType;
    let ucName = `${name[0].toUpperCase()}${name.substr(1)}`;

    switch (type) {
      case 'integer':
        parsedType = 'number';
        break
      case 'number':
      case 'string':
      case 'boolean':
        parsedType = type;

        if (optsList) {
          parsedType = ucName;
          exportType = optsList.map((opt) => `'${opt}'`).join('|');
        }
        break;
      case 'array':
        // eslint-disable-next-line no-case-declarations
        const subType = doPropertyTransform([])(`${ucName}Opts`, items);

        parsedType = `Array<${subType.type}>`;
        exportType = subType.exportTypes;
        importType = subType.importTypes;

        break;
      default:
        if (typeof $ref === 'string') {
          parsedType = importType = $ref.replace('#/definitions/', '');
        }
    }

    return {
      exportTypes: exportType,
      importTypes: importType,
      required: !!required && required.includes(name),
      type: parsedType
    };
  };

const mapSwaggerTypes = (name, value): SchemaValue => {
  const { additionalProperties, properties, required }: DescriptorValue = value;
  const getProperty = doPropertyTransform(required);
  const propertyEntries = Object.entries(properties);
  const mergedProperties = additionalProperties ? [...propertyEntries, ['[string]', additionalProperties]]
                                                : propertyEntries;

  const resolvedProperties = mergedProperties.reduce((acc, [propName, prop]) => {
    if (!(prop instanceof Object)) return acc;
    
    return { ...acc, [propName]: getProperty(propName, prop) };
  }, {});

  return { name, properties: resolvedProperties };
};

const castGraphQLType = ({ name }) => {
  if (name === 'ID') return 'string';
  
  return name.toLowerCase();
};

const mapGraphQLTypes = ({ kind, name, ofType }): PropertyValue => ({
  importTypes: kind === GQL_TOP_LEVEL_TYPE ? name : undefined,
  required: kind === 'NON_NULL',
  type: kind === GQL_TOP_LEVEL_TYPE ? name : ofType ? castGraphQLType(ofType) : name
});

type Definitions = $PropertyType<Descriptor, 'definitions'>;

export default (api: typeof API_GRAPHQL | typeof API_SWAGGER) => {
  if (api === API_GRAPHQL) {
    return ({ types }: GraphQlResponse): $ReadOnlyArray<SchemaValue> => {
      return types.map(({ fields, name }) => ({
        name,
        properties: fields.reduce((acc, { name, type }) => ({ ...acc, [name]: mapGraphQLTypes(type) }), {})
      }));
    };
  }
  
  if (api === API_SWAGGER) {
    return (definitions: Definitions): Schema => {
      const definitionEntries = Object.entries(definitions);

      return definitionEntries.map(([name, value]) => {
          if (!(value instanceof Object)) return { name: '', properties: {} };

          return mapSwaggerTypes(name, value);
        });
    };
  }

  throw new Error(`Invalid api type. API must be one of: ${API_GRAPHQL}, ${API_SWAGGER}`);
};
