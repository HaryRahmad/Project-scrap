# API Routes Documentation

## Base URL
```
http://localhost:3000/api
```

---

## 🔐 Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login user, returns JWT token |
| GET | `/auth/me` | ✅ | Get current user info |

---

## ⚙️ Settings (`/api/settings`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/settings` | ✅ | Get user settings |
| PUT | `/settings` | ✅ | Update user settings |

**Body (PUT):**
```json
{
  "locationId": "200",
  "locationName": "Butik Emas LM - Pulo Gadung",
  "targetWeights": ["1 gr", "5 gr"],
  "telegramChatId": "123456789",
  "isActive": true
}
```

---

## 📦 Stock (`/api/stock`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/stock` | ✅ | Get stock for user's location |
| GET | `/stock/all` | ❌ | Get all cached stock (admin) |
| POST | `/stock/update` | 🔑 | Receive stock from Checker (secret) |
| POST | `/stock/blocked` | 🔑 | Receive blocked notification (secret) |

---

## 🏪 Master Data (`/api/master`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/master/boutiques` | ❌ | Get all boutique locations (cached 5min) |
| GET | `/master/weights` | ❌ | Get all gold weight options (cached 5min) |

---

## 📍 Locations (`/api/locations`) - Legacy

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/locations` | ❌ | Get all locations (use `/master/boutiques` instead) |

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Requires JWT token in `Authorization: Bearer <token>` |
| ❌ | Public endpoint, no auth required |
| 🔑 | Requires `CHECKER_SECRET` in request body |
