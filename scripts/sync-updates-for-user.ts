import prisma from '../src/db/prisma';
import * as directorService from '../src/modules/ai-director/service';

const TARGET_USER_ID = 'f15e9f82-0bf4-4dc7-b994-74853e81721d';

async function syncUpdates() {
    console.log(`[SyncUpdates] Loading sessions for user: ${TARGET_USER_ID}`);
    try {
        const sessions = await (prisma as any).aISession.findMany({
            where: {
                userId: TARGET_USER_ID,
                type: 'director'
            }
        });
        
        console.log(`[SyncUpdates] Found ${sessions.length} sessions to update.`);
        
        for (const session of sessions) {
            console.log(`[SyncUpdates] Requesting update for session: ${session.sessionId}`);
            try {
                const result = await directorService.getUpdate(session.sessionId);
                
                await (prisma as any).aISession.update({
                    where: { sessionId: session.sessionId },
                    data: { metadata: result }
                });
                console.log(`[SyncUpdates] Updated metadata for session: ${session.sessionId}`);
            } catch (updateError: any) {
                console.error(`[SyncUpdates] FAILED update for ${session.sessionId}:`, updateError.message);
            }
        }
        
        console.log('[SyncUpdates] SUCCESS: All session updates synchronized.');
    } catch (error: any) {
        console.error('[SyncUpdates] ERROR:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

syncUpdates();
