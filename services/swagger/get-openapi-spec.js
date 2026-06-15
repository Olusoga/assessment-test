function getBaseUrl(headers = {}) {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL;
  }

  const host = headers.host || `localhost:${process.env.PORT || 3000}`;
  const forwardedProto = headers['x-forwarded-proto'];
  const protocol =
    typeof forwardedProto === 'string' && forwardedProto.length
      ? forwardedProto.split(',')[0].trim()
      : 'http';

  return `${protocol}://${host}`;
}

function getOpenApiSpec({ headers } = {}) {
  const baseUrl = getBaseUrl(headers);

  return {
    openapi: '3.0.3',
    info: {
      title: 'Creator Card API',
      version: '1.0.0',
      description:
        'Creator Card microservice for creating, retrieving, and deleting shareable creator profile cards.',
    },
    servers: [{ url: baseUrl }],
    tags: [{ name: 'Creator Cards', description: 'Creator Card operations' }],
    paths: {
      '/creator-cards': {
        post: {
          tags: ['Creator Cards'],
          summary: 'Create a creator card',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateCreatorCardRequest' },
                examples: {
                  publishedCard: {
                    value: {
                      title: 'George Cooks',
                      description: 'Weekly cooking podcast',
                      slug: 'george-cooks',
                      creator_reference: 'crt_8f2k1m9x4p7w3q5z',
                      links: [
                        {
                          title: 'YouTube',
                          url: 'https://youtube.com/@georgecooks',
                        },
                      ],
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
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Creator Card created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/CreateCreatorCardSuccessResponse' },
                },
              },
            },
            400: {
              description: 'Validation or business rule error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/creator-cards/{slug}': {
        get: {
          tags: ['Creator Cards'],
          summary: 'Retrieve a creator card by slug',
          parameters: [
            {
              name: 'slug',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
            {
              name: 'access_code',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'Required only for private cards.',
            },
          ],
          responses: {
            200: {
              description: 'Creator Card retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/PublicCreatorCardSuccessResponse' },
                },
              },
            },
            403: {
              description: 'Access code required or invalid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            404: {
              description: 'Creator card not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Creator Cards'],
          summary: 'Delete a creator card by slug',
          parameters: [
            {
              name: 'slug',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DeleteCreatorCardRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Creator Card deleted successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/CreateCreatorCardSuccessResponse' },
                },
              },
            },
            404: {
              description: 'Creator card not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Link: {
          type: 'object',
          required: ['title', 'url'],
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 100 },
            url: {
              type: 'string',
              maxLength: 200,
              example: 'https://youtube.com/@georgecooks',
            },
          },
        },
        ServiceRate: {
          type: 'object',
          required: ['name', 'description', 'amount'],
          properties: {
            name: { type: 'string', minLength: 3, maxLength: 100 },
            description: { type: 'string', maxLength: 250 },
            amount: { type: 'integer', minimum: 1 },
          },
        },
        ServiceRates: {
          type: 'object',
          required: ['currency', 'rates'],
          properties: {
            currency: { type: 'string', enum: ['NGN', 'USD', 'GBP', 'GHS'] },
            rates: {
              type: 'array',
              minItems: 1,
              items: { $ref: '#/components/schemas/ServiceRate' },
            },
          },
        },
        CreateCreatorCardRequest: {
          type: 'object',
          required: ['title', 'creator_reference', 'status'],
          properties: {
            title: { type: 'string', minLength: 3, maxLength: 100 },
            description: { type: 'string', maxLength: 500 },
            slug: {
              type: 'string',
              minLength: 5,
              maxLength: 50,
              description: 'Letters, numbers, hyphens, and underscores only.',
            },
            creator_reference: { type: 'string', minLength: 20, maxLength: 20 },
            links: {
              type: 'array',
              items: { $ref: '#/components/schemas/Link' },
            },
            service_rates: { $ref: '#/components/schemas/ServiceRates' },
            status: { type: 'string', enum: ['draft', 'published'] },
            access_type: { type: 'string', enum: ['public', 'private'], default: 'public' },
            access_code: {
              type: 'string',
              minLength: 6,
              maxLength: 6,
              description: 'Required when access_type is private.',
            },
          },
        },
        DeleteCreatorCardRequest: {
          type: 'object',
          required: ['creator_reference'],
          properties: {
            creator_reference: { type: 'string', minLength: 20, maxLength: 20 },
          },
        },
        CreatorCard: {
          type: 'object',
          required: [
            'id',
            'title',
            'slug',
            'creator_reference',
            'status',
            'access_type',
            'access_code',
            'created',
            'updated',
            'deleted',
          ],
          properties: {
            id: { type: 'string', example: '01JG8XYZA2B3C4D5E6F7G8H9J0' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            slug: { type: 'string' },
            creator_reference: { type: 'string' },
            links: {
              type: 'array',
              items: { $ref: '#/components/schemas/Link' },
            },
            service_rates: {
              allOf: [{ $ref: '#/components/schemas/ServiceRates' }],
              nullable: true,
            },
            status: { type: 'string', enum: ['draft', 'published'] },
            access_type: { type: 'string', enum: ['public', 'private'] },
            access_code: { type: 'string', nullable: true },
            created: { type: 'integer', format: 'int64' },
            updated: { type: 'integer', format: 'int64' },
            deleted: { type: 'integer', format: 'int64', nullable: true },
          },
        },
        PublicCreatorCard: {
          type: 'object',
          required: [
            'id',
            'title',
            'slug',
            'creator_reference',
            'status',
            'access_type',
            'created',
            'updated',
            'deleted',
          ],
          properties: {
            id: { type: 'string', example: '01JG8XYZA2B3C4D5E6F7G8H9J0' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            slug: { type: 'string' },
            creator_reference: { type: 'string' },
            links: {
              type: 'array',
              items: { $ref: '#/components/schemas/Link' },
            },
            service_rates: {
              allOf: [{ $ref: '#/components/schemas/ServiceRates' }],
              nullable: true,
            },
            status: { type: 'string', enum: ['draft', 'published'] },
            access_type: { type: 'string', enum: ['public', 'private'] },
            created: { type: 'integer', format: 'int64' },
            updated: { type: 'integer', format: 'int64' },
            deleted: { type: 'integer', format: 'int64', nullable: true },
          },
        },
        CreateCreatorCardSuccessResponse: {
          type: 'object',
          required: ['status', 'message', 'data'],
          properties: {
            status: { type: 'string', example: 'success' },
            message: { type: 'string', example: 'Creator Card Created Successfully.' },
            data: { $ref: '#/components/schemas/CreatorCard' },
          },
        },
        PublicCreatorCardSuccessResponse: {
          type: 'object',
          required: ['status', 'message', 'data'],
          properties: {
            status: { type: 'string', example: 'success' },
            message: { type: 'string', example: 'Creator Card Retrieved Successfully.' },
            data: { $ref: '#/components/schemas/PublicCreatorCard' },
          },
        },
        ErrorResponse: {
          type: 'object',
          required: ['status', 'message', 'code'],
          properties: {
            status: { type: 'string', example: 'error' },
            message: { type: 'string', example: 'Slug is already taken' },
            code: {
              type: 'string',
              enum: ['SL02', 'AC01', 'AC05', 'NF01', 'NF02', 'AC03', 'AC04', 'ERR'],
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  };
}

module.exports = getOpenApiSpec;
