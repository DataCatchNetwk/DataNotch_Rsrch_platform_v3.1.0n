import { PrismaClient, MessageBox } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const emily = await prisma.user.upsert({ where: { email: 'emily@research.local' }, update: {}, create: { id: 'seed-emily-id', name: 'Emily Davis', email: 'emily@research.local', role: 'RESEARCHER' } });
  const sarah = await prisma.user.upsert({ where: { email: 'sarah@research.local' }, update: {}, create: { name: 'Dr. Sarah Johnson', email: 'sarah@research.local', role: 'ADMIN' } });
  const thread = await prisma.communicationThread.create({
    data: {
      subject: 'Dataset Approval Request', preview: 'Please review the Clinical_SDOH_v5 dataset...', createdById: sarah.id, assetType: 'Dataset', assetName: 'Clinical_SDOH_v5 Dataset',
      participants: { create: [
        { userId: emily.id, email: emily.email, displayName: emily.name, box: MessageBox.INBOX, unreadCount: 2 },
        { userId: sarah.id, email: sarah.email, displayName: sarah.name, box: MessageBox.SENT, unreadCount: 0 },
      ]},
      messages: { create: { senderId: sarah.id, body: 'Hello Emily,\n\nPlease review the Clinical_SDOH_v5 dataset and provide your approval.', toEmails: [emily.email] } },
    }
  });
  console.log({ seeded: true, threadId: thread.id });
}
main().finally(() => prisma.$disconnect());
