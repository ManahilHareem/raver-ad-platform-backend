import prisma from '../src/db/prisma';

const TARGET_USER_ID = 'f15e9f82-0bf4-4dc7-b994-74853e81721d';
const SEEDED_IDS = ['1774817678958', '1774812723731', '1774811930938'];

async function verify() {
    console.log('\n--- Final Verification Report ---\n');
    try {
        for (const sessionId of SEEDED_IDS) {
            const s = await (prisma as any).aISession.findUnique({
                where: { sessionId }
            });
            
            if (s) {
                let metadata = s.metadata || {};
                if (typeof metadata === 'string') metadata = JSON.parse(metadata);
                
                // If nested, use the inner one, otherwise use the outer one
                const finalMeta = metadata.metadata ? metadata.metadata : metadata;

                const history = finalMeta.history || [];
                const production = finalMeta.production || null;
                const business = finalMeta.brief_draft?.business_name || 'Seeded';

                console.log(`- [${sessionId}] Business: ${business}`);
                console.log(`  -> History Messages: ${Array.isArray(history) ? history.length : 'NOT AN ARRAY'}`);
                console.log(`  -> Production Assets: ${!!production ? 'YES' : 'NO'}`);
                if (production && production.video_url) {
                    console.log(`  -> Final Video: ${production.video_url}`);
                }
            } else {
                console.log(`- [${sessionId}] Status: MISSING`);
            }
        }
    } catch (error: any) {
        console.error('ERROR:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
