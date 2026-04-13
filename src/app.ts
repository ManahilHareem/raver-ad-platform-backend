import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';

// Import modules
import userRoutes from './modules/user';
import campaignRoutes from './modules/campaign';
import billingRoutes from './modules/billing';
import projectRoutes from './modules/project';
import assetRoutes from './modules/asset';
import templateRoutes from './modules/template';
import agentRoutes from './modules/agent';
import authRoutes from './modules/auth';
import chatRoutes from './modules/chat';
import aiAdsRoutes from './modules/ai-ads';
import aiImageLeadRoutes from './modules/ai-image-lead';
import aiAudioLeadRoutes from './modules/ai-audio-lead';
import aiCopyLeadRoutes from './modules/ai-copy-lead';
import aiEditorRoutes from './modules/ai-editor';
import aiProducerRoutes from './modules/ai-producer';
import aiDirectorRoutes from './modules/ai-director';
import aiInsightsRoutes from './modules/ai-insights';
import aiQualityRoutes from './modules/ai-quality';
import voiceRoutes from './modules/voice';
import notificationRoutes from './modules/notification';
import analyticsRoutes from './modules/analytics';
import { authMiddleware } from './middleware/auth';

const app = express();

app.use(cors());
app.use(express.json());

// Main health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Raver Ad Platform API is running.' });
});
// Legacy health check for backwards compatibility
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Raver Ad Platform API is running.' });
});

// Register modules
app.use('/api/auth', authRoutes);

// Swagger Documentation Route
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: "Raver Ad Platform API Docs",
}));

// Protected routes
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/campaigns', authMiddleware, campaignRoutes);
app.use('/api/billing', authMiddleware, billingRoutes);
app.use('/api/projects', authMiddleware, projectRoutes);
app.use('/api/assets', authMiddleware, assetRoutes);
app.use('/api/templates', authMiddleware, templateRoutes);
app.use('/api/agents', authMiddleware, agentRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);
app.use('/api/voice', authMiddleware, voiceRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
// AI Proxy Routes
app.use('/api/ai/ads', authMiddleware, aiAdsRoutes);
app.use('/api/ai/image-lead', authMiddleware, aiImageLeadRoutes);
app.use('/api/ai/audio-lead', authMiddleware, aiAudioLeadRoutes);
app.use('/api/ai/copy-lead', authMiddleware, aiCopyLeadRoutes);
app.use('/api/ai/editor', authMiddleware, aiEditorRoutes);
app.use('/api/ai/producer', authMiddleware, aiProducerRoutes);
app.use('/api/ai/director', authMiddleware, aiDirectorRoutes);
app.use('/api/ai/insights', authMiddleware, aiInsightsRoutes);
app.use('/api/ai/quality', authMiddleware, aiQualityRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);

export default app;
