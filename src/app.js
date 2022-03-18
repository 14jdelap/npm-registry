const express = require('express');
const { getPackage } = require('./package.js');
const helmet = require("helmet");

function createApp() {
  const app = express();

  app.use(express.json());
  app.use(helmet());

  app.get('/package/:name/:version', getPackage);

  return app;
}

module.exports = { createApp };