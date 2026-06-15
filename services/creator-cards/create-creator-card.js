const validator = require('@app-core/validator');
const { ulid } = require('@app-core/randomness');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { CreatorCardMessages } = require('@app/messages');
const CreatorCardRepository = require('@app/repository/creator-card');
const {
  ensureValidAccessCode,
  ensureValidLinks,
  ensureValidServiceRates,
  resolveCardSlug,
  serializeCreatorCard,
} = require('./helpers');

const createCreatorCardSpec = `root {
  title string<trim|minLength:3|maxLength:100>
  description? string<trim|maxLength:500>
  slug? string<trim|minLength:5|maxLength:50>
  creator_reference string<trim|length:20>
  links[]? {
    title string<trim|minLength:1|maxLength:100>
    url string<trim|maxLength:200|startsWith:http>
  }
  service_rates? {
    currency string(NGN|USD|GBP|GHS)
    rates[] {
      name string<trim|minLength:3|maxLength:100>
      description string<trim|maxLength:250>
      amount number<min:1>
    }
  }
  status string(draft|published)
  access_type? string(public|private)
  access_code? string<trim>
}`;

const parsedCreateCreatorCardSpec = validator.parse(createCreatorCardSpec);

async function slugExists(slug) {
  const CreatorCardModel = CreatorCardRepository.raw();
  const existingCardCount = await CreatorCardModel.countDocuments({ slug });

  return existingCardCount > 0;
}

async function createCreatorCard(serviceData) {
  const validatedData = validator.validate(serviceData, parsedCreateCreatorCardSpec);
  const accessType = validatedData.access_type || 'public';
  const hasSlugField = Object.prototype.hasOwnProperty.call(serviceData, 'slug');
  const hasAccessCodeField = Object.prototype.hasOwnProperty.call(serviceData, 'access_code');
  const accessCode = validatedData.access_code;

  if (hasSlugField && !validatedData.slug) {
    throwAppError(CreatorCardMessages.INVALID_SLUG, ERROR_CODE.INVLDDATA);
  }

  if (accessType === 'private' && !accessCode) {
    throwAppError(
      CreatorCardMessages.ACCESS_CODE_REQUIRED_FOR_PRIVATE_CARD,
      ERROR_CODE.CREATOR_CARD_PRIVATE_ACCESS_CODE_REQUIRED
    );
  }

  if (accessType === 'public' && hasAccessCodeField) {
    throwAppError(
      CreatorCardMessages.ACCESS_CODE_CAN_ONLY_BE_SET_ON_PRIVATE_CARDS,
      ERROR_CODE.CREATOR_CARD_PUBLIC_ACCESS_CODE_FORBIDDEN
    );
  }

  ensureValidLinks(validatedData.links);
  ensureValidServiceRates(validatedData.service_rates);

  if (accessCode) {
    ensureValidAccessCode(accessCode);
  }

  const slug = await resolveCardSlug({
    slug: validatedData.slug,
    title: validatedData.title,
    slugExists,
  });

  const creatorCard = await CreatorCardRepository.create({
    _id: ulid(),
    title: validatedData.title,
    description: validatedData.description,
    slug,
    creator_reference: validatedData.creator_reference,
    links: validatedData.links,
    service_rates: validatedData.service_rates,
    status: validatedData.status,
    access_type: accessType,
    access_code: accessType === 'private' ? accessCode : null,
    deleted: 0,
  });

  return serializeCreatorCard(creatorCard);
}

module.exports = createCreatorCard;
