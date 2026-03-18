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

2. Configure your environment variables. Ensure you have a `.env` file in the root directory and add your PostgreSQL database URL. For example:
   ```env
   DATABASE_URL="postgresql://[USER]:[PASSWORD]@[RDS_ENDPOINT]:[PORT]/[DATABASE_NAME]?schema=public"
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

## 🔌 API Status & Health

All modules support full CRUD functionality (Create, Read, Update, Delete) utilizing standard REST conventions (e.g., `GET /api/projects/:id`, `POST /api/campaigns`). 

To verify that the application is successfully running, you can hit the health check endpoint:
```bash
curl http://localhost:5000/health
```
