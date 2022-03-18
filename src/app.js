const express = require('express');
const { getPackage } = require('./package.js');

/**
 * Bootstrap the application framework
 */
function createApp() {
  const app = express();

  app.use(express.json());

  app.get('/package/:name/:version', getPackage);

  return app;
}

module.exports = { createApp };