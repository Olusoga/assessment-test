# Creator Card Assessment Notes

This file summarizes how the submission maps to the assessment requirements.

## Implemented Endpoints

- `POST /creator-cards`
- `GET /creator-cards/:slug`
- `DELETE /creator-cards/:slug`

Supporting endpoints:

- `GET /` welcome message
- `GET /docs` Swagger UI
- `GET /openapi.json` OpenAPI document

## Live Deployment

- Base URL: `https://assessment-test-mu.vercel.app/`
- Swagger Docs: `https://assessment-test-mu.vercel.app/docs`
- OpenAPI Spec: `https://assessment-test-mu.vercel.app/openapi.json`

## Requirement Mapping

### 1. Validation

- Field-level validation uses the provided VSL validator in the creator-card services
- Validation failures return `400`
- Custom business-rule failures use explicit app error codes

### 2. Slug Handling

- Client-provided slugs are validated and must be unique
- Omitted slugs are generated from the title
- If the generated slug is too short or already taken, a 6-character suffix is appended

### 3. Access Control

- `access_type` defaults to `public`
- Private cards require a 6-character alphanumeric `access_code`
- Public cards cannot accept `access_code`
- Retrieval never exposes `access_code`

### 4. Retrieval Rules

Applied in order:

- `NF01` when the card does not exist
- `NF02` when the card exists but is still a draft
- `AC03` when the card is private and no `access_code` is supplied
- `AC04` when the supplied `access_code` is invalid

### 5. Deletion

- Deletion is soft-delete based
- Deleted cards are excluded from public retrieval
- Delete responses return the deleted card payload

### 6. Serialization

- MongoDB stores the identifier internally as `_id`
- API responses expose `id`
- Retrieval responses omit `access_code`

## Custom Error Codes

| Code   | Meaning                                |
| ------ | -------------------------------------- |
| `SL02` | Slug already taken                     |
| `AC01` | Missing `access_code` for private card |
| `AC05` | `access_code` provided for public card |
| `NF01` | Creator card not found                 |
| `NF02` | Creator card is draft-only             |
| `AC03` | Access code required                   |
| `AC04` | Invalid access code                    |

## Testing

The project includes endpoint-level coverage in:

- `test/creator-cards.test.js`

Covered scenarios include:

- successful creation
- slug auto-generation
- duplicate slug rejection
- private card validation
- private card retrieval rules
- draft card retrieval rejection
- delete flow and retrieval after deletion

## Deployment Notes

- The repository includes Vercel support through `api/index.js`
- The root route returns a welcome message so the base URL is meaningful when opened directly
- Swagger documentation is available from `/docs`

## Reviewer Notes

If you are reviewing this repository for the assessment, start here:

- `README.md` for setup and usage
- `endpoints/creator-cards/` for the HTTP layer
- `services/creator-cards/` for business rules
- `test/creator-cards.test.js` for covered scenarios
