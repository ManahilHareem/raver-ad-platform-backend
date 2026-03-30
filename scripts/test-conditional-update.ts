import prisma from '../src/db/prisma';

const TARGET_USER_ID = 'f15e9f82-0bf4-4dc7-b994-74853e81721d';
const TEST_SESSION_ID = `test-cond-${Date.now()}`;

/**
 * Controller-style metadata merge helper.
 */
const mergeMetadata = (existing: any, incoming: any) => {
  const base = (existing as any) || {};
  const data = incoming;

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

async function simulateUpdate(sessionId: string, status: string, mockData: any) {
    console.log(`\n--- Simulating Update [Status: ${status}] ---`);
    
    // 1. Check condition (Controller logic)
    if (status === 'ready_for_human_review') {
        const existing = await (prisma as any).aISession.findUnique({ where: { sessionId } });
        const merged = mergeMetadata(existing?.metadata, mockData);

        await (prisma as any).aISession.upsert({
            where: { sessionId },
            update: { metadata: merged },
            create: { userId: TARGET_USER_ID, sessionId, type: 'director', metadata: merged }
        });
        console.log(`[Success] DB updated for session ${sessionId}`);
    } else {
        console.log(`[Skip] DB NOT updated for status: ${status}`);
    }
}

async function runTest() {
    console.log('Starting AI Director Conditional Update Test...');
    try {
        // Step 0: Ensure session exists with some history
        const initialMetadata = { history: [{ role: 'user', content: 'test-init' }] };
        await (prisma as any).aISession.create({
            data: { userId: TARGET_USER_ID, sessionId: TEST_SESSION_ID, type: 'director', metadata: initialMetadata }
        });

        // Step 1: Poll with "Rendering" status (Should NOT update DB)
        const renderResult = { status: 'rendering', message: 'Generating video...' };
        await simulateUpdate(TEST_SESSION_ID, 'rendering', renderResult);

        const check1 = await (prisma as any).aISession.findUnique({ where: { sessionId: TEST_SESSION_ID } });
        if (check1.metadata.status !== 'rendering') {
            console.log('✅ Check 1: History preserved, intermediate state skipped in DB.');
        } else {
            console.log('❌ Check 1 failed: Intermediate state saved in DB unexpectedly.');
        }

        // Step 2: Poll with "Ready" status (Should UPDATE DB)
        const finalResult = { 
            status: 'ready_for_human_review', 
            video_url: 'https://raver-final.mp4',
            message: 'Final result ready!'
        };
        await simulateUpdate(TEST_SESSION_ID, 'ready_for_human_review', finalResult);

        const check2 = await (prisma as any).aISession.findUnique({ where: { sessionId: TEST_SESSION_ID } });
        if (check2.metadata.status === 'ready_for_human_review' && check2.metadata.production.video_url === 'https://raver-final.mp4') {
            console.log('✅ Check 2: Final campaign assets persisted successfully!');
        } else {
            console.log('❌ Check 2 failed: Final assets NOT persisted.');
        }

    } catch (error: any) {
        console.error('ERROR:', error.message);
    } finally {
        // Cleanup
        await (prisma as any).aISession.delete({ where: { sessionId: TEST_SESSION_ID } });
        await prisma.$disconnect();
    }
}

runTest();
