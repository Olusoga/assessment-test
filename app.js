/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
if (!process.env.__ALREADY_BOOTSTRAPPED_ENVS) require('dotenv').config();

const fs = require('fs');
const { createServer } = require('@app-core/server');
const { createConnection } = require('@app-core/mongoose');
const { createQueue } = require('@app-core/queue');

const canLogEndpointInformation = process.env.CAN_LOG_ENDPOINT_INFORMATION;

const ENDPOINT_CONFIGS = [
  {
    path: './endpoints/swagger/',
  },
  {
    path: './endpoints/creator-cards/',
  },
  {
    path: './endpoints/onboarding/',
  },
];

function logEndpointMetaData(endpointConfigs) {
  const endpointData = [];
  const storageDirName = './endpoint-data';
  const EXEMPTED_ENDPOINTS_REGEX = /onboarding/;

  endpointConfigs.forEach((endpointConfig) => {
    const { path: basePath, options } = endpointConfig;

    const dirs = fs.readdirSync(basePath);

    dirs.forEach((file) => {
      const handler = require(`${basePath}${file}`);

      if (!EXEMPTED_ENDPOINTS_REGEX.test(basePath) && handler.middlewares?.length) {
        const entry = { method: handler.method, endpoint: handler.path };
        entry.name = file.replaceAll('-', ' ').replace('.js', '');
        entry.display_name = `can ${entry.name}`;

        if (options?.pathPrefix) {
          entry.endpoint = `${options.pathPrefix}${entry.endpoint}`;
          entry.name = `${entry.name} (${options.pathPrefix.replace('/', '')})`;
        }

        endpointData.push(entry);
      }
    });
  });

  if (!fs.existsSync(storageDirName)) {
    fs.mkdirSync(storageDirName);
  }

  fs.writeFileSync(`${storageDirName}/endpoints.json`, JSON.stringify(endpointData, null, 2), {
    encoding: 'utf-8',
  });
}

function setupEndpointHandlers(basePath, options = {}) {
  const dirs = fs.readdirSync(basePath);
  const { server } = this || {};

  dirs.forEach((file) => {
    const handler = require(`${basePath}${file}`);

    if (options.pathPrefix) {
      handler.path = `${options.pathPrefix}${handler.path}`;
    }

    server.addHandler(handler);
  });
}

if (canLogEndpointInformation) {
  logEndpointMetaData(ENDPOINT_CONFIGS);
}

async function startApp() {
  await createConnection({
    uri: process.env.MONGODB_URI,
  });

  createQueue();

  const server = createServer({
    port: process.env.PORT,
    JSONLimit: '150mb',
    enableCors: true,
  });

  ENDPOINT_CONFIGS.forEach((config) => {
    setupEndpointHandlers.call({ server }, config.path, config.options);
  });

  server.startServer();

  return server;
}

if (require.main === module) {
  startApp().catch((error) => {
    console.error('Application startup failed:', error);
    process.exit(1);
  });
}

module.exports = startApp;
