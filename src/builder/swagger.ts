import { SchemaValue, Schema } from '.';
import { Descriptor, PropertyValue } from '../reader';

interface SwaggerProperty {
  $ref?: string;
  enum: Array<string>;
  items: SwaggerProperty;
  type: string;
}
interface PropertyTransforms {
  exportTypes: Array<string> | string | undefined;
  importTypes: string | undefined;
  required: boolean;
  type: string;
}

const doPropertyTransform = (required: ReadonlyArray<string> | undefined) => (
  name: string,
  { $ref, enum: optsList, items, type }: SwaggerProperty
): PropertyTransforms => {
  const ucName = `${name[0].toUpperCase()}${name.substr(1)}`;
  let parsedType = '*';
  let exportType;
  let importType: string | undefined;

  switch (type) {
    case 'integer':
      parsedType = 'number';
      break;
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

const mergeProperties = (
  propertyEntries: Array<[string, PropertyValue]>,
  additionalProperties: PropertyValue | undefined
): Array<[string, PropertyValue]> => {
  if (additionalProperties) {
    return [...propertyEntries, ['[string]', additionalProperties]];
  }

  return propertyEntries;
};

interface DescriptorValue {
  additionalProperties: PropertyValue;
  properties: { [key: string]: PropertyValue };
  required?: ReadonlyArray<string>;
  type: string;
  xml: {};
}

const mapSwaggerTypes = (name: string, value: DescriptorValue): SchemaValue => {
  const { additionalProperties, properties, required } = value;
  const getProperty = doPropertyTransform(required);
  const propertyEntries = Object.entries(properties);
  const mergedProperties = mergeProperties(
    propertyEntries,
    additionalProperties
  );

  const resolvedProperties = mergedProperties.reduce((acc, [propName, prop]) => {
    if (!(prop instanceof Object)) return acc;

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    return { ...acc, [propName]: getProperty(propName, prop) };
  }, {} as SchemaValue['properties']);

  return { name, properties: resolvedProperties };
};

export default (definitions: Descriptor['definitions']): Schema => {
  const definitionEntries = Object.entries(definitions);

  return definitionEntries.map(([name, value]) => {
    if (!(value instanceof Object)) return { name: '', properties: {} };

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    return mapSwaggerTypes(name, value);
  });
};
