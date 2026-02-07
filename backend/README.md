# Shortly API

A high-performance URL shortening service built with **Bun**, **Elysia**, **MongoDB**, and **Redis**. Features include user authentication, custom slugs, click analytics, Redis caching for blazing-fast redirects, rate limiting, and Azure Entra ID integration for admin access.

![Bun](https://img.shields.io/badge/Bun-1.3-black?logo=bun)
![Elysia](https://img.shields.io/badge/Elysia-1.4-blueviolet)
![MongoDB](https://img.shields.io/badge/MongoDB-9.1-green?logo=mongodb)
![Redis](https://img.shields.io/badge/Redis-8.0-red?logo=redis)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)

---

## 🚀 Features

### Core Features

- **URL Shortening** - Convert long URLs into short, memorable links
- **Custom Slugs** - Create personalized short links (e.g., `shortly.io/my-brand`)
- **Click Analytics** - Track clicks by day, country, device, and browser
- **URL Expiration** - Automatic expiration with configurable TTL (default: 30 days)
- **Pagination** - Efficient URL listing with pagination support
- **Redis Caching** - Sub-millisecond URL redirects with intelligent caching
- **Click Buffering** - Batch analytics writes for improved database performance

### Authentication & Security

- **JWT Authentication** - Secure token-based auth for regular users
- **Azure Entra ID** - OIDC-based authentication for admin users
- **Role-Based Access Control (RBAC)** - User and Admin roles with granular permissions
- **Rate Limiting** - Protection against abuse with tiered limits:
  - General API: 100 requests/minute
  - Auth endpoints: 5 attempts/15 minutes
  - URL creation: 30 URLs/minute
- **Security Headers** - XSS protection, clickjacking prevention, HSTS

### Developer Experience

- **Swagger/OpenAPI** - Interactive API documentation at `/swagger`
- **Eden Treaty Support** - Export types for type-safe frontend integration
- **Health Checks** - Kubernetes-ready health endpoint
- **Docker Ready** - Multi-stage Dockerfile with security hardening

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts       # MongoDB connection
│   │   ├── redis.ts          # Redis connection & management
│   │   └── index.ts          # Centralized configuration
│   ├── models/
│   │   ├── User.ts           # User model with bcrypt
│   │   ├── Url.ts            # URL model with click tracking
│   │   └── index.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts      # JWT authentication
│   │   ├── rbac.middleware.ts      # Role-based access control
│   │   ├── admin.middleware.ts     # Azure Entra ID for admins
│   │   ├── rateLimit.middleware.ts # Rate limiting
│   │   ├── security.middleware.ts  # Security headers
│   │   └── index.ts
│   ├── routes/
│   │   ├── auth.routes.ts    # Register, login, profile
│   │   ├── url.routes.ts     # URL CRUD & analytics
│   │   ├── redirect.routes.ts # Short URL redirect
│   │   └── index.ts
│   ├── services/
│   │   ├── shortcode.service.ts # Short code generation
│   │   ├── url.service.ts       # URL business logic
│   │   ├── redis.service.ts     # Redis caching & rate limiting
│   │   └── index.ts
│   └── index.ts              # Application entry point
├── tests/
│   ├── unit/
│   └── integration/
├── .env.example
├── .env
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## 🛠️ Quick Start

### Prerequisites

- [Bun](https://bun.sh/) 1.0+
- [MongoDB](https://www.mongodb.com/) 6.0+ (local or Atlas)
- [Redis](https://redis.io/) 7.0+ (optional but recommended for production)

### Installation

```bash
# Clone the repository
cd shortly/backend

# Install dependencies
bun install

# Copy environment file
cp .env.example .env

# Edit .env with your MongoDB connection string and secrets
nano .env

# Start development server
bun run dev
```

### Environment Variables

| Variable                  | Required  | Default               | Description                    |
| ------------------------- | --------- | --------------------- | ------------------------------ |
| `PORT`                    | No        | 3001                  | Server port                    |
| `NODE_ENV`                | No        | development           | Environment mode               |
| `MONGODB_URI`             | **Yes**   | -                     | MongoDB connection string      |
| `JWT_SECRET`              | **Yes**   | -                     | JWT signing secret (32+ chars) |
| `JWT_EXPIRES_IN`          | No        | 7d                    | Token expiration               |
| `REDIS_URL`               | No        | redis://localhost:6379| Redis connection URL           |
| `REDIS_PASSWORD`          | No        | -                     | Redis authentication password  |
| `REDIS_ENABLED`           | No        | true                  | Enable/disable Redis caching   |
| `AZURE_TENANT_ID`         | For admin | -                     | Azure Entra tenant ID          |
| `AZURE_CLIENT_ID`         | For admin | -                     | Azure app client ID            |
| `BASE_URL`                | No        | http://localhost:3001 | Base URL for short links       |
| `FRONTEND_URL`            | No        | http://localhost:3000 | Frontend URL for CORS          |
| `RATE_LIMIT_WINDOW_MS`    | No        | 60000                 | Rate limit window (ms)         |
| `RATE_LIMIT_MAX_REQUESTS` | No        | 100                   | Max requests per window        |
| `URL_EXPIRY_DAYS`         | No        | 30                    | Default URL expiration         |

---

## 🔴 Redis Configuration

Redis is used for high-performance caching and provides significant performance improvements for URL redirects. The application is designed with **graceful degradation** - it will work without Redis, falling back to MongoDB for all operations.

### What Redis is Used For

| Feature | Description | Performance Impact |
|---------|-------------|-------------------|
| **URL Caching** | Caches `shortCode → originalUrl` mappings | Redirects: ~0.5ms vs ~15ms (30x faster) |
| **Click Buffering** | Buffers click analytics for batch writes | Reduces MongoDB write load by ~90% |
| **Token Blacklisting** | Stores invalidated JWT tokens for logout | Instant token invalidation |
| **Distributed Rate Limiting** | (Future) Rate limiting across multiple instances | Enables horizontal scaling |

### Starting Redis

#### Option 1: Docker (Recommended)

```bash
# Start Redis with password authentication
docker run -d \
  --name shortly-redis \
  -p 6380:6379 \
  redis:8-alpine \
  redis-server --requirepass your-redis-password --appendonly yes

# Or use docker-compose (from project root)
docker-compose up -d redis
```

#### Option 2: Using a Custom Redis Image

```bash
# Example with a hardened Redis image
docker run -d \
  --name shortly-redis \
  -p 6380:6379 \
  your-registry/redis:8-hardened \
  redis-server --requirepass your-redis-password --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
```

#### Option 3: Local Redis Installation

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis
```

### Connecting to a Different Redis Instance

To connect to a different Redis database (e.g., production, staging, or managed Redis like AWS ElastiCache, Azure Cache, or Redis Cloud), update your `.env` file:

#### Local Redis (default port)
```env
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_ENABLED=true
```

#### Local Redis (custom port with password)
```env
REDIS_URL=redis://localhost:6380
REDIS_PASSWORD=your-secure-password
REDIS_ENABLED=true
```

#### Remote Redis Server
```env
REDIS_URL=redis://redis.your-domain.com:6379
REDIS_PASSWORD=your-production-password
REDIS_ENABLED=true
```

#### AWS ElastiCache
```env
REDIS_URL=redis://your-cluster.xxxxx.cache.amazonaws.com:6379
REDIS_PASSWORD=your-auth-token
REDIS_ENABLED=true
```

#### Azure Cache for Redis
```env
REDIS_URL=redis://your-cache.redis.cache.windows.net:6380
REDIS_PASSWORD=your-access-key
REDIS_ENABLED=true
```

#### Redis Cloud / Upstash
```env
REDIS_URL=redis://default:your-password@your-endpoint.upstash.io:6379
REDIS_PASSWORD=
REDIS_ENABLED=true
```

> **Note:** When using Redis URL with embedded credentials (like Upstash), leave `REDIS_PASSWORD` empty as the password is already in the URL.

### Disabling Redis

If you don't want to use Redis (development without Docker, etc.), simply disable it:

```env
REDIS_ENABLED=false
```

The application will fall back to MongoDB for all operations. This is useful for:
- Local development without Docker
- Testing MongoDB-only deployments
- Debugging caching issues

### Redis Health Check

The `/health` endpoint includes Redis status:

```bash
curl http://localhost:3002/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-04T01:49:20.596Z",
  "version": "1.0.0",
  "environment": "development",
  "services": {
    "redis": {
      "enabled": true,
      "healthy": true
    }
  }
}
```

### Redis Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Shortly Backend                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    Cache Hit     ┌─────────────┐              │
│  │   Request   │ ───────────────► │    Redis    │              │
│  │  /:shortCode│                  │   (Cache)   │              │
│  └─────────────┘                  └─────────────┘              │
│         │                               │                       │
│         │ Cache Miss                    │ ~0.5ms                │
│         ▼                               ▼                       │
│  ┌─────────────┐                  ┌─────────────┐              │
│  │   MongoDB   │ ◄─────────────── │  Response   │              │
│  │  (Primary)  │    Populate      │             │              │
│  └─────────────┘     Cache        └─────────────┘              │
│         │                                                       │
│         │ ~15ms                                                 │
│         ▼                                                       │
│  ┌─────────────┐                                               │
│  │  Response   │                                               │
│  └─────────────┘                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Cache Behavior

| Event | Action |
|-------|--------|
| URL Created | Cached in Redis with TTL matching URL expiry |
| URL Redirect | Check Redis first, fallback to MongoDB |
| URL Deleted | Cache invalidated immediately |
| URL Updated | Cache invalidated, re-cached on next access |
| Redis Unavailable | Graceful fallback to MongoDB |

---

### Creating an Admin User

To access the admin dashboard and management features, you need to promote an existing user to the admin role.

1. Register a new user via the API or Frontend.
2. Run the admin promotion script:

```bash
# Usage: bun src/scripts/create-admin.ts <email>
bun src/scripts/create-admin.ts user@example.com
```

---

## 📚 API Reference

### Base URL

- Development: `http://localhost:3002`
- Swagger Docs: `http://localhost:3002/swagger`

### Authentication

All protected endpoints require the `Authorization: Bearer <token>` header.

#### Register User

_(Note: Admins can manage users via `GET /admin/users`, `PATCH /admin/users/:id/suspend`, `DELETE /admin/users/:id`)_

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "user@example.com", "role": "user" },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### Get Current User

```http
GET /api/auth/me
Authorization: Bearer <token>
```

---

### URL Management

#### Create Short URL

```http
POST /api/urls
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://example.com/very-long-url-here",
  "customSlug": "my-link",  // optional
  "expiryDays": 30          // optional
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "shortCode": "my-link",
    "shortUrl": "http://localhost:3001/my-link",
    "originalUrl": "https://example.com/very-long-url-here",
    "expiresAt": "2024-03-15T00:00:00.000Z"
  }
}
```

#### List User's URLs

```http
GET /api/urls?page=1&limit=10
Authorization: Bearer <token>
```

#### Get URL Analytics

```http
GET /api/urls/{shortCode}/analytics
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "url": {
      "shortCode": "my-link",
      "originalUrl": "...",
      "clickCount": 42
    },
    "analytics": {
      "clicksByDay": [{ "_id": "2024-02-15", "count": 10 }],
      "clicksByCountry": [{ "_id": "US", "count": 20 }],
      "clicksByDevice": [{ "_id": "desktop", "count": 25 }]
    }
  }
}
```

#### Delete URL

```http
DELETE /api/urls/{shortCode}
Authorization: Bearer <token>
```

---

### Redirect

#### Access Short URL

```http
GET /{shortCode}
```

Returns: `302 Redirect` to original URL

---

### Health Check

```http
GET /health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-02-15T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "development"
}
```

---

## 🔒 Security Features

| Feature              | Description                                                     |
| -------------------- | --------------------------------------------------------------- |
| **Password Hashing** | bcrypt with 12 salt rounds                                      |
| **JWT Tokens**       | Stateless authentication with configurable expiry               |
| **Rate Limiting**    | IP-based limiting with multiple tiers                           |
| **CORS**             | Configured for frontend origin only                             |
| **Security Headers** | X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, HSTS |
| **Input Validation** | TypeBox schema validation on all endpoints                      |
| **Reserved Slugs**   | Prevents conflicts with API routes                              |

---

## 🐳 Docker

### Build and Run

```bash
# Build image
docker build -t shortly-api .

# Run container
docker run -p 3001:3001 --env-file .env shortly-api
```

### Docker Compose (with MongoDB)

```yaml
version: "3.8"
services:
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/shortly
      - JWT_SECRET=your-secret-key
    depends_on:
      - mongo

  mongo:
    image: mongo:6
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

volumes:
  mongo_data:
```

---

## 📊 Database Schema

### User Collection

```typescript
{
  _id: ObjectId,
  email: string,           // unique, indexed
  password?: string,       // bcrypt hashed (local auth only)
  role: "user" | "admin",
  authProvider: "local" | "entra_id",
  azureId?: string,        // for Entra ID users
  isSuspended: boolean,    // account status
  createdAt: Date,
  updatedAt: Date
}
```

### URL Collection

```typescript
{
  _id: ObjectId,
  shortCode: string,       // unique, indexed
  originalUrl: string,
  customSlug?: string,
  userId: ObjectId,        // indexed
  clickCount: number,
  clicks: [{
    timestamp: Date,
    ip: string,
    userAgent: string,
    referer: string,
    country: string,
    device: string,
    browser: string,
    os: string
  }],
  isActive: boolean,
  expiresAt: Date,         // TTL index for auto-deletion
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

- `User.email` - unique index
- `Url.shortCode` - unique index
- `Url.userId` - for user's URL queries
- `Url.expiresAt` - TTL index for automatic expiration

---

## 🧪 Testing

```bash
# Run all tests
bun test

# Watch mode
bun test --watch
```

---

## 📝 Scripts

| Script                            | Description                              |
| --------------------------------- | ---------------------------------------- |
| `bun run dev`                     | Start development server with hot reload |
| `bun run start`                   | Start production server                  |
| `bun run build`                   | Build for production                     |
| `bun test`                        | Run tests                                |
| `bun run lint`                    | Check code style                         |
| `bun run format`                  | Format code                              |
| `bun run typecheck`               | Type check without emit                  |
| `bun run docker:build`            | Build Docker image                       |
| `bun run docker:run`              | Run Docker container                     |
| `bun src/scripts/create-admin.ts` | Promote user to admin (Usage: `<email>`) |

---

## 🔗 Frontend Integration

This API exports types for [Eden Treaty](https://elysiajs.com/eden/treaty.html) integration:

```typescript
// In your frontend
import { treaty } from "@elysiajs/eden";
import type { App } from "shortly-api";

const api = treaty<App>("http://localhost:3001");

// Type-safe API calls
const { data } = await api.api.auth.login.post({
  email: "user@example.com",
  password: "password123",
});
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
