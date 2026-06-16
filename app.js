const dotenv = require('dotenv');
const fs = require('fs');

if (!process.env.__ALREADY_BOOTSTRAPPED_ENVS) dotenv.config();
const { createServer } = require('@app-core/server');
const { createConnection } = require('@app-core/mongoose');
const { createQueue } = require('@app-core/queue');

const getOpenAPISpecEndpoint = require('./endpoints/swagger/get-openapi-spec');
const getSwaggerUIEndpoint = require('./endpoints/swagger/get-swagger-ui');
const createCreatorCardEndpoint = require('./endpoints/creator-cards/create-creator-card');
const deleteCreatorCardEndpoint = require('./endpoints/creator-cards/delete-creator-card');
const getCreatorCardEndpoint = require('./endpoints/creator-cards/get-creator-card');
const onboardingLoginEndpoint = require('./endpoints/onboarding/login');

const canLogEndpointInformation = process.env.CAN_LOG_ENDPOINT_INFORMATION;

const ENDPOINT_CONFIGS = [
  {
    path: './endpoints/swagger/',
    handlers: [
      {
        fileName: 'get-openapi-spec.js',
        handler: getOpenAPISpecEndpoint,
      },
      {
        fileName: 'get-swagger-ui.js',
        handler: getSwaggerUIEndpoint,
      },
    ],
  },
  {
    path: './endpoints/creator-cards/',
    handlers: [
      {
        fileName: 'create-creator-card.js',
        handler: createCreatorCardEndpoint,
      },
      {
        fileName: 'delete-creator-card.js',
        handler: deleteCreatorCardEndpoint,
      },
      {
        fileName: 'get-creator-card.js',
        handler: getCreatorCardEndpoint,
      },
    ],
  },
  {
    path: './endpoints/onboarding/',
    handlers: [
      {
        fileName: 'login.js',
        handler: onboardingLoginEndpoint,
      },
    ],
  },
];

function logEndpointMetaData(endpointConfigs) {
  const endpointData = [];
  const storageDirName = './endpoint-data';
  const EXEMPTED_ENDPOINTS_REGEX = /onboarding/;

  endpointConfigs.forEach((endpointConfig) => {
    const { path: basePath, options, handlers } = endpointConfig;

    handlers.forEach(({ fileName, handler }) => {
      if (!EXEMPTED_ENDPOINTS_REGEX.test(basePath) && handler.middlewares?.length) {
        const entry = { method: handler.method, endpoint: handler.path };
        entry.name = fileName.replaceAll('-', ' ').replace('.js', '');
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

function setupEndpointHandlers(handlers, options = {}) {
  const { server } = this || {};

  handlers.forEach(({ handler }) => {
    const configuredHandler = options.pathPrefix
      ? { ...handler, path: `${options.pathPrefix}${handler.path}` }
      : handler;

    server.addHandler(configuredHandler);
  });
}

if (canLogEndpointInformation) {
  logEndpointMetaData(ENDPOINT_CONFIGS);
}

async function startApp(options = {}) {
  const { shouldListen = true } = options;

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
    setupEndpointHandlers.call({ server }, config.handlers, config.options);
  });

  if (shouldListen) {
    server.startServer();
  }

  return server;
}

if (require.main === module) {
  startApp().catch((error) => {
    console.error('Application startup failed:', error);
    process.exit(1);
  });
}

module.exports = startApp;
