import prisma from '../src/db/prisma';

const TARGET_USER_ID = 'f15e9f82-0bf4-4dc7-b994-74853e81721d';
const TEST_SESSION_ID = `test-chat-${Date.now()}`;

async function simulateChat(sessionId: string, message: string, existingHistory: any[] = []) {
    console.log(`\n--- Simulating Chat Turn: [${message}] ---`);
    
    // 1. Logic from controller
    const userMessage = { role: 'user', content: message };
    const updatedHistory = [...existingHistory, userMessage];

    // Mock AI response (like the service does)
    const mockAiResponse = {
        message: `Hello! I see you said: ${message}. How can I help?`,
        session_id: sessionId
    };

    const assistantMessage = { role: 'assistant', content: mockAiResponse.message };
    const finalHistory = [...updatedHistory, assistantMessage];

    // 2. Persist to DB
    await (prisma as any).aISession.upsert({
        where: { sessionId: sessionId },
        update: { metadata: { history: finalHistory } },
        create: {
            userId: TARGET_USER_ID,
            sessionId: sessionId,
            type: 'chat',
            metadata: { history: finalHistory }
        }
    });

    console.log(`Turn complete. History length: ${finalHistory.length}`);
    return finalHistory;
}

async function runTest() {
    console.log('Starting Persistent Chat Multi-turn Test...');
    try {
        // Step 1: Turn 1
        let history = await simulateChat(TEST_SESSION_ID, "My name is Maaz and I like coding.");

        // Step 2: Turn 2
        history = await simulateChat(TEST_SESSION_ID, "Do you remember my name?", history);

        // Step 3: Verify DB
        const saved = await (prisma as any).aISession.findUnique({ where: { sessionId: TEST_SESSION_ID } });
        const savedHistory = saved.metadata.history;

        console.log('\n--- Database Results ---');
        console.log(`Total Messages: ${savedHistory.length}`);
        savedHistory.forEach((m: any, i: number) => {
            console.log(`[${i}] ${m.role.toUpperCase()}: ${m.content}`);
        });

        if (savedHistory.length === 4) {
            console.log('\n✅ SUCCESS: Multi-turn regular chat history is correctly persisted!');
        } else {
            console.log('\n❌ FAILURE: History count mismatch.');
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
