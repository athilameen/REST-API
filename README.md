# REST API

A Node.js / Express REST API for a simple e-commerce-style backend with **users, products, and orders**. It uses MongoDB for persistence, Redis for session/auth state, AWS S3 for product image storage, JWT for authentication, and Nodemailer for password-reset emails.

## Tech Stack

| Concern         | Technology                                   |
| --------------- | -------------------------------------------- |
| Runtime         | Node.js (CommonJS)                           |
| Web framework   | Express 4                                    |
| Database        | MongoDB (Mongoose 8)                         |
| Auth state      | Redis (`redis` + `connect-redis`)            |
| Authentication  | JWT (`jsonwebtoken`) + bcrypt password hashing |
| Validation      | Joi                                          |
| File uploads    | Multer (in-memory) → AWS S3                  |
| Email           | Nodemailer (Gmail)                           |
| Deployment      | Vercel (`@vercel/node`)                      |

## Project Structure

```
server.js                     HTTP server entry point → mounts src/app.js
vercel.json                   Vercel build/routing config
src/
├─ app.js                     Express app: middleware, CORS, /api router, error handlers
├─ route.js                   Top-level router: /products, /orders, /user, /health
├─ routes/                    Route → controller mappings
│  ├─ user.js
│  ├─ products.js
│  └─ orders.js
├─ controllers/               Request handlers / business logic
│  ├─ user.js
│  ├─ products.js
│  └─ orders.js
├─ models/                    Mongoose schemas
│  ├─ user.js
│  ├─ product.js
│  └─ order.js
├─ middleware/
│  ├─ check-auth.js           Verifies JWT + active Redis session
│  └─ responseMiddleware.js   Adds res.success() / res.error() helpers
├─ connect/
│  ├─ connectDatabase.js      MongoDB connection
│  └─ connectRedis.js         Redis client + express-session store
├─ utils/
│  ├─ awsupload.js            Uploads a file buffer to S3, returns public URL
│  ├─ common.js               generateToken() (crypto random bytes)
│  └─ joiValidate.js          Joi async validation wrapper
└─ exceptions/
   ├─ AppError.js             Custom error class + HttpCode enum
   └─ ErrorHandler.js         Centralized error handler
```

## Getting Started

### Prerequisites

- Node.js (18+ recommended)
- A MongoDB Atlas cluster
- A Redis instance
- An AWS S3 bucket + IAM credentials
- A Gmail account (with app password) for password-reset emails

### Install

```bash
npm install
```

### Environment Variables

This project reads all configuration from environment variables (loaded via `dotenv` from a `.env` file in development). There is **no `.env` file committed** — secrets live on Vercel.

To pull the environment from Vercel into a local `.env`:

```bash
vercel link            # link this repo to the Vercel project (one time)
vercel env pull .env   # download the development env vars
```

See [`.env.example`](./.env.example) for the full list of required variables.

### Run

```bash
node server.js
```

The server listens on `process.env.PORT` (defaults to `30` in `server.js` — you'll likely want to set `PORT=3000`).

## Authentication

Authentication is a hybrid of **JWT + Redis session state**:

1. On **login**, the server generates a random `sessionId`, signs an **access token** and a **refresh token** (both JWTs containing the user info + `sessionId`), and stores the user info in Redis under the key `userState:<sessionId>` with a TTL.
2. Protected routes use the `check-auth` middleware, which:
   - Reads the bearer token from the `Authorization: Bearer <token>` header.
   - Verifies the JWT signature.
   - Confirms the `userState:<sessionId>` key still exists in Redis (so logout / expiry truly invalidates access).
   - Attaches the decoded user to `req.userData`.
3. On **logout**, the Redis key is deleted, immediately invalidating the session.

Send the access token on protected endpoints:

```
Authorization: Bearer <accessToken>
```

## Standard Response Shape

Successful responses use the `res.success()` helper:

```json
{
  "success": true,
  "data": { "...": "..." },
  "message": "Human-readable message"
}
```

Errors generally return:

```json
{ "message": "Error description" }
```

or, for validation/internal errors:

```json
{ "error": "..." }
```

> Note: response shapes are not fully uniform across all endpoints (some return `message`, some `error`, some the `success` envelope). This is documented per-endpoint below.

## API Reference

Base path: **`/api`**

### Health

#### `GET /api/health`

Returns process/host diagnostics. No auth.

**Response**

```json
{
  "uptime": 123.4,
  "message": "OK",
  "timestamp": 1718000000000,
  "hostname": "...",
  "platform": "darwin",
  "pid": 12345,
  "version": "v18.0.0",
  "memory": { "...": "..." }
}
```

---

### Users — `/api/user`

#### `POST /api/user/signup`

Create a new user. No auth.

**Body**

| Field          | Type   | Required | Notes              |
| -------------- | ------ | -------- | ------------------ |
| `firstName`    | string | yes      |                    |
| `lastName`     | string | yes      |                    |
| `countryCode`  | string | no       |                    |
| `mobileINumber`| string | yes      | Unique (intl form) |
| `mobileNumber` | string | yes      |                    |
| `email`        | string | yes      | Valid email, unique|
| `password`     | string | yes      | Min 8 chars        |

**Responses** — `201` created · `403` validation error · `409` email/mobile already exists

---

#### `POST /api/user/login`

Authenticate by email **or** mobile number. No auth.

**Body**

| Field        | Type   | Required | Notes                                   |
| ------------ | ------ | -------- | --------------------------------------- |
| `identifier` | string | yes      | Either an email or a mobile number      |
| `password`   | string | yes      |                                         |

**Response (`200`)**

```json
{
  "success": true,
  "data": {
    "user": { "sessionId": "...", "firstName": "...", "email": "...", "userId": "..." },
    "accessToken": "...",
    "refreshToken": "..."
  },
  "message": "Login Success"
}
```

**Errors** — `401` invalid credentials · `403` validation error

---

#### `POST /api/user/token`

Issue a new access token from a refresh token. No auth header (token is in the body).

**Body**

| Field          | Type   | Required |
| -------------- | ------ | -------- |
| `refreshToken` | string | yes      |

**Responses** — `200` `{ accessToken }` · `400` token verification failed · `403` validation error

---

#### `POST /api/user/logout` 🔒

Invalidate the current session (deletes the Redis key). Requires auth.

**Response** — `200` `{ success: true }`

---

#### `PATCH /api/user/profile` 🔒

Update the authenticated user's profile. Requires auth.

**Body**

| Field          | Type   | Required |
| -------------- | ------ | -------- |
| `firstName`    | string | yes      |
| `lastName`     | string | yes      |
| `countryCode`  | string | no       |
| `mobileINumber`| string | yes      |
| `mobileNumber` | string | yes      |

**Responses** — `200` updated · `403` validation error · `404` user not found

---

#### `POST /api/user/change-password` 🔒

Change password for the authenticated user. Requires auth.

**Body**

| Field             | Type   | Required |
| ----------------- | ------ | -------- |
| `currentPassword` | string | yes      |
| `newPassword`     | string | yes      |

**Responses** — `200` changed · `400` incorrect old password · `404` user not found

---

#### `POST /api/user/forgot-password`

Send a password-reset email containing a one-time token (valid for `RESET_PASSWORD_EXPIRES_IN`). No auth.

**Body**

| Field   | Type   | Required |
| ------- | ------ | -------- |
| `email` | string | yes      |

**Responses** — `200` recovery email sent · `400` user not found · `500` email send error

---

#### `POST /api/user/reset-password/:token`

Reset the password using the token from the email. No auth.

**Path param** — `token` (from the reset email)

**Body**

| Field      | Type   | Required | Notes       |
| ---------- | ------ | -------- | ----------- |
| `password` | string | yes      | Min 8 chars |

**Responses** — `200` updated · `400` token invalid/expired · `403` validation error

---

#### `DELETE /api/user/delete/:userId` 🔒

Delete a user by id. Requires auth.

**Path param** — `userId`

**Responses** — `200` deleted · `404` user not found

---

### Products — `/api/products`

#### `GET /api/products`

List all products (id, name, price, image). No auth.

**Response (`200`)**

```json
{
  "success": true,
  "data": { "count": 2, "products": [ { "_id": "...", "image": "...", "name": "...", "price": 0 } ] },
  "message": "Product List"
}
```

---

#### `POST /api/products` 🔒

Create a product with an image. Requires auth. **`multipart/form-data`.**

**Form fields**

| Field   | Type   | Required | Notes                                    |
| ------- | ------ | -------- | ---------------------------------------- |
| `name`  | string | yes      |                                          |
| `price` | number | yes      |                                          |
| `image` | file   | yes      | jpg/jpeg/png, max 2 MB → uploaded to S3  |

**Responses** — `201` created · `400` image missing/invalid or upload failed · `403` validation error

---

#### `GET /api/products/:productId`

Get a single product. No auth.

**Responses** — `200` found · `404` not found

---

#### `PATCH /api/products/:productId` 🔒

Update a product (optionally replacing the image). Requires auth. **`multipart/form-data`.**

**Form fields** — `name` (required), `price` (required), `image` (optional file)

**Responses** — `200` updated · `403` validation error · `404` not found

---

#### `DELETE /api/products/:productId` 🔒

Delete a product. Requires auth.

**Responses** — `200` deleted · `404` not found

---

### Orders — `/api/orders`

All order endpoints require authentication (🔒).

#### `GET /api/orders` 🔒

List all orders with their populated product (name, image, price).

**Response (`200`)**

```json
{
  "success": true,
  "data": { "count": 1, "orders": [ { "product": { "...": "..." }, "quantity": 2, "_id": "..." } ] },
  "message": "Order List"
}
```

---

#### `POST /api/orders` 🔒

Create an order for an existing product.

**Body**

| Field      | Type   | Required | Notes              |
| ---------- | ------ | -------- | ------------------ |
| `product`  | string | yes      | Product `_id`      |
| `quantity` | number | yes      | Min 1              |

**Responses** — `201` created · `403` validation error · `404` product not found

---

#### `GET /api/orders/:orderId` 🔒

Get a single order with its populated product.

**Responses** — `200` found · `404` not found

---

#### `DELETE /api/orders/:orderId` 🔒

Delete an order.

**Responses** — `200` deleted · `404` not found

---

## Data Models

### User

```
firstName            String   required
lastName             String   required
countryCode          String
mobileINumber        String   required, unique
mobileNumber         String   required
email                String   required, unique, email format
password             String   required (bcrypt hash)
resetPasswordToken   String
resetPasswordExpires Date
```

### Product

```
name   String  required
price  Number  required
image  String  required (S3 URL)
```

### Order

```
product  ObjectId  required, ref → Product
quantity Number    required
```

## Deployment

Deployed to **Vercel** via `vercel.json`, which builds `server.js` with `@vercel/node` and routes all requests to it. Environment variables are configured in the Vercel project settings (pull them locally with `vercel env pull .env`).

## Notes / Known Issues

These are pre-existing quirks worth being aware of (not yet fixed):

- `server.js` defaults `PORT` to `30`; set `PORT=3000` locally.
- `src/route.js` imports the error handler via destructuring (`const { errorHandler } = ...`) but `ErrorHandler.js` uses a default export — this resolves to `undefined`. Both route- and app-level error handlers are also missing the 4th `next` argument, so Express does not register them as error-handling middleware.
- `updateProduct` calls `Product.updateOne(productData)` without a filter, so it can update the wrong document, and it invokes the S3 upload even when no new image is provided.
- `crypto` is listed as an npm dependency but is a Node.js built-in.
