# Creator Card API

Creator Card API is a Node.js and Express microservice for creating, retrieving, and deleting shareable creator profile cards backed by MongoDB.

This submission implements the assessment requirements for:

- `POST /creator-cards`
- `GET /creator-cards/:slug`
- `DELETE /creator-cards/:slug`

It also includes:

- `GET /` welcome response
- `GET /docs` Swagger UI
- `GET /openapi.json` OpenAPI document

## Production Links

- Base URL: `https://assessment-test-mu.vercel.app/`
- Swagger Docs: `https://assessment-test-mu.vercel.app/docs`
- OpenAPI Spec: `https://assessment-test-mu.vercel.app/openapi.json`

## Features

- Field-level validation with the provided VSL validator
- Business rule validation for slug uniqueness and private-card access rules
- Automatic slug generation from title when `slug` is omitted
- Public retrieval rules for draft, private, and deleted cards
- MongoDB persistence with `_id` stored internally and `id` exposed in API responses
- Soft deletion with deleted cards excluded from public retrieval
- Swagger documentation and a small root welcome endpoint for deployed environments

## Tech Stack

- Node.js `>=22`
- Express
- MongoDB / Mongoose
- Custom VSL validator from the provided scaffold
- Mocha for endpoint tests

## API Endpoints

| Method   | Path                   | Purpose                           |
| -------- | ---------------------- | --------------------------------- |
| `GET`    | `/`                    | Welcome message                   |
| `GET`    | `/docs`                | Swagger UI                        |
| `GET`    | `/openapi.json`        | OpenAPI spec                      |
| `POST`   | `/creator-cards`       | Create a creator card             |
| `GET`    | `/creator-cards/:slug` | Retrieve a published creator card |
| `DELETE` | `/creator-cards/:slug` | Delete a creator card             |

## Key Rules Implemented

- `slug` is unique across cards
- If `slug` is omitted, it is generated from `title`
- `access_type` defaults to `public`
- `access_code` is required for private cards
- `access_code` is forbidden for public cards
- Draft cards return `404` with code `NF02` on public retrieval
- Private cards require a correct `access_code` on retrieval
- Retrieval responses never expose `access_code`
- Create and delete responses expose `access_code` when relevant
- API responses expose `id`, never `_id`

## Custom Error Codes

| Code   | Meaning                                        |
| ------ | ---------------------------------------------- |
| `SL02` | Slug is already taken                          |
| `AC01` | `access_code` is required for private cards    |
| `AC05` | `access_code` can only be set on private cards |
| `NF01` | Creator card not found                         |
| `NF02` | Creator card exists but is in draft status     |
| `AC03` | Access code is required to view a private card |
| `AC04` | Invalid access code                            |

## Project Structure

```text
app.js
bootstrap.js
endpoints/
  creator-cards/
  swagger/
models/
repository/
services/
  creator-cards/
messages/
test/
```

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create your local environment file

```bash
cp .env.example .env
```

Update `MONGODB_URI` inside `.env`.

For local MongoDB:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/creator-cards
```

For MongoDB Atlas:

```env
MONGODB_URI=mongodb+srv://DB_USER:DB_PASSWORD@YOUR_CLUSTER.mongodb.net/creator-cards?retryWrites=true&w=majority&appName=Cluster0
```

### 3. Start the API

```bash
npm start
```

The default local base URL is:

```text
http://localhost:3000
```

## Running Tests

```bash
npm test
```

## Sample Requests

### Create a card

```bash
curl -X POST http://localhost:3000/creator-cards \
  -H "Content-Type: application/json" \
  -d '{
    "title": "George Cooks",
    "creator_reference": "crt_8f2k1m9x4p7w3q5z",
    "status": "published"
  }'
```

### Retrieve a card

```bash
curl http://localhost:3000/creator-cards/george-cooks
```

### Delete a card

```bash
curl -X DELETE http://localhost:3000/creator-cards/george-cooks \
  -H "Content-Type: application/json" \
  -d '{
    "creator_reference": "crt_8f2k1m9x4p7w3q5z"
  }'
```

## Deployment Notes

### Vercel

- Framework preset should be set to `Other`
- The project uses `api/index.js` as the Vercel entrypoint
- Set `MONGODB_URI` in Vercel environment variables
- If using MongoDB Atlas, make sure the cluster IP access list allows your deployment to connect

### Base URL expectations

The assessment expects root-level routes with no versioning:

```text
POST   {base_url}/creator-cards
GET    {base_url}/creator-cards/:slug
DELETE {base_url}/creator-cards/:slug
```

## Notes

- `documentation.md` contains additional scaffold-level reference material from the template
- `assessment.md` contains submission-specific implementation notes for this project
