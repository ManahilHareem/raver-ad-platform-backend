# Raver AI Agents API Documentation

This document provides a comprehensive overview of the AI Agent endpoints available in the Raver Ad Platform backend. These endpoints interact with various specialized AI agents to generate, enhance, orchestrate, and edit video ad campaigns. All endpoints require authentication via a Bearer token.

---

## 1. AI Ads (`/api/ai/ads`)
Handles the generation of full ad campaigns and variations.

### `POST /api/ai/ads/generate-campaign`
Generate a full ad campaign (Scrape → Storyboard → Parallel Generation → Stitching).

**Payload Payload:**
```json
{
  "business_name": "string (Optional if website_url is provided)",
  "product_description": "string (Optional if website_url is provided)",
  "target_audience": "string",
  "website_url": "string",
  "mood": "cinematic", // default
  "platform": "instagram | youtube | tiktok | linkedin | web", // default: instagram
  "image_url": "string",
  "duration": 5, // default
  "aspect_ratio": "string",
  "fps": 25, // 25 | 50, default: 25
  "camera_motion": "static | dolly_in | dolly_out | dolly_left | dolly_right | jib_up | jib_down | focus_shift",
  "generate_audio": true, // default
  "audio_prompt": "string",
  "generate_voiceover": true, // default
  "voice": "oversea_male1 | uk_man2 | uk_boy1 | calm_story1 | genshin_vindi2", // default: oversea_male1
  "voice_speed": 1.0, // 0.8 to 2.0
  "logo_url": "string",
  "use_fal": false,
  "model_name": "ltx-video"
}
```
**Response (200 OK):** Full ad campaign generated

### `POST /api/ai/ads/generate-variations`
Generate ad variations.

**Payload Payload:** standard AdRequest.
**Response (200 OK):** Ad variations generated

### `POST /api/ai/ads/generate-multiple-fal`
Generate multiple videos using Fal.ai directly.

**Payload Payload:** standard AdRequest.
**Response (200 OK):** Multiple Fal videos generated

### `POST /api/ai/ads/generate-audio`
Generate audio for an ad using Fal.ai.

**Payload Payload:** standard AdRequest.
**Response (200 OK):** Audio generated

### `POST /api/ai/ads/generate-previews`
Generate 3 video previews.

**Payload Payload:** standard AdRequest.
**Response (200 OK):** Preview variations generated

---

## 2. AI Audio Lead (`/api/ai/audio-lead`)
AI Background music and voiceover generation.

### `POST /api/ai/audio-lead/music`
Generate background music for an ad.

**Request Payload:**
```json
{
  "brief": {}, // Campaign brief dict
  "tone": "elegant", // elegant, bold editorial, soft glam, fresh natural, luxury spa, cinematic, energetic, professional, calm
  "duration": 20, // 5 to 60
  "session_id": "string"
}
```
**Response (200 OK):** Music generated

### `POST /api/ai/audio-lead/voiceover`
Generate a voiceover.

**Request Payload:**
```json
{
  "script": "string",
  "voice": "oversea_male1", // oversea_male1, uk_man2, uk_boy1, calm_story1, genshin_vindi2
  "voice_speed": 1.0, // 0.8 to 2.0
  "session_id": "string"
}
```
**Response (200 OK):** Voiceover generated

### `POST /api/ai/audio-lead/produce`
Generate a full audio package (Music + Voiceover).

**Request Payload:**
```json
{
  "brief": {}, 
  "script": "string",
  "tone": "elegant",
  "music_duration": 30,
  "voice": "oversea_male1",
  "voice_speed": 1.0,
  "session_id": "string"
}
```
**Response (200 OK):** Audio package produced

### `POST /api/ai/audio-lead/mix`
Mix voiceover and music into a single file.

**Request Payload:**
```json
{
  "voiceover_url": "string",
  "music_url": "string",
  "session_id": "string",
  "music_volume": 0.2 // 0 to 1
}
```
**Response (200 OK):** Audio mixed successfully

### `GET /api/ai/audio-lead/vault/{session_id}`
List all audio files stored for a session.

**Response (200 OK):** Audio vault contents

---

## 3. AI Copy Lead (`/api/ai/copy-lead`)
AI Copywriting, scripts, and captions.

### `POST /api/ai/copy-lead/script`
Generate a full voiceover script.

**Request Payload:**
```json
{
  "brief": {},
  "scenes": [],
  "tone": "elegant",
  "duration_per_scene": 5 // 3 to 15
}
```
**Response (200 OK):** Script generated

### `POST /api/ai/copy-lead/captions`
Generate platform-specific social media captions.

**Request Payload:**
```json
{
  "brief": {},
  "platform": "instagram", // instagram, tiktok, youtube, linkedin, twitter, web
  "campaign_context": "string",
  "tone": "elegant"
}
```
**Response (200 OK):** Captions generated

### `POST /api/ai/copy-lead/overlays`
Generate short on-screen text overlays.

**Request Payload:**
```json
{
  "brief": {},
  "scenes": [],
  "tone": "elegant"
}
```
**Response (200 OK):** Overlays generated

### `POST /api/ai/copy-lead/cta`
Generate a call-to-action.

**Request Payload:**
```json
{
  "brief": {},
  "platform": "instagram",
  "tone": "elegant"
}
```
**Response (200 OK):** CTA generated

### `POST /api/ai/copy-lead/hashtags`
Generate platform-specific hashtags.

**Request Payload:**
```json
{
  "brief": {},
  "platform": "instagram",
  "count": 10 // 1 to 30
}
```
**Response (200 OK):** Hashtags generated

### `POST /api/ai/copy-lead/produce`
Produce a full copy package (Script + Captions + Overlays + CTAs + Hashtags).

**Request Payload:**
```json
{
  "brief": {},
  "scenes": [],
  "platforms": [],
  "tone": "elegant",
  "duration_per_scene": 5 // 3 to 15
}
```
**Response (200 OK):** Copy package produced

---

## 4. AI Director (`/api/ai/director`)
Conversational Video Director.

### `POST /api/ai/director/chat`
Send a message to the Raver Director AI.

**Request Payload:**
```json
{
  "session_id": "string",
  "message": "string",
  "professional_name": "string"
}
```
**Response (200 OK):** Director response

### `GET /api/ai/director/sessions`
List all Director sessions.

**Response (200 OK):** List of sessions

### `GET /api/ai/director/session/{session_id}`
Get conversation history for a session.

**Response (200 OK):** Session history

### `GET /api/ai/director/session/{session_id}/update`
Poll Director for the latest campaign status update.

**Response (200 OK):** Latest update

---

## 5. AI Editor (`/api/ai/editor`)
AI Video rendering and assembly.

### `POST /api/ai/editor/render`
Render a campaign in a specific format.

**Request Payload:**
```json
{
  "scenes": [], // List of scene objects with image_url, audio_url, etc.
  "format": "9:16", // "9:16", "1:1", "16:9"
  "voiceover_url": "string",
  "music_url": "string",
  "music_volume": 0.2, // 0 to 1
  "business_name": "string",
  "logo_url": "string",
  "transition": "fade", // fade, dissolve, slideright, slideleft, wipeleft, wiperight, none
  "transition_duration": 1.0,
  "session_id": "string",
  "animate_scenes": false,
  "video_model": "ltx-video" // ltx-video, hunyuan-video
}
```
**Response (200 OK):** Video render started

### `POST /api/ai/editor/export`
Render all 3 formats (9:16, 1:1, 16:9) in parallel.

**Request Payload:** Same parameters as `/api/ai/editor/render` but performs batch rendering.

**Response (200 OK):** Multi-format export started

### `GET /api/ai/editor/renders/{session_id}`
List all rendered videos for a session.

**Response (200 OK):** List of renders

---

## 6. AI Image Lead (`/api/ai/image-lead`)
AI Image generation and enhancement.

### `POST /api/ai/image-lead/session`
Initialize a new session for the Image Lead workflow. This generates a unique `session_id` and persists it to the database for tracking.

**Request Payload:**
```json
{
  "tag": "Skincare Campaign",
  "metadata": {}
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "session_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
  }
}
```

### `POST /api/ai/image-lead/generate` (Proxy: `/api/v1/image-lead/generate`)
Generate base and scene images for a campaign.

**Request Payload (Base Schema):**
```json
{
  "brief": {
    "additionalProp1": {}
  },
  "scenes": [
    {
      "additionalProp1": {}
    }
  ],
  "aspect_ratio": "16:9",
  "uploaded_image_url": "string",
  "session_id": "string"
}
```

**Full Example Payload:**
```json
{
  "brief": {
    "business_name": "Raver Coffee",
    "product_description": "Premium organic coffee beans",
    "target_audience": "Morning commuters",
    "mood": "cinematic",
    "platform": "instagram"
  },
  "scenes": [
    {
      "id": "scene_1",
      "visual_prompt": "A close up shot of steam rising from a cup of fresh coffee",
      "duration": 5
    },
    {
      "id": "scene_2",
      "visual_prompt": "Person taking a sip and smiling",
      "duration": 5
    }
  ],
  "aspect_ratio": "16:9",
  "session_id": "raver_session_123"
}
```

**Response (200 OK):** Images generated successfully.

### `POST /api/ai/image-lead/enhance` (Proxy: `/api/v1/image-lead/enhance`)
Enhance an image using post-processing parameters.

**Request Payload:**
```json
{
  "image_url": "https://s3.amazonaws.com/raver-assets/image.jpg",
  "session_id": "raver_session_123",
  "brightness": 1.2, // Default: 1.0 (range: 0.5 to 2.0)
  "saturation": 1.1, // Default: 1.0 (range: 0.5 to 2.0)
  "sharpness": 1.05, // Default: 1.0 (range: 1.0 to 1.5)
  "contrast": 1.1    // Default: 1.0 (range: 0.5 to 2.0)
}
```

**Response (200 OK):** 
```json
{
  "success": true,
  "data": {
    "enhanced_image_url": "https://raver-ai-backend.com/enhanced/image_enhanced.jpg"
  }
}
```


### `GET /api/ai/image-lead/vault/{session_id}`
Get all stored images for a session.

**Response (200 OK):** Vault contents

---

## 7. AI Producer (`/api/ai/producer`)
E2E Campaign Orchestration.

### `POST /api/ai/producer/campaign`
Launch a full pipeline campaign.

**Request Payload:**
```json
{
  "brief": {}, // Producer brief (business_name, product_description, target_audience, mood, platform)
  "session_id": "string"
}
```
**Response (200 OK):** Campaign launched

### `GET /api/ai/producer/campaigns`
List all campaigns.

**Response (200 OK):** List of campaigns

### `GET /api/ai/producer/campaign/{campaign_id}`
Get current status and results of a campaign.

**Response (200 OK):** Campaign status

### `POST /api/ai/producer/campaign/{campaign_id}/approve`
Human Creative Director approval or feedback step.

**Request Payload:**
```json
{
  "approved": true,
  "notes": "string"
}
```
**Response (200 OK):** Approval processed

---

## 8. General Agents (`/api/agents`)
Agent management.

### `GET /api/agents`
Get all agents.
**Response (200 OK):** List of agents

### `POST /api/agents`
Create an agent.
**Request Payload:**
```json
{
  "name": "string",
  "params": {}
}
```
**Response (201 Created):** Agent created

### `GET /api/agents/{id}`
Get agent details.
**Response (200 OK):** Agent details

### `PUT /api/agents/{id}`
Update an agent.
**Request Payload:** `{}`
**Response (200 OK):** Agent updated

### `DELETE /api/agents/{id}`
Delete an agent.
**Response (200 OK):** Agent deleted

### `POST /api/agents/{id}/execute`
Execute an agent.
**Response (200 OK):** Agent executed
