import { SchemaValue, Schema } from '.';
import { Descriptor, DescriptorValue } from '../reader';

interface SwaggerProperty {
  $ref?: string;
  enum: Array<string>;
  items: SwaggerProperty;
  type: string;
}

const doPropertyTransform = (required) =>
  (name, { $ref, enum: optsList, items, type }: SwaggerProperty) => {
    const ucName = `${name[0].toUpperCase()}${name.substr(1)}`;
    let parsedType = '*';
    let exportType;
    let importType;

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

const mergeProperties = (propertyEntries, additionalProperties) => {
  if (additionalProperties) return [...propertyEntries, ['[string]', additionalProperties]];

  return propertyEntries;
};

const mapSwaggerTypes = (name, value: DescriptorValue): SchemaValue => {
  const { additionalProperties, properties, required } = value;
  const getProperty = doPropertyTransform(required);
  const propertyEntries = Object.entries(properties);
  const mergedProperties = mergeProperties(
    propertyEntries,
    additionalProperties
  );

  const resolvedProperties = mergedProperties.reduce((acc, [propName, prop]) => {
    if (!(prop instanceof Object)) return acc;

    return { ...acc, [propName]: getProperty(propName, prop) };
  }, {});

  return { name, properties: resolvedProperties };
};

export default (definitions: Descriptor['definitions']): Schema => {
  const definitionEntries = Object.entries(definitions);

  return definitionEntries.map(([name, value]) => {
    if (!(value instanceof Object)) return { name: '', properties: {} };

    return mapSwaggerTypes(name, value);
  });
};
