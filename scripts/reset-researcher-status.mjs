import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL || 'postgresql://localhost:5432/health_data' } },
});

async function resetResearcherStatus() {
  const researcherEmail = process.env.RESEARCHER_IDENTIFIER ?? 'jgodwin@datanotchplatform.org';
  const newStatus = process.env.RESEARCHER_STATUS ?? 'PENDING_APPROVAL';

  try {
    const user = await prisma.user.findUnique({ where: { email: researcherEmail } });
    if (!user) {
      console.error(`[error] Researcher user not found: ${researcherEmail}`);
      process.exit(1);
    }

    await prisma.user.update({
      where: { email: researcherEmail },
      data: { accountStatus: newStatus },
    });

    console.log(`[ok] Updated ${researcherEmail} accountStatus to ${newStatus}`);
  } catch (error) {
    console.error(`[error] Failed to reset researcher status:`, error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

await resetResearcherStatus();
