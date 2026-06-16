const { createHandler } = require('@app-core/server');

module.exports = createHandler({
  path: '/',
  method: 'get',
  middlewares: [],
  async handler(rc, helpers) {
    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: 'Welcome to the Creator Card API.',
      data: {
        docs_url: '/docs',
        openapi_url: '/openapi.json',
      },
    };
  },
});
