import axios from 'axios';
import prisma from '../src/db/prisma';

async function testWebhookConfig() {
    console.log('--- Starting Webhook Configuration Test ---');

    try {
        // 1. Target user
        const targetEmail = 'maaz.khan@ccript.com';
        const user = await prisma.user.findFirst({ where: { email: targetEmail } });

        if (!user) {
            console.error(`User ${targetEmail} not found.`);
            return;
        }

        console.log(`Setting up test for user: ${user.fullName} (${user.id})`);

        // 2. Setup local listener URL
        const testWebhookUrl = 'http://localhost:9999/webhook';
        
        console.log(`Updating webhookUrl to: ${testWebhookUrl}`);
        
        // Use standard prisma to update (simulating API updateSettings)
        await prisma.user.update({
            where: { id: user.id },
            data: { webhookUrl: testWebhookUrl }
        });

        console.log('✅ Webhook URL updated successfully.');

        // 3. Trigger a notification
        console.log('Triggering a test notification...');
        
        // Import createNotification from service
        // We'll use a direct service call to simulate an agent event
        const { createNotification } = await import('../src/modules/notification/service');
        
        const notification = await createNotification({
            userId: user.id,
            type: 'SYSTEM_EVENT',
            title: 'Webhook Config Verified',
            message: 'This notification confirms that your outbound webhook endpoint is correctly configured and reachable.',
            metadata: { test: true, timestamp: new Date().toISOString() }
        });

        if (notification) {
            console.log(`✅ Notification created: ${notification.id}`);
            console.log('Check the webhook listener logs at http://localhost:9999/webhook to confirm delivery.');
        } else {
            console.error('❌ Failed to create notification.');
        }

        // 4. Wait a bit for delivery
        console.log('Waiting 3 seconds for delivery...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 5. Clear webhookUrl to test skip logic
        console.log('Clearing webhookUrl to verify skip logic...');
        await prisma.user.update({
            where: { id: user.id },
            data: { webhookUrl: null }
        });

        console.log('Triggering another notification (should NOT be delivered to webhook)...');
        await createNotification({
            userId: user.id,
            type: 'SYSTEM_EVENT',
            title: 'Webhook Skipped',
            message: 'This notification should only appear in the database, not at the webhook listener.',
            metadata: { test: true, skipped: true }
        });

        console.log('✅ Cycle complete. Verify listener logs for exactly ONE received webhook.');

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testWebhookConfig();
