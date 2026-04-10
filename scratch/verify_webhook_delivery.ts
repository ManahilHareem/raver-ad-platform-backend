import prisma from '../src/db/prisma';
import { createNotification } from '../src/modules/notification/service';

async function verifyWebhook() {
  const EMAIL = 'maaz.khan@ccript.com';
  const WEBHOOK_URL = 'http://localhost:9999/webhook';

  console.log(`Configuring webhook for ${EMAIL}...`);

  try {
    const user = await prisma.user.findFirst({
        where: { email: EMAIL }
    });

    if (!user) {
        console.error(`User ${EMAIL} not found.`);
        return;
    }

    // Update user with webhook URL
    await (prisma as any).user.update({
        where: { id: user.id },
        data: { webhookUrl: WEBHOOK_URL } as any
    });

    console.log(`✅ Webhook URL set to ${WEBHOOK_URL}`);
    console.log(`Triggering test notification...`);

    const result = await createNotification({
        userId: user.id,
        type: 'WEBHOOK_TEST',
        title: 'Webhook Verification',
        message: 'This notification should trigger an outbound webhook to localhost:9999',
        metadata: { test: true, timestamp: new Date().toISOString() }
    });

    if (result) {
        console.log(`✅ Notification created in DB (ID: ${result.id})`);
        console.log(`Check the webhook listener output...`);
    } else {
        console.error(`❌ Failed to create notification.`);
    }

  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyWebhook();
