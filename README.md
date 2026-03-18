# Raver.ai Backend

This is the Express.js backend for the Raver.ai platform, providing a robust REST API for managing users, campaigns, projects, assets, templates, and AI agents.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- An AWS RDS PostgreSQL instance (or local PostgreSQL) for full database functionality.

### Installation

1. Install the dependencies:
   ```bash
   npm install
   ```

2. Configure your environment variables. Copy the `.env.example` file to `.env` and fill in your details:
   ```bash
   cp .env.example .env
   ```
   Modify the `.env` file with your PostgreSQL database URL and JWT Secret:
   ```env
   DATABASE_URL="postgresql://[USER]:[PASSWORD]@[RDS_ENDPOINT]:[PORT]/[DATABASE_NAME]?schema=public"
   JWT_SECRET="your_super_secret_jwt_key_here"
   ```

3. Initialize the database and generate the Prisma Client:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

### Running the Application

To start the server in development mode with live-reloading enabled:

```bash
npm run dev
```

The API will start and listen for requests on `http://localhost:5000` (or whatever port is defined in your environment).

## 📁 Project Structure

The project follows a modular, domain-driven architecture:

- `src/app.ts`: Express application initialization, CORS, and middleware setup.
- `src/server.ts`: Bare HTTP server entry point.
- `src/db/`: Prisma client instantiation.
- `src/modules/`: Contains business logic, separated by domain models:
  - `agent/` - AI Agent execution and provisioning
  - `asset/` - Media metadata and S3 uploads
  - `billing/` - Stripe integrations and subscriptions
  - `campaign/` - Ad campaign wizard configurations
  - `project/` - High-level organizational containers
  - `template/` - Reusable node-based ad templates
  - `user/` - User profiles and settings

## 🔌 API Endpoints Documentation

All endpoints respond with a standard standardized JSON wrapper:
```json
{
  "success": true,
  "data": { ... } // or "message": "..." on errors/deletes
}
```

> **Security Note**: All endpoints beneath `/api/*` (except `/api/auth/*` and `/health`) are **protected via JWT Authentication**. You must pass a valid token via the request headers: `Authorization: Bearer <token>`.

### 1. Authentication Module (`/api/auth`)
| Method | Endpoint | Payload / Query | Returns | Description åå|
|---|---|---|---|---|
| `POST` | `/api/auth/signup` | `{ email, password, fullName? }` | `{ user, token }` | Registers a new user and returns JWT |
| `POST` | `/api/auth/login` | `{ email, password }` | `{ user, token }` | Authenticates user and returns JWT |

### 2. User Module (`/api/users`)
| Method | Endpoint | Payload / Query | Returns | Description |
|---|---|---|---|---|
| `GET` | `/api/users` | - | `Array<User>` | Fetches all users |
| `POST` | `/api/users` | `{ email, fullName?, avatarUrl? }` | `User` | Creates a new user |
| `GET` | `/api/users/me` | - | `User` | Fetches active authenticated user |
| `PUT` | `/api/users/settings` | `{ theme, notifications... }` | `{ updated: true }` | Updates active user settings |
| `GET` | `/api/users/:id` | `params: { id }` | `User` | Fetches a specific user |
| `PUT` | `/api/users/:id` | `{ ...userFieldsToUpdate }` | `User` | Updates a specific user |
| `DELETE`| `/api/users/:id` | `params: { id }` | `{ deleted: true }` | Deletes a user |

### 3. Campaign Module (`/api/campaigns`)
| Method | Endpoint | Payload / Query | Returns | Description |
|---|---|---|---|---|
| `GET` | `/api/campaigns` | - | `Array<Campaign>` | Fetches all campaigns |
| `POST` | `/api/campaigns` | `{ name, objective, audience, visualStyles, tones, colorScheme, platforms, duration, format, budget, config }` | `Campaign` | Creates a new ad campaign wizard |
| `GET` | `/api/campaigns/:id` | `params: { id }` | `Campaign` | Fetches a specific campaign |
| `PUT` | `/api/campaigns/:id` | `{ ...campaignFieldsToUpdate }` | `Campaign` | Updates a campaign |
| `DELETE`| `/api/campaigns/:id`| `params: { id }` | `{ deleted: true }` | Deletes a campaign |

### 4. Project Module (`/api/projects`)
| Method | Endpoint | Payload / Query | Returns | Description |
|---|---|---|---|---|
| `GET` | `/api/projects` | - | `Array<Project>` | Fetches all projects |
| `POST` | `/api/projects` | `{ name, description? }` | `Project` | Creates a new project |
| `GET` | `/api/projects/:id` | `params: { id }` | `Project` | Fetches a specific project |
| `PUT` | `/api/projects/:id` | `{ ...projectFieldsToUpdate }` | `Project` | Updates a project |
| `DELETE`| `/api/projects/:id` | `params: { id }` | `{ deleted: true }` | Deletes a project |

### 5. Asset Module (`/api/assets`)
| Method | Endpoint | Payload / Query | Returns | Description |
|---|---|---|---|---|
| `GET` | `/api/assets` | - | `Array<Asset>` | Fetches all creative assets |
| `POST` | `/api/assets/upload`| `{ filename, contentType }` | `{ uploadUrl, assetId }` | Returns a pre-signed S3 upload URL |
| `GET` | `/api/assets/:id` | `params: { id }` | `Asset` | Fetches asset metadata |
| `DELETE`| `/api/assets/:id` | `params: { id }` | `{ deleted: true }` | Deletes an asset |

### 6. Template Module (`/api/templates`)
| Method | Endpoint | Payload / Query | Returns | Description |
|---|---|---|---|---|
| `GET` | `/api/templates` | - | `Array<Template>` | Fetches all templates |
| `POST` | `/api/templates` | `{ name, category, isPublic, data }` | `Template` | Creates a new template |
| `GET` | `/api/templates/:id`| `params: { id }` | `Template` | Fetches a specific template |
| `PUT` | `/api/templates/:id`| `{ ...templateFieldsToUpdate }` | `Template` | Updates a template |
| `DELETE`| `/api/templates/:id`| `params: { id }` | `{ deleted: true }` | Deletes a template |

### 7. Agent Module (`/api/agents`)
| Method | Endpoint | Payload / Query | Returns | Description |
|---|---|---|---|---|
| `GET` | `/api/agents` | - | `Array<Agent>` | Fetches all AI agents |
| `POST` | `/api/agents` | `{ name, type, status }` | `Agent` | Provisions a new AI agent |
| `GET` | `/api/agents/:id` | `params: { id }` | `Agent` | Fetches a specific agent |
| `PUT` | `/api/agents/:id` | `{ ...agentFieldsToUpdate }` | `Agent` | Updates agent configuration |
| `DELETE`| `/api/agents/:id` | `params: { id }` | `{ deleted: true }` | Deletes an agent |
| `POST` | `/api/agents/:id/execute`| `{ taskData }` | `Agent` | Updates agent status to "processing" to handle task |

### 8. Core & Billing (`/api/billing`)
| Method | Endpoint | Payload / Query | Returns | Description |
|---|---|---|---|---|
| `GET` | `/health` | - | `String: "OK"` | Healthcheck |
| `GET` | `/api/billing/subscription` | - | `Billing` | Fetches active subscription plan |
| `PUT` | `/api/billing/subscription` | `{ planTier }` | `Billing` | Updates active subscription tier |
| `GET` | `/api/billing/payment-methods` | - | `Array<PaymentMethod>` | Fetches saved payment methods |
| `POST` | `/api/billing/payment-methods` | `{ cardHolderName, cardNumber, expiryDate, cvv, isDefault }` | `PaymentMethod` | Adds a new payment method |
| `PUT` | `/api/billing/payment-methods/:id` | `{ ...fields }` | `PaymentMethod` | Updates a payment method |

## 🛠️ Common Commands

Use these commands during development to keep your environment in sync:

### Prisma & Database
| Command | Description |
|---|---|
| `npx prisma generate` | Regenerates the Prisma Client (run this after schema changes) |
| `npx prisma db push` | Pushes schema changes to the RDS instance (dev only) |
| `npx prisma studio` | Opens a GUI to view and edit your database data |

### Development
| Command | Description |
|---|---|
| `npm run dev` | Starts the Express server with nodemon |
| `npx tsc --noEmit` | Runs a full TypeScript type check across the project |

### 💡 Fixing IDE Type Errors
If your IDE (like VS Code) shows red squiggles on valid Prisma properties (e.g., `paymentMethod`):
1. Press `CMD + Shift + P`.
2. Type `TypeScript: Restart TS Server` and press Enter.
