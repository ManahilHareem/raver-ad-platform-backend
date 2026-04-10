import prisma from '../src/db/prisma';
import * as assetService from '../src/modules/asset/service';

async function verifyUnifiedAssets() {
  const EMAIL = 'maaz.khan@ccript.com';

  console.log(`Verifying unified assets for ${EMAIL}...`);

  try {
    const user = await prisma.user.findFirst({
        where: { email: EMAIL }
    });

    if (!user) {
        console.error(`User ${EMAIL} not found.`);
        return;
    }

    const allAssets = await assetService.getAllAssets(user.id);
    
    console.log(`\nFound ${allAssets.length} total assets.`);
    
    const categories = {
        standard: allAssets.filter((a: any) => !a.origin).length,
        image: allAssets.filter((a: any) => a.origin === 'AI Image Lead').length,
        audio_mix: allAssets.filter((a: any) => a.name.includes('AI Mix')).length,
        audio_voice: allAssets.filter((a: any) => a.name.includes('AI Voiceover')).length,
        audio_music: allAssets.filter((a: any) => a.name.includes('AI Music')).length,
        video: allAssets.filter((a: any) => a.origin === 'AI Editor' || a.origin === 'AI Producer').length
    };

    console.log('Categories:');
    console.log(`- Standard (Uploaded): ${categories.standard}`);
    console.log(`- AI Images: ${categories.image}`);
    console.log(`- AI Audio Mixes: ${categories.audio_mix}`);
    console.log(`- AI Voiceovers: ${categories.audio_voice}`);
    console.log(`- AI Music: ${categories.audio_music}`);
    console.log(`- AI Video: ${categories.video}`);

    if (allAssets.length > 0) {
        console.log('\nSample Asset Detail:');
        const sample = allAssets[0];
        console.log(`- ID: ${sample.id}`);
        console.log(`- Name: ${sample.name || 'N/A'}`);
        console.log(`- Type: ${sample.type}`);
        console.log(`- Origin: ${sample.origin || 'User Upload'}`);
        console.log(`- URL: ${sample.url}`);
    }

    if (categories.image > 0 || categories.audio_mix > 0 || categories.audio_voice > 0) {
        console.log('\n✅ VERIFICATION SUCCESS: AI results are correctly merged into the asset library.');
    } else {
        console.warn('\n⚠️ Warning: No AI results found in the library. Ensure you have run some agents first.');
    }

  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyUnifiedAssets();
