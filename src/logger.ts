const getLogger = (allow: boolean) => (
  ...content: Parameters<Console['log']>
): ReturnType<Console['log']> => {
  if (allow) console.log(...content);
};

export default getLogger(
  !!process.env.NODE_ENV &&
    ['development', 'test'].includes(process.env.NODE_ENV)
);
