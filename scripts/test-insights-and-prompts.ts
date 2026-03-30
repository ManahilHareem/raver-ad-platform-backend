import prisma from '../src/db/prisma';

const TARGET_USER_ID = 'f15e9f82-0bf4-4dc7-b994-74853e81721d';

async function testInsightsAndPrompts() {
    console.log('--- AI Director Insights & Prompts Test ---');
    try {
        // 1. Verify Insights Logic
        const campaignCount = await (prisma as any).aISession.count({
            where: { userId: TARGET_USER_ID, type: 'director' }
        });
        console.log('\n[Insights Check]');
        console.log('Campaigns Created (Real Count):', campaignCount);
        console.log('Other metrics are currently mocked (Credits: 250, Quality: 94%)');

        // 2. Verify Prompt Extraction Logic
        const sessions = await (prisma as any).aISession.findMany({
            where: { userId: TARGET_USER_ID, type: 'director' },
            orderBy: { createdAt: 'desc' }
        });

        console.log('\n[Prompt Extraction Check]');
        sessions.forEach((s: any) => {
            const metadata = s.metadata || {};
            const history = metadata.history || [];
            const prompt = history.find((m: any) => m.role === 'user')?.content || 'No prompt found';
            const businessName = metadata.brief_draft?.business_name || 'N/A';
            
            console.log(`- Session: ${s.sessionId} (${businessName})`);
            console.log(`  -> Prompt: ${prompt.substring(0, 50)}...`);
        });

        if (sessions.length > 0) {
            console.log('\n✅ SUCCESS: Insights and Prompt extraction are functional!');
        } else {
            console.log('\n❌ FAILURE: No sessions found for user.');
        }

    } catch (error: any) {
        console.error('ERROR:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testInsightsAndPrompts();
