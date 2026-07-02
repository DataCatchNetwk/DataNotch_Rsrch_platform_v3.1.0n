import fs from "node:fs";
import { PrismaClient } from "@prisma/client";

const url = "postgresql://postgres:Etikese1986@localhost:5432/health_data_shadow_reconcile_test?schema=public";
const prisma = new PrismaClient({ datasources: { db: { url } } });
const sql = fs.readFileSync("prisma/migrations/20260701_residual_drift_reconcile/migration.sql", "utf8");
const statements = sql
  .split(/;\s*\n/)
  .map((part) => part.trim())
  .filter(Boolean)
  .map((part) => `${part};`);

let index = 0;
for (const statement of statements) {
  index += 1;
  try {
    await prisma.$executeRawUnsafe(statement);
  } catch (error) {
    console.error(JSON.stringify({ index, statement: statement.slice(0, 1200), error: String(error?.message || error) }, null, 2));
    process.exit(1);
  }
}

console.log(JSON.stringify({ ok: true, statements: statements.length }, null, 2));
await prisma.$disconnect();
