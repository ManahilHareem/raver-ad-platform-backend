import prisma from '../src/db/prisma';
import { createNotification } from '../src/modules/notification/service';
import { v4 as uuidv4 } from 'uuid';

async function run() {
  console.log('Starting Notification Verification for AI Agents...\n');

  try {
    // 1. Create a dummy user
    const dummyUser = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: `test_${Date.now()}@example.com`,
        campaignUpdates: true
      }
    });
    console.log(`✅ Created dummy user: ${dummyUser.email}`);

    const agentTypes = [
        { type: 'AI_PRODUCER_LAUNCHED', title: 'Producer Launched' },
        { type: 'AI_DIRECTOR_APPROVED', title: 'Director Approved' },
        { type: 'AI_AUDIO_GENERATED', title: 'Audio Generated' },
        { type: 'AI_IMAGE_GENERATED', title: 'Image Generated' },
        { type: 'AI_COPY_GENERATED', title: 'Copy Generated' },
        { type: 'AI_EDITOR_RENDERED', title: 'Editor Rendered' },
        { type: 'AI_QUALITY_SCORED', title: 'Quality Audited' },
    ];

    for (const agent of agentTypes) {
        const testUrl = `https://adplatform.raver.ai/agents/test?sessionId=test-${agent.type}`;
        await createNotification({
            userId: dummyUser.id,
            type: agent.type,
            title: agent.title,
            message: `Verifying notification for ${agent.type}.`,
            link: testUrl,
            metadata: { test: true }
        });
    }
    console.log(`✅ Triggered notifications for all AI Agents`);
    console.log(`ℹ️ Base target domain: https://adplatform.raver.ai`);

    const notifications = await (prisma as any).notification.findMany({
      where: { userId: dummyUser.id }
    });

    console.log(`\nFound ${notifications.length} notifications:`);
    let success = true;
    notifications.forEach((n: any) => {
        const hasUrl = n.link && n.link.startsWith('https://adplatform.raver.ai');
        console.log(`- [${n.type}] ${n.title}: ${n.message}`);
        console.log(`  🔗 Link: ${n.link || 'MISSING'}`);
        if (!hasUrl) success = false;
    });

    if (notifications.length === agentTypes.length && success) {
        console.log('\n✅ VERIFICATION SUCCESSFUL: All agent notifications persisted with correct deep links.');
    } else {
        console.log('\n❌ VERIFICATION FAILED: Missing notifications or malformed deep links.');
    }

    // Cleanup
    await (prisma as any).notification.deleteMany({ where: { userId: dummyUser.id } });
    await prisma.user.delete({ where: { id: dummyUser.id } });
    console.log('✅ Cleaned up dummy data.');

  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
