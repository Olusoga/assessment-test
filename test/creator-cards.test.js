process.env.USE_MOCK_MODEL = '1';

const assert = require('assert');
const createMockServer = require('@app-core/mock-server');
const { MockModelStubs, MockModels } = require('@app/mock-models');

const mockedServer = createMockServer(['endpoints/creator-cards']);

function matchesQuery(document, query = {}) {
  return Object.entries(query).every(([key, value]) => document[key] === value);
}

function createCreatorCardStoreHarness() {
  const creatorCards = [];
  const reverts = [];
  const originalCountDocuments = MockModels.CreatorCard.countDocuments;

  function addRevert(revert) {
    reverts.push(revert);
  }

  addRevert(
    MockModelStubs.CreatorCard.configureStubs({
      method: 'create',
      overrideFn(data) {
        const createdCard = { ...data };
        creatorCards.push(createdCard);
        return createdCard;
      },
    }).revert
  );

  addRevert(
    MockModelStubs.CreatorCard.configureStubs({
      method: 'findOne',
      overrideFn({ query }) {
        return creatorCards.find((creatorCard) => matchesQuery(creatorCard, query)) || null;
      },
    }).revert
  );

  addRevert(
    MockModelStubs.CreatorCard.configureStubs({
      method: 'updateOne',
      overrideFn({ query, updateValues }) {
        const creatorCard = creatorCards.find((entry) => matchesQuery(entry, query));

        if (!creatorCard) {
          return { acknowledged: true, modifiedCount: 0 };
        }

        Object.assign(creatorCard, updateValues);
        return { acknowledged: true, modifiedCount: 1 };
      },
    }).revert
  );

  MockModels.CreatorCard.countDocuments = async (query = {}) =>
    creatorCards.filter((creatorCard) => matchesQuery(creatorCard, query)).length;

  return {
    creatorCards,
    restore() {
      MockModels.CreatorCard.countDocuments = originalCountDocuments;
      reverts.reverse().forEach((revert) => revert());
    },
  };
}

describe('Creator Card endpoints', () => {
  let storeHarness;

  beforeEach(() => {
    storeHarness = createCreatorCardStoreHarness();
  });

  afterEach(() => {
    storeHarness.restore();
  });

  it('creates a public creator card and defaults access_type to public', async () => {
    const response = await mockedServer.post('/creator-cards', {
      body: {
        title: 'George Cooks',
        description: 'Weekly cooking podcast',
        slug: 'george-cooks',
        creator_reference: 'crt_8f2k1m9x4p7w3q5z',
        links: [{ title: 'YouTube', url: 'https://youtube.com/@georgecooks' }],
        service_rates: {
          currency: 'NGN',
          rates: [
            {
              name: 'IG Story Post',
              description: 'One story mention',
              amount: 5000000,
            },
          ],
        },
        status: 'published',
      },
    });

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.data.message, 'Creator Card Created Successfully.');
    assert.strictEqual(response.data.data.id.length, 26);
    assert.strictEqual(response.data.data._id, undefined);
    assert.strictEqual(response.data.data.access_type, 'public');
    assert.strictEqual(response.data.data.access_code, null);
    assert.strictEqual(response.data.data.deleted, null);
  });

  it('auto-generates a slug from the title when slug is omitted', async () => {
    const response = await mockedServer.post('/creator-cards', {
      body: {
        title: 'Ada Designs Things',
        creator_reference: 'crt_a1b2c3d4e5f6g7h8',
        status: 'published',
      },
    });

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.data.data.slug, 'ada-designs-things');
  });

  it('returns SL02 when a client-provided slug already exists', async () => {
    storeHarness.creatorCards.push({
      _id: '01HXEXISTINGCARD000000000000',
      title: 'Existing Card',
      slug: 'george-cooks',
      creator_reference: 'crt_8f2k1m9x4p7w3q5z',
      status: 'published',
      access_type: 'public',
      access_code: null,
      created: Date.now(),
      updated: Date.now(),
      deleted: 0,
    });

    const response = await mockedServer.post('/creator-cards', {
      body: {
        title: 'Another George',
        slug: 'george-cooks',
        creator_reference: 'crt_m1n2b3v4c5x6z7l8',
        status: 'published',
      },
    });

    assert.strictEqual(response.statusCode, 400);
    assert.strictEqual(response.data.code, 'SL02');
    assert.strictEqual(response.data.message, 'Slug is already taken');
  });

  it('returns AC01 when a private card is missing an access code', async () => {
    const response = await mockedServer.post('/creator-cards', {
      body: {
        title: 'Secret Card',
        creator_reference: 'crt_q1w2e3r4t5y6u7i8',
        status: 'published',
        access_type: 'private',
      },
    });

    assert.strictEqual(response.statusCode, 400);
    assert.strictEqual(response.data.code, 'AC01');
  });

  it('returns AC05 when access_code is set on a public card', async () => {
    const response = await mockedServer.post('/creator-cards', {
      body: {
        title: 'Public Card',
        creator_reference: 'crt_q1w2e3r4t5y6u7i8',
        status: 'published',
        access_type: 'public',
        access_code: 'A1B2C3',
      },
    });

    assert.strictEqual(response.statusCode, 400);
    assert.strictEqual(response.data.code, 'AC05');
  });

  it('retrieves a published public card without leaking the access code', async () => {
    storeHarness.creatorCards.push({
      _id: '01HXPUBLICCARD00000000000000',
      title: 'George Cooks',
      slug: 'george-cooks',
      creator_reference: 'crt_8f2k1m9x4p7w3q5z',
      status: 'published',
      access_type: 'public',
      access_code: null,
      created: Date.now(),
      updated: Date.now(),
      deleted: 0,
    });

    const response = await mockedServer.get('/creator-cards/george-cooks');

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.data.message, 'Creator Card Retrieved Successfully.');
    assert.strictEqual(response.data.data.id, '01HXPUBLICCARD00000000000000');
    assert.strictEqual(
      Object.prototype.hasOwnProperty.call(response.data.data, 'access_code'),
      false
    );
  });

  it('returns NF02 when a card exists but is still a draft', async () => {
    storeHarness.creatorCards.push({
      _id: '01HXDRAFTCARD000000000000000',
      title: 'My Draft Card',
      slug: 'my-draft-card',
      creator_reference: 'crt_8f2k1m9x4p7w3q5z',
      status: 'draft',
      access_type: 'public',
      access_code: null,
      created: Date.now(),
      updated: Date.now(),
      deleted: 0,
    });

    const response = await mockedServer.get('/creator-cards/my-draft-card');

    assert.strictEqual(response.statusCode, 404);
    assert.strictEqual(response.data.code, 'NF02');
  });

  it('returns AC03 when a private card is requested without an access code', async () => {
    storeHarness.creatorCards.push({
      _id: '01HXPRIVATECARD000000000000',
      title: 'VIP Rate Card',
      slug: 'vip-rate-card',
      creator_reference: 'crt_x9y8z7w6v5u4t3s2',
      status: 'published',
      access_type: 'private',
      access_code: 'A1B2C3',
      created: Date.now(),
      updated: Date.now(),
      deleted: 0,
    });

    const response = await mockedServer.get('/creator-cards/vip-rate-card');

    assert.strictEqual(response.statusCode, 403);
    assert.strictEqual(response.data.code, 'AC03');
  });

  it('returns AC04 when a private card is requested with the wrong access code', async () => {
    storeHarness.creatorCards.push({
      _id: '01HXPRIVATECARD000000000001',
      title: 'VIP Rate Card',
      slug: 'vip-rate-card',
      creator_reference: 'crt_x9y8z7w6v5u4t3s2',
      status: 'published',
      access_type: 'private',
      access_code: 'A1B2C3',
      created: Date.now(),
      updated: Date.now(),
      deleted: 0,
    });

    const response = await mockedServer.get('/creator-cards/vip-rate-card', {
      query: { access_code: 'WRONG1' },
    });

    assert.strictEqual(response.statusCode, 403);
    assert.strictEqual(response.data.code, 'AC04');
  });

  it('deletes a card and makes it unreachable afterward', async () => {
    storeHarness.creatorCards.push({
      _id: '01HXDELETECARD0000000000000',
      title: 'Ada Designs Things',
      slug: 'ada-designs-things',
      creator_reference: 'crt_a1b2c3d4e5f6g7h8',
      status: 'published',
      access_type: 'public',
      access_code: null,
      created: Date.now(),
      updated: Date.now(),
      deleted: 0,
    });

    const deleteResponse = await mockedServer.delete('/creator-cards/ada-designs-things', {
      body: { creator_reference: 'crt_a1b2c3d4e5f6g7h8' },
    });

    assert.strictEqual(deleteResponse.statusCode, 200);
    assert.strictEqual(deleteResponse.data.message, 'Creator Card Deleted Successfully.');
    assert.notStrictEqual(deleteResponse.data.data.deleted, null);

    const getResponse = await mockedServer.get('/creator-cards/ada-designs-things');

    assert.strictEqual(getResponse.statusCode, 404);
    assert.strictEqual(getResponse.data.code, 'NF01');
  });
});
