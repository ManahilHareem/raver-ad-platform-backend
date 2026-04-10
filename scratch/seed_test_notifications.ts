import prisma from '../src/db/prisma';
import { createNotification } from '../src/modules/notification/service';

async function seedNotifications() {
  console.log('Seeding test notifications...');

  try {
    // 1. Find a real user in the database to target, ideally the most recently created or updated one
    const user = await prisma.user.findFirst({
        where: { email: 'maaz.khan@ccript.com' }
    });

    if (!user) {
        console.error('User "maaz.khan@ccript.com" not found in the database. Notifications not seeded.');
        return;
    }

    console.log(`Found target user: ${user.email} (${user.id})`);

    const testNotifications = [
        {
            type: 'AI_PRODUCER_LAUNCHED',
            title: 'Campaign "Summer Sale" Launched',
            message: 'AI Producer has successfully launched your new ad campaign.',
            metadata: { campaignId: 'c123', status: 'launched' }
        },
        {
            type: 'AI_DIRECTOR_APPROVED',
            title: 'Vision Board Approved',
            message: 'Your creative vision board has been approved by the AI Director.',
            metadata: { sessionId: 's456', score: 95 }
        },
        {
            type: 'AI_EDITOR_RENDERED',
            title: 'Multiformat Rendering Complete',
            message: 'AI Editor has successfully rendered the final video assets in 16:9, 1:1, and 9:16 aspect ratios.',
            metadata: { sessionId: 's456', formats: ['16:9', '1:1', '9:16'] }
        },
        {
            type: 'AI_IMAGE_GENERATED',
            title: 'Visual Assets Ready',
            message: 'AI Image Lead has generated 4 new visual concepts for review.',
            metadata: { assetsCount: 4 }
        },
        {
            type: 'AI_AUDIO_GENERATED',
            title: 'Voiceover Mix Complete',
            message: 'The AI Audio Lead has finalized the background music and voiceover track.',
            metadata: { trackId: 't789' }
        },
        {
            type: 'AI_COPY_GENERATED',
            title: 'Lingustic Package Prepared',
            message: 'The AI Copy Lead has successfully generated the final ad scripts and caption structures.',
            metadata: { packageId: 'pkg101' }
        },
        {
            type: 'AI_QUALITY_SCORED',
            title: 'Forensic Audit Passed',
            message: 'Your campaign passed the Neural Governance Audit with a score of 98/100.',
            metadata: { score: 98, decision: 'APPROVED' }
        },
        {
            type: 'AI_DIRECTOR_READY',
            title: 'Creative Production Finalized',
            message: 'AI Director has finished the background rendering for your storyboard.',
            metadata: { sessionId: 's456' }
        }
    ];

    let count = 0;
    for (const notif of testNotifications) {
        await createNotification({
            userId: user.id,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            metadata: notif.metadata
        });
        count++;
    }

    console.log(`✅ Successfully seeded ${count} notifications for user ${user.email}`);

  } catch (error) {
    console.error('Error seeding notifications:', error);
  } finally {
    // Note: Because we import prisma from db/prisma, we shouldn't necessarily disconnect 
    // it abruptly if it has a shared pool, but for a one-off script it's generally fine.
    await prisma.$disconnect();
  }
}

seedNotifications();
