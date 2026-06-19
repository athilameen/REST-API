# API Reference

All endpoints are mounted under the base path **`/api`**.

🔒 = requires authentication via header: `Authorization: Bearer <accessToken>`

**Total: 18 endpoints** — 1 health · 9 user · 5 products · 3 orders

---

## Health

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| GET | `/api/health` | — | Process/host diagnostics (uptime, hostname, memory, etc.) |

---

## Users — `/api/user`

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| POST | `/api/user/signup` | — | Create a new user |
| POST | `/api/user/login` | — | Login by email **or** mobile number (`identifier` + `password`) |
| POST | `/api/user/token` | — | Get a new access token from a refresh token |
| POST | `/api/user/logout` | 🔒 | Invalidate the current session (deletes the Redis key) |
| PATCH | `/api/user/profile` | 🔒 | Update the logged-in user's profile |
| POST | `/api/user/change-password` | 🔒 | Change password (`currentPassword` + `newPassword`) |
| POST | `/api/user/forgot-password` | — | Email a password-reset token |
| POST | `/api/user/reset-password/:token` | — | Set a new password using the emailed token |
| DELETE | `/api/user/delete/:userId` | 🔒 | Delete a user by id |

---

## Products — `/api/products`

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| GET | `/api/products` | — | List all products |
| POST | `/api/products` | 🔒 | Create a product (`multipart/form-data`: `name`, `price`, `image`) |
| GET | `/api/products/:productId` | — | Get a single product |
| PATCH | `/api/products/:productId` | 🔒 | Update a product (`multipart/form-data`; `image` optional) |
| DELETE | `/api/products/:productId` | 🔒 | Delete a product |

---

## Orders — `/api/orders`

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| GET | `/api/orders` | 🔒 | List all orders (with populated product) |
| POST | `/api/orders` | 🔒 | Create an order (`product` id + `quantity`) |
| GET | `/api/orders/:orderId` | 🔒 | Get a single order (with populated product) |
| DELETE | `/api/orders/:orderId` | 🔒 | Delete an order |

---

> For full request bodies, parameters, and response shapes, see the [README API Reference](../README.md#api-reference).
