import express from 'express';
import cors from 'cors';

// Import modules
import userRoutes from './modules/user';
import campaignRoutes from './modules/campaign';
import billingRoutes from './modules/billing';
import projectRoutes from './modules/project';
import assetRoutes from './modules/asset';
import templateRoutes from './modules/template';
import agentRoutes from './modules/agent';
import authRoutes from './modules/auth';
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

// Protected routes
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/campaigns', authMiddleware, campaignRoutes);
app.use('/api/billing', authMiddleware, billingRoutes);
app.use('/api/projects', authMiddleware, projectRoutes);
app.use('/api/assets', authMiddleware, assetRoutes);
app.use('/api/templates', authMiddleware, templateRoutes);
app.use('/api/agents', authMiddleware, agentRoutes);

export default app;
