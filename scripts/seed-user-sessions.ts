import prisma from '../src/db/prisma';

const TARGET_USER_ID = 'f15e9f82-0bf4-4dc7-b994-74853e81721d';

const MARCO_HISTORY = [
    { role: "user", content: "I want to create campaign for Hair products" },
    { role: "assistant", content: "Great! Could you tell me the name of your salon or studio? And do you have a specific product description in mind for the hair products you're promoting?" },
    { role: "user", content: "its a studio, and its for hair styling" },
    { role: "assistant", content: "Perfect, so the campaign will focus on hairstyling services. What's the name of your studio? And do you have a target audience in mind, or should we aim for a broad reach?" },
    { role: "user", content: "name of the studio is marco styling, my target audience is women 18-30 years" },
    { role: "assistant", content: "Thanks for sharing! To capture the essence of your campaign, do you have a mood in mind, like elegant, cinematic, or energetic? And which platform are you planning to focus on, like Instagram or TikTok?" },
    { role: "user", content: "it needs to be chic and bold showing new generation styles as of 2026, and its for instagram" },
    { role: "assistant", content: "Sounds exciting! A chic and bold mood for Instagram works perfectly. How would you like the tone to be—perhaps bold editorial or fresh natural? And do you have a preference for the number of scenes, or should we go with the default of five?" },
    { role: "user", content: "we can do 5" },
    { role: "assistant", content: "Great! We'll go with five scenes. Now, confirming the tone: would you like it to be bold editorial to match the chic and bold mood? Let me know if that's what you have in mind." },
    { role: "user", content: "yes thats it" },
    { role: "assistant", content: "Perfect! Here's a summary of your campaign brief:\n\n- Business Name: Marco Styling\n- Product Description: Hairstyling services\n- Target Audience: Women aged 18-30 years\n- Mood: Chic and bold\n- Platform: Instagram\n- Tone: Bold editorial\n- Number of Scenes: 5\n\nDoes this look good to you? Can we go ahead and launch it?" },
    { role: "user", content: "yes launch it" },
    { role: "assistant", content: "LAUNCH_CAMPAIGN:{\"business_name\":\"Marco Styling\",\"product_description\":\"Hairstyling services\",\"target_audience\":\"Women aged 18-30 years\",\"mood\":\"Chic and bold\",\"platform\":\"Instagram\",\"tone\":\"Bold editorial\",\"num_scenes\":5,\"format\":\"9:16\",\"transition\":\"fade\",\"music_volume\":0.2,\"animate_scenes\":true,\"video_model\":\"kling-video\"}" }
];

const HAREEM_HISTORY = [
    { role: "user", content: "Before/after showcase reel for social media" },
    { role: "assistant", content: "That sounds exciting! Could you tell me the name of your salon or studio and the service or product you're promoting in the before/after reel?" },
    { role: "user", content: "Hareem Salon, before nails art and after" },
    { role: "assistant", content: "Great! So we have Hareem Salon showcasing a before and after nail art transformation. Who are you aiming to attract with this campaign? Any specific target audience in mind?" },
    { role: "user", content: "ladies from 18-40 age" },
    { role: "assistant", content: "Perfect. Targeting ladies aged 18-40. What vibe are you going for with this campaign? We can aim for moods like elegant, energetic, fresh, or something else you have in mind. Also, which platform are you focusing on—Instagram, TikTok, or another?" },
    { role: "user", content: "smthg chic and genZ, and for instagram" },
    { role: "assistant", content: "Got it. We'll aim for a chic and Gen Z-friendly vibe on Instagram. How about the tone—should it be bold editorial, fresh natural, or any other style you prefer? And how many scenes are you thinking, or should we go with the default of 5?" },
    { role: "user", content: "bold, and 3 scenes mini" },
    { role: "assistant", content: "Sounds bold and impactful with 3 scenes. ... Does this look good to you?" },
    { role: "user", content: "yes" },
    { role: "assistant", content: "LAUNCH_CAMPAIGN:{\"business_name\":\"Hareem Salon\",\"product_description\":\"Before and after nail art transformation\",\"target_audience\":\"Ladies aged 18-40\",\"mood\":\"Chic Gen Z\",\"platform\":\"Instagram\",\"tone\":\"Bold editorial\",\"num_scenes\":3,\"format\":\"9:16\",\"transition\":\"fade\",\"music_volume\":0.2,\"animate_scenes\":true,\"video_model\":\"kling-video\"}" }
];

const GREGORY_HISTORY = [
    { role: "user", content: "Hi Raver, can you create an ad for my salon ( and give it some Holiday and desired outcome)" },
    { role: "assistant", content: "Absolutely! I'd love to help create a festive ad for your salon. Could you tell me your salon's name and the specific service or product you'd like to promote this holiday season?" },
    { role: "user", content: "Gregory salon" },
    { role: "assistant", content: "Great, thanks for sharing. What service or product are you looking to promote at Gregory Salon for the holiday season?" },
    { role: "user", content: "Hairs" },
    { role: "assistant", content: "Perfect. So, we're focusing on promoting hair services at Gregory Salon for the holidays. Who is your target audience for this campaign? Are there any specific age groups or customer types we should focus on?" },
    { role: "user", content: "young women who likes to try new hairstyles" },
    { role: "assistant", content: "Got it! We're targeting young women who love experimenting with new hairstyles. What mood and tone are you envisioning for this campaign? We can go for something elegant, energetic, or any other vibe you have in mind." },
    { role: "user", content: "all about to you" },
    { role: "assistant", content: "Let's go with an energetic and fresh mood to capture the adventurous spirit of trying new hairstyles. ... instagram" },
    { role: "user", content: "instagram" },
    { role: "assistant", content: "Perfect choice! Instagram will be great for reaching young women. ... LAUNCH_CAMPAIGN:{\"business_name\":\"Gregory Salon\",...}" },
    { role: "assistant", content: "Your campaign is ready! It's now with Fabienne for final review." }
];

const GREGORY_PRODUCTION = {
    message: "Your campaign is ready! It's now with Fabienne for final review.",
    status: "ready_for_human_review",
    campaign_id: "910e7071-313f-4a8e-a48c-108e4b126761",
    video_url: "https://raver-ad-platform.s3.us-east-1.amazonaws.com/assets/renders/1774811930938/render_9x16_0b029ba7-f6b7-4dae-b8d8-ee15d2a897f5.mp4",
    voiceover_url: "https://raver-ad-platform.s3.us-east-1.amazonaws.com/assets/audio/1774811930938/voiceover_04855a74-df41-4154-ad4c-bc1c0f48009f.mp3",
    music_url: "https://raver-ad-platform.s3.us-east-1.amazonaws.com/assets/audio/1774811930938/music_84c68431-abf1-4c72-9680-7b13ee11e7cc.mp3",
    script: "Discover hair magic at Gregory Salon. Unleash your style with stunning cuts and vibrant colors. Experience luxury with our expert stylists. Refresh your look for any occasion. Book your transformation today."
};

const FINAL_SESSIONS = [
    { sessionId: "1774817678958", metadata: { history: MARCO_HISTORY, brief_draft: { business_name: "Marco Styling" } } },
    { sessionId: "1774812723731", metadata: { history: HAREEM_HISTORY, brief_draft: { business_name: "Hareem Salon" } } },
    { sessionId: "1774811930938", metadata: { history: GREGORY_HISTORY, brief_draft: { business_name: "Gregory Salon" }, production: GREGORY_PRODUCTION } }
];

async function seed() {
    console.log('--- ULTIMATE SEED & VERIFY ---');
    try {
        for (const session of FINAL_SESSIONS) {
            await (prisma as any).aISession.upsert({
                where: { sessionId: session.sessionId },
                update: { userId: TARGET_USER_ID, metadata: session.metadata, type: 'director' },
                create: { userId: TARGET_USER_ID, sessionId: session.sessionId, type: 'director', metadata: session.metadata }
            });
            console.log(`- Upserted: ${session.sessionId}`);
        }

        console.log('\n--- VERIFICATION ---');
        for (const session of FINAL_SESSIONS) {
            const s = await (prisma as any).aISession.findUnique({ where: { sessionId: session.sessionId } });
            const meta = s.metadata || {};
            console.log(`- Session: ${s.sessionId} | History: ${meta.history?.length || 0} msgs | Production Assets: ${!!meta.production}`);
        }
    } catch (error: any) {
        console.error('ERROR:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
