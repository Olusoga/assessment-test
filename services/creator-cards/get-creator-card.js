const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { CreatorCardMessages } = require('@app/messages');
const CreatorCardRepository = require('@app/repository/creator-card');
const { serializeCreatorCard } = require('./helpers');

async function getCreatorCard(serviceData) {
  const creatorCard = await CreatorCardRepository.findOne({
    query: { slug: serviceData.slug, deleted: 0 },
  });

  if (!creatorCard) {
    throwAppError(CreatorCardMessages.CREATOR_CARD_NOT_FOUND, ERROR_CODE.CREATOR_CARD_NOT_FOUND);
  }

  if (creatorCard.status === 'draft') {
    throwAppError(
      CreatorCardMessages.CREATOR_CARD_NOT_FOUND,
      ERROR_CODE.CREATOR_CARD_DRAFT_NOT_FOUND
    );
  }

  if (creatorCard.access_type === 'private' && !serviceData.access_code) {
    throwAppError(
      CreatorCardMessages.PRIVATE_CARD_ACCESS_CODE_REQUIRED,
      ERROR_CODE.CREATOR_CARD_ACCESS_CODE_REQUIRED_FOR_RETRIEVAL
    );
  }

  if (
    creatorCard.access_type === 'private' &&
    serviceData.access_code !== creatorCard.access_code
  ) {
    throwAppError(
      CreatorCardMessages.INVALID_ACCESS_CODE,
      ERROR_CODE.CREATOR_CARD_INVALID_ACCESS_CODE
    );
  }

  return serializeCreatorCard(creatorCard, { includeAccessCode: false });
}

module.exports = getCreatorCard;
