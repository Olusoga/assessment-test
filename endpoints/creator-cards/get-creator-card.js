const { createHandler } = require('@app-core/server');
const { CreatorCardMessages } = require('@app/messages');
const getCreatorCardService = require('@app/services/creator-cards/get-creator-card');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'get',
  middlewares: [],
  async handler(rc, helpers) {
    const responseData = await getCreatorCardService({
      slug: rc.params.slug,
      access_code: rc.query.access_code,
    });

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: CreatorCardMessages.CREATOR_CARD_RETRIEVED_SUCCESSFULLY,
      data: responseData,
    };
  },
});
