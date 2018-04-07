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

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

const DEFAULT_OPTS = { output: null };

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
      console.log(e.message);
      reject(new Error('Could not resolve path locally'));
    }
  });
});

const getDescriptor = async url => {
  try {
    const response = await getLocalDescriptor(url);

    return response;
  } catch (e) {
    console.log(e.message);
    const response = await getRemoteDescriptor(url);
    return response;
  }
};

const buildFiles = (output, schema) => schema.forEach((_ref) => {
  let { name } = _ref,
      rest = _objectWithoutProperties(_ref, ['name']);

  return _ejs2.default.renderFile(_path2.default.resolve(__dirname, 'template.ejs'), _extends({ name }, rest), (err, result) => {
    if (err) {
      console.log(err);
    }

    _fs2.default.writeFile(`${output}/${name}.js.flow`, result, err => {
      err && console.log(err);
    });
  });
});

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
      exportType = subType.exports;
      importType = subType.imports;

      break;
    default:
      if ($ref) {
        parsedType = importType = $ref.replace('#/definitions/', '');
      }
  }

  return {
    exports: exportType,
    imports: importType,
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