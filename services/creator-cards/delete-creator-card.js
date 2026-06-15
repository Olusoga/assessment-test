const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { CreatorCardMessages } = require('@app/messages');
const CreatorCardRepository = require('@app/repository/creator-card');
const { serializeCreatorCard } = require('./helpers');

const deleteCreatorCardSpec = `root {
  creator_reference string<trim|length:20>
}`;

const parsedDeleteCreatorCardSpec = validator.parse(deleteCreatorCardSpec);

async function deleteCreatorCard(serviceData) {
  const validatedData = validator.validate(serviceData, parsedDeleteCreatorCardSpec);
  const creatorCard = await CreatorCardRepository.findOne({
    query: { slug: serviceData.slug, deleted: 0 },
  });

  if (!creatorCard || creatorCard.creator_reference !== validatedData.creator_reference) {
    throwAppError(CreatorCardMessages.CREATOR_CARD_NOT_FOUND, ERROR_CODE.CREATOR_CARD_NOT_FOUND);
  }

  const deletedAt = Date.now();
  const updateResult = await CreatorCardRepository.updateOne({
    query: { _id: creatorCard._id, deleted: 0 },
    updateValues: { deleted: deletedAt },
  });

  if (!updateResult.modifiedCount) {
    throwAppError(CreatorCardMessages.CREATOR_CARD_NOT_FOUND, ERROR_CODE.CREATOR_CARD_NOT_FOUND);
  }

  return serializeCreatorCard({
    ...creatorCard,
    updated: deletedAt,
    deleted: deletedAt,
  });
}

module.exports = deleteCreatorCard;
