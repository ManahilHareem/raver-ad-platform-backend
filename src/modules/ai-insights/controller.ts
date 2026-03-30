import { Response } from 'express';
import prisma from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth';

/**
 * Get AI Director account insights for the user.
 * Returns campaign metrics, credits, and quality scores.
 */
export const getDirectorInsights = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Dynamic calculation for campaigns created
    const campaignCount = await (prisma as any).aISession.count({
      where: { userId, type: 'director' }
    });

    return res.json({
      success: true,
      data: {
        title: "AI Director Insights",
        metrics: [
          {
            label: "Campaigns Created",
            value: campaignCount.toString(),
            change: "+12%",
            isPositive: true
          },
          {
            label: "Credit Remaining",
            value: "250",
            change: "-12%",
            isPositive: false
          },
          {
            label: "Avg Quality Score",
            value: "94%",
            change: "+5%",
            isPositive: true
          },
          {
            label: "Avg Render Time",
            value: "4.2m",
            change: "-0.5m",
            isPositive: true
          }
        ]
      }
    });
  } catch (error: any) {
    console.error('[AIInsightsController] Error getting director insights:', error);
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};
