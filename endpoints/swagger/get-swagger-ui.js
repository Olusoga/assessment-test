const { createHandler } = require('@app-core/server');
const getSwaggerUiHtml = require('@app/services/swagger/get-swagger-ui-html');

module.exports = createHandler({
  path: '/docs',
  method: 'get',
  middlewares: [],
  async handler(rc, helpers) {
    return {
      status: helpers.http_statuses.HTTP_200_OK,
      disableResponseEnvelope: true,
      contentType: 'text/html; charset=utf-8',
      rawBody: getSwaggerUiHtml({ headers: rc.headers }),
    };
  },
});
