const getLogger = (allow) => (...content) => allow && console.log(...content);

export default getLogger(['development', 'test'].includes(process.env.NODE_ENV));
