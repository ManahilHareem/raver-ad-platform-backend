import { Response } from 'express';
import prisma from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth';

/**
 * Get platform-wide analytics data using real DB metrics and fallback dummies.
 */
export const getPlatformAnalytics = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // 1. Fetch real campaigns, metrics, and latest assets for thumbnails
    const [campaigns, userMetrics] = await Promise.all([
      prisma.campaign.findMany({
        where: { userId },
        include: { 
          metrics: true,
          Asset: { take: 1, orderBy: { createdAt: 'desc' } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      prisma.metric.findMany({
        where: { Campaign: { userId } },
        orderBy: { recordedAt: 'asc' }
      })
    ]);

    // 2. Aggregate metrics for Top Stats
    const totalImpressions = userMetrics.reduce((sum, m) => sum + (m.impressions || 0), 0);
    const totalClicks = userMetrics.reduce((sum, m) => sum + (m.clicks || 0), 0);

    const formatNumber = (num: number) => {
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
      return num.toString();
    };

    // 3. Process Engagement Data (Last 7 Days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const engagementData = last7Days.map((day, index) => {
      const dayViews = userMetrics
        .filter(m => m.recordedAt.toISOString().split('T')[0] === day)
        .reduce((sum, m) => sum + (m.impressions || 0), 0);
      
      return { 
        name: `Day ${index + 1}`, 
        views: dayViews > 0 ? dayViews : (2400 + (index * 500)) 
      };
    });

    // 4. Dynamic Platform Distribution
    const platformCounts: Record<string, number> = { Instagram: 0, Facebook: 0, TikTok: 0, YouTube: 0 };
    let totalPlatforms = 0;

    campaigns.forEach(c => {
      (c.platforms || []).forEach(p => {
        const platform = p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
        if (Object.prototype.hasOwnProperty.call(platformCounts, platform)) {
          platformCounts[platform]++;
          totalPlatforms++;
        }
      });
    });

    const platformDistribution = totalPlatforms > 0 
      ? Object.entries(platformCounts).map(([name, count]) => ({
          name,
          value: Math.round((count / totalPlatforms) * 100),
          color: name === 'Instagram' ? '#EA4164' : name === 'Facebook' ? '#3B82F6' : name === 'TikTok' ? '#121212' : '#FF0000'
        }))
      : [
          { name: "Instagram", value: 45, color: "#EA4164" },
          { name: "Facebook", value: 30, color: "#3B82F6" },
          { name: "TikTok", value: 18, color: "#121212" },
          { name: "YouTube", value: 7, color: "#FF0000" }
        ];

    // 5. Transform Campaigns for Performance Table
    const campaignPerformance = campaigns.length > 0 ? campaigns.map(c => {
      const cMetrics = c.metrics || [];
      const views = cMetrics.reduce((sum, m) => sum + m.impressions, 0);
      const clicks = cMetrics.reduce((sum, m) => sum + m.clicks, 0);
      const spend = cMetrics.reduce((sum, m) => sum + Number(m.spend), 0);
      const engagement = views > 0 ? ((clicks / views) * 100).toFixed(1) + '%' : '0.0%';
      
      const revenueValue = c.budget > 0 ? (c.budget * 0.8) : (spend > 0 ? spend * 1.5 : 0);

      return {
        name: c.name,
        image: c.Asset?.[0]?.url || "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=2669&auto=format&fit=crop",
        views: views > 0 ? views.toLocaleString() : (Math.floor(Math.random() * 1000) + 1000).toLocaleString(),
        engagement: views > 0 ? engagement : "7.5%",
        conversions: views > 0 ? Math.floor(clicks * 0.1).toString() : "12",
        revenue: revenueValue > 0 ? `$${revenueValue.toLocaleString()}` : "$0"
      };
    }) : [
      { name: "Summer Balayage", image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=2669&auto=format&fit=crop", views: "2,400", engagement: "8.2%", conversions: "24", revenue: "$1,240" },
      { name: "Holiday Promo", image: "https://images.unsplash.com/photo-1512418490979-92798ccc1340?q=80&w=2670&auto=format&fit=crop", views: "1,800", engagement: "8.8%", conversions: "18", revenue: "$980" },
      { name: "Spring Trends", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=2687&auto=format&fit=crop", views: "3,100", engagement: "7.5%", conversions: "31", revenue: "$1,300" },
      { name: "Nail Collection", image: "https://images.unsplash.com/photo-1604654894611-6973b376cbde?q=80&w=2670&auto=format&fit=crop", views: "1,600", engagement: "9.3%", conversions: "16", revenue: "$450" },
      { name: "Bridal Package", image: "https://images.unsplash.com/photo-1532413992378-f169ac26fff0?q=80&w=2669&auto=format&fit=crop", views: "2,200", engagement: "8.2%", conversions: "22", revenue: "$4,300" }
    ];

    return res.json({
      success: true,
      data: {
        topStats: [
          { label: "Total Views", value: totalImpressions > 0 ? formatNumber(totalImpressions) : "18.4K", trend: "+12%", isPositive: true },
          { label: "Total Likes", value: totalClicks > 0 ? formatNumber(totalClicks) : "4.3K", trend: "+21%", isPositive: true },
          { label: "New Followers", value: "1.3K", trend: "+15%", isPositive: true },
          { label: "Shares", value: "250", trend: "-5%", isPositive: false }
        ],
        engagementData,
        platformDistribution,
        campaignPerformance,
        contentTypePerformance: [
          { name: "Before & After", value: 85, posts: 24 },
          { name: "Tutorials", value: 72, posts: 24 },
          { name: "Product Shots", value: 68, posts: 24 },
          { name: "Client Reviews", value: 51, posts: 24 },
          { name: "Behind Scenes", value: 46, posts: 24 }
        ],
        audienceDemographics: [
          { name: "18-24", female: 40, male: 20 },
          { name: "25-34", female: 55, male: 30 },
          { name: "35-44", female: 45, male: 25 },
          { name: "45-54", female: 30, male: 15 },
          { name: "55+", female: 20, male: 10 }
        ]
      }
    });
  } catch (error: any) {
    console.error('[AnalyticsController] Error getting analytics:', error);
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};
