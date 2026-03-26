# Raver.ai Backend

This is the Express.js powerhouse for the Raver.ai platform. It manages core business logic (Users, Campaigns, Billing) and acts as an authenticated **AI Proxy Layer** for complex video generation services.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+
- **Database**: PostgreSQL (Prisma ORM)
- **AI Backend**: Access to `apiplatform.raver.ai` (configured via ENV)

### Installation

1.  **Clone & Install**:
    ```bash
    npm install
    ```

2.  **Environment Setup**:
    Copy the example file and fill in your secrets.
    ```bash
    cp .env.example .env
    ```
    > [!IMPORTANT]
    > Ensure `AI_BACKEND_URL` is set to `https://apiplatform.raver.ai` for proxy services to work.

3.  **Database Migration**:
    ```bash
    npx prisma generate
    npx prisma db push
    ```

### Running Locally
```bash
npm run dev
```
The server starts on `http://localhost:8000` (default).

---

## 📖 API Documentation (Swagger)

We use **Swagger/OpenAPI 3.0** for real-time, interactive documentation.

- **URL**: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
- **Try it Out**: You can test endpoints directly from the browser. Click **"Authorize"** and enter your Bearer JWT token to access protected routes.

---

## 🔌 Core Modules

| Module | Description |
| :--- | :--- |
| **Auth** | JWT-based signup, login, and session management. |
| **Campaigns**| Ad campaign wizard configurations and management. |
| **Projects** | Organizational containers for campaigns and assets. |
| **Assets** | Creative media metadata and S3-signed upload handling. |
| **Templates**| Reusable node-based ad structure definitions. |
| **Billing** | Stripe-ready subscription and payment method management. |

---

## 🤖 AI Proxy Services (`/api/ai/*`)

The backend acts as a secure tunnel to the Raver AI Platform, handling authentication and payload validation.

| Service | Endpoint Prefix | Purpose |
| :--- | :--- | :--- |
| **Ads** | `/api/ai/ads` | Storyboard generation, parallel video generation. |
| **Chat** | `/api/chat` | Conversational brand analysis and history. |
| **Image Lead**| `/api/ai/image-lead` | Style-locked image generation and enhancement. |
| **Audio Lead**| `/api/ai/audio-lead` | Background music and AI voiceover production. |
| **Copy Lead** | `/api/ai/copy-lead` | Scriptwriting, captions, and text overlays. |
| **Editor** | `/api/ai/editor` | Multi-format video rendering (9:16, 1:1, 16:9). |
| **Producer** | `/api/ai/producer` | E2E pipeline orchestration and human-in-the-loop. |
| **Director** | `/api/ai/director` | Conversational interactions with the Raver Director. |

---

## 📁 Project Structure

```text
src/
├── app.ts              # Express initialization & router mounting
├── server.ts           # HTTP server entry point
├── config/
│   ├── aiProxy.ts      # Shared axios helper for AI backend
│   └── swagger.ts      # Swagger specification & UI setup
├── modules/
│   ├── auth/           # Login/Signup logic
│   ├── ai-ads/         # Ad generation proxy
│   ├── ai-image-lead/  # Image generation proxy
│   ├── ...             # Other module folders
├── middleware/
│   └── auth.ts         # JWT Verification middleware
└── prisma/
    └── schema.prisma   # DB Model definitions
```

---

## 🛠️ Developer Tooling

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start development server with Nodemon (live reload). |
| `npx prisma studio` | Open the GUI database editor. |
| `npx tsc --noEmit` | Run a full TypeScript type check. |

> [!TIP]
> **Type Errors in VS Code?**
> If Prisma types aren't updating, run `npx prisma generate` and then restart your TS Server (`CMD+Shift+P` -> "Restart TS Server").

---

## 📜 License
This project is proprietary and confidential. © 2026 Raver.ai
