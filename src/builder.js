// @flow

import type { Descriptor } from './doctyped';

type SwaggerProperty = { $ref?: string, enum: Array<string>, items: SwaggerProperty, type: string };
export type SchemaValue = {| name: string, properties: { [string]: {| required: boolean, type: string |} } |};
export type Schema = $ReadOnlyArray<SchemaValue>;

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

export default (definitions: $PropertyType<Descriptor, 'definitions'>): Schema => {
  const definitionEntries = Object.entries(definitions);

  return definitionEntries
    .map(([name, value]) => {
      if (!(value instanceof Object)) return { name: '', properties: {} };

      const { properties, required } = value;
      const getProperty = doPropertyTransform(required);
      const propEntries = Object

      return {
        name,
        properties: Object
          .entries(properties)
          .reduce((acc, [propName, prop]) => {
            if (!(prop instanceof Object)) return acc;
            
            return { ...acc, [propName]: getProperty(propName, prop) };
          }, {})
      };
    });
};;
