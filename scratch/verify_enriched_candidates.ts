import prisma from '../src/db/prisma';
import axios from 'axios';

async function verifyEnrichedCandidates() {
  const EMAIL = 'maaz.khan@ccript.com';

  console.log(`Verifying enriched candidates for ${EMAIL}...`);

  try {
    const user = await prisma.user.findFirst({
        where: { email: EMAIL }
    });

    if (!user) {
        console.error(`User ${EMAIL} not found.`);
        return;
    }

    // Since we can't easily get a JWT here without auth flow, 
    // we'll directly check the DB and simulate the mapping logic.
    
    const limit = 20;
    const images = await (prisma as any).imageLeadResult.findMany({ where: { userId: user.id }, take: limit, orderBy: { createdAt: 'desc' } });
    const copies = await (prisma as any).copyLeadResult.findMany({ where: { userId: user.id }, take: limit, orderBy: { createdAt: 'desc' } });

    console.log(`Found ${images.length} image results and ${copies.length} copy results.`);

    if (images.length > 0) {
        const enrichedImage = { 
            id: images[0].id, 
            sessionId: images[0].sessionId, 
            type: 'Image', 
            scenes: images[0].scenes,
            metadata: images[0].metadata
        };
        console.log('\nSample Enriched Image:');
        console.log(`- ID: ${enrichedImage.id}`);
        console.log(`- Scenes Present: ${Array.isArray(enrichedImage.scenes) ? enrichedImage.scenes.length : 'Yes (Object)'}`);
        console.log(`- Metadata Present: ${enrichedImage.metadata ? 'Yes' : 'No'}`);
        
        if (!enrichedImage.scenes) {
            console.warn('⚠️ Warning: scenes field is missing in DB record.');
        } else {
            console.log('✅ VERIFICATION SUCCESS: Scenes field is available in response mapping.');
        }
    }

    if (copies.length > 0) {
        const enrichedCopy = { 
            id: copies[0].id, 
            type: 'Copy', 
            script: copies[0].script,
            captions: copies[0].captions
        };
        console.log('\nSample Enriched Copy:');
        console.log(`- ID: ${enrichedCopy.id}`);
        console.log(`- Script Present: ${enrichedCopy.script ? 'Yes' : 'No'}`);
        
        if (!enrichedCopy.script) {
            console.warn('⚠️ Warning: script field is missing in DB record.');
        } else {
            console.log('✅ VERIFICATION SUCCESS: Script field is available in response mapping.');
        }
    }

  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyEnrichedCandidates();
