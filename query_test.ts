import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const images = await prisma.imageLeadResult.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, userId: true, sessionId: true, mainImageUrl: true, createdAt: true }
  });
  console.log("Images:", JSON.stringify(images, null, 2));
}
main().finally(() => prisma.$disconnect());
