const express = require('express');
const startApp = require('../app');

const app = express();
let serverPromise;

function getServer() {
  if (!serverPromise) {
    serverPromise = startApp({ shouldListen: false });
  }

  return serverPromise;
}

app.use(async (req, res, next) => {
  try {
    const server = await getServer();
    return server.executeRequest(req, res, next);
  } catch (error) {
    return next(error);
  }
});

module.exports = app;
