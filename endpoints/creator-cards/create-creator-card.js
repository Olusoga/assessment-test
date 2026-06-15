const { createHandler } = require('@app-core/server');
const { CreatorCardMessages } = require('@app/messages');
const createCreatorCardService = require('@app/services/creator-cards/create-creator-card');

module.exports = createHandler({
  path: '/creator-cards',
  method: 'post',
  middlewares: [],
  async handler(rc, helpers) {
    const responseData = await createCreatorCardService(rc.body);

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: CreatorCardMessages.CREATOR_CARD_CREATED_SUCCESSFULLY,
      data: responseData,
    };
  },
});
