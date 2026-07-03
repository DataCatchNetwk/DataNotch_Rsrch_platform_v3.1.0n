import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main(){
  const users = await Promise.all([
    prisma.user.upsert({ where:{email:'admin@research.local'}, update:{}, create:{id:'u-admin',name:'Admin Lead',email:'admin@research.local',role:'ADMIN',avatarUrl:'https://i.pravatar.cc/150?u=admin'} }),
    prisma.user.upsert({ where:{email:'emily@research.local'}, update:{}, create:{id:'u-emily',name:'Emily Davis',email:'emily@research.local',role:'RESEARCHER',avatarUrl:'https://i.pravatar.cc/150?u=emily'} }),
    prisma.user.upsert({ where:{email:'sarah@research.local'}, update:{}, create:{id:'u-sarah',name:'Dr. Sarah Johnson',email:'sarah@research.local',role:'RESEARCHER',avatarUrl:'https://i.pravatar.cc/150?u=sarah'} })
  ]);
  const asset = await prisma.researchAsset.create({ data:{type:'DATASET', title:'Clinical_SDOH_v5 Dataset', version:'2.1'} });
  const events = [
    ['Team Stand-up','Daily Sync','2026-05-26T10:00:00','2026-05-26T11:00:00','blue'],
    ['Dataset Review','Clinical_SDOH_v5','2026-05-27T14:00:00','2026-05-27T15:30:00','violet'],
    ['PI Meeting','Project Alpha','2026-05-26T16:30:00','2026-05-26T17:30:00','amber'],
    ['Collaborator Call','External Partners','2026-05-27T18:00:00','2026-05-27T19:00:00','green']
  ];
  for (const [title,subtitle,startTime,endTime,color] of events) {
    await prisma.rZoomaEvent.create({ data:{ title, subtitle, startTime:new Date(startTime), endTime:new Date(endTime), color, type:'MEETING', createdById:'u-admin', assetId: title==='Dataset Review'?asset.id:undefined, participants:{create: users.map(u=>({userId:u.id}))} } as any });
  }
}
main().finally(()=>prisma.$disconnect());
