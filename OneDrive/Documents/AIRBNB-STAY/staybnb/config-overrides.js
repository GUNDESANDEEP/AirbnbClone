const { overrideDevServer } = require('customize-cra');

module.exports = overrideDevServer((config) => {
  // Remove deprecated options to avoid warnings
  delete config.onAfterSetupMiddleware;
  delete config.onBeforeSetupMiddleware;

  // If needed, you can add setupMiddlewares here
  // config.setupMiddlewares = (middlewares, devServer) => {
  //   // Add custom middlewares if necessary
  //   return middlewares;
  // };

  return config;
});