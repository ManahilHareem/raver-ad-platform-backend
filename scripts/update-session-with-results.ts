import prisma from '../src/db/prisma';

const TARGET_USER_ID = 'f15e9f82-0bf4-4dc7-b994-74853e81721d';
const TARGET_SESSION_ID = '1774811930938';

const RESULT_DATA = {
    "message": "Your campaign is ready! It's now with Fabienne for final review.",
    "status": "ready_for_human_review",
    "campaign_id": "910e7071-313f-4a8e-a48c-108e4b126761",
    "video_url": "https://raver-ad-platform.s3.us-east-1.amazonaws.com/assets/renders/1774811930938/render_9x16_0b029ba7-f6b7-4dae-b8d8-ee15d2a897f5.mp4",
    "voiceover_url": "https://raver-ad-platform.s3.us-east-1.amazonaws.com/assets/audio/1774811930938/voiceover_04855a74-df41-4154-ad4c-bc1c0f48009f.mp3",
    "music_url": "https://raver-ad-platform.s3.us-east-1.amazonaws.com/assets/audio/1774811930938/music_84c68431-abf1-4c72-9680-7b13ee11e7cc.mp3",
    "script": "Discover hair magic at Gregory Salon. Unleash your style with stunning cuts and vibrant colors. Experience luxury with our expert stylists. Refresh your look for any occasion. Book your transformation today."
};

async function update() {
    console.log(`[UpdateScript] Loading session: ${TARGET_SESSION_ID}`);
    try {
        const session = await (prisma as any).aISession.findUnique({
            where: { sessionId: TARGET_SESSION_ID }
        });
        
        if (!session) {
            console.error('[UpdateScript] Session NOT FOUND.');
            return;
        }

        // 1. Prepare Metadata
        let metadata = (session.metadata as any) || {};

        // 2. Append to History
        if (!Array.isArray(metadata.history)) {
            metadata.history = [];
        }
        
        // Check if message already exists to avoid duplication
        const alreadyExists = metadata.history.some((m: any) => m.content === RESULT_DATA.message);
        if (!alreadyExists) {
            metadata.history.push({
                role: "assistant",
                content: RESULT_DATA.message
            });
        }

        // 3. Attach Production Assets (New Schema/Structure)
        metadata.production = {
            status: RESULT_DATA.status,
            campaign_id: RESULT_DATA.campaign_id,
            video_url: RESULT_DATA.video_url,
            voiceover_url: RESULT_DATA.voiceover_url,
            music_url: RESULT_DATA.music_url,
            script: RESULT_DATA.script,
            updatedAt: new Date().toISOString()
        };

        // 4. Save to DB
        await (prisma as any).aISession.update({
            where: { sessionId: TARGET_SESSION_ID },
            data: { 
                metadata,
                userId: TARGET_USER_ID // Force ownership consistency
            }
        });
        
        console.log(`[UpdateScript] SUCCESS: Session ${TARGET_SESSION_ID} enriched with production results.`);
    } catch (error: any) {
        console.error('[UpdateScript] ERROR:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

update();
