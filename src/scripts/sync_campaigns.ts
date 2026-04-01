import axios from 'axios';
import prisma from '../db/prisma';
import dotenv from 'dotenv';

dotenv.config();

const EXTERNAL_API_URL = 'https://apiplatform.raver.ai/api/v1/producer/campaigns';
const DEFAULT_USER_ID = 'f15e9f82-0bf4-4dc7-b994-74853e81721d';

async function syncCampaigns() {
  console.log('🔄 Starting campaign synchronization from external API...');
  
  try {
    const response = await axios.get(EXTERNAL_API_URL, {
      headers: { 'accept': 'application/json' }
    });

    const externalCampaigns = response.data.campaigns || [];
    console.log(`✅ Fetched ${externalCampaigns.length} campaigns from external API.`);

    for (const ext of externalCampaigns) {
      const brief = ext.brief || {};
      
      // Map external status to internal status if needed
      // Internal schema default is "draft"
      const status = ext.status === 'completed' ? 'active' : (ext.status || 'draft');

      console.log(`⏳ Syncing campaign: ${brief.business_name || ext.campaign_id}`);

      // Map platform/tone/visualStyle to arrays
      const platforms = brief.platform ? [brief.platform] : [];
      const tones = brief.tone ? [brief.tone] : [];
      const visualStyles = brief.mood ? [brief.mood] : [];

      await prisma.campaign.upsert({
        where: { id: ext.campaign_id }, // Assuming external campaign_id is a valid UUID and matches our schema
        update: {
          userId: DEFAULT_USER_ID,
          name: brief.business_name || 'Untitled External Campaign',
          status: status,
          budget: brief.budget || 0,
          audience: brief.target_audience,
          format: brief.format,
          platforms: platforms,
          tones: tones,
          visualStyles: visualStyles,
          objective: brief.product_description,
          config: ext // Store full original data for safety
        },
        create: {
          id: ext.campaign_id,
          userId: DEFAULT_USER_ID,
          name: brief.business_name || 'Untitled External Campaign',
          status: status,
          budget: brief.budget || 0,
          audience: brief.target_audience,
          format: brief.format,
          platforms: platforms,
          tones: tones,
          visualStyles: visualStyles,
          objective: brief.product_description,
          config: ext
        }
      });
    }

    console.log('✨ Synchronization complete.');
  } catch (error: any) {
    console.error('❌ Synchronization failed:', error.message);
    if (error.response) {
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    await prisma.$disconnect();
  }
}

syncCampaigns();
