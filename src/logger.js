// @flow

// $FlowFixMe
const getLogger = (allow) => (...content) => allow && console.log(...content);

export default getLogger(process.env.NODE_ENV === 'development');
