import fs from "node:fs";
import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("Missing DATABASE_URL. Set it to a disposable PostgreSQL database before running this migration diagnostic.");
}

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
