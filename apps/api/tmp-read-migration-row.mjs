import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const rows = await prisma.$queryRawUnsafe(`SELECT migration_name, checksum, finished_at FROM "_prisma_migrations" WHERE migration_name = '20260701_residual_drift_reconcile'`);
console.log(JSON.stringify(rows, null, 2));
await prisma.$disconnect();
