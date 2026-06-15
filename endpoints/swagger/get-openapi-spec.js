const { createHandler } = require('@app-core/server');
const getOpenApiSpec = require('@app/services/swagger/get-openapi-spec');

module.exports = createHandler({
  path: '/openapi.json',
  method: 'get',
  middlewares: [],
  async handler(rc, helpers) {
    const spec = getOpenApiSpec({ headers: rc.headers });

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      disableResponseEnvelope: true,
      contentType: 'application/json',
      rawBody: spec,
    };
  },
});
