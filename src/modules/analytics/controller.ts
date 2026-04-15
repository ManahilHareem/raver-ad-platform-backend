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

/**
 * Deep analytics — aggregates real data across all schema models.
 * Covers: AI sessions, campaigns, assets, quality audits, and agent outputs.
 */
export const getDeepAnalytics = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // ── Parallel fetch all tables for this user ──
    const [
      campaigns,
      aiSessions,
      assets,
      qualityResults,
      imageResults,
      audioResults,
      copyResults,
      editorResults,
      producerResults
    ] = await Promise.all([
      prisma.campaign.findMany({ 
        where: { userId },
        include: {
          metrics: true,
          Asset: { take: 1, orderBy: { createdAt: 'desc' } }
        }
      }),
      prisma.aISession.findMany({ where: { userId } }),
      prisma.asset.findMany({ where: { userId } }),
      prisma.qualityLeadResult.findMany({ where: { userId } }),
      prisma.imageLeadResult.findMany({ where: { userId } }),
      prisma.audioLeadResult.findMany({ where: { userId } }),
      prisma.copyLeadResult.findMany({ where: { userId } }),
      prisma.editorResult.findMany({ where: { userId } }),
      prisma.producerResult.findMany({ where: { userId } })
    ]);

    // ── 1. Campaign Overview ──
    const campaignsByStatus: Record<string, number> = {};
    campaigns.forEach(c => {
      const s = c.status || 'draft';
      campaignsByStatus[s] = (campaignsByStatus[s] || 0) + 1;
    });

    const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);

    // ── 2. AI Session Breakdown by Type ──
    const sessionsByType: Record<string, number> = {};
    aiSessions.forEach(s => {
      const t = s.type || 'unknown';
      sessionsByType[t] = (sessionsByType[t] || 0) + 1;
    });

    // ── 3. Agent Output Counts ──
    const agentOutputs = {
      images: imageResults.length,
      audio: audioResults.length,
      copy: copyResults.length,
      video: editorResults.length,
      productions: producerResults.length,
      total: imageResults.length + audioResults.length + copyResults.length + editorResults.length + producerResults.length
    };

    // ── 4. Quality Audit Summary ──
    const avgScore = (arr: (number | null | undefined)[]) => {
      const valid = arr.filter((v): v is number => v != null);
      return valid.length > 0 ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10 : null;
    };

    const qualitySummary = {
      totalAudits: qualityResults.length,
      approved: qualityResults.filter(q => q.decision === 'approved' || q.rejected === false).length,
      rejected: qualityResults.filter(q => q.decision === 'rejected' || q.rejected === true).length,
      avgOverallScore: avgScore(qualityResults.map(q => q.overallScore)),
      avgVisualScore: avgScore(qualityResults.map(q => q.visualScore)),
      avgBrandAlignmentScore: avgScore(qualityResults.map(q => q.brandAlignmentScore)),
      avgCopyScore: avgScore(qualityResults.map(q => q.copyScore)),
      avgPlatformFitScore: avgScore(qualityResults.map(q => q.platformFitScore)),
      avgAudioFitScore: avgScore(qualityResults.map(q => q.audioFitScore)),
    };

    // ── 5. Asset Storage Breakdown ──
    const assetsByType: Record<string, number> = {};
    let totalStorageBytes = 0;
    assets.forEach(a => {
      const t = a.type || 'other';
      assetsByType[t] = (assetsByType[t] || 0) + 1;
      totalStorageBytes += (a.fileSize || 0);
    });

    // ── 6. Content Generation Timeline (last 30 days) ──
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 29);

    const allGeneratedItems: { type: string, dateObj: Date }[] = [];

    // Parse image results (accounting for multiple scenes + main image)
    imageResults.forEach(r => {
      const dateObj = r.updatedAt || r.createdAt;
      // Main image
      if (r.mainImageUrl) {
        allGeneratedItems.push({ type: 'image', dateObj });
      }
      // Scenes
      if (r.scenes && Array.isArray(r.scenes)) {
        r.scenes.forEach((scene: any) => {
          if (scene.url && scene.url !== r.mainImageUrl) {
             allGeneratedItems.push({ type: 'image', dateObj });
          }
        });
      }
    });

    // Parse audio (mix+voice+music variations sum up)
    audioResults.forEach(r => {
      const dateObj = r.updatedAt || r.createdAt;
      if (r.mixUrl) allGeneratedItems.push({ type: 'audio', dateObj });
      if (r.voiceoverUrl) allGeneratedItems.push({ type: 'audio', dateObj });
      if (r.musicUrl) allGeneratedItems.push({ type: 'audio', dateObj });
    });

    // Parse standard assets, copy, video
    assets.forEach(a => allGeneratedItems.push({ type: a.type || 'upload', dateObj: a.createdAt }));
    copyResults.forEach(r => allGeneratedItems.push({ type: 'copy', dateObj: r.updatedAt || r.createdAt }));
    editorResults.forEach(r => allGeneratedItems.push({ type: 'video', dateObj: r.updatedAt || r.createdAt }));
    producerResults.filter((p: any) => p.result && (p.result.video_url || p.result.videoUrl)).forEach(r => allGeneratedItems.push({ type: 'video', dateObj: r.updatedAt || r.createdAt }));

    const filteredItems = allGeneratedItems.filter(item => item.dateObj >= thirtyDaysAgo);

    const generationTimeline = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(thirtyDaysAgo);
      date.setDate(thirtyDaysAgo.getDate() + i);
      const dayStr = date.toISOString().split('T')[0];
      
      const dayItems = filteredItems.filter(
        item => item.dateObj.toISOString().split('T')[0] === dayStr
      );
      
      return {
        date: dayStr,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        images: dayItems.filter(i => i.type === 'image').length,
        audio: dayItems.filter(i => i.type === 'audio').length,
        copy: dayItems.filter(i => i.type === 'copy').length,
        video: dayItems.filter(i => i.type === 'video').length,
        uploads: dayItems.filter(i => !['image', 'audio', 'copy', 'video'].includes(i.type)).length,
        total: dayItems.length
      };
    });

    // ── 7. Campaign Roster Ranking ──
    const campaignRanking = campaigns
      .map((c: any) => {
        const cMetrics = c.metrics || [];
        const views = cMetrics.reduce((sum: number, m: any) => sum + (m.impressions || 0), 0);
        const clicks = cMetrics.reduce((sum: number, m: any) => sum + (m.clicks || 0), 0);
        const spend = cMetrics.reduce((sum: number, m: any) => sum + Number(m.spend || 0), 0);
        const engagement = views > 0 ? ((clicks / views) * 100).toFixed(1) + '%' : '0.0%';
        
        const revenueValue = c.budget && c.budget > 0 ? (c.budget * 0.8) : (spend > 0 ? spend * 1.5 : 0);

        // Link AISession if exists for this campaign
        const matchingSession = aiSessions.find(s => 
          s.campaignId === c.id || 
          (s.metadata && (s.metadata as any).campaign_id === c.id)
        );

        return {
          id: c.id,
          name: c.name,
          status: c.status,
          budget: c.budget,
          platforms: c.platforms,
          createdAt: c.createdAt,
          image: c.Asset?.[0]?.url || "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=2669&auto=format&fit=crop",
          views: views > 0 ? views.toLocaleString() : "0",
          engagement: engagement,
          conversions: views > 0 ? Math.floor(clicks * 0.1).toString() : "0",
          revenue: revenueValue > 0 ? `$${revenueValue.toLocaleString()}` : "$0",
          aiSession: matchingSession ? {
            id: matchingSession.id,
            sessionId: matchingSession.sessionId,
            type: matchingSession.type,
            status: (matchingSession.metadata as any)?.status || (matchingSession.metadata as any)?.production?.status
          } : null
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({
      success: true,
      data: {
        overview: {
          totalCampaigns: campaigns.length,
          totalSessions: aiSessions.length,
          totalAssets: assets.length,
          totalAgentOutputs: agentOutputs.total,
          totalQualityAudits: qualityResults.length,
          totalBudget
        },
        campaignsByStatus,
        sessionsByType,
        agentOutputs,
        qualitySummary,
        assetBreakdown: {
          byType: assetsByType,
          total: assets.length,
          storageMB: Math.round(totalStorageBytes / (1024 * 1024) * 100) / 100
        },
        generationTimeline,
        campaignRanking
      }
    });
  } catch (error: any) {
    console.error('[AnalyticsController] Error getting deep analytics:', error);
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};
