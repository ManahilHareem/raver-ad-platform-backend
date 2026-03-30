import prisma from '../src/db/prisma';
import * as directorService from '../src/modules/ai-director/service';
import { v4 as uuidv4 } from 'uuid';

const TARGET_USER_ID = 'f15e9f82-0bf4-4dc7-b994-74853e81721d';
const TEST_SESSION_ID = `test-chat-${Date.now()}`;

/**
 * Simulates the refactored controller's chat logic to verify DB persistence.
 */
async function simulateChat(sessionId: string | null, message: string) {
    console.log(`\n--- Simulating Chat: [${message}] ---`);
    
    // 1. Load context from DB
    let existingHistory: any[] = [];
    let existingMetadata: any = {};
    if (sessionId) {
      const session = await (prisma as any).aISession.findUnique({ where: { sessionId: sessionId } });
      if (session) {
        existingMetadata = session.metadata || {};
        existingHistory = Array.isArray(existingMetadata.history) ? existingMetadata.history : [];
      }
    }

    // 2. Append User Message
    const userMessage = { role: 'user', content: message };
    const updatedHistory = [...existingHistory, userMessage];

    // 3. Mock AI Service response (since we can't easily mock proxyPost, we'll assume it returns a message)
    // In a real environment, we'd call directorService.chat(payload)
    const mockAiResponse = {
        session_id: sessionId || TEST_SESSION_ID,
        message: `I understand you want: ${message}. Tell me more.`
    };
    
    // 4. Append Assistant Message
    const assistantMessage = { role: 'assistant', content: mockAiResponse.message };
    const finalHistory = [...updatedHistory, assistantMessage];

    // 5. Persist to DB
    const finalSessionId = sessionId || TEST_SESSION_ID;
    const mergedMetadata = {
        ...existingMetadata,
        ...mockAiResponse,
        history: finalHistory
    };

    await (prisma as any).aISession.upsert({
      where: { sessionId: finalSessionId },
      update: { metadata: mergedMetadata }, 
      create: {
        userId: TARGET_USER_ID,
        sessionId: finalSessionId,
        type: 'director',
        metadata: mergedMetadata
      }
    });

    console.log(`Session ${finalSessionId} updated. History length: ${finalHistory.length}`);
    return finalSessionId;
}

async function runTest() {
    console.log('Starting AI Director DB-Chat Test...');
    try {
        // Step 1: New Chat
        const sid = await simulateChat(null, "I want to create a luxury hair campaign.");

        // Step 2: Follow-up Chat
        await simulateChat(sid, "The salon name is 'Elite Cuts'.");

        // Step 3: Final Verification
        const session = await (prisma as any).aISession.findUnique({ where: { sessionId: sid } });
        const history = session.metadata.history;
        
        console.log('\n--- Final Verification ---');
        console.log(`Total History Messages: ${history.length}`);
        history.forEach((m: any, i: number) => {
            console.log(`[${i}] ${m.role.toUpperCase()}: ${m.content}`);
        });

        if (history.length === 4) {
            console.log('\nSUCCESS: Chat history is correctly persisted in the local DB!');
        } else {
            console.log(`\nFAILURE: Expected 4 messages, found ${history.length}.`);
        }

    } catch (error: any) {
        console.error('ERROR:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
