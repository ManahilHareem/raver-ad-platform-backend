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
app.use('/api/users', userRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/agents', agentRoutes);

export default app;
