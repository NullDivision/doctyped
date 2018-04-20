'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _ejs = require('ejs');

var _ejs2 = _interopRequireDefault(_ejs);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _https = require('https');

var _https2 = _interopRequireDefault(_https);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const DEFAULT_OPTS = { output: null };

const getLogger = allow => (...content) => allow && console.log(...content);

const logger = getLogger(process.env.NODE_ENV === 'development');

const getAccumulatedExtras = properties => Object.entries(properties).reduce(
// $FlowFixMe
({ exportTypes: accExports, importTypes: accImports }, [name, { exportTypes: newExport, importTypes: newImport, ...rest }]) => {
  const result = { exportTypes: newExport ? [...accExports, { name: name[0].toUpperCase() + name.slice(1), type: newExport }] : accExports, importTypes: newImport ? [...accImports, newImport] : accImports };

  return result;
}, { exportTypes: [], importTypes: [] });

const getRemoteDescriptor = url => {
  const client = url.startsWith('https') ? _https2.default : _http2.default;

  return new Promise((resolve, reject) => {
    client.get(url, response => {
      let rawData = '';

      response.on('data', chunk => {
        rawData += chunk;
      });

      response.on('end', () => resolve(JSON.parse(rawData)));
    });
  });
};

const getLocalDescriptor = url => new Promise((resolve, reject) => {
  _fs2.default.readFile(url, (err, data) => {
    try {
      if (!data) {
        throw err;
      }

      resolve(JSON.parse(data.toString()));
    } catch (e) {
      logger(e.message);
      reject(new Error('Could not resolve path locally'));
    }
  });
});

const getDescriptor = async url => {
  try {
    const response = await getLocalDescriptor(url);

    return response;
  } catch (e) {
    logger(e.message);
    const response = await getRemoteDescriptor(url);
    return response;
  }
};

const buildFiles = (output, schema) => schema.forEach(({ name, properties }) => _ejs2.default.renderFile(_path2.default.resolve(__dirname, 'template.ejs'), _extends({ name, properties }, getAccumulatedExtras(properties)), (err, result) => {
  if (err) {
    logger(err);
  }

  _fs2.default.writeFile(`${output}/${name}.js.flow`, result, err => {
    err && logger(err);
  });
}));

const doPropertyTransform = required => (name, { $ref, enum: optsList, items, type }) => {
  let parsedType = '*';
  let exportType;
  let importType;
  let ucName = `${name[0].toUpperCase()}${name.substr(1)}`;

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
        exportType = optsList.map(opt => `'${opt}'`).join('|');
      }
      break;
    case 'array':
      const subType = doPropertyTransform([])(`${ucName}Opts`, items);

      parsedType = `Array<${subType.type}>`;
      exportType = subType.exportTypes;
      importType = subType.importTypes;

      break;
    default:
      if ($ref) {
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

const getSchema = definitions => {
  const definitionEntries = Object.entries(definitions);

  return definitionEntries.map(([name, { properties, required }]) => {
    const getProperty = doPropertyTransform(required);

    return {
      name,
      properties: Object.entries(properties).reduce((acc, [propName, prop]) => _extends({}, acc, { [propName]: getProperty(propName, prop) }), {})
    };
  });
};

exports.default = async (url, options) => {
  const { output } = _extends({}, DEFAULT_OPTS, options);
  const { definitions } = await getDescriptor(url);
  const schema = getSchema(definitions);

  if (output) {
    buildFiles(output, schema);
  }

  return schema;
};