const { randomBytes } = require('@app-core/randomness');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { CreatorCardMessages } = require('@app/messages');

const WHITESPACE_CHARACTERS = ' \n\r\t\f\v';
const MAX_SLUG_LENGTH = 50;
const SUFFIX_LENGTH = 6;
const SUFFIX_SEPARATOR_LENGTH = 1;
const MAX_SUFFIXED_SLUG_BASE_LENGTH = MAX_SLUG_LENGTH - SUFFIX_LENGTH - SUFFIX_SEPARATOR_LENGTH;

function isWhitespaceCharacter(character) {
  return WHITESPACE_CHARACTERS.includes(character);
}

function isLowercaseLetter(character) {
  return character >= 'a' && character <= 'z';
}

function isUppercaseLetter(character) {
  return character >= 'A' && character <= 'Z';
}

function isDigit(character) {
  return character >= '0' && character <= '9';
}

function isAlphanumericCharacter(character) {
  return isLowercaseLetter(character) || isUppercaseLetter(character) || isDigit(character);
}

function isSlugCharacter(character) {
  return isAlphanumericCharacter(character) || character === '-' || character === '_';
}

function trimTrailingHyphen(value) {
  let output = value;

  while (output.endsWith('-')) {
    output = output.slice(0, -1);
  }

  return output;
}

function truncateSlugBase(value, maxLength) {
  return trimTrailingHyphen(value.slice(0, maxLength));
}

function normalizeSlugTitle(title) {
  const normalizedTitle = String(title || '').toLowerCase();
  let slug = '';
  let previousCharacterWasHyphen = false;

  normalizedTitle.split('').forEach((character) => {
    if (isWhitespaceCharacter(character)) {
      if (slug && !previousCharacterWasHyphen) {
        slug += '-';
        previousCharacterWasHyphen = true;
      }
      return;
    }

    if (!isSlugCharacter(character)) {
      return;
    }

    slug += character;
    previousCharacterWasHyphen = character === '-';
  });

  return truncateSlugBase(slug, MAX_SLUG_LENGTH);
}

function ensureValidSlug(slug) {
  const hasInvalidCharacter = slug.split('').some((character) => !isSlugCharacter(character));

  if (hasInvalidCharacter) {
    throwAppError(CreatorCardMessages.INVALID_SLUG, ERROR_CODE.INVLDDATA);
  }
}

function ensureValidAccessCode(accessCode) {
  if (accessCode.length !== 6) {
    throwAppError(CreatorCardMessages.INVALID_PRIVATE_ACCESS_CODE, ERROR_CODE.INVLDDATA);
  }

  const hasInvalidCharacter = accessCode
    .split('')
    .some((character) => !isAlphanumericCharacter(character));

  if (hasInvalidCharacter) {
    throwAppError(CreatorCardMessages.INVALID_PRIVATE_ACCESS_CODE, ERROR_CODE.INVLDDATA);
  }
}

function ensureValidLinks(links = []) {
  links.forEach((link) => {
    const linkUrl = link.url || '';
    const isValidProtocol = linkUrl.startsWith('http://') || linkUrl.startsWith('https://');

    if (!isValidProtocol) {
      throwAppError(CreatorCardMessages.INVALID_LINK_URL, ERROR_CODE.INVLDDATA);
    }
  });
}

function ensureValidServiceRates(serviceRates) {
  if (!serviceRates) {
    return;
  }

  serviceRates.rates.forEach((rate) => {
    if (!Number.isInteger(rate.amount) || rate.amount < 1) {
      throwAppError(CreatorCardMessages.INVALID_SERVICE_RATE_AMOUNT, ERROR_CODE.INVLDDATA);
    }
  });
}

async function generateUniqueSlug(title, slugExists) {
  const normalizedSlug = normalizeSlugTitle(title);
  const defaultBase = normalizedSlug || 'card';
  const baseSlug = truncateSlugBase(defaultBase, MAX_SLUG_LENGTH);

  if (baseSlug.length >= 5 && !(await slugExists(baseSlug))) {
    return baseSlug;
  }

  const suffixedBase = truncateSlugBase(defaultBase, MAX_SUFFIXED_SLUG_BASE_LENGTH) || 'card';

  async function generateCandidate() {
    const suffix = randomBytes(SUFFIX_LENGTH);
    const candidateSlug = `${suffixedBase}-${suffix}`;

    if (!(await slugExists(candidateSlug))) {
      return candidateSlug;
    }

    return generateCandidate();
  }

  return generateCandidate();
}

async function resolveCardSlug({ slug, title, slugExists }) {
  if (slug) {
    ensureValidSlug(slug);

    if (await slugExists(slug)) {
      throwAppError(CreatorCardMessages.SLUG_ALREADY_TAKEN, ERROR_CODE.CREATOR_CARD_SLUG_TAKEN);
    }

    return slug;
  }

  return generateUniqueSlug(title, slugExists);
}

function serializeCreatorCard(card, options = {}) {
  const includeAccessCode = options.includeAccessCode !== false;
  const responseData = {
    id: card._id || card.id,
    title: card.title,
  };

  if (card.description !== undefined) {
    responseData.description = card.description;
  }

  responseData.slug = card.slug;
  responseData.creator_reference = card.creator_reference;

  if (card.links !== undefined) {
    responseData.links = card.links;
  }

  if (card.service_rates !== undefined) {
    responseData.service_rates = card.service_rates;
  }

  responseData.status = card.status;
  responseData.access_type = card.access_type || 'public';

  if (includeAccessCode) {
    responseData.access_code = card.access_code ?? null;
  }

  responseData.created = card.created;
  responseData.updated = card.updated;
  responseData.deleted = card.deleted && card.deleted > 0 ? card.deleted : null;

  return responseData;
}

module.exports = {
  ensureValidAccessCode,
  ensureValidLinks,
  ensureValidServiceRates,
  resolveCardSlug,
  serializeCreatorCard,
};
