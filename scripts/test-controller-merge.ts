import prisma from '../src/db/prisma';

const SESSION_ID = '1774811930938';
const NEW_UPDATE_RESULT = {
    status: 'final_render_complete',
    video_url: 'https://raver-final-render.mp4', // NEW URL
    new_test_field: 'this should be added'
};

/**
 * Simulates the merge logic in the controller to verify history persistence.
 */
const mergeMetadata = (existing: any, incoming: any) => {
  const base = (existing as any) || {};
  const data = incoming.data || incoming;

  return {
    ...base,
    ...data,
    production: {
      ...(base.production || {}),
      ...(data.production || (data.video_url ? data : {})),
    },
    history: data.history || base.history || [],
    brief_draft: data.brief_draft || base.brief_draft || {}
  };
};

async function testMerge() {
    console.log('--- Controller Merge Logic Test ---');
    try {
        // 1. Get existing session (should have 13 messages)
        const existing = await (prisma as any).aISession.findUnique({ where: { sessionId: SESSION_ID } });
        const initialHistoryCount = existing.metadata.history?.length || 0;
        console.log(`Initial History Count: ${initialHistoryCount}`);

        // 2. Perform Merge (Simulation of controller logic)
        const merged = mergeMetadata(existing.metadata, NEW_UPDATE_RESULT);

        // 3. Save Merged Metadata
        await (prisma as any).aISession.update({
            where: { sessionId: SESSION_ID },
            data: { metadata: merged }
        });

        // 4. Verify Final State
        const final = await (prisma as any).aISession.findUnique({ where: { sessionId: SESSION_ID } });
        const finalHistoryCount = final.metadata.history?.length || 0;
        
        console.log(`Final History Count: ${finalHistoryCount}`);
        console.log(`Final Video URL: ${final.metadata.production.video_url}`);
        console.log(`New Test Field: ${final.metadata.new_test_field}`);

        if (finalHistoryCount === initialHistoryCount && final.metadata.production.video_url === NEW_UPDATE_RESULT.video_url) {
            console.log('\nSUCCESS: History was preserved and new production data was merged!');
        } else {
            console.log('\nFAILURE: History was lost or new data was not merged correctly.');
        }

    } catch (error: any) {
        console.error('ERROR:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testMerge();
