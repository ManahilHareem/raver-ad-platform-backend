# Raver.ai API Documentation & Explanation

This document provides a deep dive into the backend's API architecture, specifically the **AI Proxy Layer** that connects the platform to the external Raver AI Video Generation Engine.

---

## 🏗️ Architecture Overview

The Raver Backend acts as an **authenticated middleware hub**.
1.  **Frontend** sends a request with a JWT token to this Express backend.
2.  **Express** verifies the JWT and validates the user.
3.  **Express Proxy** forwards the request to the high-performance AI backend (`apiplatform.raver.ai`).
4.  **AI Backend** processes the heavy GPU workloads (Video/Image/Audio generation) and returns the result.

### ⏳ Long-Running Requests
AI generation tasks can take several minutes. The proxy is configured with a **5-minute timeout** to prevent premature connection drops during complex video rendering.

---

## 🔐 Authentication
All routes (except `/api/auth/*`) require a **Bearer JWT Token**.

```bash
Authorization: Bearer <your_access_token>
```

---

## 🤖 AI Service Breakdown

### 1. Ads Service (`/api/ai/ads`)
The primary engine for storyboard and video generation.
- **`POST /generate-campaign`**: The "Magic" endpoint. It scrapes a website, builds a storyboard, and generates all video scenes in parallel.
- **`POST /generate-previews`**: Generates 3 quick variations (Image-to-Video or Text-to-Video).

### 2. Image Lead (`/api/ai/image-lead`)
Visual style management.
- **`POST /generate`**: Generates a set of scenes using a consistent "Latent Style Lock" based on a brand brief.
- **`POST /enhance`**: Runs an AI enhancement pass (white balance, exposure, sharpness) on any image.

### 3. Audio Lead (`/api/ai/audio-lead`)
Soundtrack and narration.
- **`POST /music`**: Generates background music matching a specific mood (elegant, bold, luxury, etc.).
- **`POST /voiceover`**: Natural speech generation with specific voice IDs (e.g., `oversea_male1`, `uk_man2`).

### 4. Copy Lead (`/api/ai/copy-lead`)
Marketing copywriting.
- **`POST /script`**: Generates a scene-by-scene narrated script.
- **`POST /captions`**: Platform-optimized text (Instagram hashtags, TikTok captions).

### 5. Editor (`/api/ai/editor`)
Video assembly and stabilization.
- **`POST /render`**: Stitches images, music, and voiceover into a final file with transitions (`fade`, `dissolve`, etc.).
- **`POST /export`**: Parallel export of 9:16, 1:1, and 16:9 formats.

### 6. Producer & Director
- **Producer**: Handles E2E orchestration and Human-in-the-Loop (HITL) approval steps.
- **Director**: Real-time conversational interface to steer the creative direction of a project.

---

## 📦 Standard Payload Example: `AdRequest`

Many endpoints use the `AdRequest` schema. Below is a strictly defined example:

```json
{
  "business_name": "Raver Coffee",
  "product_description": "Premium roasted beans for creators.",
  "website_url": "https://raver.coffee",
  "mood": "cinematic",
  "platform": "instagram",
  "duration": 5,
  "aspect_ratio": "9:16",
  "fps": 25,
  "generate_audio": true,
  "voice": "oversea_male1",
  "voice_speed": 1.0,
  "use_fal": false,
  "model_name": "ltx-video"
}
```

---

## ✅ Response Format

All responses follow a standardized success/error wrapper:

### **Success**
```json
{
  "success": true,
  "data": {
    "session_id": "uuid-...",
    "video_url": "https://...",
    "status": "completed"
  }
}
```

### **Error**
```json
{
  "success": false,
  "message": "Detailed error explanation or validation feedback from AI backend."
}
```

---

## ⚡ Interactive Dashboard
For a full list of parameters and schemas, visit the live Documentation UI:
👉 **[http://localhost:8000/api/docs](http://localhost:8000/api/docs)**
