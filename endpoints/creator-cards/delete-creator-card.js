const { createHandler } = require('@app-core/server');
const { CreatorCardMessages } = require('@app/messages');
const deleteCreatorCardService = require('@app/services/creator-cards/delete-creator-card');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'delete',
  middlewares: [],
  async handler(rc, helpers) {
    const responseData = await deleteCreatorCardService({
      ...rc.body,
      slug: rc.params.slug,
    });

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: CreatorCardMessages.CREATOR_CARD_DELETED_SUCCESSFULLY,
      data: responseData,
    };
  },
});
